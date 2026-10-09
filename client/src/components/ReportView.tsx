import React, { useEffect, useState } from 'react';
import { AnalysisData, SessionConfig } from '../types';
import { generateAnalysis } from '../services/api';
import { Message } from '../types';
import { Target, RotateCcw, Download, Radar as RadarIcon, CheckCircle2, Lightbulb, FileText, ShieldCheck, FileSignature, AlertTriangle, Info, Timer } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { ArgosEye } from './PhaseTracker';

export const ReportView: React.FC<{
  config: SessionConfig;
  transcript: Message[];
  aiDeclaration: string;
  onRestart: () => void;
}> = ({ config, transcript, aiDeclaration, onRestart }) => {
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const runAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await generateAnalysis(config.mode, transcript, config.topic, aiDeclaration);
      setAnalysis(result);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { runAnalysis(); }, []);
  const WAIT_STEPS = [
    "Lecture de tes réponses",
    "Repérage des moments clés du dialogue",
    "Évaluation des six dimensions de la pensée",
    "Rédaction du bilan personnalisé",
    "Mise en forme de la trace d'apprentissage",
  ];
  const [waitStep, setWaitStep] = useState(0);
  const [waitSeconds, setWaitSeconds] = useState(0);
  useEffect(() => {
    if (!loading) return;
    const t = setInterval(() => setWaitSeconds(s => s + 1), 1000);
    const stepper = setInterval(() => {
      setWaitStep(s => (s + 1) % WAIT_STEPS.length);
    }, 9000);
    return () => { clearInterval(t); clearInterval(stepper); };
  }, [loading]);

  const getChartData = () => {
    if (!analysis) return [];
    return [
      { subject: 'Raisonnement', A: analysis.reasoningScore, fullMark: 100 },
      { subject: 'Clarté', A: analysis.clarityScore, fullMark: 100 },
      { subject: 'Intégrité', A: analysis.integrityScore, fullMark: 100 },
      { subject: 'Doute constructif', A: analysis.skepticismScore, fullMark: 100 },
      { subject: 'Méthode', A: analysis.processScore, fullMark: 100 },
      { subject: 'Prise de recul', A: analysis.reflectionScore, fullMark: 100 },
    ];
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-screen bg-paper">
      <div className="mb-6"><ArgosEye state="active" size={72} /></div>
      <h2 className="font-display text-[clamp(1.7rem,2.8vw,2.3rem)] font-extrabold tracking-[-0.02em] leading-[1.1] text-text text-center">Analyse de la réflexion par Argos</h2>
      <p className="label-mono text-accent mt-3">{WAIT_STEPS[waitStep]}</p>
      <p className="text-muted2 text-xs mt-4">Argos relit toute ta session, l'analyse prend environ une minute ({waitSeconds}s)</p>
    </div>
  );

  if (error || !analysis) return (
    <div className="flex flex-col items-center justify-center h-screen p-8 text-center space-y-6 bg-paper">
      <h2 className="font-display text-[clamp(1.7rem,2.8vw,2.3rem)] font-extrabold tracking-[-0.02em] text-text">Erreur de bilan</h2>
      <button onClick={runAnalysis} className="btn-fill px-8"><RotateCcw size={18} /> Réessayer</button>
    </div>
  );

  const userMessages = transcript.filter(m => m.role === 'user' && m.responseTimeSeconds !== undefined && m.responseTimeSeconds > 0);
  const avgResponseTime = userMessages.length > 0
    ? Math.round(userMessages.reduce((acc, curr) => acc + (curr.responseTimeSeconds || 0), 0) / userMessages.length)
    : 0;

  const rationales = analysis.scoreRationales;

  return (
    <div className="min-h-screen bg-paper p-4 sm:p-12 print:p-0">
      <div className="max-w-5xl mx-auto space-y-10 print:space-y-8">

        {/* Header */}
        <header className="bg-white border border-line text-text p-10 rounded-lg flex flex-col md:flex-row justify-between items-start gap-8 print:p-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <ArgosEye state="done" size={30} />
              <p className="label-mono text-accent">Trace d'apprentissage DES</p>
            </div>
            <h1 className="font-display text-[clamp(2.6rem,4.5vw,4rem)] font-extrabold tracking-[-0.025em] leading-[1.07] print:text-3xl">{config.studentName}</h1>
            <p className="text-muted text-lg">{config.topic}</p>
          </div>
          <div className="flex flex-col sm:flex-row md:flex-col gap-3 no-print">
            <button
              onClick={() => window.print()}
              className="btn-fill"
            >
              <Download size={16} /> Enregistrer en PDF
            </button>
            <button
              onClick={onRestart}
              className="btn-outline"
            >
              <RotateCcw size={16} /> Nouvelle session
            </button>
          </div>
        </header>

        {/* Section Déclaration IA */}
        <section className="bg-white border border-line rounded-lg p-8 md:p-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 text-off print:hidden" aria-hidden="true">
            <ShieldCheck size={120} />
          </div>
          <div className="relative z-10 space-y-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <h3 className="font-display text-[1.18rem] font-extrabold tracking-[-0.015em] text-text flex items-center gap-3">
                <Target className="text-accent" size={20} /> Authenticité du processus
              </h3>
              <div className={`px-3 py-1.5 rounded-sm label-mono flex items-center gap-2 border ${analysis.integrityScore >= 70 ? 'border-accent bg-accent-light text-accent' : 'border-line bg-paper text-rouge'}`}>
                Indice de cohérence : {analysis.integrityScore}/100
                {analysis.integrityScore < 70 && <AlertTriangle size={14} />}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-off p-6 rounded-lg border border-line">
                <p className="label-mono text-accent mb-3">Usage déclaré des outils d'assistance :</p>
                <p className="text-sm text-text italic leading-relaxed">
                  "{aiDeclaration || "Aucun usage déclaré."}"
                </p>
              </div>
              <div className="bg-off p-6 rounded-lg border border-line flex flex-col justify-center">
                <p className="label-mono text-accent mb-3">Dynamique de réflexion :</p>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[12px] text-muted">Temps moyen de saisie</span>
                    <span className="font-mono text-sm font-semibold text-accent">{avgResponseTime} seconde{avgResponseTime > 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[12px] text-muted">Ruptures de rythme</span>
                    <span className={`font-mono text-sm font-semibold ${analysis.rhythmBreakCount > 0 ? 'text-rouge' : 'text-accent'}`}>
                      {analysis.rhythmBreakCount} épisode(s) identifié(s)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-off rounded-lg border border-line">
              <Info className="text-accent shrink-0" size={18} />
              <p className="text-[12px] text-muted leading-relaxed">
                Cet indice reflète la fluidité cognitive de l'apprenant·e. Une rupture de rythme suggère qu'une réponse a été produite à une vitesse incompatible avec une saisie naturelle. La pensée critique nécessite un temps de maturation organique.
              </p>
            </div>
          </div>
        </section>

        {/* Section Graphique et Résumé */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 print:block print:space-y-8">
          <div className="lg:col-span-7 space-y-6">
            <div className="p-8 bg-white rounded-lg border border-line print:p-6">
              <h3 className="label-mono text-accent mb-4 flex items-center gap-2">
                <FileText size={14} /> Bilan de la réflexion par Argos
              </h3>
              <p className="text-[15px] text-text leading-[1.75] whitespace-pre-line">
                {analysis.summary}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white p-6 rounded-lg border border-line border-l-[3px] border-l-accent">
                <h4 className="label-mono text-accent mb-3 flex items-center gap-2">
                  <CheckCircle2 size={14} /> Points forts
                </h4>
                <ul className="space-y-2">
                  {analysis.keyStrengths.map((s, i) => (
                    <li key={i} className="text-[13px] text-text">• {s}</li>
                  ))}
                </ul>
              </div>
              <div className="bg-white p-6 rounded-lg border border-line border-l-[3px] border-l-rouge">
                <h4 className="label-mono text-accent mb-3 flex items-center gap-2">
                  <Lightbulb size={14} /> Pistes de progression
                </h4>
                <ul className="space-y-2">
                  {analysis.weaknesses.map((w, i) => (
                    <li key={i} className="text-[13px] text-text">• {w}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 bg-white border border-line rounded-lg p-6 flex flex-col items-center justify-start print:mt-8">
             <div className="flex items-center gap-2 mb-4">
                <RadarIcon className="text-accent" size={16} />
                <h3 className="label-mono text-accent">Dimensions de la pensée</h3>
             </div>
             <div className="w-full h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={getChartData()}>
                    <PolarGrid stroke="#dfe3ec" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fontWeight: 500, fill: '#5d6270', fontFamily: 'Spline Sans Mono, monospace' }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 8, fill: '#63687a', fontFamily: 'Spline Sans Mono, monospace' }} />
                    <Radar
                      name="Apprenant·e"
                      dataKey="A"
                      stroke="#1d3db0"
                      strokeWidth={1.5}
                      fill="#1d3db0"
                      fillOpacity={0.18}
                    />
                  </RadarChart>
                </ResponsiveContainer>
             </div>
             {rationales && (
               <div className="w-full mt-4 pt-4 border-t border-line space-y-2 print:break-inside-avoid">
                 {([
                   ['Raisonnement', rationales.reasoning],
                   ['Clarté', rationales.clarity],
                   ['Doute constructif', rationales.skepticism],
                   ['Méthode', rationales.process],
                   ['Prise de recul', rationales.reflection],
                   ['Intégrité', rationales.integrity],
                 ] as const).map(([label, rationale]) => (
                   <p key={label} className="text-[12px] leading-relaxed text-muted">
                     <span className="font-semibold text-text">{label}.</span> {rationale}
                   </p>
                 ))}
               </div>
             )}
          </div>
        </section>

        {/* Transcript */}
        <section className="pt-10 border-t border-line print:pt-8 bg-transparent !border-x-0 !border-b-0">
          <div className="flex items-center gap-3 mb-8 print:mb-4">
            <FileSignature className="text-accent" size={22} />
            <h3 className="font-display text-[clamp(1.7rem,2.8vw,2.3rem)] font-extrabold tracking-[-0.02em] leading-[1.1] text-text">Parcours de réflexion</h3>
          </div>
          <div className="space-y-4 print:space-y-6">
            {transcript.filter(m => !m.text.includes("Bonjour Argos")).map((m, i) => (
              <div key={i} className={`p-4 rounded-md text-sm print:text-[10pt] print:break-inside-avoid relative bg-white border border-line ${m.role === 'user' ? 'border-l-[3px] border-l-line2' : 'border-l-[3px] border-l-accent'}`}>
                {m.role === 'user' && m.responseTimeSeconds !== undefined && m.responseTimeSeconds > 0 && (
                  <div className="absolute top-2 right-4 flex items-center gap-1 font-mono text-[0.68rem] text-muted2">
                    <Timer size={8} /> Saisie : {m.responseTimeSeconds}s
                  </div>
                )}
                <span className="label-mono print:text-[8pt] block mb-1 text-accent">{m.role === 'user' ? 'Étudiant·e' : 'Argos'}</span>
                <div className="prose prose-sm max-w-none text-text">
                   {m.text}
                </div>
              </div>
            ))}
          </div>
        </section>

        <footer className="pt-16 border-t border-line text-center print:pt-10 !border-x-0 !border-b-0">
           <p className="label-mono text-muted2 print:text-text">Document certifié par le système Argos socratique • Traçabilité cognitive V3</p>
        </footer>
      </div>
    </div>
  );
};
