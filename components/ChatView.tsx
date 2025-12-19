
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, StopCircle, RefreshCw, FileSignature, HelpCircle, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Chat } from "@google/genai";
import { Message, SessionConfig, SocraticStrategy } from '../types';
import { sendMessage } from '../services/gemini';
import { GuideModal } from './GuideModal';

export const ChatView: React.FC<{
  chatInstance: Chat | null;
  config: SessionConfig;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  onFinish: (aiDeclaration: string) => void;
}> = ({ chatInstance, config, messages, setMessages, onFinish }) => {
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showDeclarationModal, setShowDeclarationModal] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [declarationText, setDeclarationText] = useState('');
  const [lastStrategy, setLastStrategy] = useState<SocraticStrategy | undefined>();
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const STRATEGIES = Object.values(SocraticStrategy);

  const getNextStrategy = () => {
    const available = STRATEGIES.filter(s => s !== lastStrategy);
    return available[Math.floor(Math.random() * available.length)];
  };

  const handleSend = async (initialPrompt?: string) => {
    const text = initialPrompt || inputText;
    if (!text.trim() || !chatInstance || isLoading) return;

    const strategy = messages.length >= 2 ? getNextStrategy() : undefined;
    
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      text: initialPrompt ? "(Démarrage)" : text,
      timestamp: Date.now(),
    };

    if (!initialPrompt) setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);
    setError(null);

    try {
      const res = await sendMessage(chatInstance, text, strategy);
      const aiMsg: Message = {
        id: crypto.randomUUID(),
        role: 'model',
        text: res.text,
        timestamp: Date.now(),
        strategy
      };
      setMessages(prev => [...prev, aiMsg]);
      setLastStrategy(strategy);
    } catch (e: any) {
      setError("Erreur de communication avec Argos.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (messages.length === 0 && chatInstance) {
      handleSend(`Bonjour Argos, je suis ${config.studentName}. Lance la session sur : ${config.topic}.`);
    }
  }, [chatInstance]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div className="flex flex-col h-full bg-white relative">
      {showGuide && <GuideModal onClose={() => setShowGuide(false)} />}
      
      {showDeclarationModal && (
        <div className="absolute inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full p-8 animate-in fade-in zoom-in duration-300">
            <h2 className="text-xl font-black flex items-center gap-3 mb-6 uppercase text-slate-900">
              <FileSignature className="text-indigo-600" /> Journal d'Usage IA
            </h2>
            <textarea 
              value={declarationText} 
              onChange={(e) => setDeclarationText(e.target.value)} 
              placeholder="Comment as-tu utilisé l'IA pour tes recherches ?" 
              className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-xl mb-6 outline-none text-sm" 
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowDeclarationModal(false)} className="px-5 text-[10px] font-black uppercase text-slate-400">Retour</button>
              <button onClick={() => onFinish(declarationText || "Aucun usage déclaré.")} className="px-6 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">Générer la trace</button>
            </div>
          </div>
        </div>
      )}

      <header className="bg-white border-b px-6 py-4 flex justify-between items-center shrink-0">
        <div className="overflow-hidden">
          <h2 className="text-sm font-black text-slate-900 uppercase truncate">{config.topic}</h2>
          <p className="text-[9px] text-slate-400 font-bold tracking-widest">{config.studentName.toUpperCase()}</p>
        </div>
        <button onClick={() => setShowDeclarationModal(true)} className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-xl text-[10px] font-black tracking-widest uppercase"><StopCircle size={14} /> Terminer</button>
      </header>

      <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-8 scrollbar-hide bg-slate-50/30">
        {messages.filter(m => !m.text.includes("Bonjour Argos")).map((msg) => (
          <div key={msg.id} className={`flex w-full animate-in fade-in duration-300 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-5 py-4 shadow-sm border ${msg.role === 'user' ? 'bg-slate-900 text-white border-slate-800' : 'bg-white text-slate-800 border-slate-100'}`}>
              <div className="prose prose-sm max-w-none prose-slate">
                <ReactMarkdown>{msg.text}</ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-indigo-50 px-4 py-3 rounded-xl flex items-center gap-3 animate-pulse">
              <RefreshCw className="animate-spin text-indigo-500" size={12} />
              <span className="text-[10px] text-indigo-600 font-bold uppercase tracking-widest">Argos réfléchit...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="bg-white border-t p-4 sm:p-6 shrink-0">
        <div className="max-w-4xl mx-auto relative">
          <textarea 
            value={inputText} 
            onChange={(e) => setInputText(e.target.value)} 
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
            placeholder="Écris ton raisonnement ici..." 
            className="w-full bg-slate-50 rounded-2xl pl-5 pr-14 py-4 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm resize-none" 
            rows={1}
          />
          <button onClick={() => handleSend()} disabled={!inputText.trim() || isLoading} className="absolute right-3 bottom-3 p-2 bg-slate-900 text-white rounded-xl disabled:opacity-20 transition-all">
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};
