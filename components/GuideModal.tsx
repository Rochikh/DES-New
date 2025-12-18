import React from 'react';
import { BrainCircuit, X, MessageCircleQuestion, ShieldAlert, Lock, Database, Save, Download, Upload, Server, Target, Gauge, Fingerprint } from 'lucide-react';

interface GuideModalProps {
  onClose: () => void;
}

export const GuideModal: React.FC<GuideModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-slate-100 p-4 flex justify-between items-center z-10">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <BrainCircuit className="text-indigo-600" />
            Guide d'emploi ARGOS V8
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-full transition-colors">
            <X size={24} className="text-slate-500" />
          </button>
        </div>
        
        <div className="p-6 space-y-6 text-slate-700">
          
          <section className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
            <h3 className="font-bold text-indigo-900 mb-2 flex items-center gap-2 text-sm uppercase tracking-wide">
              <Target size={16} /> Le Discernement Disciplinaire
            </h3>
            <p className="text-xs text-indigo-800 leading-relaxed">
              Argos ne juge pas tes opinions, mais ta capacité à utiliser des <strong>critères d'expert</strong>. 
              Si tu réponds avec du "sens commun" (idées reçues, généralités), ton score de discernement restera bas. 
              Tu dois mobiliser les outils de ta discipline : preuves scientifiques, hiérarchie des normes juridiques, ou logique argumentative rigoureuse.
            </p>
          </section>

          <section className="grid md:grid-cols-2 gap-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2 text-xs uppercase">
                <Gauge size={14} /> Temps de Réflexion
              </h4>
              <p className="text-[11px] text-slate-600">
                Argos mesure le temps que tu passes à élaborer ta réponse. Une réponse complexe envoyée en moins de 5 secondes sera signalée comme une "anomalie de réflexion" (potentiel copier-coller).
              </p>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2 text-xs uppercase">
                <Fingerprint size={14} /> Audit de Cohérence
              </h4>
              <p className="text-[11px] text-slate-600">
                À la fin, Argos compare ton style d'écriture et tes patterns de réponse avec ta <strong>Déclaration d'usage de l'IA</strong>. Sois sincère : l'honnêteté intellectuelle fait partie du score.
              </p>
            </div>
          </section>

          <section>
            <h3 className="font-bold text-lg text-slate-900 mb-2">Comprendre la "Trace"</h3>
            <p className="text-sm leading-relaxed mb-3">
              À partir de la phase 2 du dialogue, Argos affiche deux lignes techniques en bas de ses messages :
            </p>
            <div className="space-y-2">
              <div className="bg-white border-l-4 border-indigo-500 p-3 text-xs shadow-sm">
                <strong>Exigence :</strong> Ce que tu dois démontrer dans ton prochain message (ex: citer une source, identifier une cause).
              </div>
              <div className="bg-white border-l-4 border-rose-500 p-3 text-xs shadow-sm">
                <strong>Contrôle :</strong> La condition qui, si elle n'est pas remplie, invalidera ton raisonnement aux yeux d'Argos.
              </div>
            </div>
          </section>

          <div className="grid md:grid-cols-2 gap-4 pt-4">
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
              <h4 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                <MessageCircleQuestion size={18} />
                Tuteur (Défense)
              </h4>
              <p className="text-[11px] text-blue-800">
                Tu soutiens une thèse. Argos joue l'avocat du diable pour tester la <strong>solidité</strong> de tes preuves et ta capacité à répondre aux objections sans te contredire.
              </p>
            </div>

            <div className="bg-rose-50 p-4 rounded-xl border border-rose-100">
              <h4 className="font-bold text-rose-900 mb-2 flex items-center gap-2">
                <ShieldAlert size={18} />
                Critique (Audit)
              </h4>
              <p className="text-[11px] text-rose-800">
                Argos te donne un texte "plausible" mais qui contient <strong>3 défauts majeurs</strong>. Ton rôle est de les trouver et de proposer un protocole pour les corriger.
              </p>
            </div>
          </div>
          
          <section className="bg-amber-50 p-4 rounded-xl border border-amber-200">
             <h3 className="font-bold text-amber-900 mb-2 flex items-center gap-2 text-xs uppercase tracking-wide">
              <Lock size={16} /> Confidentialité & RGPD
            </h3>
            <div className="text-[10px] text-amber-900/80 space-y-2">
              <p><strong>Zéro Base de Données :</strong> Rien n'est stocké ici. Fermer l'onglet efface tout.</p>
              <p><strong>Google Gemini :</strong> Votre texte est envoyé à Google pour analyse. Évitez toute donnée nominative (Nom de famille, adresse, secrets).</p>
            </div>
          </section>
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl">
          <button 
            onClick={onClose}
            className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-lg"
          >
            J'ai compris, démarrer
          </button>
        </div>
      </div>
    </div>
  );
};