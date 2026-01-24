
import React, { useState, useEffect } from 'react';
import { LeadService } from '../services/dbService';
import { Lead, LeadStatus, Message } from '../types';
import { GoogleGenAI } from "@google/genai";
import { 
  Users, Target, Zap, Phone, Mail, 
  Search, Trash2, ExternalLink,
  Filter, MessageSquare, X, Download, Calendar,
  Settings, ShieldCheck, AlertTriangle, Activity,
  Globe, ExternalLink as LinkIcon, RefreshCw
} from 'lucide-react';

/**
 * Interface para o seletor de chaves nativo do ambiente.
 * Definimos AIStudio separadamente para evitar conflitos de tipos globais.
 */
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    aistudio: AIStudio;
  }
}

const AdminDashboard: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filter, setFilter] = useState<string>('');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [apiStatus, setApiStatus] = useState<'checking' | 'active' | 'inactive'>('checking');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  useEffect(() => {
    loadLeads();
    checkApiStatus();
  }, []);

  const loadLeads = async () => {
    const data = await LeadService.getAllLeads();
    setLeads(data.sort((a, b) => new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime()));
  };

  const checkApiStatus = async () => {
    try {
      if (window.aistudio) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setApiStatus(hasKey ? 'active' : 'inactive');
      } else {
        setApiStatus('inactive');
      }
    } catch (e) {
      setApiStatus('inactive');
    }
  };

  const handleUpdateKey = async () => {
    try {
      if (window.aistudio) {
        await window.aistudio.openSelectKey();
        // A seleção é assíncrona, mas as instruções pedem para prosseguir.
        // Tentamos verificar após um pequeno delay para a injeção da key
        setTimeout(() => verifyConnection(), 500);
      }
    } catch (err) {
      console.error("Erro ao abrir seletor de chaves:", err);
    }
  };

  const verifyConnection = async () => {
    setIsVerifying(true);
    setVerifyError(null);
    try {
      // Criamos a instância na hora para garantir que pegamos a Key injetada
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: 'Ping para verificação de sistema. Responda apenas "OK".',
      });
      
      if (response.text) {
        setApiStatus('active');
        alert("Sucesso! A conexão com a IA foi restabelecida e está funcional.");
      }
    } catch (err: any) {
      setApiStatus('inactive');
      let msg = err.message || "Erro desconhecido";
      
      if (msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED")) {
        msg = "Cota Esgotada (429). Você precisa vincular uma chave de um projeto com faturamento ativo (Pago) no Google Cloud para evitar este limite.";
      } else if (msg.includes("Requested entity was not found")) {
        msg = "Chave inválida ou projeto não encontrado. Selecione outra chave.";
      }
      
      setVerifyError(msg);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Excluir este lead permanentemente?')) {
      await LeadService.deleteLead(id);
      loadLeads();
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
      <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                  CRM da Agência
                  <button 
                    onClick={() => setShowSettings(true)}
                    className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg transition-all text-gray-400 hover:text-blue-600 group"
                  >
                    <Settings className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
                  </button>
                </h1>
                <p className="text-gray-500 text-xs md:text-sm">Gestão de Leads Capturados pela IA</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => loadLeads()} className="bg-white border border-gray-200 px-4 py-2 rounded-xl text-xs md:text-sm font-medium hover:bg-gray-50 shadow-sm transition-colors flex items-center gap-2">
                <RefreshCw className="w-4 h-4" /> Atualizar Leads
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="bg-blue-100 p-3 rounded-xl text-blue-600 shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Leads</p>
              <h3 className="text-lg md:text-2xl font-bold leading-none mt-0.5">{stats.total}</h3>
            </div>
          </div>
          <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="bg-red-100 p-3 rounded-xl text-red-600 shrink-0">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Leads Hot</p>
              <h3 className="text-lg md:text-2xl font-bold leading-none mt-0.5">{stats.hot}</h3>
            </div>
          </div>
          <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 col-span-2 md:col-span-1">
            <div className="bg-green-100 p-3 rounded-xl text-green-600 shrink-0">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Score Médio</p>
              <h3 className="text-lg md:text-2xl font-bold leading-none mt-0.5">{stats.avgScore}%</h3>
            </div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white p-3 md:p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Buscar por nome, e-mail..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <button className="flex items-center justify-center gap-2 bg-white border border-gray-100 px-4 py-2 rounded-xl text-xs md:text-sm text-gray-600 hover:bg-gray-50">
              <Filter className="w-4 h-4" /> Filtrar
            </button>
          </div>
        </div>

        {/* Lead Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 text-gray-400 text-[10px] uppercase font-bold tracking-wider">
              <tr>
                <th className="px-6 py-4">Lead</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Score IA</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredLeads.map((lead) => (
                <tr key={lead.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-bold text-sm text-gray-900">{lead.name || 'Anônimo'}</div>
                    <div className="text-[10px] text-gray-400">{lead.id}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      lead.status === LeadStatus.HOT ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {lead.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-12 bg-gray-100 h-1 rounded-full overflow-hidden">
                        <div className="bg-blue-600 h-full" style={{ width: `${lead.score}%` }} />
                      </div>
                      <span className="text-[10px] font-bold text-gray-600">{lead.score}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setSelectedLead(lead)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                        <MessageSquare className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(lead.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredLeads.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-gray-400 text-sm italic">
                    Nenhum lead encontrado para os critérios de busca.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SETTINGS MODAL */}
      {showSettings && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 leading-none">Configurações de IA</h3>
                  <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mt-1">Infraestrutura Gemini</p>
                </div>
              </div>
              <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            <div className="p-8 space-y-6">
              {/* API Status Section */}
              <div className={`p-6 rounded-3xl border transition-all ${
                apiStatus === 'active' ? 'bg-green-50/50 border-green-100' : 
                apiStatus === 'checking' ? 'bg-blue-50/50 border-blue-100' : 
                'bg-red-50/50 border-red-100'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Activity className={`w-5 h-5 ${apiStatus === 'active' ? 'text-green-600' : 'text-gray-400'}`} />
                    <span className="text-sm font-bold text-gray-700">Status da API</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    apiStatus === 'active' ? 'bg-green-600 text-white' : 'bg-gray-400 text-white'
                  }`}>
                    {apiStatus === 'active' ? 'Online' : apiStatus === 'checking' ? 'Verificando...' : 'Offline'}
                  </span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">
                  {apiStatus === 'active' 
                    ? 'Sistema conectado. Sua chave API está ativa e pronta para uso em escala.'
                    : 'Sistema desconectado ou com cota excedida. Vincule uma nova chave para continuar.'}
                </p>
              </div>

              {verifyError && (
                <div className="bg-red-50 p-4 rounded-2xl border border-red-100 flex gap-3 text-red-600">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <p className="text-[11px] font-medium leading-normal">{verifyError}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                <button 
                  onClick={handleUpdateKey}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-sm shadow-xl shadow-blue-100 flex items-center justify-center gap-3 transition-all active:scale-95"
                >
                  <ShieldCheck className="w-5 h-5" />
                  Alterar / Vincular Nova Chave
                </button>
                <button 
                  onClick={verifyConnection}
                  disabled={isVerifying}
                  className="w-full py-3 border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {isVerifying ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
                  Testar Conexão Agora
                </button>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <div className="bg-amber-50 rounded-2xl p-4 flex gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                  <div>
                    <p className="text-[11px] font-bold text-amber-900 mb-1">Dica de Faturamento:</p>
                    <p className="text-[10px] text-amber-700 leading-relaxed">
                      Para evitar erros 429 (Cota Esgotada), utilize uma chave de um projeto com faturamento ativo. 
                      <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="ml-1 font-bold underline inline-flex items-center gap-0.5">
                        Ver Documentação <LinkIcon className="w-2 h-2" />
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 bg-gray-50/50 border-t border-gray-100 text-center">
               <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Dgital Soluctions - AI Admin v3.0</p>
            </div>
          </div>
        </div>
      )}

      {/* LEAD HISTORY MODAL */}
      {selectedLead && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[2rem] shadow-2xl flex flex-col overflow-hidden">
            <div className="p-6 border-b flex items-center justify-between bg-white shrink-0">
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                   {selectedLead.name.charAt(0)}
                 </div>
                 <div>
                   <h3 className="font-bold text-gray-900">Histórico de {selectedLead.name}</h3>
                   <p className="text-[10px] text-gray-400 uppercase tracking-tighter">Status: {selectedLead.status} • Stage: {selectedLead.stage}</p>
                 </div>
               </div>
               <button onClick={() => setSelectedLead(null)} className="p-2 hover:bg-gray-100 rounded-xl"><X /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50">
               {selectedLead.messages?.length > 0 ? selectedLead.messages.map((m, idx) => (
                 <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`p-4 rounded-2xl max-w-[85%] text-sm shadow-sm ${m.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white border text-gray-800 rounded-tl-none'}`}>
                       {m.text}
                       <div className={`text-[8px] mt-1 opacity-60 ${m.role === 'user' ? 'text-blue-100' : 'text-gray-400'}`}>
                         {new Date(m.timestamp).toLocaleTimeString()}
                       </div>
                    </div>
                 </div>
               )) : (
                 <div className="text-center py-20 text-gray-400 italic">Sem histórico de mensagens.</div>
               )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
