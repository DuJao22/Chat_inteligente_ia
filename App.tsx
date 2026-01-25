
import React, { useState, useEffect, useRef } from 'react';
import { FunnelStage, LeadStatus, Message, ChatState, Lead, AdminUser } from './types';
import { getGeminiChat, parseAnalysis } from './services/geminiService';
import { LeadService } from './services/dbService';
import ChatMessage from './components/ChatMessage';
import AdminDashboard from './components/AdminDashboard';
import AdminLogin from './components/AdminLogin';
import { Send, Rocket, LayoutDashboard, MessageCircle, Menu, X, RefreshCw, AlertTriangle } from 'lucide-react';

const App: React.FC = () => {
  const [view, setView] = useState<'chat' | 'admin' | 'login'>('chat');
  const [admin, setAdmin] = useState<AdminUser>({ isAuthenticated: false, username: null });
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [apiStatus, setApiStatus] = useState<'online' | 'offline'>('online');
  
  const [leadId] = useState<string>(() => `lead_${Math.random().toString(36).substr(2, 9)}`);
  const [chatState, setChatState] = useState<ChatState>({
    messages: [],
    currentStage: FunnelStage.OPENING,
    leadStatus: LeadStatus.COLD,
    isThinking: false,
    metrics: { diagnosisComplete: false, objectionsHandled: 0, ctaReached: false }
  });

  const [input, setInput] = useState('');
  const [lastInput, setLastInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (cooldownSeconds > 0) {
      const timer = setTimeout(() => setCooldownSeconds(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setApiStatus('online');
    }
  }, [cooldownSeconds]);

  useEffect(() => {
    if (chatState.messages.length === 0 && view === 'chat') {
      const botMsg: Message = { 
        id: 'init', 
        role: 'model', 
        text: "Olá! Sou o consultor virtual da Dgital Soluctions. Como posso ajudar sua empresa a crescer com tecnologia e marketing?", 
        timestamp: new Date() 
      };
      setChatState(prev => ({ ...prev, messages: [botMsg] }));
    }
  }, [view]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatState.messages, chatState.isThinking]);

  const performSendMessage = async (messageText: string) => {
    setChatState(prev => ({ ...prev, isThinking: true }));

    try {
      const chat = await getGeminiChat(chatState.messages);
      const result = await chat.sendMessage({ message: messageText });
      const responseText = result.text || "Desculpe, não consegui processar sua ideia agora.";
      
      const { cleanText, analysis } = parseAnalysis(responseText);
      const botMsg: Message = { id: Date.now().toString(), role: 'model', text: cleanText, timestamp: new Date() };
      
      setChatState(prev => ({
        ...prev,
        messages: [...prev.messages, botMsg],
        isThinking: false,
        currentStage: (analysis?.stage as FunnelStage) || prev.currentStage,
        leadStatus: (analysis?.status as LeadStatus) || prev.leadStatus,
      }));

      const existing = await LeadService.getLeadById(leadId);
      const updatedLead: Lead = {
        ...(existing || { id: leadId, name: 'Lead em Atendimento', status: LeadStatus.COLD, stage: FunnelStage.OPENING, score: 0, lastActive: new Date(), messages: [] }),
        messages: [...chatState.messages, botMsg],
        lastActive: new Date(),
        status: analysis?.status || existing?.status || LeadStatus.COLD,
        stage: analysis?.stage || existing?.stage || FunnelStage.OPENING,
        score: analysis?.score || existing?.score || 0
      };
      await LeadService.saveLead(updatedLead);

    } catch (err: any) {
      const errStr = String(err);
      setApiStatus('offline');
      setCooldownSeconds(15);
      
      let errorMsg = "Tivemos um pequeno problema de conexão. Vou recarregar meus sistemas, tente novamente em 15 segundos.";
      if (errStr.includes("429") || errStr.includes("RESOURCE_EXHAUSTED")) {
        errorMsg = "Limite de cota atingido temporariamente. Por favor, aguarde alguns segundos enquanto estabilizamos o sistema.";
      }

      setChatState(prev => ({ 
        ...prev, 
        isThinking: false,
        messages: [...prev.messages, { 
          id: 'err-' + Date.now(), 
          role: 'model', 
          text: errorMsg, 
          timestamp: new Date() 
        }]
      }));
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || chatState.isThinking || cooldownSeconds > 0) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: input, timestamp: new Date() };
    setChatState(prev => ({ ...prev, messages: [...prev.messages, userMsg] }));
    setLastInput(input);
    const currentInput = input;
    setInput('');
    await performSendMessage(currentInput);
  };

  if (view === 'login' && !admin.isAuthenticated) {
    return <AdminLogin onLogin={(u, p) => {
      if (u === 'admin' && p === 'dujao22') {
        setAdmin({ isAuthenticated: true, username: 'Administrador' });
        setView('admin');
      } else {
        setLoginError('Credenciais inválidas.');
      }
    }} error={loginError} />;
  }

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] w-full overflow-hidden bg-slate-50">
      <aside className={`fixed inset-y-0 left-0 w-80 bg-white border-r flex flex-col z-50 transition-transform md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-8 border-b flex items-center gap-4">
          <Rocket className="text-blue-600 w-6 h-6" />
          <h1 className="font-bold text-gray-900 tracking-tight">Dgital Soluctions</h1>
        </div>
        
        <div className="p-4 flex-1 space-y-2">
          <button onClick={() => { setView('chat'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 p-4 rounded-2xl transition-all font-bold text-sm ${view === 'chat' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-50'}`}>
            <MessageCircle className="w-5 h-5" /> Chat Consultor
          </button>
          <button onClick={() => { setView(admin.isAuthenticated ? 'admin' : 'login'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 p-4 rounded-2xl transition-all font-bold text-sm ${view === 'admin' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-50'}`}>
            <LayoutDashboard className="w-5 h-5" /> Painel Admin
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 bg-white relative">
        <header className="flex items-center justify-between p-4 md:p-6 border-b bg-white shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 hover:bg-gray-100 rounded-xl"><Menu className="w-6 h-6" /></button>
            <h2 className="font-bold text-gray-800 text-lg md:text-xl">
              {view === 'admin' ? 'Controle CRM' : 'Consultoria Inteligente'}
            </h2>
          </div>
        </header>

        {view === 'admin' && admin.isAuthenticated ? <AdminDashboard /> : (
          <div className="flex flex-col h-full bg-slate-50/30">
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
              {chatState.messages.map(msg => (
                <ChatMessage 
                  key={msg.id} 
                  message={msg} 
                  isError={msg.id.startsWith('err-')} 
                  onRetry={msg.id.startsWith('err-') && cooldownSeconds === 0 ? () => performSendMessage(lastInput) : undefined}
                />
              ))}
              {chatState.isThinking && (
                <div className="flex gap-3 items-center text-blue-600 text-xs font-bold px-6 py-4 bg-white rounded-2xl border border-blue-50 w-fit animate-pulse">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>DGITAL AI está pensando...</span>
                </div>
              )}
            </div>

            <div className="p-4 md:p-8 bg-white border-t">
              <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex gap-3">
                <input 
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={cooldownSeconds > 0 ? `Aguarde ${cooldownSeconds}s...` : "Qual sua dúvida sobre tráfego ou tecnologia?"}
                  className="flex-1 bg-gray-50 border-2 border-transparent focus:border-blue-500 rounded-2xl py-4 px-6 outline-none transition-all text-sm"
                  disabled={chatState.isThinking || cooldownSeconds > 0}
                />
                <button 
                  type="submit" 
                  disabled={!input.trim() || chatState.isThinking || cooldownSeconds > 0} 
                  className="bg-blue-600 text-white p-4 rounded-2xl disabled:opacity-50 hover:bg-blue-700 transition-all active:scale-95"
                >
                  <Send className="w-6 h-6" />
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
