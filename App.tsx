
import React, { useState } from 'react';
import { AppMode, SessionConfig, Message } from './types';
import { SetupView } from './components/SetupView';
import { ChatView } from './components/ChatView';
import { ReportView } from './components/ReportView';
import { LoginView } from './components/LoginView';
import { createChatSession } from './services/gemini';
import { AlertCircle, Mail } from 'lucide-react';

const App: React.FC = () => {
  const [appMode, setAppMode] = useState<AppMode>(AppMode.LOGIN);
  const [config, setConfig] = useState<SessionConfig | null>(null);
  const [chatInstance, setChatInstance] = useState<any | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [aiDeclaration, setAiDeclaration] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleLoginSuccess = () => {
    setAppMode(AppMode.SETUP);
  };

  const handleStartSession = (newConfig: SessionConfig) => {
    setError(null);
    try {
      const chat = createChatSession(newConfig.mode, newConfig.topic, []);
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
      const chat = createChatSession(restoredConfig.mode, restoredConfig.topic, restoredMessages);
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
    <div className="flex flex-col min-h-screen w-full bg-slate-50">
      {error && appMode === AppMode.SETUP && (
        <div className="bg-rose-600 text-white px-6 py-3 flex items-center justify-between animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-3 text-sm font-bold">
            <AlertCircle size={18} />
            {error}
          </div>
          <button onClick={() => setError(null)} className="text-[10px] uppercase font-black opacity-70 hover:opacity-100">Fermer</button>
        </div>
      )}

      <main className={`flex-1 w-full ${isReportMode ? 'block overflow-visible h-auto' : 'h-[calc(100vh-28px)] overflow-hidden flex flex-col'}`}>
        {appMode === AppMode.LOGIN && (
          <LoginView onSuccess={handleLoginSuccess} />
        )}

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
      
      {appMode !== AppMode.LOGIN && (
        <footer className="shrink-0 py-2.5 text-center text-[9px] text-slate-400 bg-slate-50 border-t border-slate-100 no-print flex items-center justify-center gap-6">
          <span className="font-bold uppercase tracking-widest">© Rochane Kherbouche • Licence CC BY SA</span>
          <span className="w-1.5 h-1.5 bg-slate-200 rounded-full"></span>
          <a href="mailto:contact@rochane.fr" className="flex items-center gap-2 hover:text-indigo-600 transition-colors font-black uppercase tracking-[0.2em] group">
            <Mail size={12} className="group-hover:scale-110 transition-transform" />
            me contacter
          </a>
        </footer>
      )}
    </div>
  );
};

export default App;
