import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

const SYSTEM_PROMPT = `
Tu es l'expert certificateur de "LaTruffe".
Analyse cette voiture (Données + Photo) pour la vente.

CRITÈRES DE NOTATION (0-100) :
- +Points : Faible KM, 1ère main, Toit ouvrant, Carnet, État propre sur photo.
- -Points : Prix trop élevé, Rayures visibles, Siège usé, Description vide.

FORMAT JSON ATTENDU (Réponds uniquement en JSON) :
{
  "score": number,
  "verdict": "string (Ex: Excellente, Bonne, Risquée)",
  "avis": "string (Court commentaire expert)",
  "tags": ["string"] (Ex: Toit Ouvrant, Prix Ferme, etc.)
}
`;

// Fonction de secours (Mock) si l'IA ne répond pas
function getMockCertification(details: any) {
  console.log("⚠️ Passage en mode Simulation (Fallback)");
  return {
    score: 85,
    verdict: "Très Bonne (Simulé)",
    avis: `Véhicule ${details.marque} ${details.modele} apparemment en excellent état. Le kilométrage de ${details.mileage}km est cohérent avec l'année ${details.year}. (Note: Analyse simulée suite indisponibilité IA)`,
    tags: ["Dossier Complet", "Prix Cohérent", "Certifié LaTruffe"]
  };
}

async function fileToGenerativePart(file: File) {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
}

export async function certifyCar(details: any, imageFile: File) {
  // 1. Si pas de clé, on simule direct
  if (!API_KEY) {
    console.warn("Clé API manquante, utilisation du mode simulation.");
    return getMockCertification(details);
  }

  try {
    const genAI = new GoogleGenerativeAI(API_KEY);
    // On tente le modèle "8b" qui est souvent moins chargé et très rapide
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-8b" });

    const prompt = `${SYSTEM_PROMPT}
    
    DONNÉES VÉHICULE :
    Marque: ${details.marque}
    Modèle: ${details.modele}
    Année: ${details.year}
    KM: ${details.mileage}
    Prix: ${details.price}€
    Description: ${details.description}`;

    const imagePart = await fileToGenerativePart(imageFile);
    
    // Appel API
    const result = await model.generateContent([prompt, imagePart as any]);
    const response = await result.response;
    const text = response.text().replace(/```json/g, "").replace(/```/g, "").trim();
    
    return JSON.parse(text);

  } catch (error) {
    // 2. Si L'IA plante (404, 429, Network Error...), on attrape l'erreur et on simule
    console.error("❌ Erreur IA (Passage automatique en simulation):", error);
    return getMockCertification(details);
  }
}