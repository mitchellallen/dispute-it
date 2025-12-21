import React, { useState, useRef } from 'react';

export default function EvidenceCard({ item, onDelete, onUpdate, index }) {
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);

  // Handle Photo Upload
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);

    try {
      // 1. Create a local preview URL immediately
      const objectUrl = URL.createObjectURL(file);
      
      // 2. Update the card with the image
      onUpdate(index, { ...item, image: objectUrl });

      // 3. (Optional) In a real app, you would upload to S3/Firebase here
      // const url = await uploadToStorage(file);
    } catch (error) {
      console.error("Upload failed", error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 mb-4 transition-all hover:shadow-md">
      
      {/* --- ROW 1: Header (Title & Delete) --- */}
      {/* justify-between keeps them apart. Title gets full space. */}
      <div className="flex justify-between items-start mb-3 gap-3">
        <input
          type="text"
          className="text-lg md:text-xl font-bold text-slate-900 bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-100 rounded px-1 w-full"
          value={item.title}
          onChange={(e) => onUpdate(index, { ...item, title: e.target.value })}
          placeholder="Evidence Title"
        />
        
        {/* Delete Button (Top Right) */}
        <button 
          onClick={() => onDelete(index)}
          className="text-slate-300 hover:text-red-500 transition p-1 shrink-0"
          aria-label="Delete item"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
          </svg>
        </button>
      </div>

      {/* --- ROW 2: Description & Image Area --- */}
      <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
        
        {/* Description Text */}
        <textarea
          className="w-full bg-transparent text-slate-600 text-sm resize-none focus:outline-none mb-3 placeholder:text-slate-400"
          rows={3}
          placeholder="AI analysis or your notes will appear here..."
          value={item.description}
          onChange={(e) => onUpdate(index, { ...item, description: e.target.value })}
        />
        
        <div className="flex gap-3 h-20">
            {/* Image Preview Box */}
            {item.image && (
              <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-slate-200 shrink-0 border border-slate-200">
                  <img src={item.image} alt="Evidence" className="w-full h-full object-cover" />
              </div>
            )}

            {/* Add Photo Button (Small & Dashed) */}
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="w-20 h-20 rounded-lg border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition shrink-0 group"
            >
               <input 
                 type="file" 
                 ref={fileInputRef} 
                 className="hidden" 
                 accept="image/*"
                 onChange={handleImageUpload}
               />
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-slate-400 group-hover:text-blue-500 mb-1">
                 <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
               </svg>
               <span className="text-[10px] font-medium text-slate-400 group-hover:text-blue-600">Add</span>
            </div>
        </div>
      </div>

      {/* --- ROW 3: Type Toggle (Segmented Control) --- */}
      {/* Moved to bottom right to save space in header */}
      <div className="mt-4 flex justify-end">
        <div className="bg-slate-100 p-1 rounded-lg inline-flex relative shadow-inner">
          <button
            onClick={() => onUpdate(index, { ...item, type: 'photo' })}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-200 ${
              item.type === 'photo' 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Photo
          </button>
          <button
            onClick={() => onUpdate(index, { ...item, type: 'document' })}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-200 ${
              item.type === 'document' 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Document
          </button>
        </div>
      </div>
    </div>
  );
}