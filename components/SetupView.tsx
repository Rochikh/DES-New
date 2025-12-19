
import React, { useState, useRef } from 'react';
import { SocraticMode, SessionConfig, Message } from '../types';
import { BrainCircuit, HelpCircle, ShieldAlert, MessageCircleQuestion, Upload, Info, UserCircle2, ChevronRight } from 'lucide-react';
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
          const json = JSON.parse(event.target?.result as string);
          if (!json.transcript) throw new Error("Format invalide");

          const resumedConfig: SessionConfig = {
            studentName: json.metadata?.student || "Apprenant",
            topic: json.metadata?.topic || "Sujet importé",
            mode: json.metadata?.mode || SocraticMode.TUTOR
          };
          
          onResume(resumedConfig, json.transcript, json.aiDeclaration || "");
        } catch (err) {
          setImportError("Fichier JSON corrompu ou invalide.");
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="h-full overflow-y-auto flex flex-col items-center justify-center bg-slate-50 p-4 relative">
      <button onClick={() => setShowGuide(true)} className="absolute top-4 right-4 z-50 flex items-center gap-2 text-slate-400 hover:text-indigo-600 transition-colors">
        <HelpCircle size={24} />
      </button>

      {showGuide && <GuideModal onClose={() => setShowGuide(false)} />}

      <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl shadow-indigo-100/30 w-full max-w-2xl border border-slate-100 my-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col items-center mb-10">
          <div className="p-4 bg-indigo-600 rounded-3xl text-white shadow-xl shadow-indigo-200 mb-4">
            <BrainCircuit size={44} />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Argos Socratique</h1>
          <p className="text-slate-500 text-sm font-medium mt-1">Ton partenaire de réflexion critique</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8" autoComplete="off">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="block text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Ton Prénom</label>
              <div className="relative">
                <UserCircle2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                <input 
                  type="text" 
                  name="argos-student-first-name"
                  autoComplete="off"
                  required 
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all text-slate-800 font-medium" 
                  placeholder="Ex: Jean" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="block text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Sujet à explorer</label>
              <input 
                type="text" 
                name="argos-discussion-topic"
                autoComplete="off"
                required 
                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all text-slate-800 font-medium" 
                placeholder="Ex: La justice sociale" 
                value={topic} 
                onChange={(e) => setTopic(e.target.value)} 
              />
            </div>
          </div>

          <div className="space-y-4">
            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Choisir l'expérience de dialogue</label>
            
            <div className="grid grid-cols-1 gap-4">
              {/* Carte Mode Tuteur */}
              <button 
                type="button" 
                onClick={() => setMode(SocraticMode.TUTOR)} 
                className={`group relative p-6 rounded-[2rem] border-2 text-left transition-all flex items-start gap-5 ${mode === SocraticMode.TUTOR ? 'border-indigo-600 bg-indigo-50/50 shadow-lg shadow-indigo-100 ring-2 ring-indigo-500/10' : 'border-slate-50 bg-slate-50/50 hover:border-indigo-200'}`}
              >
                <div className={`p-4 rounded-2xl shrink-0 transition-all ${mode === SocraticMode.TUTOR ? 'bg-indigo-600 text-white shadow-lg scale-110' : 'bg-white text-indigo-400 border border-slate-100'}`}>
                  <MessageCircleQuestion size={28} />
                </div>
                <div className="flex-1">
                  <div className={`font-black text-sm uppercase tracking-tight mb-1 ${mode === SocraticMode.TUTOR ? 'text-indigo-900' : 'text-slate-500'}`}>Mode Tuteur (Accompagnement)</div>
                  <p className={`text-[12px] leading-relaxed font-medium ${mode === SocraticMode.TUTOR ? 'text-indigo-700' : 'text-slate-400'}`}>
                    Je t'aide à construire et à fortifier ton propre raisonnement. Je pose des questions pour tester la solidité de tes arguments sans jamais te donner la solution.
                  </p>
                </div>
                {mode === SocraticMode.TUTOR && <div className="absolute top-6 right-6 text-indigo-600"><ChevronRight size={20} /></div>}
              </button>

              {/* Carte Mode Critique */}
              <button 
                type="button" 
                onClick={() => setMode(SocraticMode.CRITIC)} 
                className={`group relative p-6 rounded-[2rem] border-2 text-left transition-all flex items-start gap-5 ${mode === SocraticMode.CRITIC ? 'border-rose-500 bg-rose-50/50 shadow-lg shadow-rose-100 ring-2 ring-rose-500/10' : 'border-slate-50 bg-slate-50/50 hover:border-rose-200'}`}
              >
                <div className={`p-4 rounded-2xl shrink-0 transition-all ${mode === SocraticMode.CRITIC ? 'bg-rose-500 text-white shadow-lg scale-110' : 'bg-white text-rose-400 border border-slate-100'}`}>
                  <ShieldAlert size={28} />
                </div>
                <div className="flex-1">
                  <div className={`font-black text-sm uppercase tracking-tight mb-1 ${mode === SocraticMode.CRITIC ? 'text-rose-900' : 'text-slate-500'}`}>Mode Critique (Audit Logique)</div>
                  <p className={`text-[12px] leading-relaxed font-medium ${mode === SocraticMode.CRITIC ? 'text-rose-700' : 'text-slate-400'}`}>
                    Je te propose un texte qui semble correct mais qui cache des failles logiques ou des biais. À toi de mener l'enquête pour les débusquer et les corriger.
                  </p>
                </div>
                {mode === SocraticMode.CRITIC && <div className="absolute top-6 right-6 text-rose-600"><ChevronRight size={20} /></div>}
              </button>
            </div>
          </div>

          <div className="pt-4">
            <button type="submit" className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] hover:bg-indigo-600 hover:shadow-2xl hover:shadow-indigo-200 transition-all active:scale-[0.98] shadow-xl">
              Lancer la discussion
            </button>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-white border-2 border-dashed border-slate-200 text-slate-400 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all">
              <Upload size={16} /> Reprendre un travail (.JSON)
            </button>
            <input type="file" accept=".json" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
            {importError && <div className="text-[10px] text-rose-500 font-black uppercase text-center mt-3 tracking-widest">{importError}</div>}
          </div>
        </form>
      </div>

      <div className="mt-2 flex items-center gap-2 text-slate-300 text-[10px] uppercase font-black tracking-[0.3em]">
        <Info size={12} />
        <span>Données locales non stockées</span>
      </div>
    </div>
  );
};
