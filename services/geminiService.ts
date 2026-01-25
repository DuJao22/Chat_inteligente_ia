
import { GoogleGenAI } from "@google/genai";
import { Message } from "../types";
import { LeadService } from "./dbService";

export const SYSTEM_INSTRUCTION = `Você é o Consultor Sênior da Dgital Soluctions. 
Seu objetivo é vender Tráfego Pago, Automações e SaaS. 
Seja consultivo, direto e use gatilhos mentais de escassez e autoridade.
Sempre retorne sua resposta seguida de uma análise técnica no formato:
<analysis>{"stage":"...","status":"...","score":0,"next_step":"...","extracted_data":{}}</analysis>`;

/**
 * Obtém a chave API mestre definida pelo administrador.
 */
const getMasterApiKey = async () => {
  const settings = await LeadService.getSettings();
  // Retorna a chave salva pelo admin ou a do sistema (env)
  return settings.customApiKey || process.env.API_KEY || '';
};

export const getGeminiChat = async (history: Message[] = []) => {
  const apiKey = await getMasterApiKey();
  
  if (!apiKey) {
    throw new Error("Sistema aguardando configuração da chave pelo administrador.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const optimizedHistory = history.slice(-6);

  try {
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
  } catch (error: any) {
    throw error;
  }
};

export const parseAnalysis = (text: string) => {
  const match = text.match(/<analysis>([\s\S]*?)<\/analysis>/);
  if (match) {
    try {
      const cleanText = text.replace(match[0], '').trim();
      const analysis = JSON.parse(match[1]);
      return { cleanText, analysis };
    } catch (e) {
      console.warn("Falha ao processar análise da IA");
    }
  }
  return { cleanText: text, analysis: null };
};
