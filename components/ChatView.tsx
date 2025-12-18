
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, StopCircle, RefreshCw, FileSignature, HelpCircle, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Chat } from "@google/genai";
import { Message, SessionConfig } from '../types';
import { sendMessage } from '../services/gemini';
import { GuideModal } from './GuideModal';

interface ChatViewProps {
  chatInstance: Chat | null;
  config: SessionConfig;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  onFinish: (aiDeclaration: string) => void;
}

export const ChatView: React.FC<ChatViewProps> = ({ chatInstance, config, messages, setMessages, onFinish }) => {
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showDeclarationModal, setShowDeclarationModal] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [declarationText, setDeclarationText] = useState('');
  const [lastActivityAt, setLastActivityAt] = useState<number>(Date.now());
  const [error, setError] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isStarted = useRef(false);

  const initChat = useCallback(async () => {
    // Si déjà lancé ou si pas d'instance, on ne fait rien
    if (!chatInstance || isStarted.current) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const res = await sendMessage(chatInstance, `Bonjour Argos, je suis ${config.studentName} et je suis prêt. Salue-moi par mon prénom et lance la session sur le sujet : ${config.topic}.`);
      const aiMsg: Message = {
        id: crypto.randomUUID(),
        role: 'model',
        text: res.text,
        timestamp: Date.now()
      };
      setMessages([aiMsg]);
      setLastActivityAt(Date.now());
      isStarted.current = true;
    } catch (e: any) { 
      console.error("Initialization error:", e);
      setError(e.message || "Argos semble indisponible pour le moment. Vérifiez votre connexion ou la configuration de l'API (clé manquante ?)");
    } finally { 
      setIsLoading(false); 
    }
  }, [chatInstance, config.studentName, config.topic, setMessages]);

  useEffect(() => {
    // Déclenchement automatique de la première interaction
    if (messages.length === 0 && chatInstance && !isStarted.current) {
      initChat();
    } else if (messages.length > 0) {
      isStarted.current = true;
    }
  }, [chatInstance, messages.length, initChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!inputText.trim() || !chatInstance || isLoading) return;

    setError(null);
    const now = Date.now();
    const reflectionTime = now - lastActivityAt;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      text: inputText,
      timestamp: now,
      responseTimeMs: reflectionTime
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const res = await sendMessage(chatInstance, userMsg.text);
      const aiMsg: Message = {
        id: crypto.randomUUID(),
        role: 'model',
        text: res.text,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, aiMsg]);
      setLastActivityAt(Date.now());
    } catch (e: any) {
      console.error("Send message error:", e);
      setError(e.message || "Le message n'a pas été envoyé. Argos rencontre une difficulté technique.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-white relative">
      {showGuide && <GuideModal onClose={() => setShowGuide(false)} />}

      {showDeclarationModal && (
        <div className="absolute inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full p-8 animate-in fade-in zoom-in duration-300 border border-slate-100">
            <h2 className="text-xl font-black flex items-center gap-3 mb-6 uppercase tracking-tighter text-slate-900">
              <FileSignature className="text-indigo-600" /> Journal de bord IA
            </h2>
            <div className="bg-slate-50 p-4 mb-6 text-xs text-slate-600 rounded-xl leading-relaxed">
              Pour conclure cet audit, décris brièvement comment tu as utilisé l'IA (si c'est le cas) pour construire tes réponses ou tes recherches durant cette session.
            </div>
            <textarea value={declarationText} onChange={(e) => setDeclarationText(e.target.value)} placeholder="Usage de l'IA (prompts, outils...)" className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-xl mb-6 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm" />
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowDeclarationModal(false)} className="px-5 py-2 text-[10px] font-black uppercase text-slate-400 tracking-widest hover:text-slate-600 transition-colors">Retour</button>
              <button onClick={() => onFinish(declarationText || "Aucun usage déclaré.")} className="px-6 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-lg">Générer l'Audit Final</button>
            </div>
          </div>
        </div>
      )}

      <header className="bg-white border-b px-6 py-4 flex justify-between items-center z-10">
        <div>
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-tighter">{config.topic}</h2>
          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-[0.2em]">{config.studentName} | {config.mode}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowGuide(true)} className="p-2 text-slate-300 hover:text-indigo-600 transition-colors"><HelpCircle size={20} /></button>
          <button onClick={() => setShowDeclarationModal(true)} className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-xl text-[10px] font-black tracking-widest shadow-md hover:bg-rose-700 transition-all active:scale-95 uppercase"><StopCircle size={14} /> Terminer</button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-8 scrollbar-hide">
        {/* Affichage des erreurs critiques d'initialisation */}
        {error && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full space-y-4 px-6 text-center">
             <div className="p-4 bg-rose-100 text-rose-600 rounded-full">
               <AlertCircle size={48} />
             </div>
             <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter">Erreur de Connexion</h3>
             <p className="text-sm font-medium text-slate-600 max-w-sm">{error}</p>
             <button 
               onClick={() => initChat()}
               className="px-8 py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black tracking-widest uppercase hover:bg-indigo-700 transition-all shadow-lg active:scale-95"
             >
               Réessayer de contacter Argos
             </button>
          </div>
        )}

        {/* Message d'attente initial */}
        {isLoading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full space-y-4">
             <RefreshCw className="animate-spin text-indigo-500" size={32} />
             <p className="text-[10px] text-indigo-600 font-black uppercase tracking-widest">Argos prépare ton audit...</p>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex w-full animate-in fade-in slide-in-from-bottom-2 duration-300 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-3xl px-6 py-5 shadow-sm border ${msg.role === 'user' ? 'bg-slate-900 text-white border-slate-800 rounded-br-none' : 'bg-white text-slate-800 border-slate-100 rounded-bl-none shadow-indigo-100/50'}`}>
              <div className={`prose prose-sm max-w-none ${msg.role === 'user' ? 'prose-invert' : 'prose-slate'}`}>
                <ReactMarkdown>{msg.text || "..."}</ReactMarkdown>
              </div>
              <div className="text-[9px] mt-4 opacity-40 uppercase font-black tracking-widest border-t border-current/10 pt-2">
                {msg.role === 'model' ? 'ARGOS AGENT' : config.studentName}
              </div>
            </div>
          </div>
        ))}

        {isLoading && messages.length > 0 && (
          <div className="flex justify-start">
            <div className="bg-indigo-50 border border-indigo-100 rounded-2xl px-5 py-4 flex items-center gap-3 shadow-sm animate-pulse">
              <RefreshCw className="animate-spin text-indigo-500" size={14} />
              <span className="text-[9px] text-indigo-600 font-black uppercase tracking-widest">Argos analyse tes mots...</span>
            </div>
          </div>
        )}

        {error && messages.length > 0 && (
          <div className="mx-auto max-w-md bg-rose-50 border border-rose-100 text-rose-800 px-4 py-3 rounded-2xl flex items-center gap-3 animate-in fade-in">
            <AlertCircle size={18} className="shrink-0" />
            <p className="text-[10px] font-black uppercase tracking-widest">{error}</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="bg-white border-t p-4 sm:p-6">
        <div className="max-w-4xl mx-auto relative">
          <textarea 
            value={inputText} 
            onChange={(e) => setInputText(e.target.value)} 
            onKeyDown={handleKeyPress} 
            placeholder="Écris ton raisonnement ici..." 
            disabled={isLoading || (messages.length === 0 && !error)}
            className="w-full bg-slate-50 rounded-2xl pl-5 pr-14 py-4 border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:bg-white min-h-[64px] resize-none outline-none transition-all text-sm disabled:opacity-50" 
            rows={Math.min(5, inputText.split('\n').length || 1)} 
          />
          <button 
            onClick={handleSend} 
            disabled={!inputText.trim() || isLoading || (messages.length === 0)} 
            className="absolute right-3 bottom-3 p-2.5 bg-slate-900 text-white rounded-xl disabled:opacity-20 hover:bg-indigo-600 transition-all active:scale-90"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};
