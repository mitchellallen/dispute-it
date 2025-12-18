import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { 
  Upload, Trash2, Wand2, ArrowRight, Loader2, 
  FileText,
  MapPin, Construction, Sparkles, Plus, X, FilePlus, ImagePlus, TrendingDown
} from 'lucide-react';
import { getNeighborhoodTrends, analyzeDocument } from '../lib/geminiService';
import { EvidenceItem, Trend, Property } from '../lib/types';
import Image from 'next/image';

// Moved outside the component to be a pure function
const generateUniqueId = () => `_${Math.random().toString(36).substr(2, 9)}`;

const EvidenceBuilderView: React.FC = () => {
  const router = useRouter();

  const property: Property | null = router.query.property ? JSON.parse(router.query.property as string) : null;
  const region = { city: 'Dallas', state: 'TX' };

  const [items, setItems] = useState<EvidenceItem[]>([]);
  const [trends, setTrends] = useState<Trend[]>([]);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [isLoadingTrends, setIsLoadingTrends] = useState(true);
  const [globalScanning, setGlobalScanning] = useState(false);
  const [requestedValue, setRequestedValue] = useState(property ? property.assessedValue * 0.85 : 0);
  const estimatedSavings = property ? Math.max(0, (property.assessedValue - requestedValue) * 0.025) : 0;

  useEffect(() => {
    if (property) {
      getNeighborhoodTrends(property.address, property.county || region.city)
        .then(setTrends)
        .finally(() => setIsLoadingTrends(false));
    }
  }, [router.query.property, region.city]);

  const addManualCategory = () => {
    const newItem: EvidenceItem = {
      id: generateUniqueId(),
      category: 'New Condition Category',
      userRationale: '',
      attachments: [],
      isTrendSeed: false
    };
    setItems(prev => [...prev, newItem]);
  };

  const handleGlobalFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'photo' | 'doc') => {
    const file = e.target.files?.[0];
    if (file) {
      setGlobalScanning(true);
      const reader = new FileReader();
      reader.onload = async (re) => {
        const base64Data = re.target?.result as string;
        
        try {
          // AI analyzes the image specifically for property protest evidence
          const suggestion = await analyzeDocument(base64Data, file.type);
  
          const newItem: EvidenceItem = {
            id: generateUniqueId(),
            // Use the AI's suggested title (e.g., "Foundation Cracks") instead of "Document"
            category: suggestion.docType || (type === 'photo' ? 'Condition Photo' : 'Evidence Document'),
            // Use the AI's full reasoning instead of just "Scanned"
            userRationale: suggestion.description || 'AI could not determine details. Please describe this issue.',
            amount: suggestion.amount,
            date: suggestion.date,
            attachments: [{
              url: base64Data,
              type: type,
              mimeType: file.type,
              name: file.name,
              aiData: suggestion
            }]
          };
          
          setItems(prev => [...prev, newItem]);
        } catch (err) {
          console.error("AI scanning failed", err);
        } finally {
          setGlobalScanning(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCardFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, itemId: string, type: 'photo' | 'doc') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (re) => {
        const base64Data = re.target?.result as string;
        const newAttachment = {
          url: base64Data,
          type: type,
          mimeType: file.type,
          name: file.name
        };

        setItems(prev => prev.map(item => {
          if (item.id === itemId) {
            return {
              ...item,
              attachments: [...item.attachments, newAttachment],
              isTrendSeed: false
            };
          }
          return item;
        }));
        e.target.value = '';
      };
      reader.readAsDataURL(file);
    }
  };

  const addTrendToLocker = (trend: Trend) => {
    const newItem: EvidenceItem = {
      id: generateUniqueId(),
      category: trend.title,
      userRationale: trend.reason || trend.placeholder || `Analyzing evidence for ${trend.title}...`,
      placeholder: trend.placeholder,
      attachments: [],
      isTrendSeed: true
    };
    setItems(prev => [...prev, newItem]);
  };

  const removeAttachment = (itemId: string, attachmentUrl: string) => {
    setItems(prev => prev.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          attachments: item.attachments.filter(a => a.url !== attachmentUrl)
        };
      }
      return item;
    }));
  };

  const handleFinalize = () => {
    setIsFinalizing(true);
    setTimeout(() => {
      router.push({
        pathname: '/letter',
        query: {
           property: JSON.stringify(property),
           evidence: JSON.stringify(items),
           requestedValue: requestedValue.toString()
        }
      });
    }, 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl border border-slate-800">
            <h3 className="font-bold flex items-center gap-2 mb-4 text-emerald-400">
              <TrendingDown size={18} /> Est. Annual Savings
            </h3>
            <div className="text-4xl font-black mb-1">${estimatedSavings.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
            <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-6">Based on Target: ${requestedValue.toLocaleString()}</p>
            
            <div className="space-y-4 pt-4 border-t border-slate-800">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Requested Assessment</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold">$</span>
                  <input 
                    type="number"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2 pl-7 pr-3 font-bold text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={requestedValue}
                    onChange={(e) => setRequestedValue(Number(e.target.value))}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm sticky top-24">
            <h3 className="font-bold flex items-center gap-2 mb-4 text-slate-900">
              <MapPin size={18} className="text-blue-500" /> Neighborhood Trends
            </h3>
            {isLoadingTrends ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse flex flex-col gap-2">
                    <div className="h-4 w-3/4 bg-slate-100 rounded"></div>
                    <div className="h-3 w-1/2 bg-slate-50 rounded"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {trends.map((t, idx) => (
                  <div key={idx} className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                    <h4 className="text-xs font-bold text-slate-900 mb-1">{t.title}</h4>
                    <p className="text-[10px] text-slate-500 mb-3 leading-tight">{t.reason}</p>
                    <button 
                      onClick={() => addTrendToLocker(t)}
                      className="w-full py-2 bg-white border border-blue-200 rounded-xl text-[10px] font-bold text-blue-600 flex items-center justify-center gap-1 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                    >
                      <Plus size={12} /> Add to Locker
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-3 space-y-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-extrabold mb-1">Evidence Locker</h1>
              <p className="text-slate-600 font-medium">Group photos and documents by condition or issue.</p>
            </div>
            <div className="flex gap-4">
              <button 
                onClick={addManualCategory}
                className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-2 transition-all hover:bg-slate-800 shadow-xl active:scale-95"
              >
                <Plus size={22} /> Add
              </button>
              <label className="cursor-pointer bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-2 transition-all hover:bg-blue-700 shadow-xl shadow-blue-500/20 active:scale-95">
                <Upload size={22} /> Upload File
                <input type="file" className="hidden" multiple accept="image/*,.pdf" onChange={(e) => handleGlobalFileUpload(e, 'photo')} />
              </label>
            </div>
          </div>

          {globalScanning && (
            <div className="bg-blue-50 border border-blue-100 p-8 rounded-3xl flex flex-col items-center justify-center text-center animate-pulse">
              <Loader2 size={40} className="animate-spin text-blue-600 mb-4" />
              <h3 className="font-bold text-blue-900">AI Scanning New Evidence...</h3>
            </div>
          )}

          <div className="grid gap-8">
            {items.length === 0 && !globalScanning && (
              <div className="border-2 border-dashed border-slate-200 rounded-3xl p-20 text-center bg-white">
                <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Construction size={32} />
                </div>
                <h3 className="text-xl font-bold mb-2">Locker is Empty</h3>
                <p className="text-slate-500 mb-4 max-w-sm mx-auto">Upload a file, click "Add", or use a neighborhood trend to begin building your case categories.</p>
              </div>
            )}

            {items.map((item) => (
              <div key={item.id} className={`bg-white rounded-3xl border shadow-sm transition-all ${item.isTrendSeed ? 'border-blue-200 ring-2 ring-blue-50' : 'border-slate-200'} flex flex-col`}>
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
                <div className="flex items-center gap-3 flex-1 min-w-0">
  <input 
    type="text"
    className="text-lg font-bold bg-transparent border-none focus:ring-0 p-0 text-slate-900 w-full min-w-0 block"
    value={item.category}
    placeholder="Enter title..."
    onChange={(e) => setItems(prev => prev.map(i => i.id === item.id ? { ...i, category: e.target.value } : i))}
  />
  {item.isTrendSeed && (
    <span className="flex-shrink-0 text-[10px] font-bold bg-blue-600 text-white px-2 py-0.5 rounded-full flex items-center gap-1">
      <Sparkles size={10} /> Neighborhood Trend
    </span>
  )}
</div>
                  <button onClick={() => setItems(prev => prev.filter(i => i.id !== item.id))} className="text-slate-300 hover:text-red-500 transition-colors">
                    <Trash2 size={20} />
                  </button>
                </div>

                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Attachments</label>
                    <div className="grid grid-cols-3 gap-3">
                      {item.attachments.map((at, idx) => (
                        <div key={idx} className="aspect-square rounded-xl bg-slate-100 border border-slate-200 overflow-hidden relative group">
                          {at.type === 'photo' ? (
                            <Image src={at.url} className="w-full h-full object-cover" alt="Upload" width={100} height={100} />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-slate-400">
                              <FileText size={24} />
                              <span className="text-[8px] font-bold uppercase truncate px-1 w-full text-center">{at.name}</span>
                            </div>
                          )}
                          <button 
                            onClick={() => removeAttachment(item.id, at.url)}
                            className="absolute top-1 right-1 bg-white/90 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm text-red-500"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                      
                      <label className="aspect-square rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 transition-all cursor-pointer">
                        <ImagePlus size={20} />
                        <span className="text-[8px] font-bold uppercase mt-1">Photo</span>
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleCardFileUpload(e, item.id, 'photo')} />
                      </label>
                      <label className="aspect-square rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 transition-all cursor-pointer">
                        <FilePlus size={20} />
                        <span className="text-[8px] font-bold uppercase mt-1">Doc</span>
                        <input type="file" className="hidden" accept=".pdf,image/*" onChange={(e) => handleCardFileUpload(e, item.id, 'doc')} />
                      </label>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Technical Rationale</label>
                      <textarea 
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 min-h-[140px] text-sm leading-relaxed"
                        placeholder={item.placeholder || "Reasoning..."}
                        value={item.userRationale}
                        onChange={(e) => setItems(prev => prev.map(i => i.id === item.id ? { ...i, userRationale: e.target.value } : i))}
                      />
                    </div>
                    <div className="flex gap-4">
                      <div className="flex-grow">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Est. Repair Cost</label>
                         <input 
                            type="text" 
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold"
                            placeholder="$0.00"
                            value={item.amount || ''}
                            onChange={(e) => setItems(prev => prev.map(i => i.id === item.id ? { ...i, amount: e.target.value } : i))}
                         />
                      </div>
                      <div className="flex-grow">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Evidence Date</label>
                         <input 
                            type="text" 
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold"
                            placeholder="Current"
                            value={item.date || ''}
                            onChange={(e) => setItems(prev => prev.map(i => i.id === item.id ? { ...i, date: e.target.value } : i))}
                         />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {items.length > 0 && (
            <div className="mt-12 bg-slate-900 rounded-3xl p-10 text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl">
              <div className="flex items-center gap-6">
                <div className="p-5 bg-blue-600 text-white rounded-2xl shadow-lg">
                  <Wand2 size={40} />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">Ready to Finalize</h3>
                  <p className="text-slate-400 text-sm">We&apos;ll combine your {items.length} categories into a legal packet.</p>
                </div>
              </div>
              <button 
                onClick={handleFinalize}
                disabled={isFinalizing || items.length === 0}
                className="bg-blue-600 text-white px-12 py-5 rounded-2xl font-bold flex items-center gap-3 hover:bg-blue-500 transition-all shadow-xl shadow-blue-600/20 disabled:opacity-50 min-w-[350px] justify-center text-xl active:scale-95"
              >
                {isFinalizing ? <Loader2 size={24} className="animate-spin" /> : <>Assemble My Packet <ArrowRight size={20} /></>}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EvidenceBuilderView;
