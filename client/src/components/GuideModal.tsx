import React from 'react';
import { X, Target, ShieldCheck, Zap, Lock, BookOpen, FileText, Fingerprint, Info } from 'lucide-react';
import { ArgosEye } from './PhaseTracker';

interface GuideModalProps {
  onClose: () => void;
}

export const GuideModal: React.FC<GuideModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-[100] bg-[rgba(20,21,27,0.45)] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-modal max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-line" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-line p-6 flex justify-between items-center z-20">
          <div className="flex items-center gap-3">
            <ArgosEye state="active" size={38} />
            <h2 className="font-display text-[1.18rem] font-extrabold tracking-[-0.015em] text-text">Le projet Argos socratique</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-off rounded-full transition-colors" title="Fermer">
            <X size={24} className="text-muted" />
          </button>
        </div>

        <div className="p-8 space-y-10 text-text">

          <section className="space-y-4">
            <h3 className="label-mono text-accent flex items-center gap-2">
              <Zap size={18} /> Une innovation pédagogique
            </h3>
            <p className="text-sm leading-relaxed text-muted">
              Argos (ou DES : Dialogue Évaluatif Socratique) n'est pas un simple agent conversationnel. C'est un <strong className="text-text">dispositif de traçabilité cognitive</strong> conçu comme un obstacle pédagogique fertile. Contrairement aux IA classiques qui "font à la place de l'apprenant·e", Argos refuse de donner les réponses pour forcer la construction du raisonnement.
            </p>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-off p-6 rounded-lg border border-line">
              <div className="flex items-center gap-2 mb-3 label-mono text-accent">
                <Target size={16} className="text-accent" /> Faire réfléchir
              </div>
              <p className="text-[13px] text-muted leading-relaxed">
                Le système utilise la maïeutique pour aider l'apprenant·e à fortifier ses arguments. En mode "Critique", il devient un avocat du diable pour tester la résistance aux biais logiques.
              </p>
            </div>
            <div className="bg-off p-6 rounded-lg border border-line">
              <div className="flex items-center gap-2 mb-3 label-mono text-accent">
                <ShieldCheck size={16} className="text-accent" /> Intégrité authentique
              </div>
              <p className="text-[13px] text-muted leading-relaxed">
                Au lieu de punir, Argos analyse le "flux de pensée" (rythme de saisie) pour valoriser le travail organique et détecter l'externalisation de la pensée vers des outils tiers.
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="label-mono text-accent flex items-center gap-2">
              <FileText size={18} /> Apporte tes propres textes
            </h3>
            <p className="text-sm leading-relaxed text-muted">
              Sur l'écran d'accueil, tu peux coller des extraits ou des notes de lecture, ou charger un fichier texte (.txt, .md). Argos s'appuie alors uniquement sur ce corpus pour attribuer une idée à un ouvrage : ce qui vient de tes textes est cité entre guillemets, le reste est annoncé comme savoir général ou comme hypothèse à vérifier ensemble. Sans corpus, Argos raisonne avec toi sans rien citer.
            </p>
          </section>

          <section className="space-y-6">
            <h3 className="label-mono text-accent flex items-center gap-2">
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
                <div key={phase.n} className="flex gap-4 items-center p-3 bg-white rounded-lg border border-line">
                  <span className="w-8 h-8 flex items-center justify-center bg-accent-light text-accent rounded-full font-mono text-[0.72rem] font-semibold shrink-0">{phase.n}</span>
                  <div>
                    <h4 className="text-[12px] font-semibold text-text">{phase.t}</h4>
                    <p className="text-[11px] text-muted">{phase.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-off border border-line text-text p-8 rounded-lg space-y-4">
            <div className="flex items-center gap-3">
              <Lock className="text-accent" size={24} />
              <h4 className="label-mono text-accent">Protection des données et éthique</h4>
            </div>
            <p className="text-[12px] text-muted leading-relaxed">
              La confidentialité est inscrite dans le code (Privacy by Design). Rien n'est stocké côté serveur : tes échanges transitent par le serveur d'Argos, qui interroge l'API du modèle (DeepSeek) uniquement le temps de générer chaque réponse, puis la conversation vit dans ton seul navigateur. Tu restes le·la seul·e propriétaire de ta trace d'apprentissage, exportable en format JSON. Conseil : utilise un pseudonyme et n'inscris aucune donnée personnelle ou sensible dans tes échanges.
            </p>
            <div className="flex items-center gap-2 pt-2 label-mono text-muted2">
              <Fingerprint size={14} /> Sans compte, sans base de données
            </div>
          </section>

          <section className="bg-white p-6 rounded-lg border border-line flex items-start gap-4">
            <BookOpen size={20} className="text-accent shrink-0 mt-1" />
            <p className="text-[13px] text-muted leading-relaxed">
              Argos s'inscrit dans la réflexion du livre <a href="https://livre.rochane.fr" target="_blank" rel="noopener noreferrer" className="font-semibold text-accent hover:text-accent-hover underline"><em>Évaluer en formation à l'ère de l'IA générative</em></a> de Rochane Kherbouche (Chronique Sociale, 2026, préface de Christelle Lison, Université de Sherbrooke).
            </p>
          </section>
        </div>

        <div className="p-6 border-t border-line bg-off flex items-center justify-between">
          <div className="flex items-center gap-2 text-muted2">
             <Info size={14} />
             <p className="label-mono">Licence CC BY SA • Rochane Kherbouche</p>
          </div>
          <button
            onClick={onClose}
            className="btn-fill"
          >
            Compris, je commence
          </button>
        </div>
      </div>
    </div>
  );
};
