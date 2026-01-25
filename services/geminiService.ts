
import { GoogleGenAI } from "@google/genai";
import { Message } from "../types";
import { LeadService } from "./dbService";

export const SYSTEM_INSTRUCTION = `Agente Dgital Soluctions. Venda: Tráfego, Automação, SaaS e LP.
Seja direto e consultivo. 
Obrigatório: Resposta + <analysis>{"stage":"...","status":"...","score":0,"next_step":"...","extracted_data":{}}</analysis>`;

/**
 * Recupera a chave API ativa. 
 * Em uma aplicação real com SQLite Cloud, isso viria de uma tabela de configurações.
 */
const getActiveApiKey = async () => {
  const settings = await LeadService.getSettings();
  return settings.customApiKey || process.env.API_KEY;
};

export const getGeminiChat = async (history: Message[] = []) => {
  const apiKey = await getActiveApiKey();
  const ai = new GoogleGenAI({ apiKey: apiKey || '' });
  
  const optimizedHistory = history.slice(-5);

  return ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 0.7,
      topP: 0.8,
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
      console.warn("Análise ignorada por erro de formatação");
    }
  }
  return { cleanText: text, analysis: null };
};
