// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Wand2, TrendingDown, MapPin, FileText, Loader2 } from 'lucide-react';
// IMPORT YOUR SERVICES
import { analyzeDocument, getNeighborhoodTrends } from '../lib/geminiService';
import { Property, Trend } from '../lib/types';
// IMPORT THE NEW CARD COMPONENT
import EvidenceCard, { EvidenceItem } from '../components/EvidenceCard';

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

  useEffect(() => {
    if (!router.isReady) return;

    if (router.query.property) {
      const rawParam = router.query.property as string;
      let parsedProp: Property;

      try {
        parsedProp = JSON.parse(rawParam);
      } catch (e) {
        parsedProp = {
          id: Date.now().toString(),
          address: rawParam,
          assessedValue: 0,
          requestedValue: 0,
          lat: parseFloat(router.query.lat as string || "0"),
          lng: parseFloat(router.query.lng as string || "0")
        };
      }

      setProperty(parsedProp);

      if (parsedProp.assessedValue > 0) {
        setRequestedValue(parsedProp.assessedValue * 0.85);
      }

      setIsLoadingTrends(true);
      getNeighborhoodTrends(parsedProp.address, "Dallas, TX")
        .then(data => { if (data && data.length > 0) setTrends(data); })
        .finally(() => setIsLoadingTrends(false));
    }
  }, [router.isReady, router.query]);

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
        isAiGenerated: true,
        displayType: 'photo'
      };
      
      setItems(prev => [newItem, ...prev]);
      setIsScanning(false);
    };
    reader.readAsDataURL(file);
    e.target.value = ""; 
  };

  const addTrendToLocker = (t: Trend) => {
    setItems(prev => [{
      id: generateUniqueId(), 
      title: t.title, 
      description: t.reason, 
      attachments: [], 
      isAiGenerated: true, 
      displayType: 'photo'
    }, ...prev]);
    // 2. NEW LOGIC: Remove the trend from the visible trends list
    setTrends(prevTrends => prevTrends.filter(trend => trend.title !== t.title));
  };

  const updateEvidenceItem = (id: string, updatedItem: EvidenceItem) => {
    setItems(prev => prev.map(item => item.id === id ? updatedItem : item));
  };

  const deleteEvidenceItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12 bg-slate-50 min-h-screen text-slate-900 font-sans">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* SIDEBAR */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-[#0f172a] text-white p-6 rounded-3xl shadow-xl">
            <h3 className="font-bold flex items-center gap-2 mb-4 text-[#10b981] text-[10px] uppercase tracking-widest"><TrendingDown size={14} /> Est. Savings</h3>
            <div className="text-4xl font-black mb-1">${(property ? (property.assessedValue - requestedValue) * 0.025 : 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
            <input type="number" className="w-full bg-[#1e293b] border border-slate-700 rounded-xl py-2 px-3 text-white mt-4 font-bold" value={requestedValue} onChange={(e) => setRequestedValue(Number(e.target.value))} />
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm sticky top-24">
            <h3 className="font-bold mb-4 uppercase text-xs flex items-center gap-2 text-slate-900"><MapPin size={16} className="text-blue-600" /> Neighborhood Trends</h3>
            {isLoadingTrends ? <div className="animate-pulse space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-slate-50 rounded-xl" />)}</div> : 
              <div className="space-y-3">{trends.map((t, idx) => (
                <div key={idx} className="p-4 bg-blue-50 rounded-2xl border border-blue-100 group">
                  <h4 className="text-[10px] font-black uppercase text-slate-900 mb-1">{t.title}</h4>
                  <p className="text-[10px] text-slate-500 mb-3 leading-tight">{t.reason}</p>
                  <button onClick={() => addTrendToLocker(t)} className="w-full py-2 bg-white border border-blue-200 rounded-xl text-[10px] font-bold text-blue-600 hover:bg-blue-50">Add to Locker</button>
                </div>
              ))}</div>
            }
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div className="lg:col-span-3 space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h1 className="text-3xl md:text-5xl font-black tracking-tighter mb-1 text-slate-900">Evidence Locker</h1>
            </div>
            
            <div className="flex gap-2 w-full md:w-auto">
              <button 
                onClick={() => setItems(prev => [{ id: generateUniqueId(), title: "", description: "", attachments: [], isAiGenerated: false, displayType: 'photo' }, ...prev])} 
                className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold text-sm flex-1 md:flex-none justify-center flex"
              >
                + Add
              </button>
              
              <label className={`cursor-pointer bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-blue-700 transition-all flex-1 md:flex-none ${isScanning ? 'opacity-50 pointer-events-none' : ''}`}>
                <Wand2 size={18} /> Upload Photo 
                <input type="file" className="hidden" onChange={handleFileUpload} accept="image/*" />
              </label>
            </div>
          </div>

          {isScanning && (
            <div className="p-8 bg-blue-50 border-2 border-dashed border-blue-200 rounded-[2rem] flex flex-col items-center animate-pulse">
              <Loader2 size={32} className="animate-spin text-blue-600 mb-2" />
              <p className="text-blue-900 font-black uppercase tracking-widest text-xs">AI Analyzing Photo...</p>
            </div>
          )}

          <div className="grid gap-4">
            {items.map((item) => (
              <EvidenceCard 
                key={item.id} 
                item={item} 
                onDelete={deleteEvidenceItem} 
                onUpdate={updateEvidenceItem}
              />
            ))}
          </div>

          <div className="flex justify-end pt-8 pb-20">
            <button 
                onClick={() => { if (property) router.push({ pathname: '/letter', query: { property: JSON.stringify({ ...property, requestedValue }), evidence: JSON.stringify(items) } }); }} 
                className="w-full md:w-auto bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-xl shadow-xl flex items-center justify-center gap-3 hover:scale-105 transition-all"
            >
                Assemble Packet <FileText size={24} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default EvidenceBuilderView;