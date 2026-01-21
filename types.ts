
export enum FunnelStage {
  OPENING = 'Abertura',
  DIAGNOSIS = 'Diagnóstico',
  AUTHORITY = 'Autoridade',
  SOLUTION = 'Solução',
  QUALIFICATION = 'Qualificação',
  CONVERSION = 'Conversão'
}

export enum LeadStatus {
  COLD = 'Frio',
  WARM = 'Morno',
  QUALIFIED = 'Qualificado',
  HOT = 'Quente'
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export interface Lead {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  needs?: string;
  status: LeadStatus;
  stage: FunnelStage;
  score: number;
  lastActive: Date;
  messages: Message[];
}

export interface ChatState {
  messages: Message[];
  currentStage: FunnelStage;
  leadStatus: LeadStatus;
  isThinking: boolean;
  metrics: {
    diagnosisComplete: boolean;
    objectionsHandled: number;
    ctaReached: boolean;
  };
}

export interface AdminUser {
  isAuthenticated: boolean;
  username: string | null;
}
