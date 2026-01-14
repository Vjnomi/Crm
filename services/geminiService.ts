
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getRoleRecommendation = async (roleName: string, companyIndustry: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Suggest a professional description and a list of standard CRM permissions for a role named "${roleName}" in a company in the "${companyIndustry}" industry.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            description: { type: Type.STRING },
            suggestedPermissions: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["description", "suggestedPermissions"]
        }
      }
    });
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini Error:", error);
    return null;
  }
};
