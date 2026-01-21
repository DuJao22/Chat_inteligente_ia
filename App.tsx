import React, { useState, useEffect, useRef } from 'react';
import { FunnelStage, LeadStatus, Message, ChatState, Lead, AdminUser } from './types';
import { getGeminiChat, parseAnalysis } from './services/geminiService';
import { LeadService } from './services/dbService';
import ChatMessage from './components/ChatMessage';
import AdminDashboard from './components/AdminDashboard';
import AdminLogin from './components/AdminLogin';
import { Send, Bot, Rocket, Sparkles, LayoutDashboard, MessageCircle, LogOut, ShieldCheck, Menu, X, AlertTriangle } from 'lucide-react';

const App: React.FC = () => {
  const [view, setView] = useState<'chat' | 'admin' | 'login'>('chat');
  const [admin, setAdmin] = useState<AdminUser>({ isAuthenticated: false, username: null });
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(!!process.env.API_KEY);
  
  const [leadId] = useState<string>(() => `lead_${Math.random().toString(36).substr(2, 9)}`);
  const [chatState, setChatState] = useState<ChatState>({
    messages: [],
    currentStage: FunnelStage.OPENING,
    leadStatus: LeadStatus.COLD,
    isThinking: false,
    metrics: { diagnosisComplete: false, objectionsHandled: 0, ctaReached: false }
  });

  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatState.messages.length === 0 && view === 'chat') {
      handleBotResponse("Olá! Bem-vindo à Dgital Soluctions. Sou seu consultor especialista em crescimento digital. Como posso ajudar seu negócio a escalar hoje?");
    }
  }, [view]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatState.messages, chatState.isThinking]);

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

  const persistLeadData = async (messages: Message[], analysis?: any) => {
    const currentLead = await LeadService.getLeadById(leadId) || { id: leadId, name: 'Lead Dgital' } as Lead;
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

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || chatState.isThinking) return;

    if (!process.env.API_KEY) {
      setHasApiKey(false);
      return;
    }

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: input, timestamp: new Date() };
    const newMessages = [...chatState.messages, userMsg];
    setChatState(prev => ({ ...prev, messages: newMessages, isThinking: true }));
    const currentInput = input;
    setInput('');

    try {
      // Criamos o chat com o histórico atual para manter o contexto
      const chat = getGeminiChat(chatState.messages);
      const result = await chat.sendMessage({ message: currentInput });
      handleBotResponse(result.text);
    } catch (err: any) {
      console.error("Chat Error:", err);
      const errorMsg = err.message === 'API_KEY_MISSING' 
        ? "Erro: Chave de API não configurada no Render." 
        : "Desculpe, tive um problema na conexão. Pode tentar novamente?";
      
      setChatState(prev => ({ 
        ...prev, 
        isThinking: false,
        messages: [...prev.messages, { id: 'err', role: 'model', text: errorMsg, timestamp: new Date() }]
      }));
    }
  };

  if (view === 'login' && !admin.isAuthenticated) {
    return <AdminLogin onLogin={(u, p) => {
      if (u === 'admin' && p === 'dujao22') {
        setAdmin({ isAuthenticated: true, username: 'Gestor Dgital' });
        setView('admin');
      } else {
        setLoginError('Acesso restrito.');
      }
    }} error={loginError} />;
  }

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] w-full overflow-hidden bg-slate-50">
      {/* Sidebar (Mesma estrutura anterior, omitida para brevidade mas preservada) */}
      <aside className={`fixed inset-y-0 left-0 w-80 bg-white border-r border-gray-200 flex flex-col z-50 transition-transform md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-gray-100 flex items-center gap-3">
          <Rocket className="text-blue-600 w-6 h-6" />
          <h1 className="font-bold text-gray-900">Dgital Soluctions</h1>
        </div>
        <div className="p-4 flex-1">
          <button onClick={() => { setView('chat'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 p-3 rounded-xl mb-2 ${view === 'chat' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
            <MessageCircle className="w-5 h-5" /> Chat
          </button>
          {admin.isAuthenticated && (
            <button onClick={() => { setView('admin'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 p-3 rounded-xl mb-2 ${view === 'admin' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
              <LayoutDashboard className="w-5 h-5" /> Admin
            </button>
          )}
        </div>
        <div className="p-4 border-t text-[10px] text-gray-400 flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${hasApiKey ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`}></div>
          {hasApiKey ? 'API Ativa' : 'API KEY Ausente no Render'}
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 bg-white relative">
        {/* Header Mobile */}
        <div className="md:hidden flex items-center justify-between p-4 border-b">
          <span className="font-bold">Dgital Soluctions</span>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)}><Menu /></button>
        </div>

        {view === 'admin' ? <AdminDashboard /> : (
          <div className="flex flex-col h-full">
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-10 space-y-4 bg-slate-50/50">
              {!hasApiKey && (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-center gap-3 text-amber-700 text-sm">
                  <AlertTriangle className="w-5 h-5" />
                  <span>Atenção: Configure a <b>API_KEY</b> nas variáveis de ambiente do Render para o bot responder.</span>
                </div>
              )}
              {chatState.messages.map(msg => <ChatMessage key={msg.id} message={msg} />)}
              {chatState.isThinking && <div className="animate-pulse text-blue-400 text-xs font-bold px-4">Consultor pensando...</div>}
            </div>

            <div className="p-4 md:p-6 bg-white border-t pb-[max(1rem,env(safe-area-inset-bottom))]">
              <form onSubmit={handleSendMessage} className="max-w-3xl mx-auto flex gap-2">
                <input 
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Envie sua dúvida..."
                  className="flex-1 bg-gray-50 border rounded-2xl py-3 px-4 outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={chatState.isThinking}
                />
                <button type="submit" disabled={!input.trim() || chatState.isThinking} className="bg-blue-600 text-white p-3 rounded-2xl disabled:opacity-50">
                  <Send />
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