
import React from 'react';
import { BrainCircuit, X, Target, ShieldCheck, Zap, Lock, BookOpen, Fingerprint, Info } from 'lucide-react';

interface GuideModalProps {
  onClose: () => void;
}

export const GuideModal: React.FC<GuideModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-300 border border-slate-100" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-slate-100 p-6 flex justify-between items-center z-20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-xl text-white">
              <BrainCircuit size={20} />
            </div>
            <h2 className="text-lg font-black text-slate-900">Le projet Argos socratique</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X size={24} className="text-slate-400" />
          </button>
        </div>
        
        <div className="p-8 space-y-12 text-slate-700">
          
          <section className="space-y-4">
            <h3 className="font-black text-indigo-600 flex items-center gap-2 text-xs uppercase tracking-widest">
              <Zap size={18} /> Une innovation pédagogique
            </h3>
            <p className="text-sm leading-relaxed font-medium text-slate-600">
              Argos (ou DES : Dialogue Évaluatif Socratique) n'est pas un simple agent conversationnel. C'est un <strong>dispositif de traçabilité cognitive</strong> conçu comme un obstacle pédagogique fertile. Contrairement aux IA classiques qui "font à la place de l'apprenant·e", Argos refuse de donner les réponses pour forcer la construction du raisonnement.
            </p>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100">
              <div className="flex items-center gap-2 mb-3 text-indigo-900 font-black text-[10px] uppercase tracking-wider">
                <Target size={16} className="text-indigo-600" /> Faire réfléchir
              </div>
              <p className="text-[12px] text-indigo-800 leading-relaxed">
                Le système utilise la maïeutique pour aider l'apprenant·e à fortifier ses arguments. En mode "Critique", il devient un avocat du diable pour tester la résistance aux biais logiques.
              </p>
            </div>
            <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100">
              <div className="flex items-center gap-2 mb-3 text-emerald-900 font-black text-[10px] uppercase tracking-wider">
                <ShieldCheck size={16} className="text-emerald-600" /> Intégrité authentique
              </div>
              <p className="text-[12px] text-emerald-800 leading-relaxed">
                Au lieu de punir, Argos analyse le "flux de pensée" (rythme de saisie) pour valoriser le travail organique et détecter l'externalisation de la pensée vers des outils tiers.
              </p>
            </div>
          </section>

          <section className="space-y-6">
            <h3 className="font-black text-slate-900 flex items-center gap-2 text-xs uppercase tracking-widest">
              <BookOpen size={18} /> Le protocole en 5 étapes
            </h3>
            <div className="grid grid-cols-1 gap-3">
              {[
                { n: "0", t: "Ciblage", d: "Définition précise de l'objet de recherche." },
                { n: "1", t: "Clarification", d: "Levée des ambiguïtés conceptuelles." },
                { n: "2", t: "Mécanisme", d: "Analyse des relations de cause à effet." },
                { n: "3", t: "Vérification", d: "Recherche de preuves et de protocoles de test." },
                { n: "4", t: "Stress-test", d: "Confrontation de l'idée à ses propres limites." }
              ].map(phase => (
                <div key={phase.n} className="flex gap-4 items-center p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="w-8 h-8 flex items-center justify-center bg-slate-900 text-white rounded-full text-[10px] font-black shrink-0">{phase.n}</span>
                  <div>
                    <h4 className="text-[11px] font-black text-slate-900">{phase.t}</h4>
                    <p className="text-[10px] text-slate-500">{phase.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-slate-900 text-white p-8 rounded-3xl space-y-4 shadow-xl">
            <div className="flex items-center gap-3">
              <Lock className="text-indigo-400" size={24} />
              <h4 className="font-black text-xs uppercase tracking-widest">Protection des données et éthique</h4>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              La confidentialité est inscrite dans le code (Privacy by Design). Aucune donnée n'est stockée sur nos serveurs. Tout le dialogue et l'analyse s'effectuent localement dans votre navigateur. Vous restez le·la seul·e propriétaire de votre trace d'apprentissage, exportable en format JSON.
            </p>
            <div className="flex items-center gap-2 pt-2 text-[9px] font-bold text-indigo-300 uppercase">
              <Fingerprint size={14} /> Souveraineté numérique garantie
            </div>
          </section>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-400">
             <Info size={14} />
             <p className="text-[9px] font-bold uppercase tracking-widest">Licence CC BY SA • Rochane Kherbouche</p>
          </div>
          <button 
            onClick={onClose}
            className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-900 transition-all shadow-xl"
          >
            Compris, je commence
          </button>
        </div>
      </div>
    </div>
  );
};
