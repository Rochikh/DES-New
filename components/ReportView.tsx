
import React, { useEffect, useState } from 'react';
import { AnalysisData, SessionConfig } from '../types';
import { generateAnalysis } from '../services/gemini';
import { Message } from '../types';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip, CartesianGrid, LabelList } from 'recharts';
import { FileText, Printer, ShieldCheck, FileJson, Check, RefreshCw, Sparkles, ClipboardCheck, Quote, AlertTriangle, Target, Lightbulb, TrendingUp, TrendingDown, BookOpenCheck, Copy, Share2, RotateCcw, Save } from 'lucide-react';
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
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const runAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await generateAnalysis(transcript, config.topic, aiDeclaration);
      setAnalysis(result);
    } catch (e: any) {
      console.error("Analysis failure", e);
      setError("Argos a rencontré une erreur lors de la génération de l'audit. Cela peut être dû à une saturation du service ou à une réponse mal formattée.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runAnalysis();
  }, [transcript, config.topic, aiDeclaration]);

  const downloadJSON = () => {
    if (!analysis) return;
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
    link.download = `Audit_Argos_${config.studentName.replace(/\s+/g, '_')}.json`;
    link.click();
  };

  const copyToClipboard = () => {
    if (!analysis) return;
    const text = `AUDIT ARGOS - ${config.studentName}\nSujet: ${config.topic}\nScore Global: ${analysis.globalScore}%\n\nSynthèse:\n${analysis.summary}\n\nDiagnostic:\n${analysis.diagnostic}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-screen bg-indigo-50/20">
      <RefreshCw className="animate-spin text-indigo-600 mb-6" size={48} />
      <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter text-center">Argos compile l'expertise...</h2>
      <p className="text-slate-400 text-[10px] mt-2 uppercase tracking-widest font-bold text-center px-4 animate-pulse">Extraction de la valeur cognitive</p>
    </div>
  );

  if (error || !analysis) return (
    <div className="flex flex-col items-center justify-center h-screen p-8 text-center space-y-6">
      <div className="p-6 bg-rose-100 text-rose-600 rounded-full">
        <AlertTriangle size={48} />
      </div>
      <h2 className="text-2xl font-black text-slate-900 uppercase">Échec de l'Audit</h2>
      <p className="text-slate-600 max-w-md font-medium">{error || "Une erreur inconnue est survenue."}</p>
      <div className="flex gap-4">
        <button onClick={runAnalysis} className="flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all">
          <RotateCcw size={18} /> Réessayer l'analyse
        </button>
        <button onClick={onRestart} className="px-8 py-3 border-2 border-slate-200 text-slate-500 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all">
          Abandonner
        </button>
      </div>
    </div>
  );

  const chartData = [
    { name: 'Prémisses', score: analysis.criteriaScores?.premises?.score ?? 0, color: '#4f46e5' },
    { name: 'Preuves', score: analysis.criteriaScores?.evidence?.score ?? 0, color: '#6366f1' },
    { name: 'Biais', score: analysis.criteriaScores?.bias?.score ?? 0, color: '#8b5cf6' },
    { name: 'Décentrement', score: analysis.criteriaScores?.decentering?.score ?? 0, color: '#a855f7' },
    { name: 'Logique', score: analysis.criteriaScores?.logic?.score ?? 0, color: '#10b981' },
    { name: 'Intégrité', score: analysis.criteriaScores?.integrity?.score ?? 0, color: '#f59e0b' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-12 print:bg-white print:p-0">
      <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700 print:space-y-6">
        
        {/* HEADER EXPERT AVEC ACTIONS STICKY */}
        <header className="bg-slate-900 text-white p-8 md:p-12 rounded-[3rem] shadow-2xl flex flex-col xl:flex-row justify-between items-start gap-8 print:rounded-none print:p-8">
          <div className="space-y-6 flex-1">
            <div className="flex items-center gap-4 text-indigo-400">
              <Sparkles size={24} />
              <p className="text-[10px] font-black uppercase tracking-[0.6em]">Dossier d'Évaluation Argos v9.2</p>
            </div>
            <h1 className="text-5xl md:text-6xl font-black tracking-tighter uppercase leading-none print:text-4xl">{config.studentName}</h1>
            <div className="flex flex-wrap gap-4 items-center">
               <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${config.mode === 'TUTOR' ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' : 'bg-rose-500/20 text-rose-300 border-rose-500/30'}`}>
                 {config.mode === 'TUTOR' ? 'Accompagnement Socratique' : 'Audit Critique'}
               </span>
               <div className="h-1 w-1 rounded-full bg-slate-700"></div>
               <span className="text-slate-400 text-sm font-bold uppercase tracking-tight">Sujet : {config.topic}</span>
            </div>
            
            {/* ACTIONS RAPIDES DANS LE HEADER POUR VISIBILITÉ TOTALE */}
            <div className="flex flex-wrap gap-3 pt-4 no-print">
              <button onClick={() => window.print()} className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg active:scale-95 border border-indigo-400">
                <Save size={16} /> Enregistrer en PDF
              </button>
              <button onClick={downloadJSON} className="flex items-center gap-2 bg-slate-800 text-white px-5 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-700 transition-all shadow-lg active:scale-95">
                <FileJson size={16} /> Exporter JSON
              </button>
              <button onClick={copyToClipboard} className="flex items-center gap-2 bg-slate-700 text-slate-300 px-5 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-600 transition-all active:scale-95">
                {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                {copied ? 'Copié !' : 'Copier Résumé'}
              </button>
            </div>
          </div>

          <div className="xl:text-right flex flex-col xl:items-end gap-2 border-l border-slate-800 xl:pl-10 pl-0 pt-6 xl:pt-0 w-full xl:w-auto">
            <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Score de Maturité Critique</p>
            <div className="text-6xl md:text-8xl font-black text-white leading-none tracking-tighter">{analysis.globalScore}%</div>
            <p className="text-xs font-bold text-indigo-400 mt-2 uppercase">{new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 print:block">
          
          {/* COLONNE GAUCHE : ANALYSE DÉTAILLÉE */}
          <div className="lg:col-span-8 space-y-8 print:space-y-6">
            
            {/* DIAGNOSTIC POSTURAL (PLUS VISIBLE) */}
            <section className="bg-white p-10 rounded-[3rem] border-l-8 border-indigo-600 shadow-sm print-break-avoid print:rounded-none">
              <div className="flex items-center gap-4 mb-6">
                <Target className="text-indigo-600" size={32} />
                <div>
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Diagnostic Expert</h3>
                  <p className="text-xl font-black text-slate-900 uppercase tracking-tighter">Profil de Posture Intellectuelle</p>
                </div>
              </div>
              <p className="text-2xl font-medium leading-snug tracking-tight text-slate-800 italic mb-6">
                {analysis.diagnostic}
              </p>
              <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed text-sm print:text-xs">
                <ReactMarkdown>{analysis.summary}</ReactMarkdown>
              </div>
            </section>

            {/* MOMENTS PIVOTS */}
            <section className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm print-break-avoid">
              <div className="flex items-center gap-4 mb-10">
                <Quote className="text-indigo-600" size={24} />
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Moments clés du dialogue</h3>
              </div>
              <div className="grid grid-cols-1 gap-6">
                {analysis.pivotalMoments?.map((m, i) => (
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

            {/* RECOMMANDATION FINALE */}
            <section className="bg-indigo-600 text-white p-12 rounded-[3rem] shadow-xl print-break-avoid">
              <div className="flex items-center gap-4 mb-6">
                <BookOpenCheck size={28} className="text-indigo-200" />
                <h3 className="text-xs font-black uppercase tracking-widest">Prescription Pédagogique Finale</h3>
              </div>
              <div className="text-xl font-bold leading-relaxed">
                {analysis.finalRecommendation}
              </div>
            </section>
          </div>

          {/* COLONNE DROITE : SCORES ET INTÉGRITÉ */}
          <div className="lg:col-span-4 space-y-8">
            
            {/* GRAPHIQUE DES COMPÉTENCES */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm print-break-avoid">
              <div className="flex items-center gap-3 mb-8 justify-center">
                <ClipboardCheck size={20} className="text-indigo-600" />
                <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">Profil Statistique</h3>
              </div>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" tick={{fontSize: 9, fontWeight: 800}} axisLine={false} tickLine={false} interval={0} angle={-30} textAnchor="end" />
                    <YAxis domain={[0, 100]} hide />
                    <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                    <Bar dataKey="score" radius={[8, 8, 8, 8]} barSize={24}>
                      {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                      <LabelList dataKey="score" position="top" style={{fontSize: 10, fontWeight: 900, fill: '#1e293b'}} formatter={(v: number) => `${v}%`} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* DÉTAILS DES FEEDBACKS PAR CRITÈRE */}
              <div className="mt-8 space-y-4">
                {Object.entries(analysis.criteriaScores || {}).map(([key, val]: [string, any]) => (
                  <div key={key} className="space-y-1">
                    <div className="flex justify-between items-center text-[9px] font-black uppercase text-slate-400 tracking-wider">
                      <span>{key}</span>
                      <span className="text-slate-900">{val.score}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                      <div className="bg-indigo-600 h-full" style={{ width: `${val.score}%` }}></div>
                    </div>
                    <p className="text-[10px] text-slate-500 italic leading-tight">{val.feedback}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* AUDIT INTÉGRITÉ */}
            <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] border border-slate-800 print:bg-slate-50 print:text-slate-900 print:border-slate-200">
              <div className="flex items-center gap-3 mb-6">
                <ShieldCheck className="text-indigo-400" size={24} />
                <h3 className="text-xs font-black uppercase tracking-widest">Intégrité Intellectuelle</h3>
              </div>
              <p className="text-sm font-medium leading-relaxed mb-6 italic opacity-90">
                {analysis.aiUsageAnalysis}
              </p>
              <div className="pt-6 border-t border-white/10">
                <span className="text-[9px] font-black text-white/40 uppercase tracking-widest block mb-2">Déclaration Apprenant :</span>
                <p className="text-xs text-indigo-200 italic">"{aiDeclaration}"</p>
              </div>
            </div>

            {/* ACTION : NOUVEL AUDIT (NO PRINT) */}
            <div className="no-print pt-4">
               <button onClick={onRestart} className="w-full flex items-center justify-center gap-3 bg-slate-100 text-slate-600 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95">
                 <RotateCcw size={18} /> Recommencer une session
               </button>
            </div>
          </div>
        </div>

        {/* PIED DE PAGE IMPRESSION */}
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
