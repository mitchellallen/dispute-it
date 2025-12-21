// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { Download, AlertTriangle, ArrowLeft, Wand2, FileText, Loader2, Sparkles, RefreshCw, PenTool, RotateCcw } from 'lucide-react';
import { getAIStrategyReview, getCaseScore, analyzeDocument, getLetterSuggestions } from '../lib/geminiService';
import EvidenceCard, { EvidenceItem } from '../components/EvidenceCard';
import SignatureCanvas from 'react-signature-canvas';

const generateUniqueId = () => `_${Math.random().toString(36).substr(2, 9)}`;

export default function LetterPage() {
  const router = useRouter();
  const letterTextAreaRef = useRef<HTMLTextAreaElement>(null);
  const sigPad = useRef<any>(null);
  
  const [property, setProperty] = useState<any>(null);
  const [evidence, setEvidence] = useState<EvidenceItem[]>([]);
  const [ownerName, setOwnerName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [taxedValue, setTaxedValue] = useState('');
  const [proposedValue, setProposedValue] = useState('');
  const [recipientInfo, setRecipientInfo] = useState("County Appraisal District\nAttn: Protest Department\n[Street Address]\n[City, State ZIP]");
  const [letterBody, setLetterBody] = useState("");
  const [signatureImage, setSignatureImage] = useState<string | null>(null);

  const [strategyGaps, setStrategyGaps] = useState<any[]>([]);
  const [caseStrength, setCaseStrength] = useState({ score: 0, summary: "Pending analysis..." });
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isAnalyzingText, setIsAnalyzingText] = useState(false);

  // --- Helper: Format numbers with commas as user types ---
  const formatNumberWithCommas = (val: string) => {
    const numericValue = val.replace(/[^0-9]/g, '');
    if (!numericValue) return '';
    return new Intl.NumberFormat('en-US').format(parseInt(numericValue));
  };

  useEffect(() => {
    if (letterTextAreaRef.current) {
      letterTextAreaRef.current.style.height = 'auto';
      letterTextAreaRef.current.style.height = `${letterTextAreaRef.current.scrollHeight}px`;
    }
  }, [letterBody]);

  useEffect(() => {
    if (!router.isReady) return;
    if (router.query.property) {
      try {
        const parsedProp = JSON.parse(router.query.property as string);
        setProperty(parsedProp);
        if (parsedProp.assessedValue && parsedProp.assessedValue > 0) {
            setTaxedValue(formatNumberWithCommas(parsedProp.assessedValue.toString()));
            const defaultProposed = Math.floor(parsedProp.assessedValue * 0.85).toString();
            setProposedValue(formatNumberWithCommas(defaultProposed));
        }
        if (parsedProp.address.toLowerCase().includes("dallas")) {
            setRecipientInfo("Dallas Central Appraisal District\nAttn: Protest Department\n2949 N. Stemmons Freeway\nDallas, TX 75247");
        }
        const initialValueStr = parsedProp.assessedValue ? Math.floor(parsedProp.assessedValue * 0.85).toLocaleString() : "_______";
        setLetterBody(`This letter serves as a formal protest of the ${new Date().getFullYear()} assessed value of the property located at ${parsedProp.address}. \n\nI am protesting on the grounds that the appraised value is unequal compared to similarly situated properties in this specific neighborhood and exceeds the true market value.\n\nMy proposed value, based on current condition, necessary repairs, and local market adjustments, is $${initialValueStr}.\n\nThe current assessment does not accurately reflect specific condition issues and deferred maintenance that negatively impact marketability. I have attached a detailed evidence packet supporting this claim.`);
      } catch (e) { console.error("Prop parse error", e); }
    }
    if (router.query.evidence) {
      try { setEvidence(JSON.parse(router.query.evidence as string)); } catch (e) {}
    }
  }, [router.isReady]);

  useEffect(() => {
    if (!proposedValue) return;
    setLetterBody(prev => prev.replace(/is \$\s?([0-9,]+|_+)/, `is $${proposedValue}`));
  }, [proposedValue]);

  useEffect(() => {
    if (property) runFullAnalysis();
  }, [evidence.length, property]);

  const runFullAnalysis = async () => {
    setIsAnalyzingText(true);
    const gaps = await getAIStrategyReview(property, evidence);
    setStrategyGaps(gaps);
    const strength = await getCaseScore(property, evidence);
    setCaseStrength(strength);
    const feedback = await getLetterSuggestions(letterBody);
    if (feedback && feedback.suggestions) setAiSuggestions(feedback.suggestions);
    setIsAnalyzingText(false);
  };

  const handleDownloadPacket = () => { window.print(); };
  const saveSignature = () => { if (sigPad.current) setSignatureImage(sigPad.current.getTrimmedCanvas().toDataURL('image/png')); };
  const clearSignature = () => { if (sigPad.current) { sigPad.current.clear(); setSignatureImage(null); } };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsScanning(true);
    const reader = new FileReader();
    reader.onload = async (re) => {
      const base64Data = re.target?.result as string;
      const suggestion = await analyzeDocument(base64Data, file.type);
      const newItem: EvidenceItem = {
        id: generateUniqueId(),
        title: suggestion.docType,
        description: suggestion.description,
        attachments: [{ url: base64Data, type: 'photo' }],
        displayType: 'photo'
      };
      setEvidence(prev => [...prev, newItem]);
      setIsScanning(false);
    };
    reader.readAsDataURL(file);
    e.target.value = ""; 
  };

  const deleteItem = (id: string) => setEvidence(prev => prev.filter(i => i.id !== id));
  const updateItem = (id: string, updated: EvidenceItem) => setEvidence(prev => prev.map(i => i.id === id ? updated : i));

  return (
    <>
    {/* REINFORCED PRINT STYLES TO KILL HEADERS/FOOTERS AND FIX COLOR ERRORS */}
<style dangerouslySetInnerHTML={{ __html: `
  @page {
    size: auto;
    /* This margin must be 0 to force the URL and Date to disappear */
    margin: 0mm !important; 
  }
  @media print {
    html, body {
        background-color: #ffffff !important;
        color: #000000 !important;
        /* Standardizing colors to prevent "lab" parsing errors */
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
    }
    body {
        margin: 0;
        padding: 0;
    }
    .print-only-doc {
        display: block !important;
        /* We manually add the 20mm margin back here so the text doesn't hit the edge */
        padding: 20mm !important; 
        min-height: 297mm;
        box-sizing: border-box;
    }
    /* Ensure no web UI elements leak into the print */
    .print-hide, .print\\:hidden { display: none !important; }
    
    /* Shield against modern color functions that crash iOS PDF renders */
    * { 
      color: #000000 !important; 
      border-color: #000000 !important; 
      background: transparent !important; 
    }
  }
`}} />

    {/* APP VIEW (SCREEN) */}
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20 print:hidden">
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20 px-6 py-4 flex justify-between items-center shadow-sm">
        <button onClick={() => router.back()} className="flex items-center text-slate-500 hover:text-slate-900 font-bold gap-2 text-sm">
           <ArrowLeft size={16} /> Back
        </button>
        
        <div className="flex items-center gap-6">
          {/* RE-SCAN STATUS INDICATOR */}
          <div className="text-right hidden md:block border-r border-slate-200 pr-6">
            <div className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">AI Analysis</div>
            <button 
              onClick={runFullAnalysis}
              disabled={isAnalyzingText}
              className="text-xs font-bold text-slate-600 flex items-center justify-end gap-1.5 hover:text-blue-600 transition-colors group disabled:opacity-50"
            >
              {isAnalyzingText ? (
                <><Loader2 size={12} className="animate-spin text-blue-500"/> Analyzing...</>
              ) : (
                <>
                  <RefreshCw size={12} className="group-hover:rotate-180 transition-transform duration-500"/>
                  Up to Date
                </>
              )}
            </button>
          </div>
          
          <button onClick={handleDownloadPacket} className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-blue-700 transition shadow-md">
            <Download size={18} /> Download Packet
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2 text-sm uppercase tracking-wide">
                    <FileText size={16} className="text-blue-500" /> Letter Details
                </h3>
                <div className="space-y-4">
                    <div>
                        <label className="text-[10px] uppercase font-bold text-slate-400">Recipient District</label>
                        <textarea 
                          data-lpignore="true" data-form-type="other" spellCheck={false}
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium outline-none h-20 resize-none" 
                          value={recipientInfo} 
                          onChange={(e) => setRecipientInfo(e.target.value)} 
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[10px] uppercase font-bold text-slate-400">Owner Name</label>
                            <input 
                              data-lpignore="true" data-form-type="other" spellCheck={false} autoComplete="off" 
                              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm font-bold outline-none" 
                              placeholder="Enter Name" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} 
                            />
                        </div>
                        <div>
                             <label className="text-[10px] uppercase font-bold text-slate-400">Account #</label>
                             <input 
                               data-lpignore="true" data-form-type="other" spellCheck={false} autoComplete="off" 
                               className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm font-bold outline-none" 
                               placeholder="Enter Account" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} 
                             />
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] uppercase font-bold text-slate-400">Taxed Value</label>
                        <div className="relative">
                            <span className="absolute left-3 top-2 text-slate-400 font-bold">$</span>
                            <input 
                              data-lpignore="true" data-form-type="other" spellCheck={false} autoComplete="off"
                              className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-6 pr-3 py-2 text-sm font-bold outline-none" 
                              value={taxedValue} 
                              onChange={(e) => setTaxedValue(formatNumberWithCommas(e.target.value))} 
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] uppercase font-bold text-slate-400">Proposed Value</label>
                        <div className="relative">
                            <span className="absolute left-3 top-2 text-slate-400 font-bold">$</span>
                            <input 
                              data-lpignore="true" data-form-type="other" spellCheck={false} autoComplete="off"
                              className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-6 pr-3 py-2 text-sm font-bold text-green-600 outline-none" 
                              value={proposedValue} 
                              onChange={(e) => setProposedValue(formatNumberWithCommas(e.target.value))} 
                            />
                        </div>
                    </div>
                    
                    <div className="pt-2 border-t border-slate-100">
                        <label className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1 mb-2"><PenTool size={10}/> Draw Signature</label>
                        <div className="border border-slate-300 rounded-xl bg-slate-50 overflow-hidden">
                            <SignatureCanvas ref={sigPad} penColor='black' canvasProps={{width: 300, height: 100, className: 'sigCanvas w-full'}} onEnd={saveSignature} />
                        </div>
                        <button onClick={clearSignature} className="mt-2 text-[9px] font-bold text-slate-400 flex items-center gap-1 hover:text-red-500 transition"><RotateCcw size={10}/> Clear Signature</button>
                    </div>
                </div>
            </div>

            <div className="bg-[#0f172a] text-white p-6 rounded-3xl shadow-xl border border-slate-800">
                 <div className="mb-6 pb-6 border-b border-slate-700">
                    <div className="flex justify-between items-end mb-2">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Case Strength</span>
                        <span className={`text-2xl font-black ${caseStrength.score > 70 ? 'text-[#4ade80]' : 'text-[#facc15]'}`}>{caseStrength.score}/100</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2">
                        <div className={`h-2 rounded-full transition-all duration-1000 ${caseStrength.score > 70 ? 'bg-[#4ade80]' : 'bg-[#facc15]'}`} style={{ width: `${caseStrength.score}%` }}></div>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-2 italic">{caseStrength.summary}</p>
                 </div>
                 <h3 className="font-bold text-[#fcd34d] mb-4 flex items-center gap-2 text-xs uppercase tracking-widest"><AlertTriangle size={14} /> Strategy Gaps</h3>
                 <div className="space-y-3">
                    {strategyGaps.map((gap, i) => (
                        <div key={i} className="bg-slate-800/50 p-3 rounded-xl border border-slate-700">
                            <div className="font-bold text-sm text-white mb-1">{gap.category}</div>
                            <div className="text-[11px] text-slate-400 leading-relaxed">{gap.rationale}</div>
                        </div>
                    ))}
                 </div>
            </div>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 lg:col-span-2 relative">
            <div className="font-serif text-slate-800 text-sm leading-7 max-w-2xl mx-auto mt-4">
                <div className="text-right mb-8 opacity-60">{new Date().toLocaleDateString()}</div>
                <div className="mb-6 whitespace-pre-wrap">{recipientInfo}</div>
                <div className="mb-6 font-bold bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <p>RE: Property Tax Protest</p>
                    <div className="flex items-center gap-2">
                        <span>Account Number:</span>
                        <input 
                          data-lpignore="true" data-form-type="other" spellCheck={false}
                          className="bg-white border border-slate-300 rounded px-2 py-0.5 text-blue-600 w-40 outline-none" 
                          value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} 
                        />
                    </div>
                    <p>Property Address: {property?.address}</p>
                </div>
                <p className="mb-4">To Whom It May Concern,</p>
                <textarea 
                    ref={letterTextAreaRef}
                    data-lpignore="true" data-form-type="other" spellCheck={false}
                    className="w-full min-h-[300px] resize-none p-4 rounded-xl border border-slate-300 hover:border-blue-300 focus:border-blue-400 focus:bg-blue-50/10 outline-none transition-all font-serif leading-7 text-slate-800 overflow-hidden"
                    value={letterBody}
                    onChange={(e) => setLetterBody(e.target.value)}
                />
                <div className="mt-8">
                    <p>Sincerely,</p>
                    {signatureImage ? <img src={signatureImage} alt="Signature" className="h-12 w-auto mt-2" /> : <div className="h-10 mt-2"></div>}
                    <p className="font-bold text-lg">{ownerName || "[Owner Name]"}</p>
                    <p className="text-xs text-slate-400">Property Owner</p>
                </div>
            </div>

            <div className="mt-16 pt-8 border-t-2 border-dashed border-slate-200">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2"><Wand2 size={20} className="text-blue-600" /> Evidence Packet</h3>
                    <label className="cursor-pointer bg-slate-900 text-white px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition hover:bg-slate-800">
                         + Add Evidence
                        <input type="file" className="hidden" onChange={handleFileUpload} accept="image/*" />
                    </label>
                </div>
                <div className="space-y-4">
                    {evidence.map((item) => (
                        <EvidenceCard key={item.id} item={item} onDelete={deleteItem} onUpdate={updateItem} />
                    ))}
                </div>
            </div>
        </div>
      </div>
    </div>

    {/* PRINT VIEW (PHANTOM DOC) */}
    <div className="hidden print:block bg-white print-only-container">
        <div className="min-h-[290mm] relative">
            <div className="text-right mb-12 text-sm text-black">{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
            <div className="mb-10 whitespace-pre-wrap leading-6 text-black">{recipientInfo}</div>
            <div className="mb-8 font-bold border-l-4 border-black pl-4 py-2">
                <p>Property Tax Protest</p>
                <p>Account Number: {accountNumber || "____________________"}</p>
                <p>Property Address: {property?.address}</p>
            </div>
            <p className="mb-6 text-black">To Whom It May Concern,</p>
            <div className="whitespace-pre-wrap mb-12 text-justify leading-7 text-black">{letterBody}</div>
            <div className="mt-16">
                <p className="mb-4 text-black">Sincerely,</p>
                {signatureImage && <img src={signatureImage} className="h-16 w-auto mb-2" />}
                <div className="border-b border-black w-64 mb-2"></div>
                <p className="font-bold text-lg text-black">{ownerName || "[Owner Name]"}</p>
                <p className="text-sm text-black">Property Owner</p>
            </div>
        </div>
        <div className="break-before-page"></div>
        <div>
            <h1 className="text-2xl font-bold border-b-2 border-black pb-2 mb-8 uppercase tracking-widest text-black">Evidence Appendix</h1>
            <div className="space-y-10">
                {evidence.map((item, index) => (
                    <div key={item.id} className="break-inside-avoid mb-10 border-b border-gray-400 pb-10 last:border-0">
                        <div className="flex items-start gap-2 mb-4">
                            <span className="bg-black text-white font-bold px-2 py-1 text-sm rounded">Ex. {index + 1}</span>
                            <h3 className="text-xl font-bold text-black">{item.title}</h3>
                        </div>
                        <p className="mb-6 text-black italic border-l-2 border-gray-400 pl-4">{item.description}</p>
                        <div className="grid grid-cols-2 gap-4">
                            {item.attachments && item.attachments.map((att, i) => (
                                <div key={i} className="border border-gray-400 p-2">
                                    <img src={att.url} className="w-full h-auto object-contain max-h-[300px]" />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
    </>
  );
}