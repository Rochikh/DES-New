
import React from 'react';
import { BrainCircuit, X, Save, Target, ShieldAlert, MessageCircleQuestion, HelpCircle, BookOpen, Fingerprint } from 'lucide-react';

interface GuideModalProps {
  onClose: () => void;
}

export const GuideModal: React.FC<GuideModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-300 border border-slate-100" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-slate-100 p-6 flex justify-between items-center z-20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-xl text-white">
              <BrainCircuit size={20} />
            </div>
            <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">À quoi sert Argos ?</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X size={24} className="text-slate-400" />
          </button>
        </div>
        
        <div className="p-8 space-y-10 text-slate-700">
          
          <section>
            <h3 className="font-black text-indigo-600 mb-4 flex items-center gap-2 text-xs uppercase tracking-widest">
              <Target size={18} /> La mission pédagogique
            </h3>
            <p className="text-sm leading-relaxed font-medium text-slate-600">
              Argos n'est pas un assistant qui écrit pour toi. C'est un <strong>dispositif d'évaluation de ta pensée</strong>. 
              L'objectif n'est pas d'obtenir une réponse, mais de montrer comment tu réfléchis, comment tu justifies tes choix et comment tu résistes aux erreurs de logique.
            </p>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100">
              <div className="flex items-center gap-2 mb-3 text-indigo-900 font-black text-[10px] uppercase tracking-wider">
                <MessageCircleQuestion size={16} className="text-indigo-600" /> Mode Tuteur
              </div>
              <p className="text-[12px] text-indigo-800 leading-relaxed">
                Il t'accompagne pas à pas. Il ne te juge pas mais te pousse à préciser tes définitions et à expliquer tes mécanismes de pensée. Idéal pour construire un raisonnement solide.
              </p>
            </div>
            <div className="bg-rose-50 p-6 rounded-3xl border border-rose-100">
              <div className="flex items-center gap-2 mb-3 text-rose-900 font-black text-[10px] uppercase tracking-wider">
                <ShieldAlert size={16} className="text-rose-600" /> Mode Critique
              </div>
              <p className="text-[12px] text-rose-800 leading-relaxed">
                Il joue l'avocat du diable. Il va te soumettre des textes contenant des pièges logiques et des biais. Ton rôle est de ne pas te laisser manipuler et de débusquer les erreurs.
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="font-black text-slate-900 mb-4 flex items-center gap-2 text-xs uppercase tracking-widest">
              <BookOpen size={18} /> Les 5 étapes du dialogue
            </h3>
            <div className="space-y-3">
              {[
                { n: "0", t: "Ciblage", d: "On définit précisément de quoi on va parler." },
                { n: "1", t: "Clarification", d: "On s'assure que les concepts sont clairs et sans ambiguïté." },
                { n: "2", t: "Mécanisme", d: "On analyse le 'comment' : les relations de cause à effet." },
                { n: "3", t: "Vérification", d: "On cherche les preuves et les moyens de tester la validité." },
                { n: "4", t: "Stress-test", d: "On confronte l'idée à ses limites pour voir si elle tient debout." }
              ].map(phase => (
                <div key={phase.n} className="flex gap-4 items-center p-3 hover:bg-slate-50 rounded-2xl transition-colors">
                  <span className="w-6 h-6 flex items-center justify-center bg-slate-900 text-white rounded-full text-[10px] font-black shrink-0">{phase.n}</span>
                  <div>
                    <h4 className="text-[11px] font-black uppercase text-slate-900 tracking-tight">{phase.t}</h4>
                    <p className="text-[10px] text-slate-500">{phase.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="bg-slate-900 text-white p-6 rounded-3xl flex items-start gap-4 shadow-xl">
            <Fingerprint className="text-indigo-400 shrink-0" size={32} />
            <div>
              <h4 className="font-black text-[10px] uppercase tracking-[0.2em] mb-1">Trace d'apprentissage</h4>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                À la fin, Argos génère un rapport complet qui analyse tes forces cognitives et ta capacité de doute constructif. Ce document servira de preuve de ton travail intellectuel.
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Save size={12}/> Sauvegarde possible en cours de route
          </p>
          <button 
            onClick={onClose}
            className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-900 transition-all shadow-xl"
          >
            Commencer l'expérience
          </button>
        </div>
      </div>
    </div>
  );
};
