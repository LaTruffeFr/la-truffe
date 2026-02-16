import { GoogleGenerativeAI } from "@google/generative-ai";

// Récupère la clé API depuis le fichier .env
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

async function fileToGenerativePart(file: File) {
  const base64EncodedDataPromise = new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
}

export async function certifyCar(details: any, imageFile: File) {
  if (!API_KEY) {
    console.error("Clé API Gemini manquante !");
    return null;
  }

  const genAI = new GoogleGenerativeAI(API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `${SYSTEM_PROMPT}
  
  DONNÉES VÉHICULE :
  Marque: ${details.marque}
  Modèle: ${details.modele}
  Année: ${details.year}
  KM: ${details.mileage}
  Prix: ${details.price}€
  Description: ${details.description}`;

  try {
    const imagePart = await fileToGenerativePart(imageFile);
    const result = await model.generateContent([prompt, imagePart as any]);
    const response = await result.response;
    const text = response.text().replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(text);
  } catch (error) {
    console.error("Erreur IA:", error);
    return null;
  }
}