import React from 'react';
import { X, Target, ShieldCheck, Zap, Lock, BookOpen, FileText, Fingerprint, Info } from 'lucide-react';
import { ArgosEye } from './PhaseTracker';

interface GuideModalProps {
  onClose: () => void;
}

export const GuideModal: React.FC<GuideModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-[100] bg-nuit/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-modal max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-brume" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-brume p-6 flex justify-between items-center z-20">
          <div className="flex items-center gap-3">
            <ArgosEye state="active" size={38} />
            <h2 className="font-serif text-lg font-semibold text-nuit">Le projet Argos socratique</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-craie rounded-full transition-colors" title="Fermer">
            <X size={24} className="text-ardoise" />
          </button>
        </div>

        <div className="p-8 space-y-10 text-nuit">

          <section className="space-y-4">
            <h3 className="font-semibold text-paon flex items-center gap-2 text-xs uppercase tracking-wide">
              <Zap size={18} /> Une innovation pédagogique
            </h3>
            <p className="text-sm leading-relaxed text-ardoise">
              Argos (ou DES : Dialogue Évaluatif Socratique) n'est pas un simple agent conversationnel. C'est un <strong className="text-nuit">dispositif de traçabilité cognitive</strong> conçu comme un obstacle pédagogique fertile. Contrairement aux IA classiques qui "font à la place de l'apprenant·e", Argos refuse de donner les réponses pour forcer la construction du raisonnement.
            </p>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-craie p-6 rounded-lg border border-brume">
              <div className="flex items-center gap-2 mb-3 text-paon-sombre font-semibold text-[11px] uppercase tracking-wide">
                <Target size={16} className="text-paon" /> Faire réfléchir
              </div>
              <p className="text-[13px] text-ardoise leading-relaxed">
                Le système utilise la maïeutique pour aider l'apprenant·e à fortifier ses arguments. En mode "Critique", il devient un avocat du diable pour tester la résistance aux biais logiques.
              </p>
            </div>
            <div className="bg-craie p-6 rounded-lg border border-brume">
              <div className="flex items-center gap-2 mb-3 text-paon-sombre font-semibold text-[11px] uppercase tracking-wide">
                <ShieldCheck size={16} className="text-paon" /> Intégrité authentique
              </div>
              <p className="text-[13px] text-ardoise leading-relaxed">
                Au lieu de punir, Argos analyse le "flux de pensée" (rythme de saisie) pour valoriser le travail organique et détecter l'externalisation de la pensée vers des outils tiers.
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="font-semibold text-paon flex items-center gap-2 text-xs uppercase tracking-wide">
              <FileText size={18} /> Apporte tes propres textes
            </h3>
            <p className="text-sm leading-relaxed text-ardoise">
              Sur l'écran d'accueil, tu peux coller des extraits ou des notes de lecture, ou charger un fichier texte (.txt, .md). Argos s'appuie alors uniquement sur ce corpus pour attribuer une idée à un ouvrage : ce qui vient de tes textes est cité entre guillemets, le reste est annoncé comme savoir général ou comme hypothèse à vérifier ensemble. Sans corpus, Argos raisonne avec toi sans rien citer.
            </p>
          </section>

          <section className="space-y-6">
            <h3 className="font-semibold text-nuit flex items-center gap-2 text-xs uppercase tracking-wide">
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
                <div key={phase.n} className="flex gap-4 items-center p-3 bg-craie rounded-md border border-brume">
                  <span className="w-8 h-8 flex items-center justify-center bg-nuit text-craie rounded-full text-[11px] font-semibold shrink-0">{phase.n}</span>
                  <div>
                    <h4 className="text-[12px] font-semibold text-nuit">{phase.t}</h4>
                    <p className="text-[11px] text-ardoise">{phase.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-nuit text-craie p-8 rounded-lg space-y-4">
            <div className="flex items-center gap-3">
              <Lock className="text-iris" size={24} />
              <h4 className="font-semibold text-xs uppercase tracking-wide">Protection des données et éthique</h4>
            </div>
            <p className="text-[12px] text-craie/80 leading-relaxed">
              La confidentialité est inscrite dans le code (Privacy by Design). Rien n'est stocké côté serveur : tes échanges transitent par le serveur d'Argos, qui interroge l'API du modèle (DeepSeek) uniquement le temps de générer chaque réponse, puis la conversation vit dans ton seul navigateur. Tu restes le·la seul·e propriétaire de ta trace d'apprentissage, exportable en format JSON. Conseil : utilise un pseudonyme et n'inscris aucune donnée personnelle ou sensible dans tes échanges.
            </p>
            <div className="flex items-center gap-2 pt-2 text-[10px] font-semibold text-craie/60 uppercase tracking-wide">
              <Fingerprint size={14} /> Sans compte, sans base de données
            </div>
          </section>

          <section className="bg-craie p-6 rounded-lg border border-brume flex items-start gap-4">
            <BookOpen size={20} className="text-paon shrink-0 mt-1" />
            <p className="text-[13px] text-ardoise leading-relaxed">
              Argos s'inscrit dans la réflexion du livre <a href="https://livre.rochane.fr" target="_blank" rel="noopener noreferrer" className="font-semibold text-paon hover:text-paon-sombre underline"><em>Évaluer en formation à l'ère de l'IA générative</em></a> de Rochane Kherbouche (Chronique Sociale, 2026, préface de Christelle Lison, Université de Sherbrooke).
            </p>
          </section>
        </div>

        <div className="p-6 border-t border-brume bg-craie flex items-center justify-between">
          <div className="flex items-center gap-2 text-ardoise">
             <Info size={14} />
             <p className="text-[10px] uppercase tracking-wide">Licence CC BY SA • Rochane Kherbouche</p>
          </div>
          <button
            onClick={onClose}
            className="px-8 py-3.5 bg-paon text-white rounded-md font-semibold text-[11px] uppercase tracking-wide hover:bg-paon-sombre transition-colors"
          >
            Compris, je commence
          </button>
        </div>
      </div>
    </div>
  );
};
