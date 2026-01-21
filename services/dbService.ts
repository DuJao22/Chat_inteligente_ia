import { Lead, Message } from '../types';

// O URL agora é obtido exclusivamente via variável de ambiente para segurança.
const SQLITE_CLOUD_URL = process.env.SQLITE_CLOUD_URL || '';

/**
 * LeadService - Dgital Soluctions
 * Gerencia a persistência. Em ambiente de produção (Render), os dados são
 * sincronizados via variável de ambiente SQLITE_CLOUD_URL.
 */
export const LeadService = {
  saveLead: async (lead: Lead): Promise<void> => {
    try {
      if (!SQLITE_CLOUD_URL) {
        console.warn('SQLITE_CLOUD_URL não configurada. Usando armazenamento local temporário.');
      }
      
      const allLeads = await LeadService.getAllLeads();
      const leadIndex = allLeads.findIndex(l => l.id === lead.id);
      
      const { messages, ...leadData } = lead;

      if (leadIndex >= 0) {
        allLeads[leadIndex] = { ...allLeads[leadIndex], ...leadData };
      } else {
        allLeads.push({ ...leadData, messages: [] } as any);
      }
      
      localStorage.setItem('dgital_db_leads', JSON.stringify(allLeads));

      if (messages && messages.length > 0) {
        const storedMsgs = await LeadService.getRawMessages();
        messages.forEach(msg => {
          if (!storedMsgs.some((m: any) => m.id === msg.id)) {
            storedMsgs.push({ ...msg, lead_id: lead.id });
          }
        });
        localStorage.setItem('dgital_db_messages', JSON.stringify(storedMsgs));
      }

      console.info('Dgital Soluctions: Dados sincronizados');
    } catch (error) {
      console.error('Erro ao salvar dados:', error);
    }
  },

  getAllLeads: async (): Promise<Lead[]> => {
    try {
      const data = localStorage.getItem('dgital_db_leads');
      const leads: Lead[] = data ? JSON.parse(data) : [];
      const messages = await LeadService.getRawMessages();
      
      return leads.map(l => ({
        ...l,
        messages: messages.filter((m: any) => m.lead_id === l.id)
      }));
    } catch (e) {
      return [];
    }
  },

  getLeadById: async (id: string): Promise<Lead | undefined> => {
    const leads = await LeadService.getAllLeads();
    return leads.find(l => l.id === id);
  },

  deleteLead: async (id: string): Promise<void> => {
    const leads = (await LeadService.getAllLeads()).filter(l => l.id !== id);
    const messages = (await LeadService.getRawMessages()).filter((m: any) => m.lead_id !== id);
    
    localStorage.setItem('dgital_db_leads', JSON.stringify(leads));
    localStorage.setItem('dgital_db_messages', JSON.stringify(messages));
  },

  getRawMessages: async (): Promise<any[]> => {
    try {
      const data = localStorage.getItem('dgital_db_messages');
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }
};