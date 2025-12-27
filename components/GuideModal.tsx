
import React from 'react';
import { BrainCircuit, X, Save, Download, Printer, RotateCcw, Target, ShieldCheck, Box, Info, Map } from 'lucide-react';

interface GuideModalProps {
  onClose: () => void;
}

export const GuideModal: React.FC<GuideModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-[2rem] shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-300 border border-slate-100" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-slate-100 p-6 flex justify-between items-center z-20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-xl text-white">
              <BrainCircuit size={20} />
            </div>
            <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Argos : Manuel de Session</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X size={24} className="text-slate-400" />
          </button>
        </div>
        
        <div className="p-8 space-y-8 text-slate-700">
          
          <section className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100 shadow-sm">
            <h3 className="font-black text-indigo-900 mb-3 flex items-center gap-3 text-xs uppercase tracking-[0.15em]">
              <Map size={16} /> Le Protocole Phased V3
            </h3>
            <p className="text-[13px] text-indigo-800 leading-relaxed font-medium mb-4">
              Argos ne pose pas de questions au hasard. Il suit un parcours structuré pour tester la solidité de ta pensée :
            </p>
            <div className="space-y-2">
              {[
                { n: "0", t: "Ciblage", d: "On définit l'objet et l'intention de la recherche." },
                { n: "1", t: "Clarification", d: "On s'assure que chaque mot a le même sens pour nous deux." },
                { n: "2", t: "Mécanisme", d: "On explore le 'Comment' : les liens de cause à effet." },
                { n: "3", t: "Vérification", d: "On cherche les preuves et les moyens de tester l'idée." },
                { n: "4", t: "Stress-test", d: "On cherche l'exception qui infirme la règle (Falsifiabilité)." }
              ].map(phase => (
                <div key={phase.n} className="flex gap-3 items-start p-2 bg-white/50 rounded-xl border border-indigo-100/50">
                  <span className="w-5 h-5 flex items-center justify-center bg-indigo-600 text-white rounded-full text-[10px] font-black shrink-0">{phase.n}</span>
                  <div>
                    <h4 className="text-[11px] font-black uppercase text-indigo-900">{phase.t}</h4>
                    <p className="text-[10px] text-indigo-700 leading-tight">{phase.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-slate-50 p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="font-black text-slate-900 mb-3 flex items-center gap-3 text-xs uppercase tracking-[0.15em]">
              <Save size={16} /> Sauvegarde & Reprise
            </h3>
            <p className="text-[12px] leading-relaxed">
              Clique sur l'icône <Save size={14} className="inline mx-1"/> en haut du chat pour télécharger un fichier <strong>.JSON</strong>. Tu pourras le recharger plus tard sur l'écran d'accueil pour reprendre là où tu en étais.
            </p>
          </section>

          <section className="space-y-4">
            <h3 className="font-black text-slate-900 mb-3 flex items-center gap-3 text-xs uppercase tracking-[0.15em]">
              <Printer size={16} /> Rapport Final & PDF
            </h3>
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200">
              <h4 className="font-bold text-slate-900 text-[11px] uppercase mb-2 flex items-center gap-2"><Printer size={12}/> Impression PDF</h4>
              <p className="text-[11px] leading-relaxed text-slate-500">
                Génère un rapport formaté A4 incluant l'analyse détaillée et le transcript complet (promptographie) de votre échange.
              </p>
            </div>
          </section>

          <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              <ShieldCheck size={14} /> Souveraineté des Données
            </div>
            <p className="text-[10px] text-slate-400">Aucun historique n'est conservé après fermeture de l'onglet.</p>
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50">
          <button 
            onClick={onClose}
            className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl active:scale-95"
          >
            Compris, je continue
          </button>
        </div>
      </div>
    </div>
  );
};
