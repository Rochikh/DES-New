
import React, { useEffect, useState } from 'react';
import { AnalysisData, SessionConfig, CriterionStatus } from '../types';
import { generateAnalysis } from '../services/gemini';
import { Message } from '../types';
import { Printer, RefreshCw, Sparkles, Quote, Target, RotateCcw, Box, ArrowRight, Download } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

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

  const handleExportJSON = () => {
    const data = {
      metadata: {
        student: config.studentName,
        topic: config.topic,
        mode: config.mode,
        date: new Date().toISOString()
      },
      transcript: transcript,
      aiDeclaration: aiDeclaration,
      analysis: analysis
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Audit_Argos_${config.studentName}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => { runAnalysis(); }, []);

  const getStatusColor = (status: CriterionStatus) => {
    switch (status) {
      case CriterionStatus.STRESS_TESTE: return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case CriterionStatus.ETAYE: return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case CriterionStatus.EVOQUE: return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-slate-100 text-slate-500 border-slate-200';
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-screen bg-slate-50">
      <RefreshCw className="animate-spin text-indigo-600 mb-6" size={48} />
      <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Compilation de l'audit...</h2>
      <p className="text-slate-400 text-xs font-bold mt-2 uppercase">Génération par Gemini 3 Pro</p>
    </div>
  );

  if (error || !analysis) return (
    <div className="flex flex-col items-center justify-center h-screen p-8 text-center space-y-6">
      <h2 className="text-2xl font-black text-slate-900 uppercase">Erreur d'Audit</h2>
      <p className="text-slate-600 max-w-md">{error}</p>
      <button onClick={runAnalysis} className="flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase"><RotateCcw size={18} /> Réessayer</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-white p-4 sm:p-12 print:p-0">
      <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in duration-700 print:space-y-8">
        
        {/* HEADER */}
        <header className="bg-slate-900 text-white p-10 rounded-[2.5rem] shadow-xl flex flex-col md:flex-row justify-between items-start gap-8 print:bg-slate-50 print:text-slate-900 print:rounded-xl print:shadow-none print:border-2 print:border-slate-200 print:p-8">
          <div className="space-y-4">
            <div className="flex items-center gap-4 text-indigo-400 print:text-indigo-600">
              <Sparkles size={24} />
              <p className="text-[10px] font-black uppercase tracking-[0.6em]">Audit Cognitif Argos</p>
            </div>
            <h1 className="text-5xl font-black tracking-tighter uppercase leading-none print:text-3xl">{config.studentName}</h1>
            <p className="text-slate-400 text-lg font-bold uppercase print:text-slate-600">{config.topic}</p>
          </div>
          <div className="flex flex-col sm:flex-row md:flex-col gap-3 no-print">
            <button 
              onClick={() => window.print()} 
              className="flex items-center justify-center gap-3 bg-white text-slate-900 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-50 transition-all shadow-lg active:scale-95"
            >
              <Printer size={16} /> Imprimer / PDF
            </button>
            <button 
              onClick={handleExportJSON} 
              className="flex items-center justify-center gap-3 bg-slate-800 text-indigo-300 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-700 transition-all border border-slate-700 active:scale-95"
            >
              <Download size={16} /> Exporter .JSON
            </button>
            <button 
              onClick={onRestart} 
              className="flex items-center justify-center gap-3 bg-slate-800 text-slate-400 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:text-white transition-all active:scale-95"
            >
              <RotateCcw size={16} /> Nouveau
            </button>
          </div>
        </header>

        {/* RÉSUMÉ */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 print:grid-cols-1 print:gap-4">
          <div className="bg-indigo-50 p-8 rounded-[2rem] border border-indigo-100 print:rounded-xl print:p-6">
            <h3 className="text-[10px] font-black text-indigo-900 uppercase tracking-widest mb-4">Acquis du dialogue</h3>
            <p className="text-sm text-indigo-800 leading-relaxed font-medium">{analysis.summary.built}</p>
          </div>
          <div className="bg-rose-50 p-8 rounded-[2rem] border border-rose-100 print:rounded-xl print:p-6">
            <h3 className="text-[10px] font-black text-rose-900 uppercase tracking-widest mb-4">Points d'instabilité</h3>
            <ul className="space-y-2">
              {analysis.summary.unstable.map((u, i) => <li key={i} className="text-sm text-rose-800 flex gap-2"><span>•</span> {u}</li>)}
            </ul>
          </div>
          <div className="bg-slate-900 p-8 rounded-[2rem] text-white print:bg-slate-50 print:text-slate-900 print:border-2 print:border-slate-200 print:rounded-xl print:p-6">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 print:text-slate-500">Prochaine étape</h3>
            <p className="text-sm leading-relaxed font-bold">{analysis.summary.nextStep}</p>
          </div>
        </section>

        {/* CARTE D'ARGUMENTATION */}
        <section className="bg-slate-50 p-10 rounded-[2.5rem] border border-slate-200 print:bg-white print:p-8 print:rounded-xl print:border-2 print:break-inside-avoid">
          <div className="flex items-center gap-3 mb-8">
            <Box className="text-slate-900" size={24} />
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Structure du raisonnement</h3>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 print:grid-cols-1">
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 print:border-slate-300">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Thèse (Claim)</span>
                <p className="text-sm font-bold text-slate-900">{analysis.argumentMap.claim}</p>
              </div>
            </div>
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100 print:border-emerald-300">
                <span className="text-[9px] font-black text-emerald-900 uppercase tracking-widest block mb-2">Preuves</span>
                <ul className="text-xs space-y-2 text-emerald-800">
                  {analysis.argumentMap.evidence.map((e, i) => <li key={i}>• {e}</li>)}
                </ul>
              </div>
            </div>
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-indigo-900 p-6 rounded-2xl text-white print:bg-slate-100 print:text-slate-900 print:border-slate-300">
                <span className="text-[9px] font-black text-indigo-300 uppercase tracking-widest block mb-2 print:text-slate-500">Condition de réfutation</span>
                <p className="text-xs italic leading-relaxed">{analysis.argumentMap.falsifier}</p>
              </div>
            </div>
          </div>
        </section>

        {/* CRITÈRES */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 mb-8 px-4">
            <Target className="text-slate-900" size={24} />
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Analyse par Dimension</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 print:grid-cols-1">
            {Object.entries(analysis.criteria).map(([key, trace]: [string, any]) => (
              <div key={key} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col justify-between print:rounded-xl print:p-6 print:border-2 print:break-inside-avoid">
                <div>
                  <div className="flex justify-between items-start mb-6">
                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-tighter w-2/3">
                      {key === 'premises' ? 'Questionnement des prémisses' : 
                       key === 'evidence' ? 'Usage des preuves' : 
                       key === 'bias' ? 'Gestion des biais' : 
                       key === 'decentering' ? 'Décentrement' : 
                       key === 'logic' ? 'Rigueur logique' : 'Honnêteté intellectuelle'}
                    </h4>
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase border ${getStatusColor(trace.status)}`}>
                      {trace.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="space-y-4 mb-6">
                    {trace.evidenceQuotes.map((q: string, i: number) => (
                      <p key={i} className="text-xs italic text-slate-500 border-l-2 border-slate-200 pl-4">"{q}"</p>
                    ))}
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed font-medium mb-6">{trace.expertObservation}</p>
                </div>
                <div className="pt-6 border-t border-slate-100 flex items-center gap-3">
                  <ArrowRight size={16} className="text-indigo-600" />
                  <p className="text-xs font-bold text-indigo-600">{trace.nextMove}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FOOTER PDF */}
        <footer className="pt-20 border-t border-slate-100 text-center opacity-30 print:opacity-100 print:pt-10">
           <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] print:text-slate-600">Document Certifié par le Système Argos Socratique</p>
        </footer>
      </div>
    </div>
  );
};
