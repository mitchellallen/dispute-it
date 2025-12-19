import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Search, MapPin } from 'lucide-react';
import usePlacesAutocomplete, { getGeocode, getLatLng } from "use-places-autocomplete";

export default function AddressSearch() {
  const router = useRouter();
  
  // 1. Google Places Autocomplete Hook
  const {
    ready,
    value,
    suggestions: { status, data },
    setValue,
    clearSuggestions,
  } = usePlacesAutocomplete({
    requestOptions: { componentRestrictions: { country: "us" } },
    debounce: 300,
  });

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
  };

  const handleSelect = ({ description }: any) => () => {
    setValue(description, false);
    clearSuggestions();

    // Parse City/State for the URL flow
    getGeocode({ address: description }).then((results) => {
      const { lat, lng } = getLatLng(results[0]);
      const city = results[0].address_components.find(c => c.types.includes("locality"))?.long_name;
      const state = results[0].address_components.find(c => c.types.includes("administrative_area_level_1"))?.short_name;

      router.push({
        pathname: `/property/current`,
        query: {
          address: description,
          city: city || "Dallas",
          state: state || "TX",
          lat,
          lng
        }
      });
    });
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-6 mt-16 relative">
      <div className="relative flex items-center">
        <div className="absolute left-6 pointer-events-none z-10">
          <MapPin className="text-blue-500 h-6 w-6 opacity-70" />
        </div>
        
        <input
          type="text"
          placeholder="Enter your property address..."
          value={value}
          onChange={handleInput}
          disabled={!ready}
          /* Dark Grey Styling Restored */
          className="w-full bg-slate-800 border-2 border-slate-700 text-white text-xl font-bold py-7 pl-16 pr-52 rounded-3xl focus:outline-none focus:border-blue-500 transition-all shadow-2xl"
        />

        <button 
          className="absolute right-3 bg-blue-600 hover:bg-blue-500 text-white px-10 py-4 rounded-2xl font-black text-lg flex items-center gap-2"
        >
          <Search size={22} /> Search Property
        </button>
      </div>

      {/* 2. Dropdown Suggestions with Dark Styling */}
      {status === "OK" && (
        <ul className="absolute z-50 w-[calc(100%-3rem)] mt-2 bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
          {data.map((suggestion) => (
            <li 
              key={suggestion.place_id}
              onClick={handleSelect(suggestion)}
              className="px-6 py-4 text-white hover:bg-blue-600 cursor-pointer border-b border-slate-700/50 last:border-none transition-colors"
            >
              <strong className="block text-sm">{suggestion.structured_formatting.main_text}</strong>
              <span className="text-[10px] text-slate-400 uppercase font-black">{suggestion.structured_formatting.secondary_text}</span>
            </li>
          ))}
        </ul>
      )}
      
      <p className="mt-4 text-center text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]">
        AI-Powered Protest Support for Dallas County
      </p>
    </div>
  );
}