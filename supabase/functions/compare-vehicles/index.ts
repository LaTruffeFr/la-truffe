const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { vehicles } = await req.json();

    if (!vehicles || !Array.isArray(vehicles) || vehicles.length < 2 || vehicles.length > 3) {
      return new Response(
        JSON.stringify({ error: 'Envoyez entre 2 et 3 véhicules à comparer.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    const vehiclesSummary = vehicles.map((v: any, i: number) => {
      const devisTotal = Array.isArray(v.ai_devis)
        ? v.ai_devis.reduce((sum: number, d: any) => sum + (d.cout || d.cost || 0), 0)
        : 0;
      return `Véhicule ${i + 1}: "${v.marque} ${v.modele}" — Prix: ${v.prix_affiche || v.prix}€, Km: ${v.kilometrage || 'N/A'}, Année: ${v.annee || 'N/A'}, Score IA: ${v.prix_estime ? Math.round((1 - (v.prix_affiche - v.prix_estime) / v.prix_affiche) * 100) : v.score_ia || 'N/A'}/100, Frais à prévoir: ~${devisTotal}€, Carburant: ${v.carburant || 'N/A'}, Avis IA: ${v.expert_opinion || v.ai_avis || 'Aucun'}`;
    }).join('\n');

    const systemPrompt = `Tu es La Truffe, un expert automobile impitoyable et un vieux garagiste bourru mais bienveillant. On te présente ${vehicles.length} véhicules qu'un acheteur hésite à choisir. Tu dois les comparer objectivement (rapport qualité/prix, kilométrage, frais à prévoir, fiabilité moteur, état général). Sois direct, franc, et utilise du jargon mécanique.

Renvoie UNIQUEMENT un JSON valide avec cette structure exacte :
{
  "winner_index": 0,
  "verdict": "Explication courte et percutante de ton choix en 2-3 phrases max",
  "comparison_points": [
    {"criteria": "Rapport Qualité/Prix", "values": ["Commentaire véhicule 1", "Commentaire véhicule 2"]},
    {"criteria": "État Mécanique", "values": ["...", "..."]},
    {"criteria": "Kilométrage & Usure", "values": ["...", "..."]},
    {"criteria": "Frais à Prévoir", "values": ["...", "..."]},
    {"criteria": "Fiabilité Moteur", "values": ["...", "..."]}
  ]
}

IMPORTANT: winner_index est l'index (0-based) du meilleur véhicule. Le tableau values doit avoir exactement ${vehicles.length} éléments (un par véhicule, dans l'ordre). Ajoute d'autres critères si pertinent. Sois honnête et tranchant.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            { role: 'user', parts: [{ text: `${systemPrompt}\n\nVoici les véhicules :\n${vehiclesSummary}` }] }
          ],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.7,
          },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error('Gemini error:', errText);
      throw new Error('Erreur Gemini');
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) {
      throw new Error('Réponse Gemini vide');
    }

    const result = JSON.parse(text);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('compare-vehicles error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Erreur lors de la comparaison.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
