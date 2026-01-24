import React, { useState, useEffect } from 'react';
import { LeadService } from '../services/dbService';
import { Lead, LeadStatus, Message } from '../types';
import { 
  Users, Target, Zap, Phone, Mail, 
  Search, Trash2, ExternalLink,
  Filter, MessageSquare, X, Download, Calendar
} from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filter, setFilter] = useState<string>('');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  useEffect(() => {
    loadLeads();
  }, []);

  const loadLeads = async () => {
    const data = await LeadService.getAllLeads();
    setLeads(data.sort((a, b) => new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime()));
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
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">CRM da Agência</h1>
              <p className="text-gray-500 text-xs md:text-sm">Gestão de Leads Capturados pela IA</p>
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

        {/* Responsive Content Container */}
        <div className="bg-white md:rounded-2xl shadow-sm md:border border-gray-100 overflow-hidden -mx-4 md:mx-0">
          
          {/* Mobile Card View (hidden on desktop) */}
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

                <div className="space-y-2">
                  {lead.email && <div className="flex items-center gap-2 text-[11px] text-gray-600"><Mail className="w-3.5 h-3.5" /> {lead.email}</div>}
                  {lead.phone && <div className="flex items-center gap-2 text-[11px] text-gray-600"><Phone className="w-3.5 h-3.5" /> {lead.phone}</div>}
                </div>

                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-wider">Necessidade</p>
                  <p className="text-xs text-gray-700 line-clamp-2 leading-relaxed italic">{lead.needs || 'Coletando informações...'}</p>
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
                    {lead.phone && (
                      <a href={`https://wa.me/${lead.phone.replace(/\D/g,'')}`} target="_blank" className="p-2.5 bg-green-50 text-green-600 rounded-lg">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                    <button onClick={() => handleDelete(lead.id)} className="p-2.5 bg-red-50 text-red-600 rounded-lg">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View (hidden on mobile) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 text-gray-400 text-[10px] uppercase font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-4">Lead / Contato</th>
                  <th className="px-6 py-4">Status & Estágio</th>
                  <th className="px-6 py-4">Dor / Necessidade</th>
                  <th className="px-6 py-4">Score IA</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-900">{lead.name || 'Lead Anônimo'}</span>
                        <div className="flex flex-col gap-0.5 mt-1">
                          {lead.email && <span className="text-[10px] text-gray-500 flex items-center gap-1"><Mail className="w-3 h-3" /> {lead.email}</span>}
                          {lead.phone && <span className="text-[10px] text-gray-500 flex items-center gap-1"><Phone className="w-3 h-3" /> {lead.phone}</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className={`w-fit px-2 py-0.5 rounded text-[10px] font-bold ${
                          lead.status === LeadStatus.HOT ? 'bg-red-100 text-red-600' :
                          lead.status === LeadStatus.WARM ? 'bg-orange-100 text-orange-600' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {lead.status}
                        </span>
                        <span className="text-[10px] text-gray-400 font-medium uppercase">{lead.stage}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 max-w-xs">
                      <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">{lead.needs || 'Aguardando diagnóstico...'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-12 bg-gray-100 h-1.5 rounded-full overflow-hidden shrink-0">
                          <div className="bg-blue-600 h-full" style={{ width: `${lead.score}%` }} />
                        </div>
                        <span className="text-[10px] font-bold text-gray-700">{lead.score}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setSelectedLead(lead)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Ver Histórico">
                          <MessageSquare className="w-4 h-4" />
                        </button>
                        {lead.phone && (
                          <a href={`https://wa.me/${lead.phone.replace(/\D/g,'')}`} target="_blank" className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="WhatsApp">
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                        <button onClick={() => handleDelete(lead.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Excluir">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredLeads.length === 0 && (
            <div className="py-20 text-center">
              <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                <Search className="w-8 h-8" />
              </div>
              <p className="text-sm text-gray-500 font-medium">Nenhum lead encontrado.</p>
            </div>
          )}
        </div>
      </div>

      {/* LEAD HISTORY MODAL */}
      {selectedLead && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[2rem] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-8 duration-300">
            {/* Modal Header */}
            <div className="p-6 md:p-8 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white">
              <div className="flex items-center gap-4">
                <div className="bg-blue-600 w-12 h-12 rounded-2xl flex items-center justify-center text-white shrink-0">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-bold text-gray-900">{selectedLead.name || 'Histórico do Lead'}</h3>
                  <p className="text-xs text-gray-500 flex items-center gap-2">
                    <Calendar className="w-3 h-3" /> 
                    Última atividade: {new Date(selectedLead.lastActive).toLocaleString()}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedLead(null)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-50/50 space-y-8">
              {/* Summary Section */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Status</p>
                  <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                    selectedLead.status === LeadStatus.HOT ? 'bg-red-100 text-red-600' :
                    selectedLead.status === LeadStatus.WARM ? 'bg-orange-100 text-orange-600' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {selectedLead.status}
                  </span>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Estágio no Funil</p>
                  <p className="text-sm font-bold text-gray-900">{selectedLead.stage}</p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Score IA</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-100 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-blue-600 h-full" style={{ width: `${selectedLead.score}%` }} />
                    </div>
                    <span className="text-sm font-bold text-blue-600">{selectedLead.score}%</span>
                  </div>
                </div>
              </div>

              {/* Data Section */}
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                 <h4 className="text-sm font-bold text-gray-900 border-b pb-2">Informações Coletadas</h4>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">E-mail</p>
                      <p className="text-sm text-gray-700">{selectedLead.email || 'Não informado'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">WhatsApp</p>
                      <p className="text-sm text-gray-700">{selectedLead.phone || 'Não informado'}</p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Dor Diagnosticada</p>
                      <p className="text-sm text-gray-700 italic">{selectedLead.needs || 'Nenhuma informação extraída'}</p>
                    </div>
                 </div>
              </div>

              {/* Chat Timeline */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-gray-900 border-b pb-2">Transcrição da Conversa</h4>
                <div className="space-y-4">
                  {selectedLead.messages && selectedLead.messages.length > 0 ? (
                    selectedLead.messages.map((m: Message, idx: number) => (
                      <div key={idx} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                        <div className={`max-w-[85%] p-4 rounded-2xl text-sm ${
                          m.role === 'user' 
                            ? 'bg-blue-600 text-white rounded-tr-none' 
                            : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none shadow-sm'
                        }`}>
                          <p className="whitespace-pre-wrap">{m.text}</p>
                          <p className={`text-[10px] mt-2 opacity-60 ${m.role === 'user' ? 'text-blue-100' : 'text-gray-400'}`}>
                            {new Date(m.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center py-10 text-gray-400 text-sm italic">Nenhuma mensagem registrada.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-100 bg-white shrink-0 flex justify-end gap-3">
              <button 
                onClick={() => setSelectedLead(null)}
                className="px-6 py-2.5 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-50 transition-colors"
              >
                Fechar
              </button>
              {selectedLead.phone && (
                <a 
                  href={`https://wa.me/${selectedLead.phone.replace(/\D/g,'')}`}
                  target="_blank"
                  className="px-6 py-2.5 bg-green-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-green-100 hover:bg-green-700 transition-all flex items-center gap-2"
                >
                  <Phone className="w-4 h-4" /> Chamar no Whats
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;