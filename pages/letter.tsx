import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { 
  Download, RefreshCw, CheckCircle, 
  AlertTriangle, Copy, FileText, ChevronDown, Trash2, Plus, ChevronLeft, ImagePlus, X, Save
} from 'lucide-react';
import { 
  draftProtestLetter, 
  getAIStrategyReview, 
  getCaseScore, 
  refineText 
} from '../lib/geminiService';
import { Property, EvidenceItem, StrategyItem, Comp } from '../lib/types';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

// PDF Generation Libraries
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface CaseScore {
  score: number;
  summary: string;
}

const LetterGeneratorView: React.FC = () => {
  const router = useRouter();

  // --- 1. State Management ---
  const [property, setProperty] = useState<Property>({ 
    address: 'Loading...', assessedValue: 0, sqft: 1500
  });
  const [evidence, setEvidence] = useState<EvidenceItem[]>([]);
  const [requestedValue, setRequestedValue] = useState(0);
  
  const [letter, setLetter] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [strategyReview, setStrategyReview] = useState<StrategyItem[]>([]);
  const [caseScore, setCaseScore] = useState<CaseScore>({ score: 0, summary: 'Analyzing...' });
  const [aiRefining, setAiRefining] = useState(false);

  // --- 2. Load Data from URL ---
  useEffect(() => {
    if (router.isReady) {
      if (router.query.property) {
        try {
          const p = JSON.parse(router.query.property as string) as Property;
          setProperty(p);
          if (requestedValue === 0) setRequestedValue(p.assessedValue * 0.9);
        } catch (e) { console.error("Error parsing property:", e); }
      }
      
      if (router.query.evidence) {
        try {
          const e = JSON.parse(router.query.evidence as string) as EvidenceItem[];
          setEvidence(e);
        } catch (e) { console.error("Error parsing evidence:", e); }
      }

      if (router.query.requestedValue) {
        setRequestedValue(Number(router.query.requestedValue));
      }
    }
  }, [router.isReady, router.query]);

  // --- 3. Generation Logic ---
  useEffect(() => {
    if (property.address !== 'Loading...' && !letter && !isGenerating) {
      generateData();
    }
  }, [property]);

  const estimatedSavings = property && property.assessedValue 
    ? Math.max(0, (property.assessedValue - requestedValue) * 0.025) 
    : 0;

  const generateData = async () => {
    setIsGenerating(true);
    try {
      const mockComps: Comp[] = [{
          address: "Neighbor A",
          assessedValue: property.assessedValue * 0.9,
          sqft: (property.sqft || 1500) * 1.05,
          distance: 0.2,
          valuePerSqft: (property.assessedValue * 0.9) / ((property.sqft || 1500) * 1.05),
      }];

      const content = await draftProtestLetter({ ...property, requestedValue }, mockComps, evidence);
      setLetter(content || '');
      
      const review = await getAIStrategyReview(property, evidence);
      setStrategyReview(Array.isArray(review) ? review : []);
      
      const scoreData = await getCaseScore(property, evidence);
      setCaseScore(scoreData);
    } catch (err) {
      console.error("Generation failed:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  // --- 4. Main Actions ---

  const handleSaveToFirebase = async () => {
    setIsSaving(true);
    try {
      await addDoc(collection(db, "cases"), {
        property,
        evidence,
        letter,
        requestedValue,
        estimatedSavings,
        createdAt: serverTimestamp(),
        status: 'Draft'
      });
      alert("Case saved to Dashboard!");
      router.push('/dashboard');
    } catch (error) {
      console.error("Firebase Save Error:", error);
      alert("Error saving. Please check your Firebase config.");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreviewAndSave = async () => {
    setIsExporting(true);
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      
      pdf.setFont("times", "bold");
      pdf.setFontSize(16);
      pdf.text("OFFICIAL PROPERTY TAX PROTEST", 105, 20, { align: 'center' });
      
      pdf.setFontSize(10);
      pdf.setFont("times", "normal");
      pdf.text(`Property: ${property.address}`, 20, 35);
      pdf.text(`Assessment: $${property.assessedValue.toLocaleString()}`, 20, 40);
      pdf.text(`Requested: $${requestedValue.toLocaleString()}`, 20, 45);

      const splitLetter = pdf.splitTextToSize(letter, pageWidth - 40);
      pdf.text(splitLetter, 20, 60);

      for (const item of evidence) {
        pdf.addPage();
        pdf.setFont("helvetica", "bold").setFontSize(14);
        pdf.text(item.category.toUpperCase(), 20, 20);
        pdf.setFont("helvetica", "normal").setFontSize(10);
        const splitRationale = pdf.splitTextToSize(item.userRationale, pageWidth - 40);
        pdf.text(splitRationale, 20, 30);
        
        if (item.attachments?.[0]?.url) {
          try {
            pdf.addImage(item.attachments[0].url, 'JPEG', 20, 55, 170, 110, undefined, 'FAST');
          } catch (e) { console.error("PDF Image Error", e); }
        }
      }
      
      const blob = pdf.output('blob');
      window.open(URL.createObjectURL(blob), '_blank');
    } catch (error) { console.error("PDF Error", error); } finally { setIsExporting(false); }
  };

  const handleRefinement = async (instruction: string) => {
    setAiRefining(true);
    try {
      const newText = await refineText(letter, instruction);
      setLetter(newText);
    } catch (err) { console.error(err); } finally { setAiRefining(false); }
  };

  const handleInlineUpload = (e: React.ChangeEvent<HTMLInputElement>, itemId: string) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (re) => {
        const base64Data = re.target?.result as string;
        setEvidence(prev => prev.map(item => 
          item.id === itemId 
            ? { ...item, attachments: [{ name: file.name, url: base64Data, type: 'photo', mimeType: file.type }] } 
            : item
        ));
      };
      reader.readAsDataURL(file);
    }
  };

  const updateEvidence = (id: string, field: string, value: string) => {
    setEvidence(prev => prev.map(ev => ev.id === id ? {...ev, [field]: value} : ev));
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 bg-slate-50 min-h-screen">
      
      {/* 1. NAVIGATION */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold">
          <ChevronLeft size={20} /> Back to Evidence
        </button>
        
        <div className="flex items-center gap-4">
          {['Property', 'Evidence', 'Finalize'].map((label, i) => (
            <React.Fragment key={i}>
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${i === 2 ? 'bg-blue-600 text-white' : 'bg-emerald-500 text-white'}`}>
                  {i < 2 ? <CheckCircle size={16} /> : (i + 1)}
                </div>
                <span className={`text-xs font-black uppercase tracking-widest ${i === 2 ? 'text-blue-600' : 'text-slate-400'}`}>{label}</span>
              </div>
              {i < 2 && <div className="w-8 h-[2px] bg-slate-200" />}
            </React.Fragment>
          ))}
        </div>
        <div className="w-32 hidden md:block" />
      </div>

      {/* 2. HEADER */}
      <div className="flex justify-between items-center mb-8 text-slate-900">
        <div>
          <h1 className="text-3xl font-extrabold flex items-center gap-3"><FileText className="text-blue-600" /> Final Protest Packet</h1>
          <p className="text-slate-500 uppercase text-xs font-bold tracking-widest mt-1">{property.address}</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Est. Tax Savings</p>
          <p className="text-3xl font-black text-emerald-500">${estimatedSavings.toLocaleString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT PANEL */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-end mb-4">
              <h3 className="font-bold">Case Strength</h3>
              <span className="text-2xl font-black text-blue-600">{caseScore.score}/100</span>
            </div>
            <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
              <div className="bg-blue-600 h-full transition-all duration-1000" style={{ width: `${caseScore.score}%` }} />
            </div>
            <p className="text-xs text-slate-500 mt-2">{caseScore.summary}</p>
          </div>

          <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl">
            <h3 className="font-bold mb-6 flex items-center gap-2"><AlertTriangle className="text-amber-400" size={18}/> Strategy Gaps</h3>
            <div className="space-y-4">
              {strategyReview.map((item, idx) => (
                <div key={idx} className="p-4 bg-slate-800 rounded-2xl border border-slate-700">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">{item.category}</span>
                  <p className="text-sm font-medium mt-1">{item.rationale}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
            <div className="bg-slate-50 border-b border-slate-200 p-4 flex justify-between items-center">
              <div className="flex gap-2">
                <button onClick={() => handleRefinement("Make it more assertive")} className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-blue-50 transition-all">Make Assertive</button>
                <button onClick={() => handleRefinement("Focus on repairs")} className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-blue-50 transition-all">Focus on Repairs</button>
              </div>
              <div className="flex gap-3">
                <button onClick={handleSaveToFirebase} disabled={isSaving} className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-6 py-2 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all disabled:opacity-50">
                  <Save size={16} /> {isSaving ? 'Saving...' : 'Save Draft'}
                </button>
                <button onClick={handlePreviewAndSave} disabled={isExporting} className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-700 disabled:opacity-50 transition-all">
                  <Download size={16} /> {isExporting ? 'Exporting...' : 'Preview PDF'}
                </button>
              </div>
            </div>

            <div className="p-8">
              {isGenerating || aiRefining ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <RefreshCw className="animate-spin text-blue-600 mb-4" size={32} />
                  <p className="font-bold text-slate-600">Processing...</p>
                </div>
              ) : (
                <textarea className="w-full min-h-[600px] p-2 resize-none outline-none text-slate-800 text-lg leading-relaxed font-serif bg-transparent" value={letter} onChange={(e) => setLetter(e.target.value)} />
              )}
            </div>
          </div>

          <div className="mt-12">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Evidence ({evidence.length})</h3>
              <button onClick={() => router.back()} className="flex items-center gap-2 text-blue-600 text-sm font-black bg-blue-50 px-4 py-2 rounded-xl hover:bg-blue-100 transition-all"><Plus size={16} /> Add More</button>
            </div>
            
            <div className="grid grid-cols-1 gap-6">
              {evidence.map((item) => (
                <div key={item.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex gap-6 relative group transition-all hover:border-blue-300">
                  <button onClick={() => setEvidence(prev => prev.filter(ev => ev.id !== item.id))} className="absolute top-4 right-4 p-2 text-slate-300 hover:text-red-500 transition-all"><Trash2 size={20} /></button>
                  
                  <div className="w-32 h-32 bg-slate-100 rounded-2xl flex-shrink-0 overflow-hidden border border-slate-200 relative">
                    {item.attachments?.[0] ? (
                      <img src={item.attachments[0].url} className="w-full h-full object-cover" alt="Evidence" />
                    ) : (
                      <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-slate-200 transition-colors">
                        <ImagePlus className="text-slate-400 mb-1" size={24} />
                        <span className="text-[10px] font-bold text-slate-500 uppercase text-center px-2">Add Photo</span>
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleInlineUpload(e, item.id)} />
                      </label>
                    )}
                  </div>
                  
                  <div className="flex-grow pr-10">
                    <input type="text" className="font-bold text-slate-900 bg-transparent border-none focus:ring-0 p-0 text-xl w-full mb-1" value={item.category} onChange={(e) => updateEvidence(item.id, 'category', e.target.value)} />
                    <textarea className="text-slate-600 text-sm w-full bg-transparent border-none focus:ring-0 p-0 resize-none leading-relaxed" rows={3} value={item.userRationale} onChange={(e) => updateEvidence(item.id, 'userRationale', e.target.value)} />
                    {item.amount && <div className="mt-2 text-blue-600 font-bold text-xs bg-blue-50 px-2 py-1 rounded inline-block">Estimated Cost: ${item.amount}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LetterGeneratorView;