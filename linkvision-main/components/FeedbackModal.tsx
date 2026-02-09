
import React, { useState } from 'react';
import { FeedbackType, Language } from '../types';
import { processUserFeedback } from '../services/geminiService';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose, language }) => {
  const [type, setType] = useState<FeedbackType>('suggestion');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [response, setResponse] = useState<string | null>(null);

  const t = {
    pt: {
      title: 'Feedback LinkVision',
      typeLabel: 'Categoria',
      bug: 'Bug / Erro',
      suggestion: 'Sugestão',
      other: 'Outro',
      messagePlaceholder: 'Descreva sua experiência ou sugestão...',
      submit: 'Enviar Feedback',
      sending: 'Transmitindo...',
      close: 'Fechar',
      thankYou: 'Agradecemos o seu contato!'
    },
    en: {
      title: 'LinkVision Feedback',
      typeLabel: 'Category',
      bug: 'Bug / Error',
      suggestion: 'Suggestion',
      other: 'Other',
      messagePlaceholder: 'Describe your experience or suggestion...',
      submit: 'Submit Feedback',
      sending: 'Transmitting...',
      close: 'Close',
      thankYou: 'Thank you for reaching out!'
    }
  }[language];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsSubmitting(true);
    try {
      const aiResponse = await processUserFeedback(type, message, language);
      setResponse(aiResponse || t.thankYou);
    } catch (error) {
      setResponse(t.thankYou);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-[#232323]/80 backdrop-blur-xl" onClick={onClose}></div>
      
      <div className="relative w-full max-w-lg bg-[#1a1a1a] border border-[#333] rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-8 border-b border-[#333] flex justify-between items-center bg-[#222]">
          <h2 className="text-xl font-black italic uppercase tracking-tighter">
            {t.title}
          </h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-8">
          {response ? (
            <div className="space-y-6 text-center animate-in slide-in-from-bottom-5">
              <div className="w-16 h-16 bg-[#0E7C7B]/20 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-[#0E7C7B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-slate-300 leading-relaxed italic">{response}</p>
              <button 
                onClick={onClose}
                className="w-full py-4 bg-[#232323] border border-[#333] rounded-xl font-black uppercase tracking-widest hover:border-[#F39237] transition-all"
              >
                {t.close}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 tracking-widest mb-3">
                  {t.typeLabel}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['bug', 'suggestion', 'other'] as FeedbackType[]).map((ft) => (
                    <button
                      key={ft}
                      type="button"
                      onClick={() => setType(ft)}
                      className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-tighter border transition-all ${
                        type === ft 
                          ? 'bg-[#F39237] border-[#F39237] text-white shadow-lg' 
                          : 'bg-[#232323] border-[#333] text-slate-500 hover:text-white'
                      }`}
                    >
                      {t[ft]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <textarea
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={t.messagePlaceholder}
                  className="w-full h-40 bg-[#232323] border border-[#333] rounded-2xl p-6 text-white placeholder:text-slate-600 focus:border-[#0E7C7B] outline-none transition-all resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-5 rounded-2xl font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 ${
                  isSubmitting 
                    ? 'bg-[#333] text-slate-500 cursor-not-allowed' 
                    : 'bg-[#0E7C7B] text-white hover:scale-[1.02] shadow-xl shadow-[#0E7C7B]/20'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-500 border-t-white rounded-full animate-spin"></div>
                    {t.sending}
                  </>
                ) : t.submit}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default FeedbackModal;
