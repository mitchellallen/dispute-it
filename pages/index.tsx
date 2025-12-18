import React from 'react';
import AddressSearch from '../components/AddressSearch';

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* This matches your prototype layout */}
      <main className="max-w-7xl mx-auto px-6 pt-20">
        <div className="text-center space-y-8">
          <h1 className="text-6xl font-black tracking-tight">
            Lower your <span className="text-blue-600">Dallas Property Taxes</span>
          </h1>
          <p className="text-xl text-slate-500 max-w-2xl mx-auto">
            The county over-assessed you. Use Gemini AI to build your protest packet.
          </p>
          
          <div className="pt-10">
            {/* ✅ This loads your autocomplete search component */}
            <AddressSearch />
          </div>
        </div>
      </main>
    </div>
  );
}