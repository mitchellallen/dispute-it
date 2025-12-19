// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { MapPin, TrendingDown, FileText, ChevronLeft } from 'lucide-react';
import { getNeighborhoodTrends } from '../../lib/geminiService';
import { Property, Trend } from '../../lib/types';

const PropertyDetailView = () => {
  const router = useRouter();
  const { id } = router.query;
  const [property, setProperty] = useState<Property | null>(null);
  const [trends, setTrends] = useState<Trend[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (router.isReady) {
      // In a real app, 'id' would fetch from DB. Here we mock it for stability.
      const mockProperty: Property = { 
        address: "4339 N Hall St", 
        assessedValue: 739678.5, 
        sqft: 2200,
        city: "Dallas",
        state: "TX",
        requestedValue: 628726 // Default 15% reduction target
      };
      setProperty(mockProperty);
      
      // Fetch trends using our new Safe Service
      getNeighborhoodTrends(mockProperty.address, "Dallas, TX")
        .then(data => setTrends(data))
        .finally(() => setLoading(false));
    }
  }, [router.isReady, id]);

  if (!property) return <div className="p-20 text-center text-slate-500">Loading Property...</div>;

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 bg-slate-50 min-h-screen text-slate-900 font-sans relative overflow-hidden">
      {/* Background Graphic */}
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      
      <div className="relative z-10">
        <button onClick={() => router.push('/dashboard')} className="flex items-center gap-2 font-bold text-slate-400 mb-8 hover:text-slate-900 transition-colors">
          <ChevronLeft size={20}/> Back to Dashboard
        </button>

        <h1 className="text-6xl font-black mb-12 tracking-tighter">{property.address}</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Assessment Card */}
          <div className="bg-[#0f172a] text-white p-10 rounded-[3rem] shadow-xl border border-slate-800">
            <h3 className="text-[#10b981] text-xs font-black uppercase mb-4 tracking-widest flex items-center gap-2">
              <TrendingDown size={18}/> Current Assessment
            </h3>
            <p className="text-6xl font-black tracking-tighter">${property.assessedValue.toLocaleString()}</p>
            <div className="mt-8 pt-8 border-t border-slate-800 flex gap-8">
               <div><p className="text-[10px] uppercase font-black text-slate-500">Sq Ft</p><p className="font-bold">{property.sqft?.toLocaleString()}</p></div>
               <div><p className="text-[10px] uppercase font-black text-slate-500">Location</p><p className="font-bold">{property.city}, {property.state}</p></div>
            </div>
          </div>

          {/* Trends Card */}
          <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm">
            <h3 className="text-blue-600 text-xs font-black uppercase mb-6 tracking-widest flex items-center gap-2">
              <MapPin size={18}/> Neighborhood Analysis
            </h3>
            {loading ? (
              <div className="space-y-4 animate-pulse">
                {[1,2,3].map(i => <div key={i} className="h-20 bg-slate-50 rounded-2xl"></div>)}
              </div>
            ) : (
              <div className="space-y-4">
                {trends.map((t, idx) => (
                  <div key={idx} className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                    <h4 className="text-xs font-black text-slate-900 mb-1 uppercase">{t.title}</h4>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">{t.reason}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Start Dispute Button */}
        <div className="mt-16 flex justify-center">
          <button 
            onClick={() => router.push({ 
              pathname: '/evidence', 
              query: { property: JSON.stringify(property) } 
            })} 
            className="bg-blue-600 text-white px-16 py-8 rounded-[2rem] font-black text-2xl flex items-center gap-4 hover:scale-105 transition-all shadow-2xl shadow-blue-600/30"
          >
            Start Dispute Locker <FileText size={32} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetailView;