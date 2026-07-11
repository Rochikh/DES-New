import React from 'react';
import { PROTOCOL_PHASES } from '../types';

/**
 * Tracker de progression : une rangée de cinq yeux stylisés.
 * Argos Panoptès veille sur la session — œil clos pour les phases à venir,
 * œil qui s'ouvre (iris doré) pour la phase active, œil ouvert au trait
 * pour les phases franchies. Micro-animation d'ouverture au changement de
 * phase, neutralisée sous prefers-reduced-motion (voir index.css).
 */

type EyeState = 'upcoming' | 'active' | 'done';

const STROKE = {
  upcoming: '#DDD9CF', // brume
  active: '#12676B',   // paon
  done: '#55606A',     // ardoise
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
          {/* Iris doré : seul emploi systématique de l'accent */}
          {state === 'active' && <circle cx="17" cy="10" r="4.5" stroke="#C9A227" strokeWidth="1.5" />}
          {/* Pupille */}
          <circle cx="17" cy="10" r="2" fill="#1B2A32" />
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
      className="bg-white border-b border-brume px-4 sm:px-6 py-2.5 no-print"
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
                className={`text-[11px] leading-tight ${
                  state === 'active'
                    ? 'text-paon font-semibold'
                    : state === 'done'
                      ? 'text-ardoise hidden sm:block'
                      : 'text-brume hidden sm:block'
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
