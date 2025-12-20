import React, { useRef, useEffect } from 'react';
import { X, ImagePlus, FileText, Image as ImageIcon } from 'lucide-react';

export interface EvidenceItem {
  id: string;
  title: string;
  description: string;
  type?: 'photo' | 'document';
  displayType: 'photo' | 'document';
  attachments: { url: string; type: string }[];
  isAiGenerated?: boolean;
}

interface EvidenceCardProps {
  item: EvidenceItem;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updatedItem: EvidenceItem) => void;
}

export default function EvidenceCard({ item, onDelete, onUpdate }: EvidenceCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  if (!item) return null;

  // Auto-resize description
  useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.style.height = 'auto';
      textAreaRef.current.style.height = `${textAreaRef.current.scrollHeight}px`;
    }
  }, [item.description]);

  const handleInlineUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (re) => {
      const base64Data = re.target?.result as string;
      const newAttachments = [...item.attachments, { url: base64Data, type: 'photo' }];
      onUpdate(item.id, { ...item, attachments: newAttachments });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const removeAttachment = (indexToRemove: number) => {
    const newAttachments = item.attachments.filter((_, idx) => idx !== indexToRemove);
    onUpdate(item.id, { ...item, attachments: newAttachments });
  };

  return (
    <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 p-5 mb-6 transition-all hover:shadow-md">
      
      {/* --- ROW 1: Header (Editable Title) --- */}
      <div className="flex justify-between items-start mb-4 gap-3">
        <div className="w-full">
            <input
            type="text"
            className="w-full text-lg md:text-xl font-bold text-slate-900 bg-white border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-100 placeholder:text-slate-400 transition-all"
            value={item.title}
            onChange={(e) => onUpdate(item.id, { ...item, title: e.target.value })}
            placeholder="Add Issue Title (e.g. Cracked Foundation)"
            />
        </div>
        
        <button 
          onClick={() => onDelete(item.id)}
          className="text-slate-300 hover:text-red-500 transition p-2 shrink-0"
        >
          <X size={20} />
        </button>
      </div>

      {/* --- ROW 2: Description & Images --- */}
      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
        
        {/* Editable Description with Border */}
        <textarea
          ref={textAreaRef}
          className="w-full bg-white text-slate-700 text-sm resize-none focus:outline-none mb-4 min-h-[80px] overflow-hidden border border-slate-300 rounded-lg p-3 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-100 transition-all"
          placeholder="Please describe how this issue reduces your property value..."
          value={item.description}
          onChange={(e) => onUpdate(item.id, { ...item, description: e.target.value })}
          rows={1}
        />
        
        {/* Attachments Grid */}
        <div className="grid grid-cols-3 gap-2">
            {item.attachments && item.attachments.map((at, idx) => (
              <div key={idx} className="aspect-square bg-slate-200 rounded-lg overflow-hidden relative group border border-slate-200">
                <img 
                    src={at.url} 
                    className={`w-full h-full object-cover ${item.displayType === 'document' ? 'opacity-90 grayscale' : ''}`} 
                    alt="Evidence" 
                />
                <button 
                    onClick={() => removeAttachment(idx)} 
                    className="absolute top-1 right-1 bg-white/90 p-1 rounded-full text-red-500 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity shadow-sm"
                >
                    <X size={12} />
                </button>
              </div>
            ))}

            {/* Add Photo Button */}
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="aspect-square rounded-lg border-2 border-dashed border-slate-300 bg-white flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition group"
            >
               <input 
                 type="file" 
                 ref={fileInputRef} 
                 className="hidden" 
                 accept="image/*"
                 onChange={handleInlineUpload}
               />
               <ImagePlus size={20} className="text-slate-300 group-hover:text-blue-500 mb-1" />
               <span className="text-[9px] font-bold text-slate-300 group-hover:text-blue-500 uppercase">Add</span>
            </div>
        </div>
      </div>

      {/* --- ROW 3: Type Toggle --- */}
      <div className="mt-4 flex justify-end">
        <div className="bg-slate-100 p-1 rounded-lg inline-flex relative shadow-inner border border-slate-200">
          <button
            onClick={() => onUpdate(item.id, { ...item, displayType: 'photo' })}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-bold transition-all duration-200 ${
              item.displayType === 'photo' 
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200' 
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <ImageIcon size={12} /> Photo
          </button>
          <button
            onClick={() => onUpdate(item.id, { ...item, displayType: 'document' })}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-bold transition-all duration-200 ${
              item.displayType === 'document' 
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200' 
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <FileText size={12} /> Document
          </button>
        </div>
      </div>
    </div>
  );
}