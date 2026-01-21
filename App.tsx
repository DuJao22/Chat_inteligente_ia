import React, { useState, useEffect, useRef } from 'react';
import { FunnelStage, LeadStatus, Message, ChatState, Lead, AdminUser } from './types';
import { getGeminiChat, parseAnalysis } from './services/geminiService';
import { LeadService } from './services/dbService';
import ChatMessage from './components/ChatMessage';
import AdminDashboard from './components/AdminDashboard';
import AdminLogin from './components/AdminLogin';
import { Send, Bot, Rocket, Sparkles, LayoutDashboard, MessageCircle, LogOut, ShieldCheck, Menu, X } from 'lucide-react';

const App: React.FC = () => {
  const [view, setView] = useState<'chat' | 'admin' | 'login'>('chat');
  const [admin, setAdmin] = useState<AdminUser>({ isAuthenticated: false, username: null });
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [leadId] = useState<string>(() => `lead_${Math.random().toString(36).substr(2, 9)}`);
  const [chatState, setChatState] = useState<ChatState>({
    messages: [],
    currentStage: FunnelStage.OPENING,
    leadStatus: LeadStatus.COLD,
    isThinking: false,
    metrics: { diagnosisComplete: false, objectionsHandled: 0, ctaReached: false }
  });

  const [input, setInput] = useState('');
  const chatInstanceRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initLead = async () => {
      const existing = await LeadService.getLeadById(leadId);
      if (!existing) {
        const newLead: Lead = {
          id: leadId,
          name: 'Lead Dgital',
          status: LeadStatus.COLD,
          stage: FunnelStage.OPENING,
          score: 0,
          lastActive: new Date(),
          messages: []
        };
        await LeadService.saveLead(newLead);
      }
    };
    initLead();
  }, [leadId]);

  useEffect(() => {
    if (view === 'chat' && !chatInstanceRef.current) {
      const initChat = async () => {
        try {
          chatInstanceRef.current = getGeminiChat();
          handleBotResponse("Olá! Bem-vindo à Dgital Soluctions. Sou seu consultor especialista em crescimento digital. Como posso ajudar seu negócio a escalar hoje?");
        } catch (err) {
          console.error("AI Init Error", err);
        }
      };
      initChat();
    }
  }, [view]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatState.messages, chatState.isThinking]);

  const handleAdminLogin = (user: string, pass: string) => {
    if (user === 'admin' && pass === 'dujao22') {
      setAdmin({ isAuthenticated: true, username: 'Gestor Dgital' });
      setView('admin');
      setLoginError(null);
      setIsSidebarOpen(false);
    } else {
      setLoginError('Acesso restrito à Dgital Soluctions.');
    }
  };

  const handleLogout = () => {
    setAdmin({ isAuthenticated: false, username: null });
    setView('chat');
    setIsSidebarOpen(false);
  };

  const persistLeadData = async (messages: Message[], analysis?: any) => {
    const currentLead = await LeadService.getLeadById(leadId);
    if (!currentLead) return;
    const updatedLead: Lead = {
      ...currentLead,
      messages,
      lastActive: new Date(),
      status: analysis?.status || currentLead.status,
      stage: analysis?.stage || currentLead.stage,
      score: analysis?.score || currentLead.score,
      name: analysis?.extracted_data?.name || currentLead.name,
      email: analysis?.extracted_data?.email || currentLead.email,
      phone: analysis?.extracted_data?.phone || currentLead.phone,
      needs: analysis?.extracted_data?.main_need || currentLead.needs,
    };
    await LeadService.saveLead(updatedLead);
  };

  const handleBotResponse = async (rawText: string) => {
    const { cleanText, analysis } = parseAnalysis(rawText);
    const botMsg: Message = { id: Date.now().toString(), role: 'model', text: cleanText, timestamp: new Date() };
    const newMessages = [...chatState.messages, botMsg];
    setChatState(prev => ({
      ...prev,
      messages: newMessages,
      isThinking: false,
      currentStage: analysis?.stage || prev.currentStage,
      leadStatus: analysis?.status || prev.leadStatus,
    }));
    await persistLeadData(newMessages, analysis);
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || chatState.isThinking) return;
    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: input, timestamp: new Date() };
    const newMessages = [...chatState.messages, userMsg];
    setChatState(prev => ({ ...prev, messages: newMessages, isThinking: true }));
    const currentInput = input;
    setInput('');
    try {
      if (chatInstanceRef.current) {
        const result = await chatInstanceRef.current.sendMessage({ message: currentInput });
        handleBotResponse(result.text);
      }
    } catch (err) {
      console.error("Chat Error", err);
      setChatState(prev => ({ ...prev, isThinking: false }));
    }
  };

  if (view === 'login' && !admin.isAuthenticated) {
    return <AdminLogin onLogin={handleAdminLogin} error={loginError} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row h-[100dvh] overflow-hidden">
      <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-gray-100 z-30">
        <div className="flex items-center gap-2">
          <Rocket className="w-6 h-6 text-blue-600" />
          <span className="font-bold text-gray-900 tracking-tight text-lg">Dgital Soluctions</span>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"
        >
          {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden animate-in fade-in duration-200"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 w-80 bg-white border-r border-gray-200 flex flex-col z-50 transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:translate-x-0
      `}>
        <div className="hidden md:flex p-6 border-b border-gray-100 items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Rocket className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-gray-900 leading-tight">Dgital Soluctions</h1>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Cloud Analytics 3.0</p>
          </div>
        </div>

        <div className="p-4 space-y-2 flex-1 overflow-y-auto mt-4 md:mt-0">
          {admin.isAuthenticated ? (
            <>
              <div className="mb-4 px-4 py-3 bg-blue-50 rounded-xl border border-blue-100 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold uppercase shrink-0">
                  {admin.username?.charAt(0)}
                </div>
                <div className="truncate">
                  <p className="text-[10px] text-blue-600 font-bold uppercase tracking-tighter">Sessão Admin</p>
                  <p className="text-sm font-bold text-blue-900 truncate">{admin.username}</p>
                </div>
              </div>
              <button 
                onClick={() => { setView('admin'); setIsSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  view === 'admin' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                <LayoutDashboard className="w-5 h-5" /> Leads & Conversão
              </button>
              <button 
                onClick={() => { setView('chat'); setIsSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  view === 'chat' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                <MessageCircle className="w-5 h-5" /> Testar Consultor
              </button>
              <div className="pt-4 mt-4 border-t border-gray-100">
                <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-all">
                  <LogOut className="w-5 h-5" /> Sair do Painel
                </button>
              </div>
            </>
          ) : (
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-5 rounded-2xl text-white shadow-xl shadow-blue-200">
                <h3 className="text-sm font-bold mb-3">Estratégia Dgital</h3>
                <ul className="space-y-2 text-[11px] opacity-90">
                  <li className="flex items-center gap-2"><Sparkles className="w-3 h-3" /> Growth & Performance</li>
                  <li className="flex items-center gap-2"><Sparkles className="w-3 h-3" /> Inteligência de Dados</li>
                  <li className="flex items-center gap-2"><Sparkles className="w-3 h-3" /> Automações de Vendas</li>
                </ul>
              </div>
              <button onClick={() => { setView('login'); setIsSidebarOpen(false); }} className="w-full mt-4 py-3 flex items-center justify-center gap-2 text-[10px] font-bold text-gray-400 hover:text-blue-600 transition-colors uppercase tracking-widest">
                <ShieldCheck className="w-4 h-4" /> Acesso Privado
              </button>
            </div>
          )}
        </div>

        <div className="p-4 bg-gray-50 border-t border-gray-100 text-[10px] text-gray-500 font-medium flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          SQL Cloud: Online
        </div>
      </aside>

      <main className="flex-1 flex flex-col relative bg-white overflow-hidden h-full">
        {view === 'admin' && admin.isAuthenticated ? (
          <AdminDashboard />
        ) : (
          <div className="flex flex-col h-full">
            <header className="hidden md:flex bg-white border-b border-gray-100 p-4 items-center justify-between shadow-sm z-10 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-gray-900 tracking-tight italic">Dgital Specialist</h2>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                    <span className="text-[10px] text-gray-500 font-bold uppercase">Disponível agora</span>
                  </div>
                </div>
              </div>
            </header>

            <div 
              ref={scrollRef} 
              className="flex-1 overflow-y-auto p-4 md:p-10 space-y-6 scroll-smooth bg-slate-50/50"
            >
              {chatState.messages.map(msg => (
                <ChatMessage key={msg.id} message={msg} />
              ))}
              {chatState.isThinking && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-100 px-5 py-3 rounded-2xl shadow-sm">
                    <div className="flex gap-1.5">
                      <div className="w-1.5 h-1.5 bg-blue-300 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="w-1.5 h-1.5 bg-blue-300 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="w-1.5 h-1.5 bg-blue-300 rounded-full animate-bounce"></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 md:p-6 bg-white border-t border-gray-100 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)] shrink-0">
              <form onSubmit={handleSendMessage} className="max-w-3xl mx-auto flex items-center gap-2 md:gap-3">
                <input 
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Conte-me sobre o seu desafio de negócio..."
                  className="flex-1 bg-gray-50 border border-gray-100 rounded-2xl py-3.5 px-5 md:py-4 md:px-6 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all shadow-inner"
                  disabled={chatState.isThinking}
                />
                <button 
                  type="submit"
                  disabled={!input.trim() || chatState.isThinking}
                  className="bg-blue-600 text-white p-3.5 md:p-4 rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-95 disabled:opacity-50"
                >
                  <Send className="w-5 h-5 md:w-6 md:h-6" />
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;