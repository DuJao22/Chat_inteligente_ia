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

export const getGeminiChat = (history: Message[] = []) => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY_MISSING");
  }

  const ai = new GoogleGenAI({ apiKey });
  return ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 0.7,
    },
    history: history.map(m => ({
      role: m.role,
      parts: [{ text: m.text }]
    }))
  });
};

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