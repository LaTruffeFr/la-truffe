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

    // --- STEP A: Build a precise Leboncoin search URL with price filter ---
    const budgetFilter = budget ? ` moins de ${budget}€` : '';
    const kmFilter = km_max ? ` moins de ${km_max}km` : '';
    const searchQuery = `${marque} ${modele}${budgetFilter}${kmFilter} site:leboncoin.fr/ad/voitures`;

    console.log('Firecrawl search query:', searchQuery);

    const searchResponse = await fetch('https://api.firecrawl.dev/v1/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: searchQuery,
        limit: 30,
        lang: 'fr',
        country: 'fr',
        scrapeOptions: { formats: ['markdown', 'links'] },
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

    // Filter to only keep actual Leboncoin ad URLs
    const adResults = results.filter((r: any) =>
      r.url && /leboncoin\.fr\/ad\//.test(r.url)
    );

    // Build rich context from search results
    const resultsContext = (adResults.length > 0 ? adResults : results)
      .slice(0, 25)
      .map((r: any, i: number) => {
        const parts = [`[Résultat ${i + 1}]`];
        if (r.url) parts.push(`URL: ${r.url}`);
        if (r.title) parts.push(`Titre: ${r.title}`);
        if (r.description) parts.push(`Description: ${r.description}`);
        if (r.markdown) parts.push(`Contenu: ${r.markdown.substring(0, 2000)}`);
        return parts.join('\n');
      }).join('\n\n---\n\n');

    console.log(`Got ${results.length} results (${adResults.length} ad URLs), sending to Gemini...`);

    // --- STEP B: Gemini AI analysis with strict prompt ---
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Clé Gemini non configurée.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const budgetText = budget ? `${budget}` : 'illimité';
    const kmText = km_max ? `${km_max} km` : 'illimité';

    const systemPrompt = `Tu es un expert automobile chargé d'extraire des données brutes de résultats de recherche Leboncoin scrappés.
L'utilisateur cherche : ${marque} ${modele}
Budget MAXIMUM : ${budgetText} €
Kilométrage MAXIMUM : ${kmText}

Voici tes ordres stricts :

1. QUANTITÉ : Tu DOIS obligatoirement renvoyer une liste de 5 annonces (sauf s'il y en a moins de 5 dans les résultats fournis).

2. PRIX EXACT : Tu ne dois JAMAIS inventer un prix. Cherche le prix exact affiché dans le texte de chaque annonce. Si tu ne trouves pas le prix exact dans le contenu, N'INCLUS PAS cette annonce.

3. RESPECT DU BUDGET : ${budget ? `Tous les véhicules que tu sélectionnes DOIVENT avoir un prix STRICTEMENT inférieur ou égal à ${budget} €. Si le prix dépasse ${budget} €, EXCLUS cette annonce.` : 'Pas de contrainte de budget.'}

4. KILOMÉTRAGE : ${km_max ? `Tous les véhicules DOIVENT avoir un kilométrage inférieur ou égal à ${km_max} km. Si le km dépasse, EXCLUS cette annonce.` : 'Pas de contrainte de kilométrage.'}

5. LIEN : Utilise UNIQUEMENT les URLs Leboncoin trouvées dans les résultats (format https://www.leboncoin.fr/ad/voitures/XXXXXXX). Ne modifie JAMAIS une URL.

6. PHOTO : Trouve l'URL de la photo principale dans le contenu (domaines : lfrmedias.com, img.leboncoin.fr, classistatic.com). Si aucune image n'est trouvée, mets null.

7. EXPERT_REASON : Pour chaque annonce, donne une raison percutante en 1 phrase expliquant pourquoi c'est une bonne affaire (rapport prix/km, fiabilité, etc.).

8. CLASSEMENT : Classe les annonces par meilleur rapport qualité-prix (la meilleure en rank 1).

Renvoie UNIQUEMENT un objet JSON valide avec cette structure exacte :
{
  "top5": [
    {
      "rank": 1,
      "title": "Texte exact du titre de l'annonce",
      "price": NombreEntier,
      "km": NombreEntier,
      "link": "https://www.leboncoin.fr/ad/voitures/XXXXXXX",
      "image_url": "URL_IMAGE ou null",
      "expert_reason": "Raison en 1 phrase"
    }
  ]
}

RAPPEL CRITIQUE : Ne renvoie AUCUNE annonce dont le prix dépasse ${budgetText} €. Vérifie chaque prix AVANT de l'inclure.`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

    const geminiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: `${systemPrompt}\n\n--- RÉSULTATS DE RECHERCHE ---\n${resultsContext.substring(0, 28000)}` }]
        }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.1,
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

    // Clean markdown code fences if present
    rawText = rawText.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();

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

    // --- STEP C: Server-side enforcement of budget & km filters ---
    let filtered = parsed.top5;

    if (budget) {
      filtered = filtered.filter(n => typeof n.price === 'number' && n.price <= budget);
    }
    if (km_max) {
      filtered = filtered.filter(n => typeof n.km === 'number' && n.km <= km_max);
    }

    // Re-rank after filtering
    filtered = filtered.map((n, i) => ({ ...n, rank: i + 1 }));

    if (filtered.length === 0) {
      return new Response(
        JSON.stringify({ error: `Aucune annonce trouvée dans le budget de ${budget} €. Essayez avec un budget plus élevé.` }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${parsed.top5.length} from AI, ${filtered.length} after budget/km filter for ${marque} ${modele}`);

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
