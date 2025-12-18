import React from 'react';
import usePlacesAutocomplete, { getGeocode, getLatLng } from "use-places-autocomplete";
import { Combobox, ComboboxInput, ComboboxPopover, ComboboxList, ComboboxOption } from "@reach/combobox";
import "@reach/combobox/styles.css";
import { useRouter } from 'next/router';
import { Search } from 'lucide-react';

const AddressSearch = () => {
  const router = useRouter();
  
  const {
    ready,
    value,
    suggestions: { status, data },
    setValue,
    clearSuggestions,
  } = usePlacesAutocomplete({
    requestOptions: {
      componentRestrictions: { country: "us" },
      locationBias: { radius: 10000, center: { lat: 32.7767, lng: -96.7970 } }, 
    },
    debounce: 300,
  });

  const handleSelect = async (address: string) => {
    setValue(address, false);
    clearSuggestions();

    try {
      const results = await getGeocode({ address });
      if (results && results.length > 0) {
        const { lat, lng } = await getLatLng(results[0]);
        const components = results[0].address_components;
        
        const state = components.find(c => c.types.includes("administrative_area_level_1"))?.short_name || 'TX';
        const county = components.find(c => c.types.includes("administrative_area_level_2"))?.long_name || 'Dallas County';
        
        router.push({
          pathname: `/property/p1`,
          query: { address, lat, lng, state, county }
        });
      }
    } catch (error) {
      console.error("Search error:", error);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <Combobox onSelect={handleSelect}>
        <div className="flex items-center bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl focus-within:ring-2 focus-within:ring-blue-500">
          <div className="pl-6 text-slate-400"><Search size={22} /></div>
          <ComboboxInput
            value={value}
            onChange={(e) => setValue(e.target.value)}
            disabled={!ready}
            className="w-full bg-transparent text-white px-4 py-6 outline-none text-lg font-medium"
            placeholder="Enter your home address..."
          />
          <button className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 m-2 rounded-xl font-bold transition-all">
            Start My Protest →
          </button>
        </div>
        <ComboboxPopover className="z-50 border-none shadow-2xl rounded-xl mt-2 overflow-hidden">
          <ComboboxList className="bg-white py-2">
            {status === "OK" && data.map(({ place_id, description }) => (
              <ComboboxOption key={place_id} value={description} className="px-4 py-3 hover:bg-blue-50 cursor-pointer text-slate-900 font-medium" />
            ))}
          </ComboboxList>
        </ComboboxPopover>
      </Combobox>
    </div>
  );
};

export default AddressSearch;