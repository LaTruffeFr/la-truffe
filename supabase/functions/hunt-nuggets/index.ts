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
  image_url?: string | null;
  expert_reason?: string;
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

    const query = `${marque} ${modele}`.trim();
    const parsedBudget = Number.isFinite(Number(budget)) && Number(budget) > 0 ? Math.floor(Number(budget)) : 9999999;

    const lbcUrl = `https://www.leboncoin.fr/recherche?category=2&text=${encodeURIComponent(query)}&price=min-${parsedBudget}`;

    console.log('Firecrawl scrape URL:', lbcUrl);

    const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: lbcUrl,
        formats: ['markdown'],
        onlyMainContent: true,
        waitFor: 5000,
      }),
    });

    if (!scrapeResponse.ok) {
      const errText = await scrapeResponse.text();
      console.error('Firecrawl scrape error:', scrapeResponse.status, errText);
      return new Response(
        JSON.stringify({ error: 'Impossible de scanner le marché. Réessayez dans quelques instants.' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const scrapeData = await scrapeResponse.json();
    const markdown = scrapeData?.data?.markdown || scrapeData?.markdown || '';

    if (!markdown || typeof markdown !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Aucune donnée exploitable récupérée depuis Leboncoin.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Scraped markdown length: ${markdown.length}`);

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Clé Gemini non configurée.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const budgetForPrompt = parsedBudget ?? 9999999;

    const systemPrompt = `Tu es un expert automobile. Je te fournis le texte brut d'une recherche Leboncoin. Le budget MAXIMUM de l'utilisateur est de ${budgetForPrompt} €.

ORDRES STRICTS :

Renvoie OBLIGATOIREMENT 5 annonces (sauf s'il y en a moins de 5).

Tu NE DOIS PAS inventer de prix. Lis le prix exact indiqué dans le texte de l'annonce.

TOUS les véhicules de ta liste doivent coûter MOINS CHER ou ÉGAL au budget de l'utilisateur. Refuse tout ce qui dépasse.

Trouve l'URL de la page (https://www.leboncoin.fr/ad/...) et l'URL de l'image.

Renvoie un JSON valide : { "top5": [ { "rank": 1, "title": "...", "price": 0, "km": 0, "link": "...", "image_url": "..." } ] }`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

    const geminiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: `${systemPrompt}\n\n--- TEXTE BRUT LEBONCOIN ---\n${markdown.substring(0, 45000)}` }],
        }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0,
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
    let rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

    let parsed: { top5: NuggetResult[] };
    try {
      parsed = JSON.parse(rawText);
    } catch {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('Failed to parse Gemini response:', rawText.substring(0, 500));
        return new Response(
          JSON.stringify({ error: 'Format de réponse IA invalide.' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      parsed = JSON.parse(jsonMatch[0]);
    }

    if (!parsed?.top5 || !Array.isArray(parsed.top5) || parsed.top5.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Aucune pépite trouvée pour ces critères.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const parseNumber = (value: unknown): number => {
      if (typeof value === 'number') return value;
      if (typeof value !== 'string') return NaN;
      const cleaned = value.replace(/[^\d]/g, '');
      return cleaned ? Number(cleaned) : NaN;
    };

    let filtered = parsed.top5
      .map((item, index) => ({
        rank: index + 1,
        title: String(item.title || '').trim(),
        price: parseNumber(item.price),
        km: parseNumber(item.km),
        link: String(item.link || '').trim(),
        image_url: item.image_url || null,
        expert_reason: item.expert_reason || 'Annonce filtrée automatiquement selon le budget.',
      }))
      .filter((item) =>
        item.title &&
        Number.isFinite(item.price) &&
        /^https:\/\/www\.leboncoin\.fr\/ad\//.test(item.link)
      );

    filtered = filtered.filter((item) => item.price <= parsedBudget);

    if (km_max && Number.isFinite(Number(km_max))) {
      filtered = filtered.filter((item) => !Number.isFinite(item.km) || item.km <= Number(km_max));
    }

    filtered = filtered.slice(0, 5).map((item, index) => ({ ...item, rank: index + 1 }));

    if (filtered.length === 0) {
      return new Response(
        JSON.stringify({ error: parsedBudget ? `Aucune annonce valide trouvée sous ${parsedBudget} €.` : 'Aucune annonce valide trouvée.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Returning ${filtered.length} nuggets for ${marque} ${modele}`);

    return new Response(
      JSON.stringify({ success: true, top5: filtered }),
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
