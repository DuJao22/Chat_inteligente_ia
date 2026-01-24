import React from 'react';
import { Message } from '../types';
import { RefreshCw, AlertCircle } from 'lucide-react';

interface ChatMessageProps {
  message: Message;
  onRetry?: () => void;
  isError?: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, onRetry, isError }) => {
  const isModel = message.role === 'model';

  return (
    <div className={`flex ${isModel ? 'justify-start' : 'justify-end'} mb-2 md:mb-4 animate-in fade-in slide-in-from-bottom-2 duration-300`}>
      <div 
        className={`max-w-[88%] md:max-w-[75%] px-4 py-3 md:px-5 md:py-3.5 rounded-2xl text-[13px] md:text-sm leading-relaxed shadow-sm flex flex-col ${
          isError 
            ? 'bg-red-50 border border-red-200 text-red-800 rounded-tl-none'
            : isModel 
              ? 'bg-white border border-gray-100 text-gray-800 rounded-tl-none' 
              : 'bg-blue-600 text-white rounded-tr-none'
        }`}
      >
        <div className="flex gap-2">
          {isError && <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />}
          <p className="whitespace-pre-wrap">{message.text}</p>
        </div>
        
        {isError && onRetry && (
          <button 
            onClick={onRetry}
            className="mt-3 flex items-center gap-2 bg-red-600 text-white px-3 py-1.5 rounded-lg text-[11px] font-bold hover:bg-red-700 transition-colors w-fit"
          >
            <RefreshCw className="w-3 h-3" />
            Tentar novamente
          </button>
        )}

        <div className={`text-[9px] mt-1.5 text-right font-medium tracking-tight ${isError ? 'text-red-400' : isModel ? 'text-gray-400' : 'text-blue-100'}`}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;