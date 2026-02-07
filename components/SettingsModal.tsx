
import React, { useState } from 'react';
import { Language, VideoQuality } from '../types';

interface SettingsModalProps {
  currentLang: Language;
  currentQuality: VideoQuality;
  onSelectLang: (lang: Language) => void;
  onSelectQuality: (quality: VideoQuality) => void;
  onClose: () => void;
}

const LANGUAGES = [
  { code: 'pt', name: 'Português', flag: '🇧🇷' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
];

const QUALITIES: VideoQuality[] = ['480p', '720p', '1080p', '1440p', '4K'];

const SettingsModal: React.FC<SettingsModalProps> = ({ currentLang, currentQuality, onSelectLang, onSelectQuality, onClose }) => {
  const [activeTab, setActiveTab] = useState<'lang' | 'quality'>('lang');

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 animate-in fade-in">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose}></div>
      <div className="relative w-full max-w-lg bg-[#1a1a1a] border border-[#333] rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[80vh]">
        <div className="p-8 border-b border-[#333] bg-[#222]">
          <h2 className="text-xl font-black italic uppercase tracking-tighter text-white mb-6">Settings</h2>
          <div className="flex bg-[#111] p-1 rounded-2xl border border-[#333]">
            <button 
              onClick={() => setActiveTab('lang')}
              className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'lang' ? 'bg-[#0E7C7B] text-white shadow-lg' : 'text-slate-500'}`}
            >
              Language
            </button>
            <button 
              onClick={() => setActiveTab('quality')}
              className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'quality' ? 'bg-[#F39237] text-white shadow-lg' : 'text-slate-500'}`}
            >
              Video Quality
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 no-scrollbar">
          {activeTab === 'lang' ? (
            <div className="grid grid-cols-2 gap-3">
              {LANGUAGES.map(lang => (
                <button
                  key={lang.code}
                  onClick={() => onSelectLang(lang.code)}
                  className={`flex items-center gap-3 p-4 rounded-2xl transition-all border ${
                    currentLang === lang.code ? 'bg-[#0E7C7B]/10 border-[#0E7C7B] text-[#0E7C7B]' : 'bg-[#232323] border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="text-2xl">{lang.flag}</span>
                  <span className="text-xs font-black uppercase tracking-widest">{lang.name}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] text-center mb-6">Select Quality for AI Analysis</p>
              <div className="grid grid-cols-1 gap-3">
                {QUALITIES.map(q => (
                  <button
                    key={q}
                    onClick={() => onSelectQuality(q)}
                    className={`flex items-center justify-between p-6 rounded-2xl transition-all border ${
                      currentQuality === q ? 'bg-[#F39237]/10 border-[#F39237] text-[#F39237]' : 'bg-[#232323] border-transparent text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="text-lg font-black italic uppercase tracking-tighter">{q}</span>
                    <div className="flex items-center gap-2">
                       {(q === '1440p' || q === '4K') && <span className="text-[7px] font-black text-[#F39237] border border-[#F39237] px-1 rounded uppercase tracking-tighter">ULTRA</span>}
                       {currentQuality === q && <div className="w-2 h-2 bg-[#F39237] rounded-full shadow-[0_0_10px_#F39237]"></div>}
                    </div>
                  </button>
                ))}
              </div>
              <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest text-center mt-6">Note: Ultra quality requires high speed upload.</p>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-[#333] bg-[#222] flex justify-end">
          <button onClick={onClose} className="px-8 py-3 bg-[#111] border border-[#333] rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-all">Close</button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
