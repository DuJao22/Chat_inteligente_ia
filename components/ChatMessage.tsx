
import React from 'react';
import { Message } from '../types';

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isModel = message.role === 'model';

  return (
    <div className={`flex ${isModel ? 'justify-start' : 'justify-end'} mb-2 md:mb-4 animate-in fade-in slide-in-from-bottom-2 duration-300`}>
      <div 
        className={`max-w-[88%] md:max-w-[75%] px-4 py-3 md:px-5 md:py-3.5 rounded-2xl text-[13px] md:text-sm leading-relaxed shadow-sm ${
          isModel 
            ? 'bg-white border border-gray-100 text-gray-800 rounded-tl-none' 
            : 'bg-blue-600 text-white rounded-tr-none'
        }`}
      >
        <p className="whitespace-pre-wrap">{message.text}</p>
        <div className={`text-[9px] mt-1.5 text-right font-medium tracking-tight ${isModel ? 'text-gray-400' : 'text-blue-100'}`}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
