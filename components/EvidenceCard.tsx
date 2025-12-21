import React, { useRef } from 'react';
import { Trash2, Image as ImageIcon, FileText, X } from 'lucide-react';

export interface EvidenceItem {
  id: string;
  title: string;
  description: string;
  attachments: { url: string; type: 'photo' | 'document' }[];
  displayType: 'photo' | 'document';
}

interface Props {
  item: EvidenceItem;
  onDelete: (id: string) => void;
  onUpdate: (id: string, item: EvidenceItem) => void;
}

export default function EvidenceCard({ item, onDelete, onUpdate }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (re) => {
        const base64 = re.target?.result as string;
        onUpdate(item.id, {
          ...item,
          attachments: [...(item.attachments || []), { url: base64, type: 'photo' }]
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeAttachment = (index: number) => {
    const newAtts = [...(item.attachments || [])];
    newAtts.splice(index, 1);
    onUpdate(item.id, { ...item, attachments: newAtts });
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative group transition-all hover:shadow-md">
      {/* HEADER: Title & Delete */}
      <div className="flex justify-between items-start mb-3">
        <input
          type="text"
          data-lpignore="true" 
          data-form-type="other" 
          spellCheck={false}
          autoComplete="off"
          className="w-full text-lg font-bold text-slate-900 border-none p-0 focus:ring-0 placeholder:text-slate-300"
          value={item.title}
          onChange={(e) => onUpdate(item.id, { ...item, title: e.target.value })}
          placeholder="Add Issue Title"
        />
        <button 
          onClick={() => onDelete(item.id)}
          className="text-slate-300 hover:text-red-500 transition p-1"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* BODY: Description */}
      <div className="mb-4">
        <textarea
          data-lpignore="true" 
          data-form-type="other" 
          spellCheck={false}
          className="w-full text-sm text-slate-600 border-none p-0 focus:ring-0 resize-none h-20 leading-relaxed placeholder:text-slate-300"
          value={item.description}
          onChange={(e) => onUpdate(item.id, { ...item, description: e.target.value })}
          placeholder="Describe why this affects property value..."
        />
      </div>

      {/* FOOTER: Attachments */}
      <div className="flex flex-wrap gap-3">
        {/* Existing Photos */}
        {item.attachments && item.attachments.map((att, i) => (
          <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-slate-200 group/img">
            <img src={att.url} className="w-full h-full object-cover" />
            <button 
              onClick={() => removeAttachment(i)}
              className="absolute top-0 right-0 bg-black/50 text-white p-1 opacity-0 group-hover/img:opacity-100 transition"
            >
              <X size={12} />
            </button>
          </div>
        ))}

        {/* --- FIXED: ADD PHOTO BUTTON --- */}
        {/* We added 'w-20 h-20' and 'shrink-0' to force it to stay small */}
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="w-20 h-20 shrink-0 rounded-lg border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-1 text-slate-400 hover:border-blue-400 hover:text-blue-500 transition bg-slate-50 hover:bg-blue-50/50"
        >
          <ImageIcon size={20} />
          <span className="text-[9px] font-bold uppercase tracking-wider">Add</span>
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*" 
          onChange={handleFileChange} 
        />
      </div>

      {/* META: Type selector (Optional/Hidden for now but keeping structure) */}
      <div className="absolute bottom-4 right-4 flex gap-2">
         {/* You can add document/photo toggle buttons here if needed later */}
      </div>
    </div>
  );
}