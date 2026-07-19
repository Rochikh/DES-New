import React, { useState, useEffect, useRef } from 'react';
import { Send, StopCircle, FileSignature, HelpCircle, Save, Timer } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Message, SessionConfig, PROTOCOL_PHASES } from '../types';
import { sendMessage, ChatSession } from '../services/api';
import { cleanDisplayBotText, extractPhase } from '../utils/phase';
import { PhaseTracker } from './PhaseTracker';
import { GuideModal } from './GuideModal';

export const ChatView: React.FC<{
  chatInstance: ChatSession | null;
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
  const [lastModelTime, setLastModelTime] = useState<number>(Date.now());

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleExportJSON = () => {
    const data = {
      metadata: {
        student: config.studentName,
        topic: config.topic,
        mode: config.mode,
        date: new Date().toISOString()
      },
      corpus: config.corpus || "",
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

    const now = Date.now();
    const responseTimeMs = now - lastModelTime;
    const responseTimeSeconds = Math.max(1, Math.round(responseTimeMs / 1000));

    const charCount = text.length;
    const cpm = (charCount / responseTimeSeconds) * 60;
    const isAnomaly = !initialPrompt && charCount > 100 && cpm > 600;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      text: initialPrompt ? "(Démarrage de session)" : text,
      timestamp: now,
      responseTimeSeconds: initialPrompt ? 0 : responseTimeSeconds,
      hasRhythmAnomaly: isAnomaly
    };

    if (!initialPrompt) setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);
    setError(null);

    try {
      const res = await sendMessage(chatInstance, text);
      const phase = extractPhase(res.text, currentPhase);
      setCurrentPhase(phase);

      const aiMsg: Message = {
        id: crypto.randomUUID(),
        role: 'model',
        text: res.text,
        timestamp: Date.now(),
        phase
      };
      setMessages(prev => [...prev, aiMsg]);
      setLastModelTime(Date.now());
    } catch (e: any) {
      setError("Erreur de communication avec Argos.");
      setLastModelTime(Date.now());
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [inputText]);

  useEffect(() => {
    if (messages.length === 0 && chatInstance) {
      handleSend(`Bonjour Argos, je suis ${config.studentName}. Lancez la session sur : ${config.topic}.`);
    } else if (messages.length > 0) {
      const lastModelMsg = [...messages].reverse().find(m => m.role === 'model');
      if (lastModelMsg?.phase !== undefined) setCurrentPhase(lastModelMsg.phase);
    }
  }, [chatInstance]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div className="flex flex-col h-full bg-craie relative">
      {showGuide && <GuideModal onClose={() => setShowGuide(false)} />}

      {showDeclarationModal && (
        <div className="absolute inset-0 z-50 bg-nuit/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-modal max-w-xl w-full p-8">
            <h2 className="font-serif text-xl font-semibold flex items-center gap-3 mb-6 text-nuit">
              <FileSignature className="text-paon" /> Journal d'usage de l'IA
            </h2>
            <textarea
              value={declarationText}
              onChange={(e) => setDeclarationText(e.target.value)}
              placeholder="Comment as-tu utilisé l'IA pour tes recherches ?"
              className="w-full h-32 p-4 bg-craie border border-brume rounded-md mb-6 outline-none focus:border-paon text-sm"
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowDeclarationModal(false)} className="px-5 text-[11px] font-semibold uppercase tracking-wide text-ardoise hover:text-nuit">Retour</button>
              <button onClick={() => onFinish(declarationText || "Aucun usage déclaré.")} className="px-6 py-2.5 bg-paon text-white rounded-md text-[11px] font-semibold uppercase tracking-wide hover:bg-paon-sombre transition-colors">Générer la trace</button>
            </div>
          </div>
        </div>
      )}

      <PhaseTracker currentPhase={currentPhase} />

      <header className="bg-white border-b border-brume px-6 py-3.5 flex justify-between items-center shrink-0 z-10 no-print">
        <div className="overflow-hidden flex items-center gap-4">
          <div className="hidden sm:block">
            <h2 className="text-sm font-semibold text-nuit truncate">{config.topic}</h2>
            <p className="text-[11px] text-ardoise">Phase {currentPhase} : {PROTOCOL_PHASES[currentPhase]?.label}</p>
          </div>
          <button
            onClick={handleExportJSON}
            title="Sauvegarder pour reprendre plus tard"
            className="p-2 text-ardoise hover:text-paon rounded-md transition-colors flex items-center gap-2"
          >
            <Save size={18} />
            <span className="text-[11px] font-semibold uppercase tracking-wide hidden md:inline">Sauvegarder</span>
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowGuide(true)} className="p-2 text-ardoise hover:text-nuit transition-colors" title="Le projet Argos"><HelpCircle size={20} /></button>
          <button onClick={() => setShowDeclarationModal(true)} className="flex items-center gap-2 px-4 py-2 bg-ambre text-white rounded-md text-[11px] font-semibold uppercase tracking-wide hover:opacity-90 transition-opacity"><StopCircle size={14} /> Terminer la session</button>
        </div>
      </header>

      {error && (
        <div className="bg-craie border-b border-ambre text-nuit text-sm px-6 py-2 no-print">{error}</div>
      )}

      <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-8 scrollbar-hide">
        {messages.filter(m => !m.text.includes("Bonjour Argos")).map((msg) => (
          <div key={msg.id} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`group relative max-w-[88%] sm:max-w-[75%] rounded-lg px-6 py-4 border ${
              msg.role === 'user'
                ? 'bg-nuit text-craie border-nuit'
                : 'bg-white text-nuit border-brume'
            }`}>
              {msg.role === 'user' && msg.responseTimeSeconds !== undefined && msg.responseTimeSeconds > 0 && (
                <div className={`absolute -top-5 right-2 flex items-center gap-1.5 text-[10px] ${msg.hasRhythmAnomaly ? 'text-ambre font-semibold' : 'text-ardoise'}`}>
                  <Timer size={10} />
                  Flux : {msg.responseTimeSeconds}s {msg.hasRhythmAnomaly && "• Rupture de rythme"}
                </div>
              )}
              <div className={`prose prose-sm max-w-none leading-relaxed ${
                msg.role === 'user' ? 'prose-invert prose-p:text-craie' : 'prose-p:text-nuit'
              }`}>
                <ReactMarkdown>
                  {msg.role === 'model' ? cleanDisplayBotText(msg.text) : msg.text}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-brume text-ardoise px-5 py-3 rounded-lg flex items-center gap-3">
              <span className="flex gap-1" aria-hidden="true">
                <span className="thinking-dot w-1.5 h-1.5 bg-paon rounded-full"></span>
                <span className="thinking-dot w-1.5 h-1.5 bg-paon rounded-full"></span>
                <span className="thinking-dot w-1.5 h-1.5 bg-paon rounded-full"></span>
              </span>
              <span className="text-sm">Argos réfléchit</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="bg-white border-t border-brume p-4 sm:p-6 shrink-0 no-print">
        <div className="max-w-4xl mx-auto relative">
          <div className="flex justify-between items-center mb-3 px-2">
            <button
              onClick={() => handleSend("Je suis un peu bloqué sur ce point, peux-tu m'aider à avancer ou m'expliquer ce concept ?")}
              disabled={isLoading}
              className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-ardoise hover:text-paon transition-colors"
            >
              <HelpCircle size={14} />
              Besoin d'un indice ou d'une explication ?
            </button>
            <span className="text-[11px] text-ardoise">
              {inputText.length} caractères
            </span>
          </div>
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Réponds ici avec précision..."
              className="w-full bg-craie rounded-md pl-6 pr-16 py-4 border border-brume focus:border-paon focus:bg-white outline-none transition-colors text-base resize-none overflow-y-auto"
              rows={1}
            />
            <button
              onClick={() => handleSend()}
              disabled={!inputText.trim() || isLoading}
              className="absolute right-3 bottom-3 p-3 bg-paon text-white rounded-md disabled:opacity-20 hover:bg-paon-sombre transition-colors"
              title="Envoyer le message"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
