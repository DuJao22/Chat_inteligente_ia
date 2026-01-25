
import { Lead, Message, SystemSettings } from '../types';

const SQLITE_CLOUD_URL = process.env.SQLITE_CLOUD_URL || '';

export const LeadService = {
  // Gerenciamento de Configurações Globais
  getSettings: async (): Promise<SystemSettings> => {
    try {
      const data = localStorage.getItem('dgital_system_settings');
      return data ? JSON.parse(data) : {};
    } catch (e) {
      return {};
    }
  },

  updateSettings: async (settings: SystemSettings): Promise<void> => {
    localStorage.setItem('dgital_system_settings', JSON.stringify(settings));
  },

  saveLead: async (lead: Lead): Promise<void> => {
    try {
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

  getRawMessages: async (): Promise<any[]> => {
    try {
      const data = localStorage.getItem('dgital_db_messages');
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }
};
