import { useEffect, useRef } from "react";
import usePlacesAutocomplete, { getGeocode, getLatLng } from "use-places-autocomplete";
import useOnclickOutside from "react-cool-onclickoutside";
import { useRouter } from "next/router";

export default function AddressSearch() {
  const router = useRouter();

  const {
    ready,
    value,
    suggestions: { status, data },
    setValue,
    clearSuggestions,
  } = usePlacesAutocomplete({
    requestOptions: {
      /* Define search scope here if needed */
    },
    debounce: 300,
  });

  const ref = useOnclickOutside(() => {
    clearSuggestions();
  });

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
  };

  const handleSelect = ({ description }: { description: string }) => {
    setValue(description, false);
    clearSuggestions();

    getGeocode({ address: description }).then((results) => {
      const { lat, lng } = getLatLng(results[0]);
      console.log("📍 Coordinates: ", { lat, lng });

      // Navigate to the Evidence Locker with the selected address
      router.push(`/evidence?property=${encodeURIComponent(description)}&lat=${lat}&lng=${lng}`);
    });
  };

  return (
    <div ref={ref} className="w-full max-w-2xl mx-auto p-4">
      <div className="relative flex items-center w-full h-14 rounded-lg focus-within:shadow-lg bg-white overflow-hidden ring-1 ring-gray-900/10">
        
        {/* ICON */}
        <div className="grid place-items-center h-full w-12 text-gray-300">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>

        {/* INPUT: Fully responsive now */}
        <input
          className="peer h-full w-full outline-none text-sm text-gray-700 pr-2"
          type="text"
          id="search"
          value={value}
          onChange={handleInput}
          disabled={!ready}
          placeholder="Enter your property address..."
        />

        {/* BUTTON: Search triggers selection logic if needed, or just visual */}
        <button 
            disabled={!ready}
            className="h-full px-6 bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors disabled:bg-gray-400"
        >
             Search
        </button>
      </div>
      
      {/* DROPDOWN SUGGESTIONS */}
      {status === "OK" && (
        <ul className="absolute z-50 mt-1 max-h-60 w-full max-w-2xl overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
          {data.map((suggestion) => {
            const {
              place_id,
              structured_formatting: { main_text, secondary_text },
            } = suggestion;

            return (
              <li
                key={place_id}
                onClick={() => handleSelect(suggestion)}
                className="cursor-pointer py-2 px-4 hover:bg-blue-50 text-gray-900 border-b border-gray-100 last:border-0"
              >
                <div className="font-medium">{main_text}</div>
                <div className="text-xs text-gray-500">{secondary_text}</div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}