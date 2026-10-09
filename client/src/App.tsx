import React, { useState } from 'react';
import { AppMode, SessionConfig, Message } from './types';
import { SetupView } from './components/SetupView';
import { ChatView } from './components/ChatView';
import { ReportView } from './components/ReportView';
import { createChatSession, ChatSession } from './services/api';
import { AlertCircle, ExternalLink } from 'lucide-react';

const App: React.FC = () => {
  const [appMode, setAppMode] = useState<AppMode>(AppMode.SETUP);
  const [config, setConfig] = useState<SessionConfig | null>(null);
  const [chatInstance, setChatInstance] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [aiDeclaration, setAiDeclaration] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleStartSession = (newConfig: SessionConfig) => {
    setError(null);
    try {
      const chat = createChatSession(newConfig.mode, newConfig.topic, [], newConfig.corpus);
      setConfig(newConfig);
      setMessages([]);
      setChatInstance(chat);
      setAppMode(AppMode.CHAT);
    } catch (err: any) {
      console.error("Session creation failed:", err);
      setError(err.message || "Impossible de créer la session. Vérifiez la configuration.");
    }
  };

  const handleResumeSession = (restoredConfig: SessionConfig, restoredMessages: Message[], restoredDeclaration: string) => {
    setError(null);
    try {
      const chat = createChatSession(restoredConfig.mode, restoredConfig.topic, restoredMessages, restoredConfig.corpus);
      setConfig(restoredConfig);
      setMessages(restoredMessages);
      setAiDeclaration(restoredDeclaration);
      setChatInstance(chat);
      setAppMode(AppMode.CHAT);
    } catch (err: any) {
      setError("Erreur lors de la reprise de session.");
    }
  };

  const handleFinishSession = (declaration: string) => {
    setAiDeclaration(declaration);
    setAppMode(AppMode.REPORT);
  };

  const handleRestart = () => {
    setConfig(null);
    setChatInstance(null);
    setMessages([]);
    setAiDeclaration('');
    setError(null);
    setAppMode(AppMode.SETUP);
  };

  const isReportMode = appMode === AppMode.REPORT;

  return (
    <div className="flex flex-col min-h-screen w-full bg-paper">
      {error && appMode === AppMode.SETUP && (
        <div className="bg-paper border-b border-line text-text px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 label-mono text-rouge">
            <AlertCircle size={18} className="text-rouge" />
            {error}
          </div>
          <button onClick={() => setError(null)} className="label-mono text-muted hover:text-accent">Fermer</button>
        </div>
      )}

      <main className={`flex-1 w-full ${isReportMode ? 'block overflow-visible h-auto' : 'h-[calc(100vh-28px)] overflow-hidden flex flex-col'}`}>
        {appMode === AppMode.SETUP && (
          <SetupView
            onStart={handleStartSession}
            onResume={handleResumeSession}
          />
        )}

        {appMode === AppMode.CHAT && config && (
          <ChatView
            chatInstance={chatInstance}
            config={config}
            messages={messages}
            setMessages={setMessages}
            onFinish={handleFinishSession}
          />
        )}

        {appMode === AppMode.REPORT && config && (
          <ReportView
            config={config}
            transcript={messages}
            aiDeclaration={aiDeclaration}
            onRestart={handleRestart}
          />
        )}
      </main>

      <footer className="shrink-0 py-2.5 px-4 text-center text-[0.8rem] text-muted2 bg-off border-t border-line no-print flex flex-wrap items-center justify-center gap-x-6 gap-y-1">
        <span>© Rochane Kherbouche • Licence CC BY SA</span>
        <span className="w-1 h-1 bg-line2 rounded-full" aria-hidden="true"></span>
        <a
          href="https://rochane.fr"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 font-semibold text-accent hover:text-accent-hover hover:underline transition-colors"
        >
          <ExternalLink size={12} />
          Retrouver les outils de Rochane Kherbouche
        </a>
      </footer>
    </div>
  );
};

export default App;
