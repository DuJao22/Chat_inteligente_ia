
import React, { useState, useEffect } from 'react';
import { LeadService } from '../services/dbService';
import { Lead, LeadStatus } from '../types';
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
  const [manualKey, setManualKey] = useState(localStorage.getItem('dgital_custom_api_key') || '');
  const [showKey, setShowKey] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  useEffect(() => {
    loadLeads();
    checkInitialStatus();
  }, []);

  const loadLeads = async () => {
    const data = await LeadService.getAllLeads();
    setLeads(data.sort((a, b) => new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime()));
  };

  const checkInitialStatus = async () => {
    if (manualKey) {
      await testManualKey(manualKey, true);
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
        localStorage.setItem('dgital_custom_api_key', keyToTest.trim());
        setApiStatus('active');
        if (!silent) alert("Sucesso! Chave API validada e ativa.");
      }
    } catch (err: any) {
      setApiStatus('error');
      let msg = err.message || "Erro de conexão";
      if (msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED")) {
        msg = "Cota Esgotada (Erro 429). Esta chave pertence a um projeto sem faturamento ativo.";
      } else if (msg.includes("API_KEY_INVALID")) {
        msg = "Chave Inválida. Verifique se a chave está correta.";
      }
      setVerifyError(msg);
    } finally {
      if (!silent) setIsVerifying(false);
    }
  };

  const clearManualKey = () => {
    if (confirm("Deseja remover a chave manual e voltar para a chave padrão?")) {
      localStorage.removeItem('dgital_custom_api_key');
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
            <p className="text-gray-500 text-xs">Controle de Leads e Infraestrutura de IA</p>
          </div>
          <button onClick={() => loadLeads()} className="bg-white border border-gray-200 px-4 py-2 rounded-xl text-xs font-bold hover:bg-gray-50 shadow-sm flex items-center gap-2 transition-all">
            <RefreshCw className="w-4 h-4" /> Sincronizar
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="bg-blue-50 p-3 rounded-2xl text-blue-600"><Users /></div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Leads Totais</p>
              <h3 className="text-2xl font-bold text-gray-900">{stats.total}</h3>
            </div>
          </div>
          <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="bg-red-50 p-3 rounded-2xl text-red-600"><Zap /></div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Leads Quentes</p>
              <h3 className="text-2xl font-bold text-gray-900">{stats.hot}</h3>
            </div>
          </div>
          <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="bg-green-50 p-3 rounded-2xl text-green-600"><Target /></div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Conversão Média</p>
              <h3 className="text-2xl font-bold text-gray-900">{stats.avgScore}%</h3>
            </div>
          </div>
        </div>

        {/* Lead Table */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-50 bg-gray-50/50 flex items-center gap-3">
             <Search className="w-4 h-4 text-gray-400" />
             <input 
              type="text" 
              placeholder="Pesquisar leads..."
              className="bg-transparent text-sm outline-none flex-1"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
             />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                <tr>
                  <th className="px-6 py-4">Lead</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-sm text-gray-900">{lead.name || 'Anônimo'}</p>
                      <p className="text-[10px] text-gray-400">{lead.id}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                        lead.status === LeadStatus.HOT ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'
                      }`}>{lead.status}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => setSelectedLead(lead)} className="p-2 hover:bg-blue-50 text-blue-600 rounded-xl transition-all">
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
                  <h3 className="text-lg font-bold text-gray-900 leading-none">Infraestrutura de IA</h3>
                  <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mt-1">Configuração de Chaves</p>
                </div>
              </div>
              <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            <div className="p-8 space-y-6">
              {/* Status Section */}
              <div className={`p-6 rounded-3xl border transition-all ${
                apiStatus === 'active' ? 'bg-green-50/50 border-green-100' : 
                apiStatus === 'error' ? 'bg-red-50/50 border-red-100' :
                'bg-slate-50 border-slate-100'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 font-bold text-gray-700 text-sm">
                    <Activity className={`w-4 h-4 ${apiStatus === 'active' ? 'text-green-600' : apiStatus === 'error' ? 'text-red-600' : 'text-gray-400'}`} />
                    Saúde da Conexão
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    apiStatus === 'active' ? 'bg-green-600 text-white' : 
                    apiStatus === 'error' ? 'bg-red-600 text-white' : 
                    'bg-gray-400 text-white'
                  }`}>
                    {apiStatus === 'active' ? 'Operacional' : apiStatus === 'error' ? 'Cota Esgotada' : 'Offline'}
                  </span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">
                  {apiStatus === 'active' ? 'Chave validada. O chatbot está operando sem limites de IP.' : 'O sistema requer uma chave API para evitar o Erro 429 de cota compartilhada.'}
                </p>
              </div>

              {/* Manual Input Section */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <Key className="w-3 h-3" /> Chave API Gemini (Manual)
                  </label>
                  <div className="relative group">
                    <input 
                      type={showKey ? "text" : "password"}
                      placeholder="Cole sua API Key aqui..."
                      className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-3.5 px-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all pr-12"
                      value={manualKey}
                      onChange={(e) => setManualKey(e.target.value)}
                    />
                    <button 
                      onClick={() => setShowKey(!showKey)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {verifyError && (
                  <div className="bg-red-50 p-4 rounded-2xl border border-red-100 flex gap-3 text-red-700">
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                    <p className="text-[11px] font-medium leading-normal">{verifyError}</p>
                  </div>
                )}

                <div className="flex gap-2">
                  <button 
                    onClick={() => testManualKey(manualKey)}
                    disabled={isVerifying || !manualKey}
                    className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-sm shadow-xl shadow-blue-100 flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {isVerifying ? <RefreshCw className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                    Validar e Ativar Chave
                  </button>
                  {manualKey && (
                    <button 
                      onClick={clearManualKey}
                      className="p-4 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-2xl transition-colors"
                      title="Remover Chave"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <div className="bg-amber-50 rounded-2xl p-4 flex gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                  <div>
                    <p className="text-[11px] font-bold text-amber-900 mb-1">Dica Importante</p>
                    <p className="text-[10px] text-amber-700 leading-relaxed">
                      Para evitar erros 429 permanentes, utilize uma chave de um projeto no Google AI Studio com **Billing (faturamento)** ativado.
                      <a href="https://aistudio.google.com/app/apikey" target="_blank" className="ml-1 font-bold underline inline-flex items-center gap-0.5">
                        Criar Chave <LinkIcon className="w-2 h-2" />
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 bg-gray-50/50 border-t border-gray-100 text-center">
               <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Dgital Soluctions - Infrastructure Control</p>
            </div>
          </div>
        </div>
      )}

      {/* LEAD HISTORY MODAL */}
      {selectedLead && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[2rem] shadow-2xl flex flex-col overflow-hidden">
            <div className="p-6 border-b flex items-center justify-between shrink-0">
               <h3 className="font-bold text-gray-900">Histórico: {selectedLead.name}</h3>
               <button onClick={() => setSelectedLead(null)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><X /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50">
               {selectedLead.messages?.map((m, idx) => (
                 <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`p-4 rounded-2xl max-w-[85%] text-sm ${m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white border text-gray-800'}`}>
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

export default AdminDashboard;
