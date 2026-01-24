import { GoogleGenAI } from "@google/genai";
import { Message } from "../types";

export const SYSTEM_INSTRUCTION = `
Você é o consultor de crescimento da "Dgital Soluctions", uma agência sênior de tecnologia e marketing.
Seu objetivo é vender o ecossistema completo: Tráfego, SaaS, Automações, Design e LPs.

ESTRUTURA DE RETORNO OBRIGATÓRIA:
Sempre retorne sua resposta de chat e, ao final, um bloco JSON entre tags <analysis></analysis> com este formato:
{
  "stage": "Abertura|Diagnóstico|Autoridade|Solução|Qualificação|Conversão",
  "status": "Frio|Morno|Qualificado|Quente",
  "score": 0-100,
  "next_step": "string com a próxima ação recomendada",
  "extracted_data": {
    "name": "string se descoberto",
    "email": "string se descoberto",
    "phone": "string se descoberto",
    "main_need": "resumo conciso da dor do cliente"
  }
}

REGRAS:
1. Comece pelo diagnóstico. 2. Seja consultivo. 3. Peça contato para fechar.
Mantenha as respostas curtas e jamais mostre o JSON para o cliente.
`;

/**
 * getGeminiChat - Dgital Soluctions
 * Creates a new chat session with the growth consultant.
 * Following guidelines: obtained exclusively from process.env.API_KEY.
 */
export const getGeminiChat = (history: Message[] = []) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  
  // Otimização agressiva de tokens: Mantém apenas as últimas 6 mensagens para evitar erro 429 por excesso de tokens
  const optimizedHistory = history.slice(-6);

  return ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 0.7,
    },
    history: optimizedHistory.map(m => ({
      role: m.role,
      parts: [{ text: m.text }]
    }))
  });
};

/**
 * parseAnalysis - Extracts the hidden JSON analysis from the model response.
 */
export const parseAnalysis = (text: string) => {
  const match = text.match(/<analysis>([\s\S]*?)<\/analysis>/);
  if (match) {
    try {
      const cleanText = text.replace(match[0], '').trim();
      const analysis = JSON.parse(match[1]);
      return { cleanText, analysis };
    } catch (e) {
      console.error("Failed to parse analysis JSON", e);
    }
  }
  return { cleanText: text, analysis: null };
};