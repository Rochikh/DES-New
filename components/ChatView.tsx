
import React, { useState, useEffect, useRef } from 'react';
import { Send, StopCircle, RefreshCw, FileSignature, HelpCircle, Save, Info, ChevronRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Chat } from "@google/genai";
import { Message, SessionConfig, SocraticStrategy, PROTOCOL_PHASES } from '../types';
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
  const [currentPhase, setCurrentPhase] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const extractPhase = (text: string): number => {
    const match = text.match(/Phase:\s*(\d)/i);
    return match ? parseInt(match[1], 10) : currentPhase;
  };

  const handleExportJSON = () => {
    const data = {
      metadata: {
        student: config.studentName,
        topic: config.topic,
        mode: config.mode,
        date: new Date().toISOString()
      },
      transcript: messages,
      aiDeclaration: declarationText || ""
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Progression_${config.studentName}_${new Date().toLocaleDateString()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleSend = async (initialPrompt?: string) => {
    const text = initialPrompt || inputText;
    if (!text.trim() || !chatInstance || isLoading) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      text: initialPrompt ? "(Démarrage de session)" : text,
      timestamp: Date.now(),
    };

    if (!initialPrompt) setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);
    setError(null);

    try {
      const res = await sendMessage(chatInstance, text);
      const phase = extractPhase(res.text);
      setCurrentPhase(phase);

      const aiMsg: Message = {
        id: crypto.randomUUID(),
        role: 'model',
        text: res.text,
        timestamp: Date.now(),
        phase
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (e: any) {
      setError("Erreur de communication avec Argos.");
    } finally {
      setIsLoading(false);
    }
  };

  // Ajustement automatique de la hauteur du textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [inputText]);

  useEffect(() => {
    if (messages.length === 0 && chatInstance) {
      handleSend(`Bonjour Argos, je suis ${config.studentName}. Lance la session sur : ${config.topic}.`);
    } else if (messages.length > 0) {
      const lastModelMsg = [...messages].reverse().find(m => m.role === 'model');
      if (lastModelMsg?.phase !== undefined) setCurrentPhase(lastModelMsg.phase);
    }
  }, [chatInstance]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div className="flex flex-col h-full bg-slate-50 relative">
      {showGuide && <GuideModal onClose={() => setShowGuide(false)} />}
      
      {showDeclarationModal && (
        <div className="absolute inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
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

      {/* PROGRESS TRACKER */}
      <div className="bg-white border-b border-slate-100 px-6 py-2 flex items-center justify-between overflow-x-auto scrollbar-hide no-print">
        <div className="flex items-center gap-2 min-w-max">
          {PROTOCOL_PHASES.map((p, i) => (
            <div key={p.id} className="flex items-center gap-2">
               <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-500 ${currentPhase === p.id ? 'bg-indigo-600 text-white shadow-md' : currentPhase > p.id ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-50 text-slate-300'}`}>
                  <span className="text-[9px] font-black uppercase tracking-tighter">{i}. {p.label}</span>
                  {currentPhase > p.id && <Info size={10} />}
               </div>
               {i < PROTOCOL_PHASES.length - 1 && <ChevronRight size={12} className="text-slate-200" />}
            </div>
          ))}
        </div>
      </div>

      <header className="bg-white border-b px-6 py-4 flex justify-between items-center shrink-0 shadow-sm z-10 no-print">
        <div className="overflow-hidden flex items-center gap-4">
          <div className="hidden sm:block">
            <h2 className="text-sm font-black text-slate-900 uppercase truncate">{config.topic}</h2>
            <p className="text-[9px] text-slate-400 font-bold tracking-widest">PHASE {currentPhase} : {PROTOCOL_PHASES[currentPhase]?.label.toUpperCase()}</p>
          </div>
          <button 
            onClick={handleExportJSON}
            title="Sauvegarder pour reprendre plus tard"
            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all flex items-center gap-2 group"
          >
            <Save size={18} />
            <span className="text-[9px] font-black uppercase tracking-widest hidden md:inline">Sauvegarder</span>
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowGuide(true)} className="p-2 text-slate-300 hover:text-slate-600 transition-colors"><HelpCircle size={20} /></button>
          <button onClick={() => setShowDeclarationModal(true)} className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-xl text-[10px] font-black tracking-widest uppercase hover:bg-rose-700 transition-colors shadow-lg shadow-rose-100"><StopCircle size={14} /> Terminer</button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 scrollbar-hide">
        {messages.filter(m => !m.text.includes("Bonjour Argos")).map((msg) => (
          <div key={msg.id} className={`flex w-full animate-in fade-in slide-in-from-bottom-2 duration-300 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[88%] sm:max-w-[75%] rounded-[1.8rem] px-6 py-5 shadow-md border transition-all ${
              msg.role === 'user' 
                ? 'bg-slate-900 text-white border-slate-800 rounded-tr-none' 
                : 'bg-white text-slate-800 border-slate-200 rounded-tl-none'
            }`}>
              <div className={`prose prose-sm max-w-none font-medium leading-relaxed ${
                msg.role === 'user' ? 'prose-invert prose-p:text-white prose-p:font-semibold' : 'prose-slate'
              }`}>
                <ReactMarkdown>{msg.text}</ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-indigo-600 text-white px-5 py-3 rounded-2xl rounded-tl-none flex items-center gap-3 animate-pulse shadow-lg shadow-indigo-200">
              <RefreshCw className="animate-spin" size={14} />
              <span className="text-[10px] font-black uppercase tracking-widest">Argos analyse ton propos...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="bg-white border-t p-4 sm:p-6 shrink-0 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)] no-print">
        <div className="max-w-4xl mx-auto relative group">
          <textarea 
            ref={textareaRef}
            value={inputText} 
            onChange={(e) => setInputText(e.target.value)} 
            placeholder="Réponds ici avec précision..." 
            className="w-full bg-slate-50 rounded-2xl pl-6 pr-16 py-5 border-2 border-slate-100 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all text-base font-medium resize-none shadow-inner overflow-y-auto" 
            rows={1}
          />
          <button 
            onClick={() => handleSend()} 
            disabled={!inputText.trim() || isLoading} 
            className="absolute right-3 bottom-3 p-3 bg-slate-900 text-white rounded-xl disabled:opacity-10 hover:bg-indigo-600 transition-all shadow-lg active:scale-90"
            title="Envoyer le message"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};
