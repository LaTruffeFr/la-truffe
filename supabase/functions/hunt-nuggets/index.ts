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
  image_url?: string;
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

    const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');
    if (!FIRECRAWL_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Firecrawl non configuré.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // --- STEP A: Use Firecrawl SEARCH (much more reliable than scraping Leboncoin directly) ---
    const budgetPart = budget ? ` moins de ${budget}€` : '';
    const kmPart = km_max ? ` moins de ${km_max}km` : '';
    const searchQuery = `site:leboncoin.fr voiture ${marque} ${modele}${budgetPart}${kmPart}`;

    console.log('Firecrawl search query:', searchQuery);

    const searchResponse = await fetch('https://api.firecrawl.dev/v1/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: searchQuery,
        limit: 20,
        lang: 'fr',
        country: 'fr',
        scrapeOptions: { formats: ['markdown'] },
      }),
    });

    if (!searchResponse.ok) {
      const errText = await searchResponse.text();
      console.error('Firecrawl search error:', searchResponse.status, errText);
      return new Response(
        JSON.stringify({ error: 'Impossible de scanner le marché. Réessayez dans quelques instants.' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const searchData = await searchResponse.json();
    const results = searchData?.data || [];

    if (!results || results.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Aucune annonce trouvée pour cette recherche. Essayez avec d\'autres critères.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build context from search results
    const resultsContext = results.map((r: any, i: number) => {
      const parts = [`[Résultat ${i + 1}]`];
      if (r.url) parts.push(`URL: ${r.url}`);
      if (r.title) parts.push(`Titre: ${r.title}`);
      if (r.description) parts.push(`Description: ${r.description}`);
      if (r.markdown) parts.push(`Contenu: ${r.markdown.substring(0, 1500)}`);
      return parts.join('\n');
    }).join('\n\n---\n\n');

    console.log(`Got ${results.length} search results, sending to Gemini...`);

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
Voici des résultats de recherche Leboncoin pour des ${marque} ${modele} (${criteriaInfo}).

Analyse ces résultats et sélectionne les 5 meilleures affaires (meilleur rapport prix/kilométrage/fiabilité).
IMPORTANT :
- Utilise UNIQUEMENT les URLs Leboncoin trouvées dans les résultats (format https://www.leboncoin.fr/ad/...)
- Si une image est mentionnée dans le contenu (URL contenant lfrmedias.com, img.leboncoin.fr, ou classistatic), utilise-la
- Extrais le prix et le kilométrage réels depuis le contenu

Renvoie UNIQUEMENT un JSON valide :
{
  "top5": [
    {
      "rank": 1,
      "title": "Titre de l'annonce",
      "price": 12000,
      "km": 85000,
      "link": "https://www.leboncoin.fr/ad/voitures/XXXXXXX",
      "image_url": null,
      "expert_reason": "Pourquoi c'est une bonne affaire en 1 phrase percutante"
    }
  ]
}

Si tu ne trouves pas l'URL d'une image, mets null. Si tu trouves moins de 5 annonces valides, renvoie celles que tu as. Minimum 1.`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

    const geminiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: `${systemPrompt}\n\n--- RÉSULTATS ---\n${resultsContext.substring(0, 28000)}` }]
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
