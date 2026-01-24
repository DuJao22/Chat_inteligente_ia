
import { GoogleGenAI } from "@google/genai";
import { Message } from "../types";

// Agente Dgital Soluctions - Prompt do Sistema
export const SYSTEM_INSTRUCTION = `Agente Dgital Soluctions. Venda: Tráfego, Automação, SaaS e LP.
Seja direto e consultivo. 
Obrigatório: Resposta + <analysis>{"stage":"...","status":"...","score":0,"next_step":"...","extracted_data":{}}</analysis>`;

/**
 * getGeminiChat - Dgital Soluctions
 * Inicializa o chat utilizando exclusivamente a chave da variável de ambiente.
 */
export const getGeminiChat = (history: Message[] = []) => {
  // O SDK deve ser inicializado com process.env.API_KEY conforme diretrizes
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Otimização de histórico para manter o contexto relevante
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

/**
 * parseAnalysis - Extrai os metadados JSON da resposta da IA
 */
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
