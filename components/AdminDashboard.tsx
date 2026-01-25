
import React, { useState, useEffect } from 'react';
import { LeadService } from '../services/dbService';
import { Lead, LeadStatus, SystemSettings } from '../types';
import { GoogleGenAI } from "@google/genai";
import { 
  Users, Target, Zap, 
  Search, MessageSquare, X, 
  Settings, Activity, 
  RefreshCw, ShieldCheck, Link as LinkIcon, AlertTriangle, CheckCircle2,
  Key, Trash2, Eye, EyeOff
} from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filter, setFilter] = useState<string>('');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [apiStatus, setApiStatus] = useState<'checking' | 'active' | 'inactive' | 'error'>('checking');
  const [manualKey, setManualKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  useEffect(() => {
    loadLeads();
    loadSettings();
  }, []);

  const loadLeads = async () => {
    const data = await LeadService.getAllLeads();
    setLeads(data.sort((a, b) => new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime()));
  };

  const loadSettings = async () => {
    const settings = await LeadService.getSettings();
    if (settings.customApiKey) {
      setManualKey(settings.customApiKey);
      await testManualKey(settings.customApiKey, true);
    } else {
      setApiStatus('inactive');
    }
  };

  const testManualKey = async (keyToTest: string, silent = false) => {
    if (!keyToTest.trim()) return;
    if (!silent) setIsVerifying(true);
    setVerifyError(null);

    try {
      const ai = new GoogleGenAI({ apiKey: keyToTest.trim() });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: 'ping',
      });
      
      if (response.text) {
        // Salva nas configurações globais (simula persistência para todos os usuários)
        await LeadService.updateSettings({ customApiKey: keyToTest.trim() });
        setApiStatus('active');
        if (!silent) alert("Sucesso! Chave API aplicada globalmente para todos os usuários.");
      }
    } catch (err: any) {
      setApiStatus('error');
      let msg = err.message || "Erro de conexão";
      if (msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED")) {
        msg = "Cota Esgotada (Erro 429). Esta chave não possui faturamento ativo no Google AI Studio.";
      } else if (msg.includes("API_KEY_INVALID")) {
        msg = "Chave Inválida. Verifique os caracteres e tente novamente.";
      }
      setVerifyError(msg);
    } finally {
      if (!silent) setIsVerifying(false);
    }
  };

  const clearManualKey = async () => {
    if (confirm("Deseja remover a chave personalizada de todos os usuários e voltar para o padrão do sistema?")) {
      await LeadService.updateSettings({});
      setManualKey('');
      setApiStatus('inactive');
      setVerifyError(null);
    }
  };

  const filteredLeads = leads.filter(l => 
    l.name.toLowerCase().includes(filter.toLowerCase()) || 
    l.email?.toLowerCase().includes(filter.toLowerCase()) ||
    l.phone?.includes(filter)
  );

  const stats = {
    total: leads.length,
    hot: leads.filter(l => l.status === LeadStatus.HOT).length,
    avgScore: leads.length ? Math.round(leads.reduce((acc, curr) => acc + curr.score, 0) / leads.length) : 0
  };

  return (
    <div className="flex-1 bg-slate-50 overflow-y-auto p-4 md:p-8 h-full relative">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              Painel Gestor Dgital
              <button 
                onClick={() => setShowSettings(true)}
                className={`p-1.5 rounded-lg transition-all ${apiStatus === 'error' ? 'text-red-600 bg-red-50 animate-pulse' : 'text-gray-400 hover:text-blue-600'}`}
              >
                <Settings className="w-5 h-5" />
              </button>
            </h1>
            <p className="text-gray-500 text-xs tracking-tight uppercase font-bold opacity-60">ADMINISTRAÇÃO CENTRAL DE INFRAESTRUTURA</p>
          </div>
          <button onClick={() => loadLeads()} className="bg-white border border-gray-200 px-4 py-2 rounded-xl text-xs font-bold hover:bg-gray-50 shadow-sm flex items-center gap-2 transition-all active:scale-95">
            <RefreshCw className="w-4 h-4" /> Sincronizar CRM
          </button>
        </div>

        {/* Status da IA (Apenas Admin vê isso com controle total) */}
        <div className="bg-white p-6 rounded-[2rem] border border-blue-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
           <div className="flex items-center gap-4">
              <div className={`p-4 rounded-2xl ${apiStatus === 'active' ? 'bg-green-100 text-green-600' : apiStatus === 'error' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-400'}`}>
                 <Activity className="w-6 h-6" />
              </div>
              <div>
                 <h2 className="font-bold text-gray-900">Motor de IA Gemini 3</h2>
                 <p className="text-xs text-gray-500">{apiStatus === 'active' ? 'Operando normalmente para todos os usuários.' : 'Configuração pendente ou erro de cota.'}</p>
              </div>
           </div>
           <div className="flex gap-2 w-full md:w-auto">
              <button onClick={() => setShowSettings(true)} className="flex-1 md:flex-none px-6 py-3 bg-blue-600 text-white rounded-xl font-bold text-xs shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all">
                Configurar Chave Global
              </button>
           </div>
        </div>

        {/* Grid de Leads */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Leads</p>
            <h3 className="text-2xl font-bold text-gray-900">{stats.total}</h3>
          </div>
          <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Oportunidades Quentes</p>
            <h3 className="text-2xl font-bold text-gray-900 text-red-600">{stats.hot}</h3>
          </div>
          <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Qualificação Média</p>
            <h3 className="text-2xl font-bold text-gray-900 text-green-600">{stats.avgScore}%</h3>
          </div>
        </div>

        {/* Tabela de Leads */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-50 bg-gray-50/50 flex items-center gap-3">
             <Search className="w-4 h-4 text-gray-400" />
             <input type="text" placeholder="Pesquisar histórico de leads..." className="bg-transparent text-sm outline-none flex-1" value={filter} onChange={(e) => setFilter(e.target.value)} />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                <tr>
                  <th className="px-6 py-4">Lead</th>
                  <th className="px-6 py-4">Status Qualificação</th>
                  <th className="px-6 py-4 text-right">Interação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-sm text-gray-900">{lead.name || 'Pendente'}</p>
                      <p className="text-[10px] text-gray-400">{lead.email || 'Sem e-mail'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase ${
                        lead.status === LeadStatus.HOT ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-600'
                      }`}>{lead.status}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => setSelectedLead(lead)} className="p-2.5 hover:bg-blue-50 text-blue-600 rounded-xl transition-all">
                        <MessageSquare className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL DE CONFIGURAÇÃO (APENAS ADMIN) */}
      {showSettings && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden">
            <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 leading-none">Gestão de Infraestrutura</h3>
                  <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mt-1">Chave API Global do Sistema</p>
                </div>
              </div>
              <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="bg-amber-50 rounded-2xl p-5 border border-amber-100 flex gap-4">
                  <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />
                  <p className="text-[11px] text-amber-800 leading-relaxed font-medium">
                    <b>Atenção:</b> A chave inserida aqui será usada por <b>todos os usuários</b> que acessarem o chatbot. 
                    Certifique-se de usar uma chave de um projeto com faturamento ativo para evitar erros 429.
                  </p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Chave Mestre (Google Gemini)</label>
                <div className="relative">
                  <input 
                    type={showKey ? "text" : "password"}
                    placeholder="Cole a chave API mestre..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 px-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all pr-12"
                    value={manualKey}
                    onChange={(e) => setManualKey(e.target.value)}
                  />
                  <button onClick={() => setShowKey(!showKey)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {verifyError && (
                <div className="bg-red-50 p-4 rounded-2xl border border-red-100 flex gap-3 text-red-700 text-[11px] font-bold">
                  <XCircle className="w-4 h-4 shrink-0" />
                  {verifyError}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button 
                  onClick={() => testManualKey(manualKey)}
                  disabled={isVerifying || !manualKey}
                  className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-sm shadow-xl shadow-blue-100 flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50"
                >
                  {isVerifying ? <RefreshCw className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                  Salvar Chave para Todos
                </button>
                {manualKey && (
                  <button onClick={clearManualKey} className="p-4 bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-600 rounded-2xl transition-all">
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
              
              <p className="text-[10px] text-gray-400 text-center">
                A chave mestre é armazenada no banco de dados sincronizado da agência.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* LEAD HISTORY */}
      {selectedLead && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[2rem] shadow-2xl flex flex-col overflow-hidden">
            <div className="p-6 border-b flex items-center justify-between shrink-0">
               <h3 className="font-bold text-gray-900 text-lg">Histórico de Negociação: {selectedLead.name}</h3>
               <button onClick={() => setSelectedLead(null)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><X /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50">
               {selectedLead.messages?.map((m, idx) => (
                 <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`p-4 rounded-2xl max-w-[85%] text-sm shadow-sm ${m.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white border text-gray-800 rounded-tl-none'}`}>
                       {m.text}
                    </div>
                 </div>
               ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const XCircle = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
);

export default AdminDashboard;
