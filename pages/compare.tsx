import { useState } from 'react';

/**
 * Data Battleground: Comparison Page
 * Purpose: Compare property data from Zillow, Redfin, and RentCast for 4339 N Hall St.
 */
export default function ComparePage() {
  // 1. State Hooks (Restored to fix "Cannot find name" errors)
  const [results, setResults] = useState<any>({ zillow: null, redfin: null, rentcast: null });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 2. Hardcoded Target Address
  const targetAddress = "4339 N Hall St, Dallas, TX 75219";

  const runBattle = async () => {
    setLoading(true);
    setError('');

    // Scraper-friendly URL formatting
    const zFormatted = "4339-N-Hall-St-Dallas-TX-75219";
    const zUrl = `https://www.zillow.com/homes/${zFormatted}_rb/`;
    const rUrl = `https://www.redfin.com/search?query=${encodeURIComponent(targetAddress)}`;

    try {
      /**
       * Robust Fetcher logic to prevent "Unexpected end of JSON input"
       */
      const fetcher = async (src: string, targetUrl: string) => {
        const res = await fetch(`/api/scrapeProperty?source=${src}&url=${encodeURIComponent(targetUrl)}`);
        
        // Read as text first to handle empty responses from the API route
        const text = await res.text();
        if (!text) {
          throw new Error(`${src} returned an empty response body.`);
        }

        let json;
        try {
          json = JSON.parse(text);
        } catch (e) {
          throw new Error(`${src} returned invalid JSON format.`);
        }

        if (!res.ok) {
          throw new Error(json.error || `${src} failed with status ${res.status}`);
        }

        return json;
      };

      // Execute all three searches in parallel
      const [z, r, rc] = await Promise.all([
        fetcher('zillow', zUrl),
        fetcher('redfin', rUrl),
        fetcher('rentcast', targetAddress)
      ]);

      setResults({ zillow: z, redfin: r, rentcast: rc });

    } catch (err: any) {
      console.error("Battleground Error:", err.message);
      setError(err.message);
    } finally {
      setLoading(false); // Guarantees the spinner stops
    }
  };

  return (
    <div className="p-10 bg-slate-900 min-h-screen text-white text-center font-sans">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-extrabold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">
          Data Battleground
        </h1>
        <p className="text-slate-400 mb-8 text-lg">
          Target: <span className="text-blue-300 font-mono">{targetAddress}</span>
        </p>
        
        <button 
          onClick={runBattle} 
          disabled={loading} 
          className={`
            px-16 py-5 rounded-full font-bold text-xl shadow-2xl transition-all transform hover:scale-105
            ${loading ? 'bg-slate-700 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 active:bg-blue-700'}
          `}
        >
          {loading ? 'Crunching Numbers...' : 'Run Final Battle'}
        </button>

        {/* Error Display Block */}
        {error && (
          <div className="mt-8 p-6 bg-red-900/20 border border-red-500/50 rounded-xl max-w-2xl mx-auto text-red-200 animate-pulse">
            <span className="font-bold uppercase tracking-widest text-xs block mb-1 text-red-400">System Error</span>
            {error}
          </div>
        )}

        {/* Data Comparison Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-16 text-left">
          <DataBox title="ZILLOW (Scraped)" data={results.zillow} loading={loading} />
          <DataBox title="REDFIN (Scraped)" data={results.redfin} loading={loading} />
          <DataBox title="RENTCAST (Official)" data={results.rentcast} loading={loading} />
        </div>
      </div>
    </div>
  );
}

/**
 * Reusable JSON Data Display Box
 */
function DataBox({ title, data, loading }: { title: string, data: any, loading: boolean }) {
  return (
    <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-2xl border border-slate-700 h-[650px] overflow-auto shadow-inner flex flex-col">
      <h2 className="text-[10px] font-black text-slate-500 mb-4 tracking-[0.2em] uppercase border-b border-slate-700/50 pb-3">
        {title}
      </h2>
      <pre className="text-[11px] text-green-400 font-mono leading-relaxed whitespace-pre-wrap">
        {loading ? '// Loading data stream...' : 
         data ? JSON.stringify(data, null, 2) : '// Awaiting command...'}
      </pre>
    </div>
  );
}