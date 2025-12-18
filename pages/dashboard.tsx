import React from 'react';
import Link from 'next/link'; // ✅ Fixed: Uses Next.js router
import { Plus, Home, ChevronRight, AlertCircle, Clock } from 'lucide-react';

const DashboardView: React.FC = () => {
  const properties = [
    { id: 'p1', address: '123 Highland Park Dr, Dallas, TX', status: 'Protest Required', deadline: 'May 15', assessed: 980000, target: 820000 },
    { id: 'p2', address: '4502 Oak Lawn Ave, Dallas, TX', status: 'In Review', deadline: 'Completed', assessed: 450000, target: 410000 }
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="flex justify-between items-end mb-10">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Property Dashboard</h1>
          <p className="text-slate-600">Manage your active tax protests.</p>
        </div>
        {/* Note: This button does not go anywhere yet. You can wrap it in a Link later. */}
        <button className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20">
          <Plus size={20} /> Add Property
        </button>
      </div>

      <div className="grid gap-6">
        {properties.map((p) => (
          <div key={p.id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row items-center gap-8">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
              <Home size={32} />
            </div>
            <div className="flex-grow">
              <h3 className="text-xl font-bold text-slate-800">{p.address}</h3>
              <div className="flex gap-4 mt-2">
                <span className={`flex items-center gap-1.5 text-xs font-bold px-2 py-1 rounded-md ${p.status === 'Protest Required' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                  {p.status === 'Protest Required' ? <AlertCircle size={14} /> : <Clock size={14} />}
                  {p.status}
                </span>
                <span className="text-xs font-medium text-slate-500">Deadline: {p.deadline}</span>
              </div>
            </div>
            <div className="flex gap-8 items-center">
              <div className="text-right">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Assessed</p>
                <p className="text-lg font-bold">${p.assessed.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-medium text-blue-500 uppercase tracking-wider">Target</p>
                <p className="text-lg font-bold text-blue-600">${p.target.toLocaleString()}</p>
              </div>
              {/* ✅ Fixed: Link uses 'href' instead of 'to' */}
              {/* Note: /property/p1 page doesn't exist yet, so clicking this will 404 until we build it. */}
              <Link href={`/property/${p.id}`} className="p-2 rounded-full hover:bg-slate-100 transition-colors">
                <ChevronRight size={24} className="text-slate-400" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DashboardView;