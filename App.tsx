
import React, { useState, useEffect, useRef } from 'react';
import { FunnelStage, LeadStatus, Message, ChatState, Lead, AdminUser } from './types';
import { getGeminiChat, parseAnalysis } from './services/geminiService';
import { LeadService } from './services/dbService';
import ChatMessage from './components/ChatMessage';
import AdminDashboard from './components/AdminDashboard';
import AdminLogin from './components/AdminLogin';
import { Send, Bot, Rocket, LayoutDashboard, MessageCircle, Menu, X, AlertTriangle } from 'lucide-react';

const App: React.FC = () => {
  const [view, setView] = useState<'chat' | 'admin' | 'login'>('chat');
  const [admin, setAdmin] = useState<AdminUser>({ isAuthenticated: false, username: null });
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  // Guideline: The API key must be obtained exclusively from process.env.API_KEY
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
      handleBotInitialGreeting();
    }
  }, [view]);

  const handleBotInitialGreeting = async () => {
    const text = "Olá! Bem-vindo à Dgital Soluctions. Sou seu consultor especialista em crescimento digital. Como posso ajudar seu negócio a escalar hoje?";
    const botMsg: Message = { id: Date.now().toString(), role: 'model', text, timestamp: new Date() };
    setChatState(prev => ({ ...prev, messages: [botMsg] }));
    await persistLeadData([botMsg]);
  };

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
      currentStage: (analysis?.stage as FunnelStage) || prev.currentStage,
      leadStatus: (analysis?.status as LeadStatus) || prev.leadStatus,
    }));
    await persistLeadData(newMessages, analysis);
  };

  const persistLeadData = async (messages: Message[], analysis?: any) => {
    const existing = await LeadService.getLeadById(leadId);
    
    const baseLead: Lead = existing || {
      id: leadId,
      name: 'Lead Dgital',
      status: LeadStatus.COLD,
      stage: FunnelStage.OPENING,
      score: 0,
      lastActive: new Date(),
      messages: []
    };

    const updatedLead: Lead = {
      ...baseLead,
      messages,
      lastActive: new Date(),
      status: analysis?.status || baseLead.status,
      stage: analysis?.stage || baseLead.stage,
      score: analysis?.score || baseLead.score,
      name: analysis?.extracted_data?.name || baseLead.name,
      email: analysis?.extracted_data?.email || baseLead.email,
      phone: analysis?.extracted_data?.phone || baseLead.phone,
      needs: analysis?.extracted_data?.main_need || baseLead.needs,
    };
    
    await LeadService.saveLead(updatedLead);
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || chatState.isThinking) return;

    // Guideline: Exclusively use process.env.API_KEY
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      setHasApiKey(false);
      return;
    } else {
      setHasApiKey(true);
    }

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: input, timestamp: new Date() };
    const newMessages = [...chatState.messages, userMsg];
    setChatState(prev => ({ ...prev, messages: newMessages, isThinking: true }));
    const currentInput = input;
    setInput('');

    try {
      const chat = getGeminiChat(chatState.messages);
      const result = await chat.sendMessage({ message: currentInput });
      const responseText = result.text || "Desculpe, tive um erro ao processar sua mensagem.";
      handleBotResponse(responseText);
    } catch (err: any) {
      console.error("Chat Error:", err);
      const errorMsg = `Erro de conexão: ${err.message || "Problema desconhecido"}.`;
      
      setChatState(prev => ({ 
        ...prev, 
        isThinking: false,
        messages: [...prev.messages, { id: 'err-' + Date.now(), role: 'model', text: errorMsg, timestamp: new Date() }]
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
      <aside className={`fixed inset-y-0 left-0 w-80 bg-white border-r border-gray-200 flex flex-col z-50 transition-transform md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-gray-100 flex items-center gap-3">
          <Rocket className="text-blue-600 w-6 h-6" />
          <h1 className="font-bold text-gray-900">Dgital Soluctions</h1>
        </div>
        <div className="p-4 flex-1 overflow-y-auto">
          <button onClick={() => { setView('chat'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 p-3 rounded-xl mb-2 transition-all ${view === 'chat' ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-gray-500 hover:bg-gray-50'}`}>
            <MessageCircle className="w-5 h-5" /> Chat do Consultor
          </button>
          <button onClick={() => { setView(admin.isAuthenticated ? 'admin' : 'login'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 p-3 rounded-xl mb-2 transition-all ${view === 'admin' ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-gray-500 hover:bg-gray-50'}`}>
            <LayoutDashboard className="w-5 h-5" /> Painel CRM
          </button>
        </div>
        <div className="p-4 border-t text-[10px] text-gray-400 flex items-center gap-2 shrink-0">
          <div className={`w-2 h-2 rounded-full ${hasApiKey ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`}></div>
          {hasApiKey ? 'IA Operacional' : 'API Key Pendente'}
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 bg-white relative h-full">
        <div className="md:hidden flex items-center justify-between p-4 border-b bg-white shrink-0">
          <div className="flex items-center gap-2">
            <Rocket className="text-blue-600 w-5 h-5" />
            <span className="font-bold text-gray-900">Dgital</span>
          </div>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2">
            {isSidebarOpen ? <X /> : <Menu />}
          </button>
        </div>

        {view === 'admin' && admin.isAuthenticated ? <AdminDashboard /> : (
          <div className="flex flex-col h-full overflow-hidden">
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-10 space-y-4 bg-slate-50/50">
              {!hasApiKey && (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-center gap-3 text-amber-700 text-sm mb-4">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <span>Configure a variável <b>API_KEY</b> no ambiente para ativar as respostas da IA.</span>
                </div>
              )}
              {chatState.messages.map(msg => <ChatMessage key={msg.id} message={msg} />)}
              {chatState.isThinking && (
                <div className="flex gap-2 items-center text-blue-400 text-xs font-bold px-4 animate-pulse">
                  <Bot className="w-4 h-4" />
                  <span>Consultor analisando...</span>
                </div>
              )}
            </div>

            <div className="p-4 md:p-6 bg-white border-t shrink-0 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <form onSubmit={handleSendMessage} className="max-w-3xl mx-auto flex gap-2">
                <input 
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Como podemos escalar seu negócio?"
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl py-3 px-4 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm"
                  disabled={chatState.isThinking}
                />
                <button 
                  type="submit" 
                  disabled={!input.trim() || chatState.isThinking} 
                  className="bg-blue-600 text-white p-3 rounded-2xl disabled:opacity-50 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-100"
                >
                  <Send className="w-5 h-5" />
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
