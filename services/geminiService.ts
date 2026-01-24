import { GoogleGenAI } from "@google/genai";
import { Message } from "../types";

export const SYSTEM_INSTRUCTION = `Agente Dgital Soluctions. Venda: Tráfego, Automação, SaaS e LP.
Seja direto e consultivo. 
Obrigatório: Resposta + <analysis>{"stage":"...","status":"...","score":0,"next_step":"...","extracted_data":{}}</analysis>`;

/**
 * getGeminiChat - Dgital Soluctions
 * Sempre utiliza a chave mais recente disponível em process.env.API_KEY
 */
export const getGeminiChat = (history: Message[] = []) => {
  // A chave é injetada automaticamente após window.aistudio.openSelectKey()
  // No Render, se o admin não vinculou uma chave própria, usa a do ambiente VITE_API_KEY
  const apiKey = process.env.API_KEY || (window as any).VITE_API_KEY;
  
  if (!apiKey) {
    throw new Error('API_KEY_MISSING');
  }

  const ai = new GoogleGenAI({ apiKey });
  
  // Otimização extrema: Máximo de 3 mensagens de histórico para economizar tokens
  const optimizedHistory = history.slice(-3);

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