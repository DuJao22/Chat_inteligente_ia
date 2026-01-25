
import React, { useState, useEffect } from 'react';
import { LeadService } from '../services/dbService';
import { Lead, LeadStatus, SystemSettings } from '../types';
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
  const [isSaving, setIsSaving] = useState(false);

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

  const handleSaveKey = async () => {
    if (!manualKey.trim()) return;
    setIsSaving(true);

    try {
      // Salvando diretamente sem validação de ping para evitar erro 429 no momento do salvamento
      await LeadService.updateSettings({ customApiKey: manualKey.trim() });
      setApiStatus('active');
      alert("Configuração atualizada! O chat agora usará esta chave.");
      setShowSettings(false);
    } catch (err: any) {
      alert("Erro ao salvar localmente.");
    } finally {
      setIsSaving(false);
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
        
        <div className={`p-6 rounded-[2rem] border-2 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 transition-all bg-white ${
          apiStatus === 'active' ? 'border-blue-100' : 'border-gray-100'
        }`}>
          <div className="flex items-center gap-5">
            <div className={`p-4 rounded-2xl ${apiStatus === 'active' ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-400'}`}>
              <Key className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Gerenciador de Acesso</h3>
              <p className="text-sm text-gray-500 max-w-md">
                {apiStatus === 'active' 
                  ? 'Chave personalizada configurada com sucesso.' 
                  : 'Nenhuma chave personalizada detectada. O sistema usará o padrão.'}
              </p>
            </div>
          </div>
          <button onClick={() => setShowSettings(true)} className="w-full md:w-auto px-8 py-4 bg-blue-600 text-white rounded-2xl font-bold text-sm hover:bg-blue-700 transition-all shadow-xl">
             Configurar Chave API
          </button>
        </div>

        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-50 flex items-center gap-4">
             <Search className="w-5 h-5 text-gray-400" />
             <input type="text" placeholder="Filtrar base de clientes..." className="bg-transparent text-sm outline-none flex-1 font-medium" value={filter} onChange={(e) => setFilter(e.target.value)} />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] uppercase font-bold text-gray-400 tracking-[0.2em] bg-slate-50">
                  <th className="px-8 py-5">Identificação</th>
                  <th className="px-8 py-5">Status CRM</th>
                  <th className="px-8 py-5 text-right">Interações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-8 py-5">
                      <p className="font-bold text-sm text-gray-900">{lead.name || 'Anônimo'}</p>
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

      {showSettings && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden">
            <div className="p-8 border-b flex items-center justify-between">
               <h3 className="text-xl font-bold text-gray-900">Configurar Chave</h3>
               <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-gray-100 rounded-full"><X /></button>
            </div>

            <div className="p-8 space-y-6">
              <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex gap-3 text-amber-800 text-xs font-medium">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p>Insira sua chave gratuita aqui. Se o chat der "Erro 429", aguarde alguns segundos e tente novamente. É um limite temporário do Google.</p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Sua Chave API (Google AI Studio)</label>
                <div className="relative">
                  <input 
                    type={showKey ? "text" : "password"}
                    placeholder="AIzaSy..."
                    className="w-full bg-gray-50 border-2 border-transparent focus:border-blue-500 rounded-2xl py-4 px-4 text-sm outline-none transition-all pr-12 font-mono"
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
                  onClick={handleSaveKey} 
                  disabled={isSaving || !manualKey}
                  className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-bold text-sm shadow-xl shadow-blue-100 flex items-center justify-center gap-2"
                 >
                   {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                   Salvar Agora
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

      {selectedLead && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[2rem] shadow-2xl flex flex-col overflow-hidden">
            <div className="p-6 border-b flex items-center justify-between">
               <h3 className="text-xl font-bold text-gray-900">Histórico de Mensagens</h3>
               <button onClick={() => setSelectedLead(null)} className="p-2 hover:bg-gray-100 rounded-full"><X /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 space-y-4 bg-slate-50/50">
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

export default AdminDashboard;
