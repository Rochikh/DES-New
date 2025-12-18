import React, { useState } from 'react';
import { AppMode, SessionConfig, Message } from './types';
import { SetupView } from './components/SetupView';
import { ChatView } from './components/ChatView';
import { ReportView } from './components/ReportView';
import { LoginView } from './components/LoginView';
import { Chat } from "@google/genai";
import { createChatSession } from './services/gemini';

const App: React.FC = () => {
  const [appMode, setAppMode] = useState<AppMode>(AppMode.LOGIN);
  const [config, setConfig] = useState<SessionConfig | null>(null);
  const [chatInstance, setChatInstance] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [aiDeclaration, setAiDeclaration] = useState<string>('');

  const handleLoginSuccess = () => {
    setAppMode(AppMode.SETUP);
  };

  const handleStartSession = (newConfig: SessionConfig) => {
    setConfig(newConfig);
    setMessages([]);
    const chat = createChatSession(newConfig.mode, newConfig.topic, []);
    setChatInstance(chat);
    setAppMode(AppMode.CHAT);
  };

  const handleResumeSession = (restoredConfig: SessionConfig, restoredMessages: Message[], restoredDeclaration: string) => {
    setConfig(restoredConfig);
    setMessages(restoredMessages);
    setAiDeclaration(restoredDeclaration);
    const chat = createChatSession(restoredConfig.mode, restoredConfig.topic, restoredMessages);
    setChatInstance(chat);
    setAppMode(AppMode.CHAT);
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
    setAppMode(AppMode.SETUP);
  };

  // Crucial : En mode REPORT, on ne doit PAS avoir de overflow-hidden ou de h-screen strict sur le parent
  const isReportMode = appMode === AppMode.REPORT;

  return (
    <div className={`flex flex-col ${isReportMode ? 'min-h-screen' : 'h-screen'} w-full`}>
      <div className={`flex-1 relative ${isReportMode ? '' : 'overflow-hidden'}`}>
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
      </div>
      {appMode !== AppMode.LOGIN && (
        <footer className="shrink-0 py-1 text-center text-[10px] text-slate-400 bg-slate-50 border-t border-slate-100 no-print">
          Rochane Kherbouche en CC BY SA
        </footer>
      )}
    </div>
  );
};

export default App;