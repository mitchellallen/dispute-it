// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Trash2, ImagePlus, Loader2, Wand2, TrendingDown, MapPin, FileText, X, FileText as FileIcon, Image as ImageIcon } from 'lucide-react';
import { analyzeDocument, getNeighborhoodTrends } from '../lib/geminiService';
import { Property, EvidenceItem, Trend } from '../lib/types';

const generateUniqueId = () => `_${Math.random().toString(36).substr(2, 9)}`;

const EvidenceBuilderView = () => {
  const router = useRouter();
  const [items, setItems] = useState<EvidenceItem[]>([]);
  const [trends, setTrends] = useState<Trend[]>([]);
  const [isLoadingTrends, setIsLoadingTrends] = useState(false);
  
  // Controls the Blue Box Animation
  const [isScanning, setIsScanning] = useState(false);
  
  const [property, setProperty] = useState<Property | null>(null);
  const [requestedValue, setRequestedValue] = useState(0);

  // FIXED: Robust useEffect that handles both JSON objects AND plain text addresses
  useEffect(() => {
    if (!router.isReady) return;

    if (router.query.property) {
      const rawParam = router.query.property as string;
      let parsedProp: Property;

      try {
        // 1. Try to parse as a full JSON object (if coming from specialized link)
        parsedProp = JSON.parse(rawParam);
      } catch (e) {
        // 2. Fallback: It is a plain address string (from Search Bar)
        parsedProp = {
          id: Date.now().toString(),
          address: rawParam,
          assessedValue: 0, // Default to 0, user can edit later
          requestedValue: 0,
          lat: parseFloat(router.query.lat as string || "0"),
          lng: parseFloat(router.query.lng as string || "0")
        };
      }

      setProperty(parsedProp);

      // Only calculate savings if we actually have a value
      if (parsedProp.assessedValue > 0) {
        setRequestedValue(parsedProp.assessedValue * 0.85);
      }

      // Always fetch trends based on the address
      setIsLoadingTrends(true);
      getNeighborhoodTrends(parsedProp.address, "Dallas, TX")
        .then(data => { if (data && data.length > 0) setTrends(data); })
        .finally(() => setIsLoadingTrends(false));
    }
  }, [router.isReady, router.query]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // 1. Trigger the Blue Box
    setIsScanning(true);
    
    const reader = new FileReader();
    reader.onload = async (re) => {
      const base64Data = re.target?.result as string;
      
      // 2. Call AI (Scanning Box stays visible)
      const suggestion = await analyzeDocument(base64Data, file.type);
      
      const newItem: EvidenceItem = {
        id: generateUniqueId(),
        title: suggestion.docType,
        description: suggestion.description,
        attachments: [{ url: base64Data, type: 'photo' }],
        isAiGenerated: true,
        displayType: 'photo'
      };
      
      // 3. Add Item and Hide Blue Box
      setItems(prev => [newItem, ...prev]);
      setIsScanning(false);
    };
    reader.readAsDataURL(file);
    e.target.value = ""; 
  };

  const handleInlineUpload = (e: React.ChangeEvent<HTMLInputElement>, itemId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (re) => {
      const base64Data = re.target?.result as string;
      setItems(prev => prev.map(item => item.id === itemId ? { ...item, attachments: [...item.attachments, { url: base64Data, type: 'photo' }] } : item));
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const removeAttachment = (itemId: string, indexToRemove: number) => {
    setItems(prev => prev.map(item => item.id === itemId ? { ...item, attachments: item.attachments.filter((_, idx) => idx !== indexToRemove) } : item));
  };

  const toggleDisplayType = (itemId: string) => {
    setItems(prev => prev.map(item => item.id === itemId ? { ...item, displayType: item.displayType === 'photo' ? 'document' : 'photo' } : item));
  };

  const addTrendToLocker = (t: Trend) => {
    setItems(prev => [{
      id: generateUniqueId(), title: t.title, description: t.reason, attachments: [], isAiGenerated: true, displayType: 'photo'
    }, ...prev]);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 bg-slate-50 min-h-screen text-slate-900 font-sans">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-[#0f172a] text-white p-6 rounded-3xl shadow-xl">
            <h3 className="font-bold flex items-center gap-2 mb-4 text-[#10b981] text-[10px] uppercase tracking-widest"><TrendingDown size={14} /> Est. Savings</h3>
            <div className="text-4xl font-black mb-1">${(property ? (property.assessedValue - requestedValue) * 0.025 : 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
            <input type="number" className="w-full bg-[#1e293b] border border-slate-700 rounded-xl py-2 px-3 text-white mt-4 font-bold" value={requestedValue} onChange={(e) => setRequestedValue(Number(e.target.value))} />
          </div>
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm sticky top-24">
            <h3 className="font-bold mb-4 uppercase text-xs flex items-center gap-2 text-slate-900"><MapPin size={16} className="text-blue-600" /> Neighborhood Trends</h3>
            {isLoadingTrends ? <div className="animate-pulse space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-slate-50 rounded-xl" />)}</div> : 
              <div className="space-y-4">{trends.map((t, idx) => (
                <div key={idx} className="p-4 bg-blue-50 rounded-2xl border border-blue-100 group">
                  <h4 className="text-[10px] font-black uppercase text-slate-900 mb-1">{t.title}</h4>
                  <p className="text-[10px] text-slate-500 mb-3 leading-tight">{t.reason}</p>
                  <button onClick={() => addTrendToLocker(t)} className="w-full py-2 bg-white border border-blue-200 rounded-xl text-[10px] font-bold text-blue-600">Add to Locker</button>
                </div>
              ))}</div>
            }
          </div>
        </div>

        <div className="lg:col-span-3 space-y-8">
          <div className="flex justify-between items-center">
            <div><h1 className="text-5xl font-black tracking-tighter mb-1">Evidence Locker</h1></div>
            <div className="flex gap-4">
              <button onClick={() => setItems(prev => [{ id: generateUniqueId(), title: "", description: "", attachments: [], isAiGenerated: false, displayType: 'photo' }, ...prev])} className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold">+ Add</button>
              <label className={`cursor-pointer bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all ${isScanning ? 'opacity-50 pointer-events-none' : ''}`}>
                <Wand2 size={22} /> Upload Photo <input type="file" className="hidden" onChange={handleFileUpload} accept="image/*" />
              </label>
            </div>
          </div>

          {/* Blue Scanning Box */}
          {isScanning && (
            <div className="p-12 bg-blue-50 border-2 border-dashed border-blue-200 rounded-[2.5rem] flex flex-col items-center animate-pulse">
              <Loader2 size={40} className="animate-spin text-blue-600 mb-4" />
              <p className="text-blue-900 font-black uppercase tracking-widest text-xs">AI Analyzing Photo...</p>
            </div>
          )}

          <div className="grid gap-8">
            {items.map((item) => (
              <div key={item.id} className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-8 bg-slate-50/50 border-b flex justify-between items-center">
                  <div className="flex-grow mr-4">
                     <input className="text-3xl font-black w-full bg-transparent border-none text-slate-900 focus:ring-0" value={item.title} placeholder="Issue Title" onChange={(e) => setItems(prev => prev.map(i => i.id === item.id ? {...i, title: e.target.value} : i))} />
                  </div>
                  <button onClick={() => toggleDisplayType(item.id)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${item.displayType === 'document' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-600'}`}>
                    {item.displayType === 'document' ? <><FileIcon size={14}/> Document</> : <><ImageIcon size={14}/> Photo</>}
                  </button>
                  <button onClick={() => setItems(prev => prev.filter(i => i.id !== item.id))} className="text-slate-300 hover:text-red-500 ml-4"><Trash2 size={24} /></button>
                </div>
                <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-12 text-slate-900">
                  <div className="space-y-4">
                     <textarea className="w-full p-6 bg-slate-50 rounded-3xl border-none font-medium text-slate-900 min-h-[160px] focus:ring-2 focus:ring-blue-100" value={item.description} placeholder="Describe the issue..." onChange={(e) => setItems(prev => prev.map(i => i.id === item.id ? {...i, description: e.target.value} : i))} />
                     <p className="text-xs text-slate-400 italic pl-2">AI Suggestion: You can edit the description above.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {item.attachments.map((at, idx) => (
                      <div key={idx} className="aspect-square bg-slate-100 rounded-2xl overflow-hidden shadow-inner relative group">
                        <img src={at.url} className={`w-full h-full object-cover ${item.displayType === 'document' ? 'opacity-80' : ''}`} />
                        <button onClick={() => removeAttachment(item.id, idx)} className="absolute top-2 right-2 bg-white/90 p-1.5 rounded-full text-red-500 opacity-0 group-hover:opacity-100"><X size={14} /></button>
                      </div>
                    ))}
                    <label className="aspect-square border-4 border-dashed border-slate-100 rounded-2xl flex flex-col items-center justify-center text-slate-300 hover:border-blue-400 hover:bg-blue-50 cursor-pointer transition-all"><ImagePlus size={28} /><span className="text-[10px] font-black uppercase mt-2">Add Photo</span><input type="file" className="hidden" accept="image/*" onChange={(e) => handleInlineUpload(e, item.id)} /></label>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end pt-12 pb-20">
            <button onClick={() => { if (property) router.push({ pathname: '/letter', query: { property: JSON.stringify({ ...property, requestedValue }), evidence: JSON.stringify(items) } }); }} className="bg-blue-600 text-white px-12 py-6 rounded-[2.5rem] font-black text-2xl shadow-2xl flex items-center gap-4 hover:scale-105 transition-all">Assemble Packet <FileText size={28} /></button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default EvidenceBuilderView;