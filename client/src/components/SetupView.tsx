import React, { useState, useRef } from 'react';
import { SocraticMode, SessionConfig, Message } from '../types';
import { HelpCircle, ShieldAlert, MessageCircleQuestion, Upload, Info, UserCircle2, Check } from 'lucide-react';
import { parseSessionFile } from '../utils/session';
import { ArgosEye } from './PhaseTracker';
import { GuideModal } from './GuideModal';

interface SetupViewProps {
  onStart: (config: SessionConfig) => void;
  onResume: (config: SessionConfig, messages: Message[], aiDeclaration: string) => void;
}

export const SetupView: React.FC<SetupViewProps> = ({ onStart, onResume }) => {
  const [name, setName] = useState('');
  const [topic, setTopic] = useState('');
  const [mode, setMode] = useState<SocraticMode>(SocraticMode.TUTOR);
  const [showGuide, setShowGuide] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && topic.trim()) {
      onStart({ studentName: name, topic, mode });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setImportError(null);

    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const session = parseSessionFile(event.target?.result as string);
          onResume(session.config, session.messages, session.aiDeclaration);
        } catch (err) {
          setImportError("Fichier JSON corrompu ou invalide.");
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="h-full overflow-y-auto flex flex-col items-center bg-craie p-4 relative">
      <button
        onClick={() => setShowGuide(true)}
        className="self-end sm:self-auto sm:absolute sm:top-6 sm:right-6 z-50 flex items-center gap-2 px-4 py-2 bg-white text-ardoise border border-brume rounded-md hover:text-paon hover:border-paon transition-colors shrink-0"
      >
        <span className="text-[11px] font-semibold uppercase tracking-wide">Le projet Argos</span>
        <HelpCircle size={18} />
      </button>

      {showGuide && <GuideModal onClose={() => setShowGuide(false)} />}

      <div className="w-full max-w-2xl flex flex-col items-center mt-4 mb-6 sm:my-auto">
      <div className="bg-white p-8 sm:p-12 rounded-lg border border-brume w-full">
        <div className="flex flex-col items-center mb-10">
          <div className="mb-4" aria-hidden="true">
            <ArgosEye state="active" size={64} />
          </div>
          <h1 className="font-serif text-4xl font-semibold text-nuit">Argos socratique</h1>
          <p className="text-ardoise text-sm mt-2">Ton partenaire de réflexion critique</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8" autoComplete="off">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label htmlFor="setup-name" className="block text-[11px] font-semibold text-ardoise uppercase tracking-wide ml-1">Prénom</label>
              <div className="relative">
                <UserCircle2 className="absolute left-4 top-1/2 -translate-y-1/2 text-brume" size={20} />
                <input
                  id="setup-name"
                  type="text"
                  required
                  autoComplete="off"
                  className="w-full pl-12 pr-4 py-3.5 bg-craie border border-brume rounded-md focus:border-paon focus:bg-white outline-none transition-colors text-nuit"
                  placeholder="Ex : Alex"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="setup-topic" className="block text-[11px] font-semibold text-ardoise uppercase tracking-wide ml-1">Sujet d'exploration</label>
                <input
                  id="setup-topic"
                  type="text"
                  required
                  autoComplete="off"
                  className="w-full px-5 py-3.5 bg-craie border border-brume rounded-md focus:border-paon focus:bg-white outline-none transition-colors text-nuit"
                  placeholder="Ex : L'impact de l'IA sur l'emploi"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                />
            </div>
          </div>

          <div className="space-y-4">
            <span className="block text-[11px] font-semibold text-ardoise uppercase tracking-wide ml-1">Expérience de dialogue</span>

            <div className="grid grid-cols-1 gap-4">
              <button
                type="button"
                onClick={() => setMode(SocraticMode.TUTOR)}
                className={`group relative p-6 rounded-lg border text-left transition-colors flex items-start gap-5 ${mode === SocraticMode.TUTOR ? 'border-paon bg-paon/5' : 'border-brume bg-white hover:border-paon'}`}
              >
                <div className={`p-3.5 rounded-md shrink-0 ${mode === SocraticMode.TUTOR ? 'bg-paon text-white' : 'bg-craie text-paon border border-brume'}`}>
                  <MessageCircleQuestion size={26} />
                </div>
                <div className="flex-1">
                  <div className={`font-semibold text-sm mb-1 ${mode === SocraticMode.TUTOR ? 'text-paon-sombre' : 'text-nuit'}`}>Mode tuteur (accompagnement)</div>
                  <p className="text-[13px] leading-relaxed text-ardoise">
                    Je t'aide à construire et à fortifier ton propre raisonnement en posant des questions ciblées sans jamais donner la solution.
                  </p>
                </div>
                {mode === SocraticMode.TUTOR && <Check size={18} className="absolute top-5 right-5 text-paon" />}
              </button>

              <button
                type="button"
                onClick={() => setMode(SocraticMode.CRITIC)}
                className={`group relative p-6 rounded-lg border text-left transition-colors flex items-start gap-5 ${mode === SocraticMode.CRITIC ? 'border-ambre bg-ambre/5' : 'border-brume bg-white hover:border-ambre'}`}
              >
                <div className={`p-3.5 rounded-md shrink-0 ${mode === SocraticMode.CRITIC ? 'bg-ambre text-white' : 'bg-craie text-ambre border border-brume'}`}>
                  <ShieldAlert size={26} />
                </div>
                <div className="flex-1">
                  <div className={`font-semibold text-sm mb-1 ${mode === SocraticMode.CRITIC ? 'text-ambre' : 'text-nuit'}`}>Mode critique (audit logique)</div>
                  <p className="text-[13px] leading-relaxed text-ardoise">
                    Je soumets un texte piégé. À toi de mener l'enquête pour débusquer les failles logiques et les biais cognitifs cachés.
                  </p>
                </div>
                {mode === SocraticMode.CRITIC && <Check size={18} className="absolute top-5 right-5 text-ambre" />}
              </button>
            </div>
          </div>

          <div className="pt-4">
            <button type="submit" className="w-full bg-paon text-white py-4 rounded-md font-semibold text-sm hover:bg-paon-sombre transition-colors">
              Lancer la discussion
            </button>
          </div>

          <div className="pt-4 border-t border-brume">
            <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full flex items-center justify-center gap-3 py-3.5 px-6 bg-white border border-dashed border-brume text-ardoise rounded-md text-[11px] font-semibold uppercase tracking-wide hover:border-paon hover:text-paon transition-colors">
              <Upload size={16} /> Reprendre un travail (.JSON)
            </button>
            <input type="file" accept=".json" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
            {importError && <div className="text-[11px] text-ambre font-semibold text-center mt-3">{importError}</div>}
          </div>
        </form>
      </div>

      <div className="mt-4 flex items-center gap-2 text-ardoise text-[10px] uppercase tracking-wide">
        <Info size={12} />
        <span>Données locales non stockées</span>
      </div>
      </div>
    </div>
  );
};
