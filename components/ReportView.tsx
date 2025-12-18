
import React, { useEffect, useState } from 'react';
import { AnalysisData, SessionConfig } from '../types';
import { generateAnalysis } from '../services/gemini';
import { Message } from '../types';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip, CartesianGrid, LabelList } from 'recharts';
import { FileText, Printer, ShieldCheck, FileJson, Check, RefreshCw, Sparkles, ClipboardCheck, Quote, AlertTriangle, Target, Lightbulb, TrendingUp, TrendingDown, BookOpenCheck } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ReportViewProps {
  config: SessionConfig;
  transcript: Message[];
  aiDeclaration: string;
  onRestart: () => void;
}

export const ReportView: React.FC<ReportViewProps> = ({ config, transcript, aiDeclaration, onRestart }) => {
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const runAnalysis = async () => {
      try {
        const result = await generateAnalysis(transcript, config.topic, aiDeclaration);
        setAnalysis(result);
      } catch (e) {
        console.error("Analysis failure", e);
      } finally {
        setLoading(false);
      }
    };
    runAnalysis();
  }, [transcript, config.topic, aiDeclaration]);

  const downloadJSON = () => {
    const data = {
      metadata: { student: config.studentName, topic: config.topic, mode: config.mode, date: new Date().toISOString() },
      transcript,
      aiDeclaration,
      analysis: analysis
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Audit_Argos_${config.studentName}.json`;
    link.click();
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-screen bg-indigo-50/20">
      <RefreshCw className="animate-spin text-indigo-600 mb-6" size={48} />
      <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter text-center">Argos compile l'expertise...</h2>
      <p className="text-slate-400 text-[10px] mt-2 uppercase tracking-widest font-bold text-center px-4 animate-pulse">Extraction de la valeur cognitive</p>
    </div>
  );

  if (!analysis) return <div className="p-8 text-center font-bold">L'audit n'a pas pu être généré.</div>;

  const chartData = [
    { name: 'Prémisses', score: analysis.criteriaScores.premises.score, color: '#4f46e5' },
    { name: 'Preuves', score: analysis.criteriaScores.evidence.score, color: '#6366f1' },
    { name: 'Biais', score: analysis.criteriaScores.bias.score, color: '#8b5cf6' },
    { name: 'Décentrement', score: analysis.criteriaScores.decentering.score, color: '#a855f7' },
    { name: 'Logique', score: analysis.criteriaScores.logic.score, color: '#10b981' },
    { name: 'Intégrité', score: analysis.criteriaScores.integrity.score, color: '#f59e0b' },
  ];

  return (
    <div className="min-h-screen bg-white p-4 sm:p-12 print:p-0">
      <div className="max-w-6xl mx-auto space-y-12 print:space-y-8">
        
        {/* HEADER EXPERT */}
        <header className="bg-slate-900 text-white p-12 rounded-[3rem] shadow-2xl flex flex-col md:flex-row justify-between items-start print:rounded-none print:p-10">
          <div className="space-y-6">
            <div className="flex items-center gap-4 text-indigo-400">
              <Sparkles size={24} />
              <p className="text-xs font-black uppercase tracking-[0.6em]">Dossier d'Évaluation Argos v9.0</p>
            </div>
            <h1 className="text-6xl font-black tracking-tighter uppercase leading-none print:text-5xl">{config.studentName}</h1>
            <div className="flex flex-wrap gap-4 items-center">
               <span className="px-4 py-1.5 bg-indigo-500/20 text-indigo-300 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-500/30">
                 {config.mode === 'TUTOR' ? 'Accompagnement' : 'Critique'}
               </span>
               <div className="h-1 w-1 rounded-full bg-slate-700"></div>
               <span className="text-slate-400 text-sm font-bold uppercase tracking-tight">Sujet : {config.topic}</span>
            </div>
          </div>
          <div className="text-right flex flex-col items-end gap-2 md:mt-0 mt-8 border-l border-slate-800 pl-10">
            <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Score de Maturité Critique</p>
            <div className="text-7xl font-black text-white leading-none tracking-tighter">{analysis.globalScore}%</div>
            <p className="text-xs font-bold text-indigo-400 mt-2 uppercase">{new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
          </div>
        </header>

        {/* SECTION GRAPHIQUE & FEEDBACKS GRANULAIRES */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-12 print:block">
          
          <div className="xl:col-span-4 space-y-8">
            <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-200 sticky top-8 print:relative print:top-0">
              <h3 className="text-[10px] font-black uppercase text-slate-400 mb-8 tracking-widest text-center flex items-center justify-center gap-2">
                <ClipboardCheck size={16} /> Cartographie des compétences
              </h3>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 0, right: 30, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" tick={{fontSize: 9, fontWeight: 800}} axisLine={false} tickLine={false} interval={0} angle={-30} textAnchor="end" />
                    <YAxis domain={[0, 100]} hide />
                    <Tooltip cursor={{fill: '#fff'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}} />
                    <Bar dataKey="score" radius={[8, 8, 8, 8]} barSize={24}>
                      {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                      <LabelList dataKey="score" position="top" style={{fontSize: 10, fontWeight: 900, fill: '#1e293b'}} formatter={(v: number) => `${v}%`} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Liste textuelle des scores pour impression */}
              <div className="mt-10 space-y-3">
                {Object.entries(analysis.criteriaScores).map(([key, val]: [string, any]) => (
                  <div key={key} className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                    <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider">
                      {key === 'premises' ? 'Prémisses' : 
                       key === 'evidence' ? 'Preuves' : 
                       key === 'bias' ? 'Biais' : 
                       key === 'decentering' ? 'Décentrement' : 
                       key === 'logic' ? 'Logique' : 'Intégrité'}
                    </span>
                    <span className="text-sm font-black text-slate-900">{val.score}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ACTION BUTTONS (NO PRINT) */}
            <div className="bg-slate-900 p-8 rounded-[2.5rem] space-y-3 no-print">
              <button onClick={() => window.print()} className="w-full flex items-center justify-center gap-3 bg-white text-slate-900 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-indigo-50 transition-all shadow-xl active:scale-95 group">
                <Printer size={18} className="group-hover:text-indigo-600" /> Générer PDF Officiel
              </button>
              <button onClick={downloadJSON} className="w-full flex items-center justify-center gap-3 bg-indigo-600 text-white py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-indigo-700 transition-all active:scale-95">
                <FileJson size={18} /> Télécharger Données Raw
              </button>
              <button onClick={onRestart} className="w-full text-slate-500 py-3 font-black text-[10px] uppercase tracking-[0.2em] hover:text-white transition-colors">Nouvel Audit</button>
            </div>
          </div>

          <div className="xl:col-span-8 space-y-12">
            
            {/* ANALYSE QUALITATIVE DÉTAILLÉE PAR SCORE */}
            <section className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm print-break-avoid">
              <div className="flex items-center gap-4 mb-10 border-b border-slate-100 pb-6">
                <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-100"><FileText size={24} /></div>
                <div>
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Expertise Cognitive</h3>
                  <p className="text-xl font-black text-slate-900 uppercase tracking-tighter">Diagnostic des Dimensions</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {Object.entries(analysis.criteriaScores).map(([key, val]: [string, any]) => (
                  <div key={key} className="space-y-2">
                    <div className="flex justify-between items-baseline">
                      <h4 className="text-[10px] font-black uppercase text-indigo-600 tracking-widest">
                        {key === 'premises' ? 'Mise en question des prémisses' : 
                         key === 'evidence' ? 'Force des preuves' : 
                         key === 'bias' ? 'Identification des biais' : 
                         key === 'decentering' ? 'Capacité de décentrement' : 
                         key === 'logic' ? 'Cohérence logique' : 'Honnêteté intellectuelle'}
                      </h4>
                      <span className="text-xs font-black text-slate-300">{val.score}%</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed italic">{val.feedback}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* SYNTHÈSE GLOBALE ET POSTURE */}
            <section className="bg-slate-900 text-white p-12 rounded-[3rem] shadow-2xl print-break-avoid print:bg-slate-50 print:text-slate-900 print:border print:border-slate-200">
              <div className="flex items-center gap-4 mb-8">
                <Target className="text-indigo-400" size={28} />
                <h3 className="text-xs font-black uppercase tracking-widest">Posture d'apprentissage</h3>
              </div>
              <p className="text-2xl font-light leading-snug tracking-tight mb-8">
                {analysis.diagnostic}
              </p>
              <div className="prose prose-invert max-w-none text-slate-400 leading-relaxed text-sm print:text-slate-700">
                <ReactMarkdown>{analysis.summary}</ReactMarkdown>
              </div>
            </section>

            {/* MOMENTS PIVOTS STYLISÉS */}
            <section className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm print-break-avoid">
              <div className="flex items-center gap-4 mb-10">
                <Quote className="text-indigo-600" size={24} />
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Moments pivots du dialogue</h3>
              </div>
              <div className="grid grid-cols-1 gap-6">
                {analysis.pivotalMoments.map((m, i) => (
                  <div key={i} className="flex gap-6 items-start p-6 bg-slate-50 rounded-[2rem] border border-slate-100 hover:border-indigo-200 transition-all">
                    <div className={`mt-1 p-2 rounded-xl shrink-0 ${m.impact === 'positive' ? 'bg-emerald-100 text-emerald-600' : m.impact === 'negative' ? 'bg-rose-100 text-rose-600' : 'bg-slate-200 text-slate-500'}`}>
                      {m.impact === 'positive' ? <TrendingUp size={20} /> : m.impact === 'negative' ? <TrendingDown size={20} /> : <Target size={20} />}
                    </div>
                    <div className="space-y-3">
                      <p className="text-xs italic font-semibold text-slate-800 leading-relaxed border-l-4 border-slate-200 pl-4">"{m.quote}"</p>
                      <p className="text-[11px] text-slate-500 font-medium leading-relaxed">{m.analysis}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* RECOMMANDATION FINALE (LE "RICHE") */}
            <section className="bg-indigo-600 text-white p-12 rounded-[3rem] shadow-xl print-break-avoid">
              <div className="flex items-center gap-4 mb-6">
                <BookOpenCheck size={28} className="text-indigo-200" />
                <h3 className="text-xs font-black uppercase tracking-widest">Prescription Pédagogique Finale</h3>
              </div>
              <div className="text-xl font-bold leading-relaxed">
                {analysis.finalRecommendation}
              </div>
            </section>

            {/* INTEGRITÉ & IA */}
            <section className="bg-slate-50 p-10 rounded-[2rem] border border-slate-200 print-break-avoid">
              <div className="flex items-center gap-4 mb-6">
                <ShieldCheck size={24} className="text-slate-900" />
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Audit d'Intégrité Intellectuelle</h3>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-inner border border-slate-100 mb-6 text-sm font-medium text-slate-700 italic">
                {analysis.aiUsageAnalysis}
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Déclaration de l'apprenant :</span>
                <p className="text-[11px] text-slate-500 bg-slate-200/50 p-4 rounded-xl leading-relaxed">"{aiDeclaration}"</p>
              </div>
            </section>
          </div>
        </div>

        {/* FOOTER PDF */}
        <footer className="hidden print:flex flex-col items-center pt-20 border-t border-slate-100 gap-4">
           <div className="flex gap-10 opacity-30">
              <div className="flex items-center gap-2"><Sparkles size={14} /><span className="text-[9px] font-black uppercase tracking-widest">Argos AI Certification</span></div>
              <div className="flex items-center gap-2"><Lightbulb size={14} /><span className="text-[9px] font-black uppercase tracking-widest">Trace Cognitive Valide</span></div>
           </div>
           <p className="text-[8px] font-black text-slate-200 uppercase tracking-[0.5em]">Rapport généré par Argos Socratic System v9.2 - 2025</p>
        </footer>
      </div>
    </div>
  );
};
