
import React, { useState, useEffect } from 'react';
import { LeadService } from '../services/dbService';
import { Lead, LeadStatus, SystemSettings } from '../types';
import { GoogleGenAI } from "@google/genai";
import { 
  Users, Target, Zap, 
  Search, MessageSquare, X, 
  Settings, Activity, 
  RefreshCw, ShieldCheck, Link as LinkIcon, AlertTriangle, CheckCircle2,
  Key, Trash2, Eye, EyeOff, AlertCircle
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
      // Teste simples para validar conectividade e cota
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: 'hi',
      });
      
      if (response.text) {
        await LeadService.updateSettings({ customApiKey: keyToTest.trim() });
        setApiStatus('active');
        if (!silent) alert("Sucesso! A nova chave mestre está ativa para TODOS os usuários.");
      }
    } catch (err: any) {
      setApiStatus('error');
      let msg = err.message || "Falha na conexão com a API.";
      if (msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED")) {
        msg = "ERRO 429: Esta chave atingiu o limite ou não tem faturamento ativo no Google. Chaves gratuitas compartilhadas em hospedagem costumam falhar.";
      }
      setVerifyError(msg);
    } finally {
      if (!silent) setIsVerifying(false);
    }
  };

  const clearManualKey = async () => {
    if (confirm("Deseja remover a chave mestre e resetar o sistema? Isso afetará todos os usuários.")) {
      await LeadService.updateSettings({});
      setManualKey('');
      setApiStatus('inactive');
    }
  };

  const filteredLeads = leads.filter(l => 
    l.name.toLowerCase().includes(filter.toLowerCase()) || 
    l.email?.toLowerCase().includes(filter.toLowerCase()) ||
    l.phone?.includes(filter)
  );

  return (
    <div className="flex-1 bg-slate-50 overflow-y-auto p-4 md:p-8 h-full">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Alerta de Infraestrutura (Crucial para o Erro 429) */}
        <div className={`p-6 rounded-[2rem] border-2 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 transition-all ${
          apiStatus === 'active' ? 'bg-white border-green-100' : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center gap-5">
            <div className={`p-4 rounded-2xl ${apiStatus === 'active' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
              <Key className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Infraestrutura de IA</h3>
              <p className="text-sm text-gray-500 max-w-md">
                {apiStatus === 'active' 
                  ? 'Chave API Master ativa. O chatbot está liberado para todos os visitantes do site.' 
                  : 'SISTEMA EM PAUSA: Os usuários verão o erro 429 até que uma chave com faturamento ativo seja configurada.'}
              </p>
            </div>
          </div>
          <button onClick={() => setShowSettings(true)} className="w-full md:w-auto px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-black transition-all shadow-xl">
             Gerenciar Chave Global
          </button>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
              <Users className="w-6 h-6 text-blue-500 mb-3" />
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total de Atendimentos</p>
              <h4 className="text-3xl font-black text-gray-900">{leads.length}</h4>
           </div>
           <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
              <Zap className="w-6 h-6 text-red-500 mb-3" />
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Leads Qualificados</p>
              <h4 className="text-3xl font-black text-red-600">{leads.filter(l => l.status === LeadStatus.HOT).length}</h4>
           </div>
           <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
              <Activity className="w-6 h-6 text-green-500 mb-3" />
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Status da API</p>
              <h4 className={`text-xl font-black uppercase ${apiStatus === 'active' ? 'text-green-600' : 'text-red-600'}`}>
                {apiStatus === 'active' ? 'Operacional' : 'Erro 429'}
              </h4>
           </div>
        </div>

        {/* CRM Leads Table */}
        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-50 flex items-center gap-4 bg-gray-50/30">
             <Search className="w-5 h-5 text-gray-400" />
             <input type="text" placeholder="Filtrar por nome ou telefone..." className="bg-transparent text-sm outline-none flex-1 font-medium" value={filter} onChange={(e) => setFilter(e.target.value)} />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] uppercase font-bold text-gray-400 tracking-[0.2em] bg-slate-50">
                  <th className="px-8 py-5">Cliente</th>
                  <th className="px-8 py-5">Qualificação</th>
                  <th className="px-8 py-5">Score</th>
                  <th className="px-8 py-5 text-right">Ver Conversa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-8 py-5">
                      <p className="font-bold text-sm text-gray-900">{lead.name || 'Novo Lead'}</p>
                      <p className="text-[10px] text-gray-400">{lead.phone || lead.email || lead.id}</p>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        lead.status === LeadStatus.HOT ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'
                      }`}>{lead.status}</span>
                    </td>
                    <td className="px-8 py-5">
                       <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-100 h-1.5 rounded-full w-24">
                             <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${lead.score}%` }}></div>
                          </div>
                          <span className="text-[10px] font-bold text-gray-500">{lead.score}%</span>
                       </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button onClick={() => setSelectedLead(lead)} className="p-3 bg-white border hover:bg-blue-600 hover:text-white rounded-2xl transition-all shadow-sm">
                        <MessageSquare className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL CONFIGURAÇÃO GLOBAL (CHAVE API) */}
      {showSettings && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden">
            <div className="p-8 border-b flex items-center justify-between">
               <div className="flex items-center gap-3">
                  <ShieldCheck className="w-6 h-6 text-blue-600" />
                  <h3 className="text-xl font-bold text-gray-900">Configuração Global</h3>
               </div>
               <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X /></button>
            </div>

            <div className="p-8 space-y-6">
              <div className="bg-red-50 p-5 rounded-2xl border border-red-100 flex gap-4 text-red-700">
                <AlertCircle className="w-6 h-6 shrink-0" />
                <p className="text-xs font-medium leading-relaxed">
                  <b>Importante:</b> Se você hospedar este site publicamente, use uma chave API associada a uma conta com <b>Billing (Cartão)</b> no Google Cloud. Chaves gratuitas são limitadas por IP e causarão o Erro 429 para todos os usuários.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Master API Key (Todos os Usuários)</label>
                <div className="relative">
                  <input 
                    type={showKey ? "text" : "password"}
                    placeholder="Sua chave API aqui..."
                    className="w-full bg-gray-50 border-2 border-transparent focus:border-blue-500 rounded-2xl py-4 px-4 text-sm outline-none transition-all pr-12"
                    value={manualKey}
                    onChange={(e) => setManualKey(e.target.value)}
                  />
                  <button onClick={() => setShowKey(!showKey)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                    {showKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {verifyError && (
                <div className="p-4 bg-red-50 text-red-700 rounded-xl text-[11px] font-bold border border-red-100">
                  {verifyError}
                </div>
              )}

              <div className="flex gap-3">
                 <button 
                  onClick={() => testManualKey(manualKey)} 
                  disabled={isVerifying || !manualKey}
                  className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-sm shadow-xl shadow-blue-100 flex items-center justify-center gap-3 transition-all disabled:opacity-50"
                 >
                   {isVerifying ? <RefreshCw className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                   Validar e Salvar Global
                 </button>
                 {manualKey && (
                   <button onClick={clearManualKey} className="p-4 bg-gray-100 text-gray-400 hover:text-red-600 rounded-2xl transition-all">
                     <Trash2 className="w-5 h-5" />
                   </button>
                 )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HISTORICO DE LEADS */}
      {selectedLead && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden">
            <div className="p-8 border-b flex items-center justify-between">
               <h3 className="text-xl font-bold text-gray-900">Conversa com {selectedLead.name}</h3>
               <button onClick={() => setSelectedLead(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 space-y-4 bg-slate-50/50">
               {selectedLead.messages?.map((m, idx) => (
                 <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`p-5 rounded-2xl max-w-[85%] text-sm shadow-sm ${m.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white border text-gray-800 rounded-tl-none'}`}>
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
