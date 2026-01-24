
import { GoogleGenAI } from "@google/genai";
import { Message } from "../types";

// Agente Dgital Soluctions - Prompt do Sistema
export const SYSTEM_INSTRUCTION = `Agente Dgital Soluctions. Venda: Tráfego, Automação, SaaS e LP.
Seja direto e consultivo. 
Obrigatório: Resposta + <analysis>{"stage":"...","status":"...","score":0,"next_step":"...","extracted_data":{}}</analysis>`;

/**
 * Recupera a melhor chave API disponível.
 * Prioridade: Chave Manual (Painel) > process.env.API_KEY
 */
const getActiveApiKey = () => {
  const manualKey = localStorage.getItem('dgital_custom_api_key');
  return manualKey || process.env.API_KEY;
};

/**
 * getGeminiChat - Dgital Soluctions
 * Inicializa o chat utilizando a chave mestre definida.
 */
export const getGeminiChat = (history: Message[] = []) => {
  const apiKey = getActiveApiKey();
  const ai = new GoogleGenAI({ apiKey: apiKey || '' });
  
  // Otimização de histórico
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
