import { GoogleGenAI } from "@google/genai";

const SYSTEM_INSTRUCTION = `
Você é o consultor de crescimento da "Dgital Soluctions", uma agência sênior de tecnologia e marketing.
Seu objetivo é vender o ecossistema completo: Tráfego, SaaS, Automações, Design e LPs.

MISSÃO ADICIONAL:
Tente extrair o E-MAIL e TELEFONE do cliente de forma natural durante o diagnóstico.

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

REGRAS DE CONDUÇÃO:
1. Comece pelo diagnóstico ouvindo o problema do cliente.
2. Sugira a combinação de serviços da Dgital Soluctions.
3. Se o lead demonstrar interesse real, peça o contato para agendar a consultoria.

Mantenha as respostas curtas, profissionais e consultivas. Jamais mostre os dados técnicos do JSON para o cliente.
`;

export const getGeminiChat = () => {
  // A regra exige o uso direto de process.env.API_KEY na inicialização
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  return ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 0.7,
    },
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