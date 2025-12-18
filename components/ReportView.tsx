
import React, { useEffect, useState } from 'react';
import { AnalysisData, SessionConfig } from '../types';
import { generateAnalysis } from '../services/gemini';
import { Message } from '../types';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip, CartesianGrid } from 'recharts';
import { FileText, Printer, ShieldCheck, FileJson, Check, RefreshCw, Sparkles, ClipboardCheck } from 'lucide-react';
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
      metadata: {
        student: config.studentName,
        topic: config.topic,
        mode: config.mode,
        date: new Date().toISOString()
      },
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
      <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter text-center">Argos génère l'audit final...</h2>
      <p className="text-slate-400 text-[10px] mt-2 uppercase tracking-widest font-bold text-center px-4 animate-pulse">Évaluation de la trace cognitive en cours</p>
    </div>
  );

  if (!analysis) return <div className="p-8 text-center font-bold">L'audit n'a pas pu être généré. Veuillez recommencer la session.</div>;

  const chartData = [
    { name: 'Logique', score: analysis.reasoningScore, color: '#4f46e5' },
    { name: 'Discernement', score: analysis.disciplinaryDiscernmentScore || 50, color: '#0ea5e9' },
    { name: 'Transparence', score: analysis.aiDeclarationCoherenceScore, color: '#8b5cf6' },
    { name: 'Réflexivité', score: analysis.reflectionScore || 50, color: '#10b981' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-12 print:bg-white print:p-0">
      <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in duration-700 print:space-y-8">
        
        {/* Header - Identité Visuelle Forte */}
        <header className="bg-slate-900 text-white p-12 rounded-[2.5rem] flex flex-col md:flex-row justify-between items-start md:items-end gap-6 shadow-2xl print:rounded-none print:shadow-none print:bg-slate-900 print:text-white">
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-indigo-400">
              <Sparkles size={20} />
              <p className="text-[11px] font-black uppercase tracking-[0.4em]">Audit de Pensée Critique ARGOS v8</p>
            </div>
            <h1 className="text-5xl font-black tracking-tighter uppercase leading-none">{config.studentName}</h1>
            <div className="flex flex-col gap-1">
              <p className="text-indigo-200/60 text-sm font-medium uppercase tracking-widest">Sujet d'étude</p>
              <p className="text-xl font-bold text-white">{config.topic}</p>
            </div>
          </div>
          <div className="text-right border-l border-white/10 pl-8 hidden sm:block print:block">
            <p className="text-[10px] opacity-40 uppercase font-black tracking-widest mb-1">Date de l'Audit</p>
            <p className="text-2xl font-black">{new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
            <p className="text-[10px] text-indigo-400 font-bold mt-2 uppercase">Mode : {config.mode === 'TUTOR' ? 'Socratique' : 'Critique'}</p>
          </div>
        </header>

        {/* Section Principale : Analyse Pédagogique */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 print:block">
          
          <div className="lg:col-span-8 space-y-10 print:space-y-8">
            
            <section className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm print-break-avoid">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600"><FileText size={20} /></div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Synthèse de la trace cognitive</h3>
              </div>
              <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed text-base italic print:text-sm">
                <ReactMarkdown>{analysis.summary}</ReactMarkdown>
              </div>
            </section>

            <section className="bg-slate-50 p-10 rounded-[2.5rem] border border-slate-200 print-break-avoid">
              <div className="flex items-center gap-3 mb-8 text-slate-900">
                <div className="p-2 bg-slate-900 rounded-lg text-white"><ShieldCheck size={20} /></div>
                <h3 className="text-sm font-black uppercase tracking-widest">Expertise d'Honnêteté Intellectuelle</h3>
              </div>
              <p className="text-sm font-medium text-slate-800 leading-relaxed mb-8 bg-white p-6 rounded-2xl border border-slate-100 shadow-inner">
                {analysis.aiUsageAnalysis}
              </p>
              <div className="bg-indigo-900/5 p-6 rounded-2xl border border-indigo-100">
                <span className="opacity-50 uppercase block mb-2 text-[9px] font-black text-indigo-900 tracking-widest">Journal de bord de l'apprenant :</span>
                <p className="text-xs text-indigo-900 italic font-medium leading-relaxed">"{aiDeclaration}"</p>
              </div>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-2 print:gap-4">
              <div className="bg-emerald-50/50 p-8 rounded-[2.5rem] border border-emerald-100 print-break-avoid">
                <h4 className="font-black text-emerald-900 text-xs uppercase mb-6 tracking-widest flex items-center gap-2">
                  <Check size={16} className="text-emerald-500" /> Forces de Raisonnement
                </h4>
                <ul className="space-y-4">
                  {analysis.keyStrengths.map((s, i) => (
                    <li key={i} className="text-xs text-emerald-800 flex gap-3 font-semibold leading-relaxed">
                      <span className="text-emerald-400">•</span> {s}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-indigo-50/30 p-8 rounded-[2.5rem] border border-indigo-100 print-break-avoid">
                <h4 className="font-black text-indigo-900 text-xs uppercase mb-6 tracking-widest flex items-center gap-2">
                  <Sparkles size={16} className="text-indigo-400" /> Pistes de Progrès
                </h4>
                <ul className="space-y-4">
                  {analysis.weaknesses.map((w, i) => (
                    <li key={i} className="text-xs text-indigo-800 flex gap-3 font-semibold leading-relaxed">
                      <span className="text-indigo-400 font-black">→</span> {w}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Sidebar : Statistiques & Graphiques */}
          <div className="lg:col-span-4 space-y-8 print:mt-12">
            
            <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm print-break-avoid">
              <div className="flex items-center gap-3 mb-10 justify-center">
                <ClipboardCheck size={20} className="text-indigo-600" />
                <h3 className="text-[11px] font-black text-center uppercase text-slate-500 tracking-[0.2em]">Profil de Compétences</h3>
              </div>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 0, right: 0, left: -40, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{fontSize: 9, fontWeight: 800}} axisLine={false} tickLine={false} interval={0} angle={-45} textAnchor="end" />
                    <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700}} />
                    <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                    <Bar dataKey="score" radius={[8, 8, 8, 8]} barSize={28}>
                      {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-8 pt-8 border-t border-slate-50 space-y-4">
                 <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Score Global</span>
                    <span className="text-2xl font-black text-indigo-600">{Math.round((analysis.reasoningScore + (analysis.disciplinaryDiscernmentScore || 50) + analysis.aiDeclarationCoherenceScore + (analysis.reflectionScore || 50)) / 4)}%</span>
                 </div>
              </div>
            </div>

            {/* Actions (Cachées à l'impression) */}
            <div className="bg-slate-900 p-10 rounded-[2.5rem] space-y-4 shadow-2xl no-print">
              <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4 text-center">Gestion de l'Archive</h3>
              <button 
                type="button"
                onClick={() => window.print()} 
                className="w-full flex items-center justify-center gap-3 bg-white text-slate-900 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-indigo-50 transition-all shadow-lg active:scale-95 group"
              >
                <Printer size={16} className="group-hover:text-indigo-600 transition-colors" /> Imprimer en PDF
              </button>
              <button 
                type="button"
                onClick={downloadJSON} 
                className="w-full flex items-center justify-center gap-3 bg-indigo-600 text-white py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-indigo-700 transition-all active:scale-95"
              >
                <FileJson size={16} /> Exporter (.JSON)
              </button>
              <button 
                type="button"
                onClick={onRestart} 
                className="w-full text-slate-500 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:text-white transition-colors mt-4"
              >
                Lancer un nouvel audit
              </button>
            </div>

            {/* Signature Pédagogique (Visible à l'impression) */}
            <div className="hidden print:block text-center pt-20">
              <div className="w-32 h-1 bg-slate-200 mx-auto mb-4"></div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Certification ARGOS Socratique</p>
              <p className="text-[9px] text-slate-300 mt-1">Généré via Gemini-3-Pro-Preview</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
