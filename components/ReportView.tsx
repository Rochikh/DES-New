import React, { useEffect, useState } from 'react';
import { AnalysisData, SessionConfig } from '../types';
import { generateAnalysis } from '../services/gemini';
import { Message } from '../types';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip } from 'recharts';
import { FileText, Printer, ShieldCheck, FileJson, Check, RefreshCw, Sparkles } from 'lucide-react';
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
      const result = await generateAnalysis(transcript, config.topic, aiDeclaration);
      setAnalysis(result);
      setLoading(false);
    };
    runAnalysis();
  }, []);

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
      analysis: analysis ? { summary: analysis.summary, score: analysis.reasoningScore } : null
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Audit_Argos_${config.studentName}.json`;
    link.click();
  };

  const handlePrint = () => {
    // Retirer le focus du bouton pour un rendu propre
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    // Appel direct à window.print() sans asynchronisme bloquant
    window.print();
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-screen bg-indigo-50/20">
      <RefreshCw className="animate-spin text-indigo-600 mb-6" size={48} />
      <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Argos génère l'audit...</h2>
      <p className="text-slate-400 text-xs mt-2 uppercase tracking-widest font-bold">Un instant, nous mesurons ton parcours</p>
    </div>
  );

  if (!analysis) return <div className="p-8 text-center font-bold">L'audit a rencontré une difficulté.</div>;

  const chartData = [
    { name: 'Raisonnement', score: analysis.reasoningScore, color: '#4f46e5' },
    { name: 'Clarté', score: analysis.clarityScore || 50, color: '#0ea5e9' },
    { name: 'Transparence', score: analysis.aiDeclarationCoherenceScore, color: '#8b5cf6' },
    { name: 'Processus', score: analysis.processScore || 50, color: '#10b981' },
  ];

  return (
    <div className="h-full bg-slate-50 p-4 sm:p-8 overflow-y-auto print:bg-white print:p-0 print:h-auto print:overflow-visible">
      <div id="printable-area" className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-700 print:space-y-4">
        
        {/* Header du rapport */}
        <header className="bg-gradient-to-br from-slate-900 to-indigo-900 text-white p-10 rounded-[2.5rem] flex justify-between items-end shadow-2xl print:rounded-none print:shadow-none print:p-6 print:bg-slate-900">
          <div>
            <div className="flex items-center gap-2 text-indigo-300 mb-2">
              <Sparkles size={16} />
              <p className="text-[10px] font-black uppercase tracking-[0.3em]">Résultat du dialogue évaluatif</p>
            </div>
            <h1 className="text-4xl font-black tracking-tighter uppercase">{config.studentName}</h1>
            <p className="text-indigo-200/60 text-sm mt-1">Sujet : {config.topic}</p>
          </div>
          <div className="text-right hidden sm:block print:block">
            <p className="text-[10px] opacity-40 uppercase font-bold tracking-widest">Date de session</p>
            <p className="text-lg font-bold">{new Date().toLocaleDateString()}</p>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 print:grid-cols-1 print:gap-4">
          <div className="lg:col-span-2 space-y-8 print:space-y-4">
            
            <section className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm print-break-avoid print:p-6">
              <h3 className="text-xs font-black text-slate-400 mb-6 uppercase tracking-widest flex items-center gap-2">
                <FileText size={16} className="text-indigo-500" /> Synthèse de la réflexion
              </h3>
              <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed text-sm italic">
                <ReactMarkdown>{analysis.summary}</ReactMarkdown>
              </div>
            </section>

            <section className="bg-indigo-50/50 p-8 rounded-[2rem] border border-indigo-100 print-break-avoid print:p-6">
              <h3 className="text-xs font-black text-indigo-900 mb-4 uppercase tracking-widest flex items-center gap-2">
                <ShieldCheck size={16} /> Audit d'Honnêteté Intellectuelle
              </h3>
              <p className="text-sm text-indigo-800 leading-relaxed mb-6 italic">"{analysis.aiUsageAnalysis}"</p>
              <div className="bg-white p-5 rounded-2xl text-[11px] font-medium border border-indigo-100">
                <span className="opacity-50 uppercase block mb-1 text-[9px] font-black text-slate-400 tracking-widest">Ta déclaration :</span>
                <span className="text-slate-700 italic">{aiDeclaration}</span>
              </div>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:grid-cols-2">
              <div className="bg-emerald-50 p-6 rounded-[2rem] border border-emerald-100 print-break-avoid">
                <h4 className="font-black text-emerald-900 text-[10px] uppercase mb-4 tracking-widest">Points de Force</h4>
                <ul className="space-y-3">
                  {analysis.keyStrengths.map((s, i) => (
                    <li key={i} className="text-xs text-emerald-800 flex gap-2 font-medium">
                      <Check size={14} className="shrink-0 mt-0.5 text-emerald-500" /> {s}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-indigo-50/30 p-6 rounded-[2rem] border border-indigo-100 print-break-avoid">
                <h4 className="font-black text-indigo-900 text-[10px] uppercase mb-4 tracking-widest">Pistes de Progrès</h4>
                <ul className="space-y-3">
                  {analysis.weaknesses.map((w, i) => (
                    <li key={i} className="text-xs text-indigo-800 flex gap-2 font-medium">
                      <span className="text-indigo-400 font-black shrink-0">→</span> {w}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="space-y-6 print:space-y-4">
            <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm print-break-avoid print:p-6">
              <h3 className="text-[10px] font-black text-center uppercase text-slate-400 mb-8 tracking-[0.2em]">Profil de Pensée Critique</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 0, right: 0, left: -40, bottom: 20 }}>
                    <XAxis dataKey="name" tick={{fontSize: 9, fontWeight: 700}} axisLine={false} tickLine={false} interval={0} angle={-45} textAnchor="end" />
                    <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                    <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '16px', border: 'none'}} />
                    <Bar dataKey="score" radius={[12, 12, 12, 12]} barSize={24}>
                      {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-slate-900 p-8 rounded-[2rem] space-y-4 shadow-2xl no-print">
              <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2 text-center">Exportation & Partage</h3>
              <button 
                type="button"
                onClick={handlePrint} 
                className="w-full flex items-center justify-center gap-3 bg-white text-slate-900 py-4 rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-indigo-50 transition-all shadow-lg group"
              >
                <Printer size={16} className="group-hover:text-indigo-600" /> Enregistrer / Imprimer
              </button>
              <button 
                type="button"
                onClick={downloadJSON} 
                className="w-full flex items-center justify-center gap-3 bg-indigo-600 text-white py-4 rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-indigo-700 transition-all"
              >
                <FileJson size={16} /> Fichier Source (.JSON)
              </button>
              <button 
                type="button"
                onClick={onRestart} 
                className="w-full text-slate-400 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest hover:text-white transition-colors"
              >
                Nouvelle Session
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};