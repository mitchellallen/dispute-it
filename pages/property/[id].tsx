import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router'; 
import Link from 'next/link'; 
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  ArrowLeft, Sparkles, Loader2, ArrowRight, Save, Edit3, 
  Clock, MapPin, Mail, CreditCard, Lock, X, LayoutGrid 
} from 'lucide-react';
import { getDynamicDeadline, DeadlineInfo } from '../../lib/deadlineService';

const PropertyDetailView: React.FC = () => {
  const router = useRouter();
  const { address, state, county } = router.query;
  
  const [isLoading, setIsLoading] = useState(true);
  const [showPaywall, setShowPaywall] = useState(false);
  const [email, setEmail] = useState('');
  const [deadline, setDeadline] = useState<DeadlineInfo | null>(null);
  const [imgError, setImgError] = useState(false);
  
  const [property, setProperty] = useState({
    address: '',
    sqft: 0,
    beds: 0,
    baths: 0,
    yearBuilt: 0,
    assessedValue: 0,
    county: 'Dallas County',
    state: 'TX'
  });

  const [comps, setComps] = useState<any[]>([]);

  useEffect(() => {
    // Wait for the address from the URL
    if (!router.isReady || !address) return;

    const loadData = async () => {
      setIsLoading(true);
      try {
        const apiKey = process.env.NEXT_PUBLIC_RENTCAST_API_KEY;
        const currentAddress = address as string;

        // 1. Fetch SUBJECT from RentCast
        const res = await fetch(`https://api.rentcast.io/v1/properties?address=${encodeURIComponent(currentAddress)}`, {
          headers: { 'X-Api-Key': apiKey || '', 'Accept': 'application/json' }
        });
        const data = await res.json();
        
        if (data && data.length > 0) {
          const p = data[0];
          
          // Map RentCast data to state
          setProperty({
            address: currentAddress,
            sqft: p.squareFootage || 0,
            beds: p.bedrooms || 0,
            baths: p.bathrooms || 0,
            yearBuilt: p.yearBuilt || 0,
            // Grab latest tax value
            assessedValue: (p.taxAssessments && p.taxAssessments.length > 0) ? p.taxAssessments[0].value : 0,
            state: (state as string) || 'TX',
            county: (county as string) || 'Dallas County'
          });

          // 2. Fetch COMPS using address radius
          const cRes = await fetch(`https://api.rentcast.io/v1/properties?address=${encodeURIComponent(currentAddress)}&radius=0.5&limit=10`, {
            headers: { 'X-Api-Key': apiKey || '' }
          });
          const cData = await cRes.json();
          if (Array.isArray(cData)) {
            setComps(cData.filter((n: any) => n.addressLine1 !== p.addressLine1).slice(0, 4));
          }
        }
      } catch (err) {
        console.error("RentCast Fetch Error:", err);
      } finally {
        setDeadline(getDynamicDeadline(state as string, county as string));
        setIsLoading(false);
      }
    };

    loadData();
  }, [router.isReady, address, state, county]);

  const streetViewUrl = address 
    ? `https://maps.googleapis.com/maps/api/streetview?size=1200x800&location=${encodeURIComponent(address as string)}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
    : null;

  const chartData = [
    { name: 'Subject', value: property.assessedValue || 500000, type: 'subject' },
    ...comps.map((c, i) => ({ 
      name: `Comp ${i+1}`, 
      value: (c.taxAssessments && c.taxAssessments.length > 0) ? c.taxAssessments[0].value : 480000, 
      type: 'comp' 
    }))
  ];

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-blue-600" size={48} /></div>;

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 bg-slate-50 min-h-screen font-sans">
      <div className="flex justify-between items-center mb-10">
        <Link href="/" className="flex items-center gap-2 text-slate-500 font-bold hover:text-slate-800 transition-colors">
          <ArrowLeft size={20} /> New Search
        </Link>
        {deadline && (
          <div className="bg-white border-2 border-red-100 px-6 py-3 rounded-3xl flex items-center gap-4 shadow-sm">
            <div className="bg-red-600 text-white w-10 h-10 rounded-xl flex items-center justify-center font-black">{deadline.days}</div>
            <div className="text-xs font-bold uppercase text-red-500">{deadline.region} Deadline: {deadline.deadlineDate}</div>
          </div>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-10 mb-12">
        <div className="w-full lg:w-1/2 rounded-[48px] overflow-hidden shadow-2xl h-96 lg:h-auto border-8 border-white bg-slate-200 relative group">
          {streetViewUrl && !imgError ? (
            <img src={streetViewUrl} alt="Home" className="w-full h-full object-cover transition-transform duration-700 hover:scale-105" onError={() => setImgError(true)} />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400 font-bold uppercase text-xs">Image Unavailable</div>
          )}
        </div>

        <div className="flex-grow flex flex-col justify-center">
          <h1 className="text-4xl lg:text-5xl font-black text-slate-900 mb-2 tracking-tight">{property.address || address}</h1>
          <p className="text-blue-600 font-bold text-xs uppercase tracking-[0.2em] mb-8">{property.county} • {property.state}</p>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Sq Ft', value: property.sqft },
              { label: 'Beds', value: property.beds },
              { label: 'Baths', value: property.baths },
              { label: 'Built', value: property.yearBuilt },
            ].map((k) => (
              <div key={k.label} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{k.label}</p>
                <p className="text-2xl font-black text-slate-800 tracking-tight">{k.value || '--'}</p>
              </div>
            ))}
          </div>

          <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-3xl mb-8 shadow-sm">
            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Last Assessed Tax Value</p>
            <p className="text-3xl font-black text-emerald-900 tracking-tight">
               {property.assessedValue > 0 ? `$${property.assessedValue.toLocaleString()}` : 'Value Not Found'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-10 rounded-[48px] border border-slate-200 shadow-sm">
          <h3 className="text-2xl font-black text-slate-900 mb-8 tracking-tight flex items-center gap-3">
             <LayoutGrid size={24} className="text-blue-600" /> Neighborhood Parity
          </h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontWeight: 800, fontSize: 12}} />
                <YAxis hide />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '24px', border: 'none'}} />
                <Bar dataKey="value" radius={[16, 16, 0, 0]} barSize={60}>
                  {chartData.map((e, i) => <Cell key={i} fill={e.type === 'subject' ? '#2563eb' : '#e2e8f0'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="bg-slate-900 text-white p-10 rounded-[48px] shadow-2xl flex flex-col justify-between border border-slate-800 relative group overflow-hidden">
          <Sparkles className="absolute -top-10 -right-10 w-40 h-40 text-blue-500/10 group-hover:scale-125 transition-transform duration-700" />
          <div className="relative z-10">
            <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-blue-500/20">
              <Sparkles size={28} />
            </div>
            <h3 className="text-2xl font-bold mb-4">Evidence Locker</h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-8">
              We identified <span className="text-white font-bold">{comps.length} comparable properties</span> with lower tax assessments than yours. 
            </p>
          </div>
          <button 
            onClick={() => setShowPaywall(true)} 
            className="w-full bg-blue-600 py-6 rounded-3xl font-black text-lg hover:bg-blue-500 transition-all flex items-center justify-center gap-3 shadow-2xl shadow-blue-900/40"
          >
            Start My Protest <ArrowRight size={24} />
          </button>
        </div>
      </div>

      {showPaywall && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-6">
          <div className="bg-white w-full max-w-lg rounded-[48px] p-12 shadow-2xl relative text-center">
            <button onClick={() => setShowPaywall(false)} className="absolute top-8 right-8 p-2 text-slate-400 hover:text-slate-600 transition-colors">
              <X size={32} />
            </button>
            <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Lock size={40} />
            </div>
            <h3 className="text-3xl font-black mb-3 text-slate-900">Unlock Evidence</h3>
            <p className="text-slate-500 mb-8 font-medium">Create your account to generate your final protest packet.</p>
            <form onSubmit={(e) => { e.preventDefault(); router.push({ pathname: '/evidence', query: { address: property.address } }); }} className="space-y-6">
              <div className="relative text-left">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                <input required type="email" placeholder="you@example.com" className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-3xl outline-none font-bold" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <button className="w-full bg-slate-900 text-white py-5 rounded-3xl font-black text-lg flex items-center justify-center gap-3">
                <CreditCard size={24} /> Pay $79 & Continue
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyDetailView;