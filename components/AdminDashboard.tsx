
import React, { useState, useEffect } from 'react';
import { LeadService } from '../services/dbService';
import { Lead, LeadStatus } from '../types';
import { 
  Users, Target, Zap, Phone, Mail, 
  Search, Trash2, ExternalLink,
  Filter, ChevronRight
} from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filter, setFilter] = useState<string>('');

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

  return (
    <div className="flex-1 bg-slate-50 overflow-y-auto p-4 md:p-8 h-full">
      <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">CRM da Agência</h1>
              <p className="text-gray-500 text-xs md:text-sm">Gestão de Leads Capturados pela IA</p>
            </div>
            <button onClick={loadLeads} className="bg-white border border-gray-200 px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-medium hover:bg-gray-50 shadow-sm transition-colors">
              Atualizar
            </button>
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
    </div>
  );
};

export default AdminDashboard;
