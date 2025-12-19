
import React from 'react';
import { BrainCircuit, X, Save, Download, Printer, RotateCcw, Target, ShieldCheck, Box } from 'lucide-react';

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
            <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Argos : Manuel de Continuité</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X size={24} className="text-slate-400" />
          </button>
        </div>
        
        <div className="p-8 space-y-8 text-slate-700">
          
          <section className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100 shadow-sm">
            <h3 className="font-black text-indigo-900 mb-3 flex items-center gap-3 text-xs uppercase tracking-[0.15em]">
              <Save size={16} /> Sauvegarde & Reprise
            </h3>
            <p className="text-[13px] text-indigo-800 leading-relaxed font-medium">
              Argos ne stocke rien sur les serveurs pour garantir votre confidentialité. Pour ne pas perdre votre travail :
            </p>
            <ul className="mt-3 space-y-2 text-[12px] text-indigo-900/80">
              <li className="flex gap-2"><strong>1.</strong> Cliquez sur l'icône <Save size={14} className="inline"/> dans l'en-tête pour télécharger votre progression en <strong>.JSON</strong>.</li>
              <li className="flex gap-2"><strong>2.</strong> Au prochain démarrage, utilisez le bouton <strong>"Reprendre un travail"</strong> sur l'écran d'accueil pour réimporter ce fichier.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h3 className="font-black text-slate-900 mb-3 flex items-center gap-3 text-xs uppercase tracking-[0.15em]">
              <Printer size={16} /> Archivage & PDF
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200">
                <h4 className="font-bold text-slate-900 text-[11px] uppercase mb-2">Rapport PDF</h4>
                <p className="text-[11px] leading-relaxed text-slate-500">
                  En fin de session, cliquez sur <strong>"Imprimer / PDF"</strong>. Une mise en page spécifique s'active pour transformer votre audit en document académique propre.
                </p>
              </div>
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200">
                <h4 className="font-bold text-slate-900 text-[11px] uppercase mb-2">Audit numérique</h4>
                <p className="text-[11px] leading-relaxed text-slate-500">
                  Le bouton <strong>"Exporter .JSON"</strong> du rapport final contient l'intégralité du dialogue ET de l'analyse cognitive pour vos archives personnelles.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h3 className="font-black text-slate-900 mb-4 flex items-center gap-3 text-xs uppercase tracking-[0.15em]">
              <Target size={16} /> Objectif de la Trace
            </h3>
            <div className="space-y-3">
              <div className="bg-white border-l-4 border-indigo-600 p-4 text-[12px] shadow-sm rounded-r-xl border-y border-r border-slate-100">
                <span className="font-black text-indigo-600 uppercase block mb-1">Qualité, pas Quantité</span>
                Argos n'attribue pas de points. Il identifie des <strong>statuts de progression</strong> (évoqué, étayé, stress-testé) pour valider la solidité de votre argumentation.
              </div>
              <div className="bg-white border-l-4 border-emerald-500 p-4 text-[12px] shadow-sm rounded-r-xl border-y border-r border-slate-100">
                <span className="font-black text-emerald-600 uppercase block mb-1">Preuve par Citation</span>
                Chaque observation d'Argos dans le rapport final est liée à un extrait précis de vos écrits. Si Argos ne trouve pas de preuve, il ne validera pas le critère.
              </div>
            </div>
          </section>

          <div className="pt-6 border-t border-slate-100">
            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              <ShieldCheck size={14} /> Confidentialité Totale
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Vos données restent dans votre navigateur. Les fichiers JSON sont les seuls moyens de conserver votre travail hors-ligne.</p>
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50">
          <button 
            onClick={onClose}
            className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl active:scale-95"
          >
            Démarrer / Reprendre
          </button>
        </div>
      </div>
    </div>
  );
};
