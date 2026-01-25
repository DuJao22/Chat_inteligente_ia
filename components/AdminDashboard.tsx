
import React, { useState, useEffect } from 'react';
import { LeadService } from '../services/dbService';
import { Lead, LeadStatus, SystemSettings } from '../types';
import { GoogleGenAI } from "@google/genai";
import { 
  Users, Target, Zap, 
  Search, MessageSquare, X, 
  Settings, Activity, 
  RefreshCw, ShieldCheck, Link as LinkIcon, AlertTriangle, CheckCircle2,
  Key, Trash2, Eye, EyeOff, AlertCircle, Info
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
      setApiStatus('active');
    } else {
      setApiStatus('inactive');
    }
  };

  const saveKey = async () => {
    if (!manualKey.trim()) return;
    setIsVerifying(true);
    setVerifyError(null);

    try {
      // Salva diretamente conforme solicitado, sem travar por cota no momento da gravação
      await LeadService.updateSettings({ customApiKey: manualKey.trim() });
      setApiStatus('active');
      alert("Chave salva com sucesso para todos os usuários!");
      setShowSettings(false);
    } catch (err: any) {
      setVerifyError("Erro ao salvar a configuração.");
    } finally {
      setIsVerifying(false);
    }
  };

  const clearManualKey = async () => {
    if (confirm("Deseja remover a chave personalizada?")) {
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
        
        {/* Alerta de Configuração Simples */}
        <div className={`p-6 rounded-[2rem] border-2 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 transition-all bg-white ${
          apiStatus === 'active' ? 'border-blue-100' : 'border-gray-100'
        }`}>
          <div className="flex items-center gap-5">
            <div className={`p-4 rounded-2xl ${apiStatus === 'active' ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-400'}`}>
              <Key className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Configuração de Chave Mestre</h3>
              <p className="text-sm text-gray-500 max-w-md">
                {apiStatus === 'active' 
                  ? 'O chatbot está utilizando a sua chave personalizada para todos os usuários.' 
                  : 'O sistema está utilizando a chave padrão. Defina uma nova para todos os usuários.'}
              </p>
            </div>
          </div>
          <button onClick={() => setShowSettings(true)} className="w-full md:w-auto px-8 py-4 bg-blue-600 text-white rounded-2xl font-bold text-sm hover:bg-blue-700 transition-all shadow-xl">
             Alterar Chave API
          </button>
        </div>

        {/* CRM Leads Table */}
        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-50 flex items-center gap-4">
             <Search className="w-5 h-5 text-gray-400" />
             <input type="text" placeholder="Pesquisar leads..." className="bg-transparent text-sm outline-none flex-1 font-medium" value={filter} onChange={(e) => setFilter(e.target.value)} />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] uppercase font-bold text-gray-400 tracking-[0.2em] bg-slate-50">
                  <th className="px-8 py-5">Cliente</th>
                  <th className="px-8 py-5">Status</th>
                  <th className="px-8 py-5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-8 py-5">
                      <p className="font-bold text-sm text-gray-900">{lead.name || 'Sem nome'}</p>
                      <p className="text-[10px] text-gray-400">{lead.phone || lead.id}</p>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase ${
                        lead.status === LeadStatus.HOT ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'
                      }`}>{lead.status}</span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button onClick={() => setSelectedLead(lead)} className="p-3 hover:bg-blue-50 text-blue-600 rounded-xl transition-all">
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

      {/* MODAL CONFIGURAÇÃO */}
      {showSettings && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden">
            <div className="p-8 border-b flex items-center justify-between">
               <h3 className="text-xl font-bold text-gray-900">Configuração Global</h3>
               <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-gray-100 rounded-full"><X /></button>
            </div>

            <div className="p-8 space-y-6">
              <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex gap-3 text-blue-800 text-xs">
                <Info className="w-5 h-5 shrink-0" />
                <p>A chave inserida aqui será aplicada para <b>todos os usuários</b> do sistema instantaneamente.</p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Chave API Gemini</label>
                <div className="relative">
                  <input 
                    type={showKey ? "text" : "password"}
                    placeholder="Sua chave API aqui..."
                    className="w-full bg-gray-50 border-2 border-transparent focus:border-blue-500 rounded-2xl py-4 px-4 text-sm outline-none transition-all pr-12"
                    value={manualKey}
                    onChange={(e) => setManualKey(e.target.value)}
                  />
                  <button onClick={() => setShowKey(!showKey)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex gap-3">
                 <button 
                  onClick={saveKey} 
                  disabled={isVerifying || !manualKey}
                  className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-bold text-sm shadow-xl shadow-blue-100 flex items-center justify-center gap-2"
                 >
                   {isVerifying ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                   Salvar para Todos
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

      {/* HISTORICO */}
      {selectedLead && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[2rem] shadow-2xl flex flex-col overflow-hidden">
            <div className="p-6 border-b flex items-center justify-between">
               <h3 className="text-xl font-bold text-gray-900">Chat Log: {selectedLead.name}</h3>
               <button onClick={() => setSelectedLead(null)} className="p-2 hover:bg-gray-100 rounded-full"><X /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 space-y-4 bg-slate-50/50">
               {selectedLead.messages?.map((m, idx) => (
                 <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`p-4 rounded-2xl max-w-[85%] text-sm shadow-sm ${m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white border text-gray-800'}`}>
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
