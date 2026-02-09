
import React, { useState } from 'react';
import { shareContent } from '../utils/shareUtils';

interface ShareButtonProps {
  title: string;
  text: string;
  url?: string;
  className?: string;
  label?: string;
  variant?: 'minimal' | 'full';
}

const ShareButton: React.FC<ShareButtonProps> = ({ title, text, url, className = "", label, variant = 'minimal' }) => {
  const [copied, setCopied] = useState(false);

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const result = await shareContent(title, text, url);
    if (result.success && result.method === 'clipboard') {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button 
      onClick={handleShare}
      className={`group flex items-center justify-center gap-2 transition-all active:scale-95 ${className}`}
    >
      <div className={`relative ${variant === 'full' ? 'bg-white/10 p-3 rounded-xl' : ''}`}>
        {copied ? (
          <span className="text-[10px] font-black text-[#0E7C7B] absolute -top-8 left-1/2 -translate-x-1/2 bg-white px-2 py-1 rounded shadow-lg animate-in slide-up">COPIADO!</span>
        ) : null}
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
      </div>
      {label && <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>}
    </button>
  );
};

export default ShareButton;
