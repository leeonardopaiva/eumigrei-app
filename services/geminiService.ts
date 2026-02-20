
import { GoogleGenAI } from "@google/genai";

let aiClient: GoogleGenAI | null = null;

const getApiKey = (): string | undefined => {
  const viteKey = (import.meta as any)?.env?.VITE_GEMINI_API_KEY as string | undefined;
  const processKey =
    typeof process !== "undefined"
      ? (process.env?.GEMINI_API_KEY || process.env?.API_KEY)
      : undefined;

  return viteKey || processKey;
};

const getClient = (): GoogleGenAI | null => {
  if (aiClient) {
    return aiClient;
  }

  const apiKey = getApiKey();
  if (!apiKey) {
    return null;
  }

  try {
    aiClient = new GoogleGenAI({ apiKey });
    return aiClient;
  } catch (error) {
    console.error("Gemini client initialization error:", error);
    return null;
  }
};

export const getImmigrationHelp = async (query: string) => {
  const ai = getClient();
  if (!ai) {
    return "Assistente IA indisponível no momento. Configure a chave GEMINI_API_KEY para ativar esta função.";
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `O usuário brasileiro no exterior tem a seguinte dúvida: "${query}". Responda de forma amigável, concisa e informativa em português, agindo como um consultor de imigração experiente da comunidade Eumigrei.`,
      config: {
        temperature: 0.7,
        topP: 0.95,
      },
    });
    // Access response text property directly
    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Desculpe, tive um problema ao processar sua dúvida. Tente novamente mais tarde.";
  }
};
