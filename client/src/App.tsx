import React, { useState } from 'react';
import { AppMode, SessionConfig, Message } from './types';
import { SetupView } from './components/SetupView';
import { ChatView } from './components/ChatView';
import { ReportView } from './components/ReportView';
import { createChatSession, ChatSession } from './services/api';
import { AlertCircle, Mail } from 'lucide-react';

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
    <div className="flex flex-col min-h-screen w-full bg-craie">
      {error && appMode === AppMode.SETUP && (
        <div className="bg-craie border-b-2 border-ambre text-nuit px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 text-sm font-semibold">
            <AlertCircle size={18} className="text-ambre" />
            {error}
          </div>
          <button onClick={() => setError(null)} className="text-[11px] uppercase tracking-wide font-semibold text-ardoise hover:text-nuit">Fermer</button>
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

      <footer className="shrink-0 py-2.5 text-center text-[10px] text-ardoise bg-craie border-t border-brume no-print flex items-center justify-center gap-6">
        <span className="uppercase tracking-wide">© Rochane Kherbouche • Licence CC BY SA</span>
        <span className="w-1 h-1 bg-brume rounded-full"></span>
        <a href="mailto:contact@rochane.fr" className="flex items-center gap-2 hover:text-paon transition-colors uppercase tracking-wide">
          <Mail size={12} />
          me contacter
        </a>
      </footer>
    </div>
  );
};

export default App;
