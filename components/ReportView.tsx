
import React, { useEffect, useState } from 'react';
import { AnalysisData, SessionConfig } from '../types';
import { generateAnalysis } from '../services/gemini';
import { Message } from '../types';
import { RefreshCw, Sparkles, Target, RotateCcw, Download, Radar as RadarIcon, CheckCircle2, Lightbulb, FileText, ShieldCheck, FileSignature, AlertTriangle, Info, Timer } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

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
      { subject: 'Doute Constructif', A: analysis.skepticismScore, fullMark: 100 },
      { subject: 'Méthode', A: analysis.processScore, fullMark: 100 },
      { subject: 'Prise de recul', A: analysis.reflectionScore, fullMark: 100 },
    ];
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-screen bg-slate-50">
      <RefreshCw className="animate-spin text-indigo-600 mb-6" size={48} />
      <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Analyse de ta réflexion par Argos...</h2>
      <p className="text-slate-400 text-[10px] font-bold mt-2 uppercase tracking-widest">Calcul de la trace d'apprentissage</p>
    </div>
  );

  if (error || !analysis) return (
    <div className="flex flex-col items-center justify-center h-screen p-8 text-center space-y-6">
      <h2 className="text-2xl font-black text-slate-900 uppercase">Erreur de bilan</h2>
      <button onClick={runAnalysis} className="flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase"><RotateCcw size={18} /> Réessayer</button>
    </div>
  );

  const userMessages = transcript.filter(m => m.role === 'user' && m.responseTimeSeconds !== undefined && m.responseTimeSeconds > 0);
  const avgResponseTime = userMessages.length > 0
    ? Math.round(userMessages.reduce((acc, curr) => acc + (curr.responseTimeSeconds || 0), 0) / userMessages.length)
    : 0;

  return (
    <div className="min-h-screen bg-white p-4 sm:p-12 print:p-0">
      <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in duration-700 print:space-y-8">
        
        {/* HEADER */}
        <header className="bg-slate-900 text-white p-10 rounded-[2.5rem] shadow-xl flex flex-col md:flex-row justify-between items-start gap-8 print:bg-slate-50 print:text-slate-900 print:rounded-xl print:shadow-none print:border-2 print:border-slate-200 print:p-8">
          <div className="space-y-4">
            <div className="flex items-center gap-4 text-indigo-400 print:text-indigo-600">
              <Sparkles size={24} />
              <p className="text-[10px] font-black uppercase tracking-[0.6em]">Trace d'Apprentissage DES</p>
            </div>
            <h1 className="text-5xl font-black tracking-tighter uppercase leading-none print:text-3xl">{config.studentName}</h1>
            <p className="text-slate-400 text-lg font-bold uppercase print:text-slate-600">{config.topic}</p>
          </div>
          <div className="flex flex-col sm:flex-row md:flex-col gap-3 no-print">
            <button 
              onClick={() => window.print()} 
              className="flex items-center justify-center gap-3 bg-white text-slate-900 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-50 transition-all shadow-lg active:scale-95"
            >
              <Download size={16} /> Enregistrer en PDF
            </button>
            <button 
              onClick={onRestart} 
              className="flex items-center justify-center gap-3 bg-slate-800 text-slate-400 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:text-white transition-all active:scale-95"
            >
              <RotateCcw size={16} /> Nouvelle Session
            </button>
          </div>
        </header>

        {/* SECTION DÉCLARATION IA (INTÉGRITÉ) */}
        <section className="bg-slate-50 border-2 border-slate-100 rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden print:rounded-xl print:border-slate-200">
          <div className="absolute top-0 right-0 p-8 text-slate-100 print:hidden">
            <FileSignature size={120} />
          </div>
          <div className="relative z-10 space-y-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-3">
                <ShieldCheck className="text-indigo-600" size={20} /> engagement et intégrité
              </h3>
              <div className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${analysis.integrityScore >= 70 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                Score d'Intégrité : {analysis.integrityScore}/100
                {analysis.integrityScore < 50 && <AlertTriangle size={14} />}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-inner">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Déclaration d'usage de l'IA par l'élève :</p>
                <p className="text-sm font-medium text-slate-800 italic leading-relaxed">
                  "{aiDeclaration || "Aucun usage déclaré."}"
                </p>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-inner flex flex-col justify-center">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Métriques de comportement :</p>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Réflexion moyenne</span>
                    <span className="text-xs font-black text-slate-900">{avgResponseTime} secondes</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Réponses à vitesse suspecte</span>
                    {/* On utilise ici la donnée certifiée par l'IA lors de l'analyse globale */}
                    <span className={`text-xs font-black ${analysis.suspiciousMessageCount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {analysis.suspiciousMessageCount} détectée(s)
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-start gap-4 p-4 bg-indigo-50/50 rounded-xl border border-indigo-100">
              <Info className="text-indigo-600 shrink-0" size={18} />
              <p className="text-[11px] text-indigo-900 font-bold leading-relaxed">
                Ce score mesure la cohérence entre ton travail réel dans le chat (incluant ton rythme de frappe) et ce que tu déclares ci-dessus. L'honnêteté sur les outils utilisés est une compétence clé de la pensée critique.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION GRAPHIQUE ET RÉSUMÉ */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 print:block print:space-y-8">
          <div className="lg:col-span-7 space-y-6">
            <div className="p-8 bg-white rounded-[2rem] border-2 border-slate-50 print:p-6 print:rounded-xl">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <FileText size={14} /> Bilan de ta réflexion par Argos
              </h3>
              <p className="text-sm text-slate-800 leading-relaxed font-medium whitespace-pre-line">
                {analysis.summary}
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100 print:border-emerald-300">
                <h4 className="text-[9px] font-black text-emerald-900 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <CheckCircle2 size={14} /> Tes Points Forts
                </h4>
                <ul className="space-y-2">
                  {analysis.keyStrengths.map((s, i) => (
                    <li key={i} className="text-[11px] text-emerald-800 font-bold">• {s}</li>
                  ))}
                </ul>
              </div>
              <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100 print:border-amber-300">
                <h4 className="text-[9px] font-black text-amber-900 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Lightbulb size={14} /> Pistes de progression
                </h4>
                <ul className="space-y-2">
                  {analysis.weaknesses.map((w, i) => (
                    <li key={i} className="text-[11px] text-amber-800 font-bold">• {w}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 bg-white border-2 border-slate-100 rounded-[2.5rem] p-6 shadow-sm flex flex-col items-center justify-center print:border-slate-300 print:rounded-xl print:mt-8">
             <div className="flex items-center gap-2 mb-4">
                <RadarIcon className="text-indigo-600" size={16} />
                <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Dimensions de ta pensée</h3>
             </div>
             <div className="w-full h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={getChartData()}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9, fontWeight: 700, fill: '#64748b' }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 8 }} />
                    <Radar
                      name="Apprenant"
                      dataKey="A"
                      stroke="#4f46e5"
                      fill="#4f46e5"
                      fillOpacity={0.6}
                    />
                  </RadarChart>
                </ResponsiveContainer>
             </div>
          </div>
        </section>

        {/* TRANSCRIPT */}
        <section className="pt-12 border-t border-slate-100 print:pt-8 print:border-slate-300">
          <div className="flex items-center gap-3 mb-8 print:mb-4">
            <Target className="text-slate-900" size={24} />
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Historique de la discussion</h3>
          </div>
          <div className="space-y-4 print:space-y-6">
            {transcript.filter(m => !m.text.includes("Bonjour Argos")).map((m, i) => (
              <div key={i} className={`p-4 rounded-xl text-xs print:text-[10pt] print:break-inside-avoid relative ${m.role === 'user' ? 'bg-slate-100 border-l-4 border-slate-900' : 'bg-indigo-50 border-l-4 border-indigo-600'}`}>
                {m.role === 'user' && m.responseTimeSeconds !== undefined && m.responseTimeSeconds > 0 && (
                  <div className={`absolute top-2 right-4 flex items-center gap-1 text-[7px] font-black uppercase tracking-widest text-slate-400`}>
                    <Timer size={8} /> {m.responseTimeSeconds}s de réflexion
                  </div>
                )}
                <span className="font-black uppercase text-[9px] print:text-[8pt] block mb-1">{m.role === 'user' ? 'Étudiant·e' : 'Argos'}</span>
                <div className="prose prose-sm max-w-none text-slate-800">
                   {m.text}
                </div>
              </div>
            ))}
          </div>
        </section>

        <footer className="pt-20 border-t border-slate-100 text-center opacity-30 print:opacity-100 print:pt-10">
           <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] print:text-slate-600">Document Certifié par le Système Argos Socratique • Protocole Phased V3</p>
        </footer>
      </div>
    </div>
  );
};
