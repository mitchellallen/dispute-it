// pages/compare.tsx
import { useState } from 'react';

export default function ComparePage() {
  const [results, setResults] = useState<any>({ zillow: null, redfin: null, rentcast: null });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const targetAddress = "4339 N Hall St, Dallas, TX 75219";

  const runBattle = async () => {
    setLoading(true);
    setError('');

    // Zillow URLs require specific hyphenation for search
    const zFormatted = "4339-N-Hall-St-Dallas-TX-75219";
    const zUrl = `https://www.zillow.com/homes/${zFormatted}_rb/`;
    const rUrl = `https://www.redfin.com/search?query=${encodeURIComponent(targetAddress)}`;

    try {
      const fetcher = async (src: string, targetUrl: string) => {
        const res = await fetch(`/api/scrapeProperty?source=${src}&url=${encodeURIComponent(targetUrl)}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || `${src} failed`);
        return json;
      };

      const [z, r, rc] = await Promise.all([
        fetcher('zillow', zUrl),
        fetcher('redfin', rUrl),
        fetcher('rentcast', targetAddress)
      ]);

      setResults({ zillow: z, redfin: r, rentcast: rc });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-10 bg-slate-900 min-h-screen text-white text-center">
      <h1 className="text-3xl font-bold mb-4 text-blue-400">Data Battleground</h1>
      <p className="text-slate-400 mb-8">Test: {targetAddress}</p>
      
      <button onClick={runBattle} disabled={loading} className="bg-blue-600 px-12 py-4 rounded-full font-bold hover:bg-blue-500 disabled:opacity-50 text-xl transition-all">
        {loading ? 'Fetching Sources...' : 'Run Final Battle'}
      </button>

      {error && <div className="mt-8 p-4 bg-red-900/30 border border-red-500 rounded max-w-2xl mx-auto text-red-200">System Message: {error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-12 text-left">
        <DataBox title="ZILLOW" data={results.zillow} />
        <DataBox title="REDFIN" data={results.redfin} />
        <DataBox title="RENTCAST" data={results.rentcast} />
      </div>
    </div>
  );
}

function DataBox({ title, data }: { title: string, data: any }) {
  return (
    <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 h-[600px] overflow-auto shadow-inner">
      <h2 className="text-[10px] font-bold text-slate-500 mb-3 uppercase border-b border-slate-700 pb-2">{title}</h2>
      <pre className="text-[10px] text-green-400 font-mono whitespace-pre-wrap">
        {data ? JSON.stringify(data, null, 2) : '// Awaiting data...'}
      </pre>
    </div>
  );
}