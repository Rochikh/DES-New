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
      const result = await generateAnalysis(transcript, config.topic, aiDeclaration);
      setAnalysis(result);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { runAnalysis(); }, []);

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
    <div className="flex flex-col items-center justify-center h-screen bg-craie">
      <div className="mb-6"><ArgosEye state="active" size={72} /></div>
      <h2 className="font-serif text-xl font-semibold text-nuit">Analyse de la réflexion par Argos</h2>
      <p className="text-ardoise text-sm mt-2">Calcul de la trace d'apprentissage</p>
    </div>
  );

  if (error || !analysis) return (
    <div className="flex flex-col items-center justify-center h-screen p-8 text-center space-y-6 bg-craie">
      <h2 className="font-serif text-2xl font-semibold text-nuit">Erreur de bilan</h2>
      <button onClick={runAnalysis} className="flex items-center gap-2 px-8 py-3 bg-paon text-white rounded-md font-semibold text-sm hover:bg-paon-sombre transition-colors"><RotateCcw size={18} /> Réessayer</button>
    </div>
  );

  const userMessages = transcript.filter(m => m.role === 'user' && m.responseTimeSeconds !== undefined && m.responseTimeSeconds > 0);
  const avgResponseTime = userMessages.length > 0
    ? Math.round(userMessages.reduce((acc, curr) => acc + (curr.responseTimeSeconds || 0), 0) / userMessages.length)
    : 0;

  const rationales = analysis.scoreRationales;

  return (
    <div className="min-h-screen bg-craie p-4 sm:p-12 print:p-0">
      <div className="max-w-5xl mx-auto space-y-10 print:space-y-8">

        {/* Header */}
        <header className="bg-nuit text-craie p-10 rounded-lg flex flex-col md:flex-row justify-between items-start gap-8 print:p-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <ArgosEye state="done" size={30} className="opacity-80" />
              <p className="text-[11px] uppercase tracking-wide text-craie/70">Trace d'apprentissage DES</p>
            </div>
            <h1 className="font-serif text-5xl font-semibold leading-none print:text-3xl">{config.studentName}</h1>
            <p className="text-craie/80 text-lg">{config.topic}</p>
          </div>
          <div className="flex flex-col sm:flex-row md:flex-col gap-3 no-print">
            <button
              onClick={() => window.print()}
              className="flex items-center justify-center gap-3 bg-craie text-nuit px-6 py-3 rounded-md font-semibold text-[11px] uppercase tracking-wide hover:bg-white transition-colors"
            >
              <Download size={16} /> Enregistrer en PDF
            </button>
            <button
              onClick={onRestart}
              className="flex items-center justify-center gap-3 bg-transparent border border-craie/40 text-craie/80 px-6 py-3 rounded-md font-semibold text-[11px] uppercase tracking-wide hover:text-craie hover:border-craie transition-colors"
            >
              <RotateCcw size={16} /> Nouvelle session
            </button>
          </div>
        </header>

        {/* Section Déclaration IA */}
        <section className="bg-white border border-brume rounded-lg p-8 md:p-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 text-craie print:hidden" aria-hidden="true">
            <ShieldCheck size={120} />
          </div>
          <div className="relative z-10 space-y-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <h3 className="font-serif text-lg font-semibold text-nuit flex items-center gap-3">
                <Target className="text-paon" size={20} /> Authenticité du processus
              </h3>
              <div className={`px-4 py-2 rounded-full text-[11px] font-semibold uppercase tracking-wide flex items-center gap-2 border ${analysis.integrityScore >= 70 ? 'border-paon text-paon-sombre' : 'border-ambre text-ambre'}`}>
                Indice de cohérence : {analysis.integrityScore}/100
                {analysis.integrityScore < 70 && <AlertTriangle size={14} />}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-craie p-6 rounded-md border border-brume">
                <p className="text-[11px] font-semibold text-ardoise uppercase tracking-wide mb-3">Usage déclaré des outils d'assistance :</p>
                <p className="text-sm text-nuit italic leading-relaxed">
                  "{aiDeclaration || "Aucun usage déclaré."}"
                </p>
              </div>
              <div className="bg-craie p-6 rounded-md border border-brume flex flex-col justify-center">
                <p className="text-[11px] font-semibold text-ardoise uppercase tracking-wide mb-3">Dynamique de réflexion :</p>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[12px] text-ardoise">Temps moyen de saisie</span>
                    <span className="text-sm font-semibold text-nuit">{avgResponseTime} seconde{avgResponseTime > 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[12px] text-ardoise">Ruptures de rythme</span>
                    <span className={`text-sm font-semibold ${analysis.rhythmBreakCount > 0 ? 'text-ambre' : 'text-paon-sombre'}`}>
                      {analysis.rhythmBreakCount} épisode(s) identifié(s)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-craie rounded-md border border-brume">
              <Info className="text-paon shrink-0" size={18} />
              <p className="text-[12px] text-ardoise leading-relaxed">
                Cet indice reflète la fluidité cognitive de l'apprenant·e. Une rupture de rythme suggère qu'une réponse a été produite à une vitesse incompatible avec une saisie naturelle. La pensée critique nécessite un temps de maturation organique.
              </p>
            </div>
          </div>
        </section>

        {/* Section Graphique et Résumé */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 print:block print:space-y-8">
          <div className="lg:col-span-7 space-y-6">
            <div className="p-8 bg-white rounded-lg border border-brume print:p-6">
              <h3 className="text-[11px] font-semibold text-ardoise uppercase tracking-wide mb-4 flex items-center gap-2">
                <FileText size={14} /> Bilan de la réflexion par Argos
              </h3>
              <p className="font-serif text-[15px] text-nuit leading-relaxed whitespace-pre-line">
                {analysis.summary}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white p-6 rounded-lg border border-brume border-l-4 border-l-paon">
                <h4 className="text-[11px] font-semibold text-paon-sombre uppercase tracking-wide mb-3 flex items-center gap-2">
                  <CheckCircle2 size={14} /> Points forts
                </h4>
                <ul className="space-y-2">
                  {analysis.keyStrengths.map((s, i) => (
                    <li key={i} className="text-[13px] text-nuit">• {s}</li>
                  ))}
                </ul>
              </div>
              <div className="bg-white p-6 rounded-lg border border-brume border-l-4 border-l-ambre">
                <h4 className="text-[11px] font-semibold text-ambre uppercase tracking-wide mb-3 flex items-center gap-2">
                  <Lightbulb size={14} /> Pistes de progression
                </h4>
                <ul className="space-y-2">
                  {analysis.weaknesses.map((w, i) => (
                    <li key={i} className="text-[13px] text-nuit">• {w}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 bg-white border border-brume rounded-lg p-6 flex flex-col items-center justify-start print:mt-8">
             <div className="flex items-center gap-2 mb-4">
                <RadarIcon className="text-paon" size={16} />
                <h3 className="text-[11px] font-semibold text-nuit uppercase tracking-wide">Dimensions de la pensée</h3>
             </div>
             <div className="w-full h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={getChartData()}>
                    <PolarGrid stroke="#DDD9CF" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fontWeight: 600, fill: '#55606A' }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 8, fill: '#55606A' }} />
                    <Radar
                      name="Apprenant·e"
                      dataKey="A"
                      stroke="#12676B"
                      strokeWidth={1.5}
                      fill="#12676B"
                      fillOpacity={0.3}
                    />
                  </RadarChart>
                </ResponsiveContainer>
             </div>
             {rationales && (
               <div className="w-full mt-4 pt-4 border-t border-brume space-y-2 print:break-inside-avoid">
                 {([
                   ['Raisonnement', rationales.reasoning],
                   ['Clarté', rationales.clarity],
                   ['Doute constructif', rationales.skepticism],
                   ['Méthode', rationales.process],
                   ['Prise de recul', rationales.reflection],
                   ['Intégrité', rationales.integrity],
                 ] as const).map(([label, rationale]) => (
                   <p key={label} className="text-[12px] leading-relaxed text-ardoise">
                     <span className="font-semibold text-nuit">{label}.</span> {rationale}
                   </p>
                 ))}
               </div>
             )}
          </div>
        </section>

        {/* Transcript */}
        <section className="pt-10 border-t border-brume print:pt-8 bg-transparent !border-x-0 !border-b-0">
          <div className="flex items-center gap-3 mb-8 print:mb-4">
            <FileSignature className="text-nuit" size={22} />
            <h3 className="font-serif text-lg font-semibold text-nuit">Parcours de réflexion</h3>
          </div>
          <div className="space-y-4 print:space-y-6">
            {transcript.filter(m => !m.text.includes("Bonjour Argos")).map((m, i) => (
              <div key={i} className={`p-4 rounded-md text-sm print:text-[10pt] print:break-inside-avoid relative bg-white border border-brume ${m.role === 'user' ? 'border-l-4 border-l-nuit' : 'border-l-4 border-l-paon'}`}>
                {m.role === 'user' && m.responseTimeSeconds !== undefined && m.responseTimeSeconds > 0 && (
                  <div className="absolute top-2 right-4 flex items-center gap-1 text-[10px] text-ardoise">
                    <Timer size={8} /> Saisie : {m.responseTimeSeconds}s
                  </div>
                )}
                <span className="font-semibold uppercase tracking-wide text-[10px] print:text-[8pt] block mb-1 text-ardoise">{m.role === 'user' ? 'Étudiant·e' : 'Argos'}</span>
                <div className="prose prose-sm max-w-none text-nuit">
                   {m.text}
                </div>
              </div>
            ))}
          </div>
        </section>

        <footer className="pt-16 border-t border-brume text-center print:pt-10 !border-x-0 !border-b-0">
           <p className="text-[10px] text-ardoise uppercase tracking-wide print:text-nuit">Document certifié par le système Argos socratique • Traçabilité cognitive V3</p>
        </footer>
      </div>
    </div>
  );
};
