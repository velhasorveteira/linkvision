
import React, { useState } from 'react';
import { Language } from '../types';

interface LanguageSelectorProps {
  current: Language;
  onSelect: (lang: Language) => void;
  onClose: () => void;
}

const LANGUAGES = [
  { code: 'pt', name: 'Português', flag: '🇧🇷' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
  { code: 'nl', name: 'Nederlands', flag: '🇳🇱' },
  { code: 'sv', name: 'Svenska', flag: '🇸🇪' },
  { code: 'pl', name: 'Polski', flag: '🇵🇱' },
  { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'th', name: 'ไทย', flag: '🇹🇭' },
];

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ current, onSelect, onClose }) => {
  const [search, setSearch] = useState('');

  const filtered = LANGUAGES.filter(l => 
    l.name.toLowerCase().includes(search.toLowerCase()) || 
    l.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 animate-in fade-in">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose}></div>
      <div className="relative w-full max-w-lg bg-[#1a1a1a] border border-[#333] rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[80vh]">
        <div className="p-8 border-b border-[#333] bg-[#222]">
          <h2 className="text-xl font-black italic uppercase tracking-tighter text-white mb-6">Select Language</h2>
          <div className="relative">
            <input 
              type="text" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search language..."
              className="w-full bg-[#111] border border-[#333] rounded-2xl py-4 px-12 text-sm text-white focus:border-[#0E7C7B] outline-none"
            />
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeWidth={2} /></svg>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 gap-2 no-scrollbar">
          {filtered.map(lang => (
            <button
              key={lang.code}
              onClick={() => { onSelect(lang.code); onClose(); }}
              className={`flex items-center gap-3 p-4 rounded-2xl transition-all border ${
                current === lang.code ? 'bg-[#0E7C7B] border-[#0E7C7B] text-white shadow-lg' : 'bg-[#232323] border-transparent text-slate-400 hover:border-[#333] hover:text-white'
              }`}
            >
              <span className="text-2xl">{lang.flag}</span>
              <span className="text-xs font-black uppercase tracking-widest">{lang.name}</span>
            </button>
          ))}
        </div>

        <div className="p-6 border-t border-[#333] bg-[#222] flex justify-end">
          <button onClick={onClose} className="px-8 py-3 bg-[#111] border border-[#333] rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-all">Close</button>
        </div>
      </div>
    </div>
  );
};

export default LanguageSelector;
