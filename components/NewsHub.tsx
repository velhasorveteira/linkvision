
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Language } from '../types';
import { fetchTennisNews, generateNewsIllustration } from '../services/geminiService';
import ShareButton from './ShareButton';

interface TennisArticle {
  title: string;
  description: string;
  category?: string;
  sourceUrl: string;
  sourceName: string;
  date?: string;
}

interface NewsHubProps {
  language: Language;
}

const ArticleCard: React.FC<{ article: TennisArticle; isHero?: boolean; language: Language }> = ({ article, isHero, language }) => {
  const [aiImage, setAiImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const isPt = language === 'pt';

  const loadIllustration = useCallback(async () => {
    if (aiImage || isGenerating) return;
    setIsGenerating(true);
    try {
      const img = await generateNewsIllustration(article.title, article.description);
      setAiImage(img);
    } catch (e) {
      console.warn("Illustration generation failed", e);
    } finally {
      setIsGenerating(false);
    }
  }, [article.title, article.description, aiImage, isGenerating]);

  useEffect(() => {
    const delay = isHero ? 100 : Math.random() * 800 + 400;
    const timeout = setTimeout(loadIllustration, delay);
    return () => clearTimeout(timeout);
  }, [loadIllustration, isHero]);

  const handleDownloadCharge = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!aiImage) return;
    
    const link = document.createElement('a');
    link.href = aiImage;
    link.download = `charge-lv-${article.title.substring(0, 15).toLowerCase().replace(/\s+/g, '-')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div 
      className={`group relative flex flex-col bg-[#1a1a1a] border border-[#333] rounded-[2.5rem] overflow-hidden transition-all duration-700 hover:border-[#0E7C7B] hover:shadow-[0_0_80px_rgba(14,124,123,0.15)] ${isHero ? 'lg:flex-row lg:col-span-2' : ''}`}
    >
      <div className={`relative overflow-hidden bg-[#111] ${isHero ? 'lg:w-[65%] aspect-[16/9]' : 'aspect-[16/10]'}`}>
        {isGenerating && !aiImage ? (
          <div className="w-full h-full flex flex-col items-center justify-center bg-[#111] absolute inset-0">
             <div className="w-12 h-12 border-4 border-[#0E7C7B]/20 border-t-[#0E7C7B] rounded-full animate-spin"></div>
             <span className="text-[9px] font-black uppercase tracking-[0.4em] text-[#0E7C7B] mt-5 animate-pulse">IA CRIANDO CHARGE...</span>
          </div>
        ) : aiImage ? (
          <>
            <img 
              src={aiImage} 
              alt={article.title} 
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-[3s] group-hover:scale-110"
            />
            <div className="absolute top-4 right-4 z-20 flex gap-2">
              <ShareButton 
                title={article.title}
                text={`Acabei de ver no LinkVision: ${article.title}. Com charge gerada por IA!`}
                url={article.sourceUrl}
                className="p-3 bg-black/60 backdrop-blur-md border border-white/10 rounded-full text-white hover:bg-[#F39237] transition-all opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100"
              />
              <button 
                onClick={handleDownloadCharge}
                className="p-3 bg-black/60 backdrop-blur-md border border-white/10 rounded-full text-white hover:bg-[#0E7C7B] transition-all opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100"
                title={isPt ? "Baixar Charge" : "Download Cartoon"}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
            </div>
          </>
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
      </div>

      <div className={`p-10 sm:p-14 flex flex-col justify-between ${isHero ? 'lg:w-[35%]' : ''}`}>
        <div className="space-y-6">
          <div className="flex items-center gap-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
            <span className="text-[#F39237] px-4 py-1.5 bg-[#F39237]/10 rounded-full border border-[#F39237]/20">{article.sourceName}</span>
            <span>•</span>
            <span className="font-mono text-slate-600">CHARGE_HUMOR_LV</span>
          </div>
          <h3 className={`${isHero ? 'text-3xl' : 'text-xl'} font-black italic uppercase tracking-tighter text-white group-hover:text-[#F39237] transition-colors leading-tight line-clamp-2`}>
            {article.title}
          </h3>
          <p className="text-slate-400 text-sm leading-relaxed line-clamp-4 font-medium opacity-80 group-hover:opacity-100 transition-opacity">
            {article.description}
          </p>
        </div>
        
        <div className="mt-10 flex flex-col gap-3">
          <a 
            href={article.sourceUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-[#0E7C7B] hover:translate-x-3 transition-transform"
          >
            {isPt ? 'ABRIR MATÉRIA' : 'OPEN ARTICLE'}
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7-7 7" /></svg>
          </a>
        </div>
      </div>
    </div>
  );
};

const NewsHub: React.FC<NewsHubProps> = ({ language }) => {
  const [articles, setArticles] = useState<TennisArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const isPt = language === 'pt';

  const loadNews = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchTennisNews(language);
      if (data && Array.isArray(data.articles)) {
        setArticles(data.articles);
      } else {
        setArticles([]);
      }
    } catch (err) {
      console.error("News stream interrupted:", err);
      setArticles([]);
    } finally {
      setIsLoading(false);
    }
  }, [language]);

  useEffect(() => {
    loadNews();
  }, [loadNews, refreshKey]);

  return (
    <div className="space-y-12 max-w-7xl mx-auto px-2 sm:px-4 pb-24 animate-in fade-in">
      <header className="text-center space-y-8 py-6">
        <div className="inline-flex items-center gap-3 px-6 py-2 bg-[#0E7C7B]/10 border border-[#0E7C7B]/30 rounded-full shadow-[0_0_20px_rgba(14,124,123,0.2)]">
           <div className="w-2 h-2 bg-[#0E7C7B] rounded-full animate-ping"></div>
           <span className="text-[10px] font-black text-[#0E7C7B] uppercase tracking-[0.5em]">{isPt ? 'carregando' : 'loading'}</span>
        </div>
        <h2 className="text-6xl sm:text-9xl font-black italic uppercase tracking-tighter text-white">
          <span className="text-[#0E7C7B]">LV</span> NEWS
        </h2>
        <div className="h-0.5 w-32 bg-[#F39237] mx-auto rounded-full"></div>
      </header>

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="lg:col-span-2 aspect-[21/9] bg-[#1a1a1a] rounded-[3.5rem] animate-pulse relative overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-shimmer"></div>
          </div>
          <div className="aspect-[16/10] bg-[#1a1a1a] rounded-[2.5rem] animate-pulse"></div>
          <div className="aspect-[16/10] bg-[#1a1a1a] rounded-[2.5rem] animate-pulse"></div>
        </div>
      ) : articles.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {articles.map((article, idx) => (
            <ArticleCard 
              key={`${refreshKey}-${idx}-${article.title.substring(0, 10)}`} 
              article={article} 
              isHero={idx === 0} 
              language={language}
            />
          ))}
        </div>
      ) : (
        <div className="py-40 text-center space-y-10 bg-[#1a1a1a] border border-[#333] border-dashed rounded-[5rem] shadow-inner">
           <div className="flex flex-col items-center gap-6 opacity-30">
              <svg className="w-24 h-24 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2" strokeWidth={1} /></svg>
              <p className="text-sm font-black uppercase text-slate-500 tracking-[0.4em]">{isPt ? 'Conexão perdida com o feed.' : 'Feed signal lost.'}</p>
           </div>
           <button 
             onClick={() => setRefreshKey(k => k + 1)}
             className="px-14 py-5 bg-[#0E7C7B] text-white rounded-[2rem] font-black uppercase text-[11px] tracking-[0.3em] shadow-2xl hover:scale-105 active:scale-95 transition-all"
           >
             {isPt ? 'RECONECTAR AO HUB' : 'RECONNECT TO HUB'}
           </button>
        </div>
      )}
    </div>
  );
};

export default NewsHub;
