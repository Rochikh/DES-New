import React from 'react';
import { PROTOCOL_PHASES } from '../types';

/**
 * Tracker de progression : une rangée de cinq yeux stylisés.
 * Argos Panoptès veille sur la session : œil clos pour les phases à venir,
 * œil qui s'ouvre (iris rouge) pour la phase active, œil ouvert au trait
 * pour les phases franchies. Micro-animation d'ouverture au changement de
 * phase, neutralisée sous prefers-reduced-motion (voir index.css).
 */

type EyeState = 'upcoming' | 'active' | 'done';

const STROKE = {
  upcoming: '#c6cddc', // --line2
  active: '#1d3db0',   // --accent
  done: '#63687a',     // --muted2
};

export const ArgosEye: React.FC<{
  state: EyeState;
  size?: number;
  className?: string;
}> = ({ state, size = 34, className }) => {
  const stroke = STROKE[state];
  return (
    <svg
      width={size}
      height={(size * 20) / 34}
      viewBox="0 0 34 20"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      {state === 'upcoming' ? (
        // Paupière close : simple arc convexe
        <path d="M4 9 Q17 16 30 9" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
      ) : (
        <g className={state === 'active' ? 'eye-opening' : undefined}>
          {/* Amande de l'œil */}
          <path
            d="M3 10 Q17 -2 31 10 Q17 22 3 10 Z"
            stroke={stroke}
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          {/* Iris rouge : geste de correcteur sur la phase active */}
          {state === 'active' && <circle cx="17" cy="10" r="4.5" stroke="#cf2e2e" strokeWidth="1.5" />}
          {/* Pupille */}
          <circle cx="17" cy="10" r="2" fill="#14151b" />
          {/* Cils courts de l'œil actif */}
          {state === 'active' && (
            <>
              <path d="M10 3.2 L8.8 1.4" stroke={stroke} strokeWidth="1.2" strokeLinecap="round" />
              <path d="M17 1.8 L17 -0.4" stroke={stroke} strokeWidth="1.2" strokeLinecap="round" />
              <path d="M24 3.2 L25.2 1.4" stroke={stroke} strokeWidth="1.2" strokeLinecap="round" />
            </>
          )}
        </g>
      )}
    </svg>
  );
};

export const PhaseTracker: React.FC<{ currentPhase: number }> = ({ currentPhase }) => {
  return (
    <div
      className="bg-white border-b border-line px-4 sm:px-6 py-2.5 no-print"
      role="group"
      aria-label={`Progression : phase ${currentPhase}, ${PROTOCOL_PHASES[currentPhase]?.label}`}
    >
      <div className="max-w-4xl mx-auto flex items-start justify-between sm:justify-center sm:gap-10">
        {PROTOCOL_PHASES.map((p) => {
          const state: EyeState =
            currentPhase === p.id ? 'active' : currentPhase > p.id ? 'done' : 'upcoming';
          return (
            <div key={p.id} className="flex flex-col items-center gap-0.5" title={`${p.label} : ${p.desc}`}>
              <ArgosEye state={state} />
              <span
                className={`label-mono leading-tight ${
                  state === 'active'
                    ? 'text-accent font-semibold'
                    : state === 'done'
                      ? 'text-muted2 hidden sm:block'
                      : 'text-line2 hidden sm:block'
                }`}
              >
                {p.id}. {p.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
