
import React from 'react';
import { BrainCircuit, X, Save, Download, Printer, RotateCcw, Target, ShieldCheck, Box, Info } from 'lucide-react';

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
              <Save size={16} /> Sauvegarde & Reprise
            </h3>
            <p className="text-[13px] text-indigo-800 leading-relaxed font-medium">
              Argos est un système "local" : il ne stocke aucune donnée sur un serveur. Pour ne pas perdre votre travail :
            </p>
            <ul className="mt-3 space-y-3 text-[12px] text-indigo-900/80">
              <li className="flex gap-2">
                <span className="font-black">1. Sauvegarder :</span> Cliquez sur l'icône <Save size={14} className="inline mx-1"/> en haut du chat pour télécharger un fichier <strong>.JSON</strong>.
              </li>
              <li className="flex gap-2">
                <span className="font-black">2. Reprendre :</span> Sur l'écran d'accueil, utilisez le bouton <strong>"Reprendre un travail"</strong> et sélectionnez votre fichier JSON pour retrouver votre dialogue exactement là où vous l'avez laissé.
              </li>
            </ul>
          </section>

          <section className="space-y-4">
            <h3 className="font-black text-slate-900 mb-3 flex items-center gap-3 text-xs uppercase tracking-[0.15em]">
              <Printer size={16} /> Rapport Final & PDF
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200">
                <h4 className="font-bold text-slate-900 text-[11px] uppercase mb-2 flex items-center gap-2"><Printer size={12}/> Impression PDF</h4>
                <p className="text-[11px] leading-relaxed text-slate-500">
                  Le bouton <strong>"Imprimer / PDF"</strong> génère un rapport formaté A4. Il masque l'interface de l'application pour ne garder que l'audit analytique, idéal pour un rendu académique.
                </p>
              </div>
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200">
                <h4 className="font-bold text-slate-900 text-[11px] uppercase mb-2 flex items-center gap-2"><Download size={12}/> Export JSON Final</h4>
                <p className="text-[11px] leading-relaxed text-slate-500">
                  L'audit final peut aussi être exporté en JSON. Ce fichier contient le transcript complet ET l'analyse détaillée générée par l'IA.
                </p>
              </div>
            </div>
          </section>

          <section className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl">
            <h3 className="font-black text-indigo-400 mb-4 flex items-center gap-3 text-xs uppercase tracking-[0.15em]">
              <Info size={16} /> Intelligence Artificielle
            </h3>
            <p className="text-[12px] leading-relaxed opacity-80">
              Vous utilisez actuellement <strong>Gemini 3 Flash</strong> pour le dialogue interactif (pour sa rapidité) et <strong>Gemini 3 Pro</strong> pour l'audit final (pour sa profondeur d'analyse). 
            </p>
            <div className="mt-4 p-3 bg-white/5 rounded-xl border border-white/10 text-[10px] italic">
              Le système est configuré pour minimiser les coûts tout en maximisant la qualité réflexive.
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
