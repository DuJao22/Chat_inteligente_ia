import React, { useState, useEffect, useRef } from 'react';
import { FunnelStage, LeadStatus, Message, ChatState, Lead, AdminUser } from './types';
import { getGeminiChat, parseAnalysis } from './services/geminiService';
import { LeadService } from './services/dbService';
import ChatMessage from './components/ChatMessage';
import AdminDashboard from './components/AdminDashboard';
import AdminLogin from './components/AdminLogin';
import { Send, Rocket, LayoutDashboard, MessageCircle, Menu, X, Clock, RefreshCw } from 'lucide-react';

const App: React.FC = () => {
  const [view, setView] = useState<'chat' | 'admin' | 'login'>('chat');
  const [admin, setAdmin] = useState<AdminUser>({ isAuthenticated: false, username: null });
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [apiStatus, setApiStatus] = useState<'online' | 'reconnecting' | 'offline'>('online');
  
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
    } else if (cooldownSeconds === 0 && apiStatus === 'offline') {
      setApiStatus('online');
    }
  }, [cooldownSeconds]);

  useEffect(() => {
    if (chatState.messages.length === 0 && view === 'chat') {
      const botMsg: Message = { 
        id: 'init', 
        role: 'model', 
        text: "Olá! Bem-vindo à Dgital Soluctions. Como posso ajudar seu negócio a escalar hoje?", 
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

  const performSendMessage = async (messageText: string, currentRetry = 0) => {
    setChatState(prev => ({ ...prev, isThinking: true }));
    setRetryAttempt(currentRetry);
    if (currentRetry > 0) setApiStatus('reconnecting');

    try {
      const chat = getGeminiChat(chatState.messages);
      const result = await chat.sendMessage({ message: messageText });
      const responseText = result.text || "Sem resposta.";
      
      const { cleanText, analysis } = parseAnalysis(responseText);
      const botMsg: Message = { id: Date.now().toString(), role: 'model', text: cleanText, timestamp: new Date() };
      
      setChatState(prev => ({
        ...prev,
        messages: [...prev.messages, botMsg],
        isThinking: false,
        currentStage: (analysis?.stage as FunnelStage) || prev.currentStage,
        leadStatus: (analysis?.status as LeadStatus) || prev.leadStatus,
      }));
      setApiStatus('online');
      setRetryAttempt(0);

      // Persistência
      const existing = await LeadService.getLeadById(leadId);
      const updatedLead: Lead = {
        ...(existing || { id: leadId, name: 'Lead', status: LeadStatus.COLD, stage: FunnelStage.OPENING, score: 0, lastActive: new Date(), messages: [] }),
        messages: [...chatState.messages, botMsg],
        lastActive: new Date(),
        status: analysis?.status || existing?.status || LeadStatus.COLD,
        stage: analysis?.stage || existing?.stage || FunnelStage.OPENING,
        score: analysis?.score || existing?.score || 0
      };
      await LeadService.saveLead(updatedLead);

    } catch (err: any) {
      const errStr = String(err);
      
      // LOGIC RELICON: Se for erro 429 ou rede, tenta até 4 vezes com espera progressiva
      if ((errStr.includes("429") || errStr.includes("RESOURCES_EXHAUSTED") || errStr.includes("fetch")) && currentRetry < 4) {
        const wait = (currentRetry + 1) * 2000;
        console.warn(`Relicon: Tentativa ${currentRetry + 1} em ${wait}ms`);
        setTimeout(() => performSendMessage(messageText, currentRetry + 1), wait);
        return;
      }

      setApiStatus('offline');
      setCooldownSeconds(30);
      setChatState(prev => ({ 
        ...prev, 
        isThinking: false,
        messages: [...prev.messages, { 
          id: 'err-' + Date.now(), 
          role: 'model', 
          text: errStr.includes("API_KEY_MISSING") 
            ? "Erro de Configuração: API_KEY não encontrada no Render." 
            : "O sistema do Google está sobrecarregado. Por favor, aguarde 30 segundos para reconectar.", 
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
        setAdmin({ isAuthenticated: true, username: 'Gestor' });
        setView('admin');
      } else {
        setLoginError('Acesso negado.');
      }
    }} error={loginError} />;
  }

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] w-full overflow-hidden bg-slate-50">
      <aside className={`fixed inset-y-0 left-0 w-80 bg-white border-r flex flex-col z-50 transition-transform md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b flex items-center gap-3">
          <Rocket className="text-blue-600 w-6 h-6" />
          <h1 className="font-bold text-gray-900">Dgital Soluctions</h1>
        </div>
        <div className="p-4 flex-1">
          <button onClick={() => { setView('chat'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 p-3 rounded-xl mb-2 transition-all ${view === 'chat' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-50'}`}>
            <MessageCircle className="w-5 h-5" /> Chat Consultor
          </button>
          <button onClick={() => { setView(admin.isAuthenticated ? 'admin' : 'login'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 p-3 rounded-xl mb-2 transition-all ${view === 'admin' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-50'}`}>
            <LayoutDashboard className="w-5 h-5" /> Painel Admin
          </button>
        </div>
        <div className="p-4 border-t text-[10px] text-gray-400 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${apiStatus === 'online' ? 'bg-green-500' : 'bg-amber-500 animate-pulse'}`}></div>
            <span className="font-bold uppercase tracking-tighter">{apiStatus === 'online' ? 'Sistema Ativo' : 'Sincronizando'}</span>
          </div>
          {cooldownSeconds > 0 && <span className="text-red-500 font-bold">Aguarde {cooldownSeconds}s</span>}
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
              {chatState.messages.map(msg => (
                <ChatMessage 
                  key={msg.id} 
                  message={msg} 
                  isError={msg.id.startsWith('err-')} 
                  onRetry={msg.id.startsWith('err-') && cooldownSeconds === 0 ? () => performSendMessage(lastInput) : undefined}
                />
              ))}
              {chatState.isThinking && (
                <div className="flex gap-2 items-center text-blue-500 text-[11px] font-bold px-4 animate-pulse">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>{retryAttempt > 0 ? `Relicon: Tentativa de Conexão ${retryAttempt}...` : 'Consultor analisando seu negócio...'}</span>
                </div>
              )}
            </div>

            <div className="p-4 md:p-6 bg-white border-t shrink-0">
              <form onSubmit={handleSendMessage} className="max-w-3xl mx-auto flex gap-2">
                <input 
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={cooldownSeconds > 0 ? `Reconectando em ${cooldownSeconds}s...` : "Como podemos escalar seu negócio?"}
                  className={`flex-1 bg-gray-50 border border-gray-200 rounded-2xl py-3 px-4 outline-none focus:ring-2 focus:ring-blue-500 text-sm ${cooldownSeconds > 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={chatState.isThinking || cooldownSeconds > 0}
                />
                <button 
                  type="submit" 
                  disabled={!input.trim() || chatState.isThinking || cooldownSeconds > 0} 
                  className="bg-blue-600 text-white p-3 rounded-2xl disabled:opacity-50 hover:bg-blue-700 shadow-lg"
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