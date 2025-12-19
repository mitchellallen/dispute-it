// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Download, AlertTriangle, ChevronLeft, RefreshCw } from 'lucide-react';
import { draftProtestLetter, getAIStrategyReview, getCaseScore } from '../lib/geminiService';
import { Property, EvidenceItem, StrategyItem, CaseScore } from '../lib/types';
import jsPDF from 'jspdf';

const LetterGeneratorView = () => {
  const router = useRouter();
  const [property, setProperty] = useState<Property>({ address: 'Loading...', assessedValue: 0 });
  const [evidence, setEvidence] = useState<EvidenceItem[]>([]);
  const [letter, setLetter] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [strategyReview, setStrategyReview] = useState<StrategyItem[]>([]);
  const [caseScore, setCaseScore] = useState<CaseScore>({ score: 0, summary: 'Analyzing...' });

  useEffect(() => {
    if (!router.isReady) return;
    try {
      if (router.query.property) setProperty(JSON.parse(router.query.property as string));
      if (router.query.evidence) setEvidence(JSON.parse(router.query.evidence as string));
    } catch (e) { console.error("Error parsing", e); }
  }, [router.isReady]);

  useEffect(() => {
    if (property.address !== 'Loading...' && !letter && !isGenerating) generateData();
  }, [property, evidence]);

  const generateData = async () => {
    setIsGenerating(true);
    try {
      const [draft, review, score] = await Promise.all([
        draftProtestLetter(property, evidence),
        getAIStrategyReview(property, evidence),
        getCaseScore(property, evidence)
      ]);
      setLetter(draft);
      setStrategyReview(review);
      setCaseScore(score);
    } finally { setIsGenerating(false); }
  };

  const handlePreviewAndSave = async () => {
    setIsExporting(true);
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      const maxLineWidth = pageWidth - (margin * 2);

      // --- PAGE 1: THE LETTER ---
      pdf.setFont("times", "bold").setFontSize(16);
      pdf.text("PROPERTY TAX PROTEST", pageWidth / 2, 20, { align: 'center' });
      pdf.setFontSize(10).setFont("times", "normal");
      pdf.text(`Property: ${property.address}`, margin, 35);
      pdf.text(`Requested Value: $${property.requestedValue?.toLocaleString() || "Not Specified"}`, margin, 40);
      pdf.setFont("times", "normal").setFontSize(11);
      const splitLetter = pdf.splitTextToSize(letter, maxLineWidth);
      pdf.text(splitLetter, margin, 55);

      // --- EVIDENCE PAGES ---
      evidence.forEach((item, index) => {
        pdf.addPage();
        const header = `Exhibit ${index + 1}: ${(item.title || "Evidence").toUpperCase()}`;
        
        if (item.displayType === 'document') {
          // --- LAYOUT: FULL PAGE DOCUMENT ---
          pdf.setFont("helvetica", "bold").setFontSize(12);
          pdf.text(header + " (Document)", margin, 15);
          
          if (item.attachments?.[0]?.url) {
            try {
              // Maximize image size for document
              pdf.addImage(item.attachments[0].url, 'JPEG', margin, 20, maxLineWidth, pageHeight - 40);
            } catch (e) { pdf.text("[Error rendering document]", margin, 30); }
          }
        } else {
          // --- LAYOUT: PHOTO WITH DESCRIPTION ---
          pdf.setFont("helvetica", "bold").setFontSize(14);
          pdf.text(header, margin, 20);
          
          pdf.setFont("helvetica", "normal").setFontSize(10);
          const desc = pdf.splitTextToSize(item.description || "", maxLineWidth);
          pdf.text(desc, margin, 30);
          
          // Calculate Y position after text
          const textHeight = (desc.length * 5) + 35; // approx height
          
          if (item.attachments?.[0]?.url) {
            try {
              // Full width photo, maintain aspect ratio, cap height
              const imgProps = pdf.getImageProperties(item.attachments[0].url);
              const imgHeight = (imgProps.height * maxLineWidth) / imgProps.width;
              const finalHeight = Math.min(imgHeight, 160); 
              pdf.addImage(item.attachments[0].url, 'JPEG', margin, textHeight, maxLineWidth, finalHeight);
            } catch (e) { pdf.text("[Error rendering photo]", margin, textHeight); }
          }
        }
      });

      window.open(URL.createObjectURL(pdf.output('blob')), '_blank');
    } catch (e) { alert("PDF Error"); } finally { setIsExporting(false); }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 bg-slate-50 min-h-screen text-slate-900 font-sans">
      <div className="flex justify-between items-center mb-12">
        <button onClick={() => router.back()} className="flex items-center gap-2 font-bold text-slate-500"><ChevronLeft size={20} /> Back</button>
        <p className="text-3xl font-black text-emerald-500">${((property.assessedValue - (property.requestedValue || 0)) * 0.025).toLocaleString()}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
            <h3 className="font-bold text-xs uppercase text-slate-400 mb-2">Case Strength: {caseScore.score}/100</h3>
            <div className="w-full bg-slate-100 h-3 rounded-full mb-4"><div className="bg-blue-600 h-full" style={{ width: `${caseScore.score}%` }} /></div>
            <p className="text-xs text-slate-500 font-medium">{caseScore.summary}</p>
          </div>
          <div className="bg-[#0f172a] text-white p-8 rounded-[2rem]">
            <h3 className="font-bold mb-4 text-xs uppercase flex items-center gap-2"><AlertTriangle size={16} className="text-amber-400" /> Strategy Gaps</h3>
            {strategyReview.map((s, i) => (
              <div key={i} className="mb-4 p-4 bg-slate-800 rounded-2xl"><p className="text-[10px] font-bold text-slate-500 uppercase">{s.category}</p><p className="text-sm font-medium text-slate-200">{s.rationale}</p></div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b bg-slate-50/50 flex justify-between items-center">
               <h3 className="font-black text-xl">Protest Letter</h3>
               <button onClick={handlePreviewAndSave} disabled={isExporting} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-xl hover:bg-blue-700 flex items-center gap-2">{isExporting ? <RefreshCw className="animate-spin" size={16}/> : <Download size={16}/>} Download Packet</button>
            </div>
            <div className="p-10 min-h-[500px] relative">
              {isGenerating ? <div className="absolute inset-0 flex flex-col justify-center items-center bg-white/80"><RefreshCw className="animate-spin text-blue-600" size={40}/><p className="text-xs font-black uppercase tracking-widest text-slate-400 mt-4">Drafting...</p></div> : <textarea className="w-full h-full min-h-[500px] outline-none text-slate-800 text-lg leading-relaxed font-serif bg-transparent resize-none" value={letter} onChange={(e) => setLetter(e.target.value)} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default LetterGeneratorView;