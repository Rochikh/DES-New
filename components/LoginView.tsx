
import React, { useState } from 'react';
import { Lock, ArrowRight, HelpCircle, BrainCircuit } from 'lucide-react';
import { GuideModal } from './GuideModal';

interface LoginViewProps {
  onSuccess: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onSuccess }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  const VALID_CODE = "DES2025"; 

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim() === VALID_CODE) {
      onSuccess();
    } else {
      setError(true);
    }
  };

  return (
    <div className="h-full flex flex-col items-center justify-center bg-slate-900 px-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-rose-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Help Button - Prominent */}
      <button 
        onClick={() => setShowGuide(true)} 
        className="absolute top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 bg-white/10 backdrop-blur-md text-white rounded-2xl border border-white/20 hover:bg-white/20 transition-all shadow-2xl group animate-in slide-in-from-right duration-500"
      >
        <span className="text-[10px] font-black uppercase tracking-widest">Besoin d'aide ?</span>
        <HelpCircle size={20} className="text-indigo-400 group-hover:scale-110 transition-transform" />
      </button>

      {showGuide && <GuideModal onClose={() => setShowGuide(false)} />}

      <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl p-10 animate-in fade-in zoom-in duration-300 relative z-10">
        <div className="flex flex-col items-center mb-10">
          <div className="p-5 bg-slate-900 rounded-[2rem] text-white shadow-2xl shadow-indigo-200 mb-6">
            <BrainCircuit size={40} />
          </div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tighter uppercase mb-1">Argos Socratique</h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em]">Accès Session</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Entrez votre code d'accès</label>
            <div className="relative">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input
                type="text"
                style={{ WebkitTextSecurity: 'disc' } as any}
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  setError(false);
                }}
                autoComplete="off"
                className={`w-full pl-14 pr-6 py-5 rounded-2xl border-2 outline-none transition-all text-center text-xl font-bold tracking-[0.5em] ${
                  error 
                    ? 'border-rose-200 bg-rose-50 text-rose-900 focus:border-rose-500' 
                    : 'border-slate-100 bg-slate-50 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10'
                }`}
                placeholder="••••••"
                autoFocus
              />
            </div>
            {error && (
              <p className="text-center text-rose-600 text-[10px] font-black uppercase tracking-widest mt-3 animate-pulse">
                Code invalide
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] hover:bg-indigo-600 transition-all flex items-center justify-center gap-3 group shadow-xl shadow-indigo-100"
          >
            Ouvrir la session
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </form>
        
        <div className="mt-10 text-center border-t border-slate-50 pt-8">
           <p className="text-[9px] text-slate-400 leading-relaxed font-medium">
             Dispositif de traçabilité des compétences critiques.<br/>
             Aucune donnée personnelle n'est stockée sur nos serveurs.
           </p>
        </div>
      </div>
    </div>
  );
};
