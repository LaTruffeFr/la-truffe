const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface NuggetResult {
  rank: number;
  title: string;
  price: number;
  km: number;
  link: string;
  expert_reason: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { marque, modele, budget, km_max } = await req.json();

    if (!marque || !modele) {
      return new Response(
        JSON.stringify({ error: 'Marque et modèle sont requis.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // --- STEP A: Scrape Leboncoin search page via Firecrawl ---
    const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');
    if (!FIRECRAWL_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Firecrawl non configuré.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const searchQuery = `${marque} ${modele}`;
    let leboncoinUrl = `https://www.leboncoin.fr/recherche?category=2&text=${encodeURIComponent(searchQuery)}`;
    if (budget) leboncoinUrl += `&price=min-${budget}`;
    if (km_max) leboncoinUrl += `&mileage=min-${km_max}`;

    console.log('Scraping Leboncoin URL:', leboncoinUrl);

    const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: leboncoinUrl,
        formats: ['markdown', 'links', 'html'],
        onlyMainContent: true,
        waitFor: 15000,
        location: { country: 'FR', languages: ['fr'] },
      }),
    });

    if (!scrapeResponse.ok) {
      const errText = await scrapeResponse.text();
      console.error('Firecrawl error:', scrapeResponse.status, errText);
      return new Response(
        JSON.stringify({ error: 'Impossible de scanner Leboncoin. Réessayez dans quelques instants.' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const scrapeData = await scrapeResponse.json();
    const markdown = scrapeData?.data?.markdown || scrapeData?.markdown || '';
    const links = scrapeData?.data?.links || scrapeData?.links || [];

    if (!markdown || markdown.length < 100) {
      return new Response(
        JSON.stringify({ error: 'Aucune annonce trouvée pour cette recherche. Essayez avec d\'autres critères.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Collect Leboncoin ad links for context
    const adLinks = links.filter((l: string) => l.includes('leboncoin.fr/ad/'));
    const linksContext = adLinks.length > 0
      ? `\n\nVoici les liens d'annonces trouvés sur la page :\n${adLinks.join('\n')}`
      : '';

    // --- STEP B: Gemini AI analysis ---
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Clé Gemini non configurée.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const budgetInfo = budget ? `budget max de ${budget}€` : '';
    const kmInfo = km_max ? `kilométrage max de ${km_max} km` : '';
    const criteriaInfo = [budgetInfo, kmInfo].filter(Boolean).join(' et ') || 'sans contrainte particulière';

    const systemPrompt = `Tu es un expert automobile français spécialisé dans la chasse aux bonnes affaires.
Voici le texte brut d'une page de recherche Leboncoin contenant plusieurs annonces de voitures ${marque} ${modele} (${criteriaInfo}).

Trouve les 5 meilleures annonces (meilleur rapport prix/kilométrage/fiabilité apparente).
Pour chaque annonce, tu DOIS fournir :
- Le lien Leboncoin complet (format https://www.leboncoin.fr/ad/voitures/XXXXXXX)
- L'URL de la photo principale si disponible (cherche les URLs d'images contenant lfrmedias.com, img.leboncoin.fr ou classistatic)

Renvoie UNIQUEMENT un JSON valide avec cette structure exacte :
{
  "top5": [
    {
      "rank": 1,
      "title": "Titre exact de l'annonce",
      "price": 12000,
      "km": 85000,
      "link": "https://www.leboncoin.fr/ad/voitures/XXXXXXX",
      "image_url": "https://img.leboncoin.fr/api/v1/lbcpb1/images/XXXXX.jpg",
      "expert_reason": "Pourquoi c'est une bonne affaire en 1 phrase percutante"
    }
  ]
}

Si tu ne trouves pas l'URL d'une image, mets null pour image_url.
Si tu ne trouves pas 5 annonces, renvoie celles que tu trouves. Minimum 1.
Ne renvoie RIEN d'autre que le JSON.`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

    const geminiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: `${systemPrompt}\n\n--- CONTENU DE LA PAGE ---\n${markdown.substring(0, 30000)}${linksContext}` }]
        }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.3,
        },
      }),
    });

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text();
      console.error('Gemini error:', geminiResponse.status, errText);
      return new Response(
        JSON.stringify({ error: 'L\'IA n\'a pas pu analyser les résultats.' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const geminiData = await geminiResponse.json();
    const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    let parsed: { top5: NuggetResult[] };
    try {
      parsed = JSON.parse(rawText);
    } catch {
      // Try extracting JSON from markdown code block
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        console.error('Failed to parse Gemini response:', rawText.substring(0, 500));
        return new Response(
          JSON.stringify({ error: 'Format de réponse IA invalide.' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    if (!parsed.top5 || !Array.isArray(parsed.top5) || parsed.top5.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Aucune pépite trouvée pour ces critères.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${parsed.top5.length} nuggets for ${marque} ${modele}`);

    return new Response(
      JSON.stringify({ success: true, top5: parsed.top5 }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('hunt-nuggets error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erreur interne.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
