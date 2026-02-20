
import { GoogleGenAI } from "@google/genai";

// Initialize AI client using process.env.API_KEY directly
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getImmigrationHelp = async (query: string) => {
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
