
import React, { useState, useEffect } from 'react';
import { LeadService } from '../services/dbService';
import { Lead, LeadStatus, Message } from '../types';
import { GoogleGenAI } from "@google/genai";
import { 
  Users, Target, Zap, Phone, Mail, 
  Search, Trash2, ExternalLink,
  Filter, MessageSquare, X, Download, Calendar,
  Settings, ShieldCheck, AlertTriangle, Activity,
  Globe, ExternalLink as LinkIcon
} from 'lucide-react';

/**
 * Global declaration for AIStudio to avoid conflicts with ambient types.
 */
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
  interface Window {
    // Making it optional to match potential pre-existing ambient declarations
    aistudio?: AIStudio;
  }
}

const AdminDashboard: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filter, setFilter] = useState<string>('');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [apiStatus, setApiStatus] = useState<'checking' | 'active' | 'inactive'>('checking');
  const [isVerifying, setIsVerifying] = useState(false);

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
      // Using optional chaining to safely check for aistudio availability
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
    // Safely trigger key selection dialog
    await window.aistudio?.openSelectKey();
    // Após abrir o seletor, tentamos verificar a chave imediatamente
    verifyConnection();
  };

  const verifyConnection = async () => {
    setIsVerifying(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: 'Ping check',
      });
      
      if (response.text) {
        setApiStatus('active');
        alert("Sucesso! A nova chave API foi verificada e está ativa em todo o sistema.");
      }
    } catch (err: any) {
      setApiStatus('inactive');
      if (err.message?.includes("Requested entity was not found")) {
        alert("A chave selecionada parece ser de um projeto inválido. Por favor, selecione uma chave de um projeto faturado.");
      } else {
        alert("Erro na verificação: " + err.message);
      }
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

  const exportData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(leads, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "leads_dgital_history.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
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
                    className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg transition-all text-gray-400 hover:text-blue-600 rotate-0 hover:rotate-90 duration-300"
                  >
                    <Settings className="w-5 h-5" />
                  </button>
                </h1>
                <p className="text-gray-500 text-xs md:text-sm">Gestão de Leads Capturados pela IA</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={exportData}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-xl text-xs md:text-sm font-bold hover:bg-blue-100 transition-colors"
              >
                <Download className="w-4 h-4" /> Exportar Histórico
              </button>
              <button onClick={loadLeads} className="bg-white border border-gray-200 px-4 py-2 rounded-xl text-xs md:text-sm font-medium hover:bg-gray-50 shadow-sm transition-colors">
                Atualizar
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3 md:gap-4">
            <div className="bg-blue-100 p-2 md:p-3 rounded-xl text-blue-600 shrink-0">
              <Users className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total</p>
              <h3 className="text-lg md:text-2xl font-bold leading-none mt-0.5">{stats.total}</h3>
            </div>
          </div>
          <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3 md:gap-4">
            <div className="bg-red-100 p-2 md:p-3 rounded-xl text-red-600 shrink-0">
              <Zap className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Hot</p>
              <h3 className="text-lg md:text-2xl font-bold leading-none mt-0.5">{stats.hot}</h3>
            </div>
          </div>
          <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3 md:gap-4 col-span-2 md:col-span-1">
            <div className="bg-green-100 p-2 md:p-3 rounded-xl text-green-600 shrink-0">
              <Target className="w-5 h-5 md:w-6 md:h-6" />
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
          <button className="flex items-center justify-center gap-2 bg-white border border-gray-100 px-4 py-2 rounded-xl text-xs md:text-sm text-gray-600 hover:bg-gray-50">
            <Filter className="w-4 h-4" /> Filtrar
          </button>
        </div>

        {/* Lead List Content */}
        <div className="bg-white md:rounded-2xl shadow-sm md:border border-gray-100 overflow-hidden -mx-4 md:mx-0">
          {/* Mobile View */}
          <div className="md:hidden divide-y divide-gray-100">
            {filteredLeads.map((lead) => (
              <div key={lead.id} className="p-5 flex flex-col gap-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">{lead.name || 'Visitante Novo'}</h4>
                    <p className="text-[10px] text-gray-500 font-mono mt-0.5 uppercase tracking-tighter">ID: {lead.id}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    lead.status === LeadStatus.HOT ? 'bg-red-100 text-red-600' :
                    lead.status === LeadStatus.WARM ? 'bg-orange-100 text-orange-600' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {lead.status}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-10 bg-gray-100 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-blue-600 h-full" style={{ width: `${lead.score}%` }} />
                    </div>
                    <span className="text-[10px] font-bold text-gray-700">{lead.score}%</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setSelectedLead(lead)} className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
                      <MessageSquare className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(lead.id)} className="p-2.5 bg-red-50 text-red-600 rounded-lg">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 text-gray-400 text-[10px] uppercase font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-4">Lead / Contato</th>
                  <th className="px-6 py-4">Status & Estágio</th>
                  <th className="px-6 py-4">Score IA</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4 font-bold text-sm text-gray-900">{lead.name || 'Anônimo'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        lead.status === LeadStatus.HOT ? 'bg-red-100 text-red-600' : 'bg-gray-100'
                      }`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-12 bg-gray-100 h-1 rounded-full overflow-hidden">
                          <div className="bg-blue-600 h-full" style={{ width: `${lead.score}%` }} />
                        </div>
                        <span className="text-[10px] font-bold">{lead.score}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
              </tbody>
            </table>
          </div>
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

            <div className="p-8 space-y-8">
              {/* API Status Section */}
              <div className={`p-5 rounded-3xl border ${
                apiStatus === 'active' ? 'bg-green-50/50 border-green-100' : 
                apiStatus === 'checking' ? 'bg-blue-50/50 border-blue-100' : 
                'bg-red-50/50 border-red-100'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Activity className={`w-5 h-5 ${apiStatus === 'active' ? 'text-green-600' : 'text-gray-400'}`} />
                    <span className="text-sm font-bold text-gray-700">Status da Conexão</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    apiStatus === 'active' ? 'bg-green-600 text-white' : 'bg-gray-400 text-white'
                  }`}>
                    {apiStatus === 'active' ? 'Online' : apiStatus === 'checking' ? 'Verificando...' : 'Desconectado'}
                  </span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">
                  {apiStatus === 'active' 
                    ? 'O sistema está conectado com sua chave API exclusiva. Limites de cota baseados no seu plano Google Cloud.'
                    : 'Não foi detectada uma chave API válida. O sistema está operando no modo de cota compartilhada (sujeito a erros 429).'}
                </p>
              </div>

              {/* Action Section */}
              <div className="space-y-4">
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={handleUpdateKey}
                    className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-sm shadow-xl shadow-blue-100 flex items-center justify-center gap-3 transition-all active:scale-95"
                  >
                    <ShieldCheck className="w-5 h-5" />
                    Vincular Nova Chave API
                  </button>
                  <button 
                    onClick={verifyConnection}
                    disabled={isVerifying}
                    className="w-full py-3 border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    {isVerifying ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
                    Testar Conectividade Agora
                  </button>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <div className="bg-amber-50 rounded-2xl p-4 flex gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                    <div>
                      <p className="text-[11px] font-bold text-amber-900 mb-1">Dica de Performance:</p>
                      <p className="text-[10px] text-amber-700 leading-relaxed">
                        Para evitar erros de "Cota Esgotada", use uma chave de um projeto com faturamento ativo no Google AI Studio.
                        <a 
                          href="https://ai.google.dev/gemini-api/docs/billing" 
                          target="_blank" 
                          className="inline-flex items-center gap-1 ml-1 font-bold underline"
                        >
                          Documentação <LinkIcon className="w-2.5 h-2.5" />
                        </a>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 bg-gray-50/50 border-t border-gray-100 flex justify-center">
               <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Dgital Soluctions - Admin Engine v2.5</p>
            </div>
          </div>
        </div>
      )}

      {/* SELECTED LEAD HISTORY MODAL - Mantido do código anterior */}
      {selectedLead && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[2rem] shadow-2xl flex flex-col overflow-hidden">
            <div className="p-6 border-b flex items-center justify-between bg-white shrink-0">
               <h3 className="font-bold text-gray-900">Histórico: {selectedLead.name}</h3>
               <button onClick={() => setSelectedLead(null)} className="p-2 hover:bg-gray-100 rounded-xl"><X /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50">
               {selectedLead.messages?.map((m, idx) => (
                 <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`p-4 rounded-2xl max-w-[80%] text-sm ${m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white border'}`}>
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

// Ícone de Refresh inline para simplificar
const RefreshCw = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
);

export default AdminDashboard;
