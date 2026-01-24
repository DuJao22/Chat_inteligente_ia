import { GoogleGenAI } from "@google/genai";
import { Message } from "../types";

export const SYSTEM_INSTRUCTION = `
Você é o consultor de crescimento da "Dgital Soluctions". Venda: Tráfego, SaaS, Automações e LPs.
Seja consultivo e direto. Sempre retorne sua resposta e o JSON de análise ao final.

FORMATO OBRIGATÓRIO:
[Sua resposta aqui]
<analysis>{"stage": "...", "status": "...", "score": 0, "next_step": "...", "extracted_data": {}}</analysis>

REGRAS: 1. Diagnóstico primeiro. 2. Peça contato. 3. Respostas curtas.
`;

/**
 * getGeminiChat - Dgital Soluctions
 * Otimizado para economizar cota de tokens (TPM).
 */
export const getGeminiChat = (history: Message[] = []) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  
  // Otimização Relicon: Mantém apenas as últimas 4 mensagens. 
  // Isso reduz drasticamente o consumo de tokens e evita erros 429.
  const optimizedHistory = history.slice(-4);

  return ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 0.7,
      topP: 0.8,
      topK: 40
    },
    history: optimizedHistory.map(m => ({
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
      console.error("Analysis Parse Fail");
    }
  }
  return { cleanText: text, analysis: null };
};