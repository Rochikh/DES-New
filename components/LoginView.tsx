import React, { useState } from 'react';
import { Lock, ArrowRight } from 'lucide-react';

interface LoginViewProps {
  onSuccess: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onSuccess }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState(false);

  // Le code est défini dans .env (VITE_ACCESS_CODE) ou par défaut "DES2025"
  // Note: Dans une vraie appli, import.meta.env est mieux, mais process.env fonctionne ici grâce au define de vite.config
  // @ts-ignore
  const VALID_CODE = process.env.VITE_ACCESS_CODE || import.meta.env?.VITE_ACCESS_CODE || "DES2025";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim() === VALID_CODE) {
      onSuccess();
    } else {
      setError(true);
    }
  };

  return (
    <div className="h-full flex items-center justify-center bg-slate-900 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 animate-in fade-in zoom-in duration-300">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-indigo-100 rounded-full text-indigo-600">
            <Lock size={32} />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-center text-slate-800 mb-2">Accès Restreint</h1>
        <p className="text-center text-slate-500 mb-8 text-sm">
          Veuillez entrer le code de la session fourni par votre enseignant·e pour accéder au Dialogue Évaluatif Socratique.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setError(false);
              }}
              className={`w-full px-4 py-3 rounded-xl border-2 outline-none transition-all text-center text-lg tracking-widest ${
                error 
                  ? 'border-rose-300 bg-rose-50 text-rose-900 focus:border-rose-500 placeholder-rose-300' 
                  : 'border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10'
              }`}
              placeholder="CODE D'ACCÈS"
              autoFocus
            />
            {error && (
              <p className="text-center text-rose-600 text-xs mt-2 font-medium animate-pulse">
                Code incorrect. Réessayez.
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 group"
          >
            Entrer
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </form>
        
        <div className="mt-8 text-center">
           <p className="text-[10px] text-slate-400">
             Ce dispositif ne stocke aucune donnée personnelle.
           </p>
        </div>
      </div>
    </div>
  );
};