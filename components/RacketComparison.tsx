
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { RacketSpec, Language, ImageSize, AspectRatio } from '../types';
import { compare_rackets, identify_racket_from_image, search_racket_image, generate_racket_image } from '../services/geminiService';
import { fetchRacketsFromDb, syncRacketsFromAI } from '../services/racketSyncService';
import ShareButton from './ShareButton';
import ShareMenu from './ShareMenu';

type SortOption = 'relevant' | 'priceLow' | 'priceHigh' | 'weightHeavy' | 'weightLight';

const BRANDS = ['All', 'Wilson', 'Babolat', 'Head', 'Yonex', 'Prince', 'Dunlop', 'Technifibre'];

const FEATURED_RACKETS: RacketSpec[] = [
  { id: 'w-b98-v9', name: 'Blade 98 v9 (16x19)', brand: 'Wilson', weight: '305g', headSize: '98 sq in', stringPattern: '16x19', balance: '320mm', swingweight: '326', stiffness: '62', powerLevel: 6, controlLevel: 9, comfortLevel: 8, playerType: 'All-court', recommendedLevel: 'Advanced', proPlayers: ['Tsitsipas'], summary: 'Feel moderno com estabilidade torsional superior.', pros: ['Precisão', 'Conexão'], cons: ['Exigente'], priceValue: 250, priceDisplay: '$250.00', imageUrl: 'https://images.tennis.com/image/upload/t_16x9/v1705603713/tennis/Blade_V9_16x19_Angle.jpg' },
  { id: 'b-pa-23', name: 'Pure Aero 2023', brand: 'Babolat', weight: '300g', headSize: '100 sq in', stringPattern: '16x19', balance: '320mm', swingweight: '322', stiffness: '65', powerLevel: 9, controlLevel: 6, comfortLevel: 7, playerType: 'Aggressive', recommendedLevel: 'Advanced', proPlayers: ['Alcaraz'], summary: 'Otimizada para spin absoluto e aerodinâmica.', pros: ['Spin', 'Aceleração'], cons: ['Vibração'], priceValue: 249, priceDisplay: '$249.00', imageUrl: 'https://www.babolat.com/dw/image/v2/BBDC_PRD/on/demandware.static/-/Sites-master-catalog/default/dw106d365f/images/101479_PureAero_1_1.jpg' },
  { id: 'h-sp-24', name: 'Speed Pro 2024', brand: 'Head', weight: '310g', headSize: '100 sq in', stringPattern: '18x20', balance: '315mm', swingweight: '330', stiffness: '60', powerLevel: 5, controlLevel: 9, comfortLevel: 9, playerType: 'Control', recommendedLevel: 'Advanced', proPlayers: ['Djokovic', 'Sinner'], summary: 'Estabilidade máxima e feel Auxetic 2.0.', pros: ['Feel', 'Sólida'], cons: ['Manuseio lento'], priceValue: 279, priceDisplay: '$279.00' },
  { id: 'y-e98-24', name: 'EZONE 98 (2024)', brand: 'Yonex', weight: '305g', headSize: '98 sq in', stringPattern: '16x19', balance: '315mm', swingweight: '318', stiffness: '65', powerLevel: 8, controlLevel: 8, comfortLevel: 8, playerType: 'Aggressive', recommendedLevel: 'Advanced', proPlayers: ['Kyrgios', 'Ruud'], summary: 'Poder explosivo e feel japonês preciso.', pros: ['Snapback', 'Potência'], cons: ['Feedback mudo'], priceValue: 265, priceDisplay: '$265.00' },
];

const BATCH_SIZE = 8;

const Icons = {
  Power: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
  Control: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  Comfort: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
};

const SpecBar: React.FC<{
  label: string,
  value: number,
  color: string,
  icon: React.ReactNode,
  condensed?: boolean
}> = ({ label, value, color, icon, condensed }) => (
  <div className={`space-y-2 w-full ${condensed ? 'space-y-1.5' : 'space-y-3'}`}>
    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
      <div className="flex items-center gap-2">
        <div className={`p-1.5 rounded-lg bg-white/5 ${color.replace('bg-', 'text-')}`}>{icon}</div>
        {!condensed && <span>{label}</span>}
      </div>
      <span className="text-white bg-white/5 px-2.5 py-1 rounded-md font-mono text-xs">{value}/10</span>
    </div>
    <div className={`w-full bg-black/40 rounded-full overflow-hidden border border-white/5 relative shadow-inner ${condensed ? 'h-2' : 'h-3'}`}>
      <div className={`h-full transition-all duration-1000 ease-out ${color}`} style={{ width: `${value * 10}%` }} />
    </div>
  </div>
);

const RacketCard = ({ racket, onOpenDetails, onSelect, isSelected, onImageFound, onGenerateAiImage, isPt, staggerIndex }: any) => {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const performSearch = async () => {
    setIsSearching(true);
    setImgError(false);
    setImgLoaded(false);
    try {
      const url = await search_racket_image(racket.brand, racket.name);
      if (url) {
        onImageFound(racket.id, url);
      } else {
        setImgError(true);
      }
    } catch (e) {
      setImgError(true);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAiGeneration = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsAiGenerating(true);
    try {
      await onGenerateAiImage(racket);
    } catch (err) {
      setImgError(true);
    } finally {
      setIsAiGenerating(false);
    }
  };

  useEffect(() => {
    if (!racket.imageUrl && !isSearching && !imgError && !isAiGenerating) {
      const timer = setTimeout(performSearch, (staggerIndex * 150) + 100);
      return () => clearTimeout(timer);
    }
  }, [racket.id, racket.imageUrl, retryCount]);

  const handleRetry = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImgError(false);
    setImgLoaded(false);
    setRetryCount(prev => prev + 1);
    performSearch();
  };

  return (
    <div
      onClick={() => onOpenDetails(racket)}
      className={`group relative bg-[#1a1a1a] border p-4 sm:p-6 rounded-[2.5rem] flex flex-col transition-all duration-500 hover:scale-[1.03] cursor-pointer shadow-xl ${isSelected ? 'border-[#F39237] bg-[#222]' : 'border-[#333] hover:border-slate-500'}`}
    >
      <div className="absolute top-6 left-6 z-40">
        <ShareButton
          title={racket.name}
          text={`Dá uma olhada nessa raquete no LinkVision: ${racket.brand} ${racket.name}!`}
          className="w-10 h-10 bg-black/40 border border-white/10 rounded-full text-white hover:bg-[#F39237] transition-all"
        />
      </div>
      <div className="absolute top-6 right-6 z-40">
        <button
          onClick={(e) => { e.stopPropagation(); onSelect(racket); }}
          className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-[#F39237] border-[#F39237] text-white shadow-lg scale-110' : 'bg-black/40 border-white/10 text-transparent hover:border-[#F39237] hover:text-[#F39237]'}`}
        >
          {isSelected ? '✓' : <span className="text-xs font-black uppercase">VS</span>}
        </button>
      </div>

      <div className="relative aspect-[1/1.2] mb-6 rounded-[2rem] bg-[#111] overflow-hidden flex items-center justify-center border border-white/5">
        {/* Skeleton Loader */}
        {(!imgLoaded || isSearching || isAiGenerating) && !imgError && (
          <div className="absolute inset-0 z-10 bg-[#1a1a1a]">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-shimmer" />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 opacity-30">
              <div className="w-16 h-16 bg-slate-800 rounded-full animate-pulse"></div>
              <p className="text-[8px] font-black uppercase tracking-widest text-white">
                {isAiGenerating ? (isPt ? 'GERANDO IA...' : 'GENERATING AI...') : (isPt ? 'BUSCANDO...' : 'SEARCHING...')}
              </p>
            </div>
          </div>
        )}

        {racket.imageUrl && !imgError ? (
          <img
            key={racket.imageUrl}
            src={racket.imageUrl}
            alt={racket.name}
            loading="lazy"
            onLoad={() => setImgLoaded(true)}
            onError={() => {
              setImgError(true);
              setImgLoaded(false);
            }}
            className={`w-full h-full object-contain p-8 transition-all duration-1000 ease-out ${imgLoaded ? 'opacity-100 scale-100 blur-0' : 'opacity-0 scale-95 blur-md'}`}
          />
        ) : imgError ? (
          <div className="flex flex-col items-center gap-4 px-6 text-center animate-in fade-in">
            <div className="w-14 h-14 bg-red-500/10 rounded-full flex items-center justify-center text-red-500/50">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div >
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] block">{isPt ? 'Imagem não encontrada' : 'Image not found'}</span>
              <div className="flex flex-col gap-2 mt-2">
                <button
                  onClick={handleRetry}
                  className="text-[8px] font-black text-white bg-slate-800 px-4 py-2 rounded-xl hover:bg-slate-700 transition-all uppercase tracking-widest"
                >
                  {isPt ? 'Tentar Busca' : 'Retry Search'}
                </button>
                <button
                  onClick={handleAiGeneration}
                  disabled={isAiGenerating}
                  className="text-[8px] font-black text-white bg-[#0E7C7B] px-4 py-2 rounded-xl hover:bg-[#0c6b6a] transition-all uppercase tracking-widest shadow-lg active:scale-95"
                >
                  {isPt ? 'Gerar com IA' : 'Generate with AI'}
                </button>
              </div >
            </div >
          </div >
        ) : null}
      </div >

      <div className="space-y-4 px-1 pb-2">
        <span className="text-[10px] font-black text-[#F39237] uppercase tracking-[0.3em] block opacity-70">{racket.brand}</span>
        <h3 className="text-base sm:text-lg font-black italic uppercase tracking-tighter text-white line-clamp-1 group-hover:text-[#F39237] transition-colors">{racket.name}</h3>
        <div className="space-y-3 pt-2">
          <SpecBar condensed label="Power" value={racket.powerLevel} color="bg-link-salmon" icon={<Icons.Power />} />
          <SpecBar condensed label="Control" value={racket.controlLevel} color="bg-link-teal" icon={<Icons.Control />} />
          <SpecBar condensed label="Comfort" value={racket.comfortLevel} color="bg-link-orange" icon={<Icons.Comfort />} />
        </div >
      </div >
    </div >
  );
};

const RacketComparison: React.FC<{ language: Language }> = ({ language }) => {
  const isPt = language === 'pt';
  const [query, setQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('All');
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);
  const [selectedDetails, setSelectedDetails] = useState<RacketSpec | null>(null);
  const [dbRackets, setDbRackets] = useState<RacketSpec[]>(FEATURED_RACKETS);
  const [comparisonSelection, setComparisonSelection] = useState<RacketSpec[]>([]);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isIdentifying, setIsIdentifying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number | 'All'>('All');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isShareMenuOpen, setIsShareMenuOpen] = useState(false);

  const filteredRackets = useMemo(() => {
    let list = [...dbRackets];
    if (selectedBrand !== 'All') list = list.filter(r => r.brand.toLowerCase() === selectedBrand.toLowerCase());
    if (selectedYear !== 'All') {
      list = list.filter(r => r.year ? r.year >= (selectedYear as number) : true);
    }
    if (query) list = list.filter(r => r.name.toLowerCase().includes(query.toLowerCase()) || r.brand.toLowerCase().includes(query.toLowerCase()));
    return list;
  }, [dbRackets, query, selectedBrand, selectedYear]);

  useEffect(() => {
    const loadRackets = async () => {
      setIsLoading(true);
      const rackets = await fetchRacketsFromDb();
      if (rackets.length > 0) {
        setDbRackets(rackets);
      }
      setIsLoading(false);
    };
    loadRackets();
  }, []);

  const handleSearch = async (searchQuery?: string) => {
    const finalQuery = searchQuery || query;
    if (!finalQuery.trim()) return;
    setIsLoading(true);
    try {
      // First try to sync from AI if not found in DB (or just always sync for new data)
      await syncRacketsFromAI(finalQuery, language);
      const updatedRackets = await fetchRacketsFromDb({ search: finalQuery });

      setDbRackets(prev => {
        const combined = [...prev];
        updatedRackets.forEach(nr => {
          if (!combined.some(pr => pr.id === nr.id)) {
            combined.push(nr);
          }
        });
        return combined;
      });
      setVisibleCount(BATCH_SIZE);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageFound = (id: string, url: string) => {
    setDbRackets(p => p.map(x => x.id === id ? { ...x, imageUrl: url } : x));
  };

  const handleGenerateAiImage = async (racket: RacketSpec) => {
    const prompt = `A professional studio product photo of a ${racket.brand} ${racket.name} tennis racket, clean white background, high quality, realistic.`;
    const imageUrl = await generate_racket_image(prompt, '1K', '1:1');
    if (imageUrl) {
      handleImageFound(racket.id, imageUrl);
    }
  };

  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setIsCameraActive(true);
    } catch (err) {
      alert(isPt ? "Acesso à câmera negado." : "Camera access denied.");
    }
  };

  const closeCamera = () => {
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    setIsCameraActive(false);
  };

  const captureAndIdentify = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    setIsIdentifying(true);
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    const base64 = canvas.toDataURL('image/jpeg', 0.8);
    try {
      const identified = await identify_racket_from_image(base64);
      if (identified.name) {
        setQuery(identified.name);
        handleSearch(identified.name);
        closeCamera();
      } else {
        alert(isPt ? "Não foi possível identificar a raquete. Tente novamente." : "Could not identify the racket. Try again.");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsIdentifying(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-10 max-w-7xl mx-auto px-2 sm:px-4 pb-12 relative animate-in fade-in">
      <div className="text-center space-y-4 py-8">
        <h2 className="text-5xl sm:text-8xl font-black italic uppercase tracking-tighter text-white">RACKET <span className="text-[#0E7C7B]">LAB</span></h2>
        <p className="text-[11px] font-black uppercase tracking-[0.5em] text-slate-500">BUSCA TÉCNICA v6.5</p>
      </div>

      <div className="max-w-3xl mx-auto w-full space-y-8">
        <div className="flex flex-col sm:flex-row gap-4 w-full">
          <div className="flex-1 relative">
            <input
              value={query} onChange={e => setQuery(e.target.value)}
              placeholder={isPt ? "Busque por modelo ou marca..." : "Search by model or brand..."}
              className="w-full h-16 bg-[#1a1a1a] border border-[#333] rounded-[1.5rem] px-8 pr-16 text-sm text-white focus:border-[#F39237] outline-none transition-all shadow-xl"
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button
              onClick={openCamera}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 text-slate-500 hover:text-[#0E7C7B] transition-colors"
              title={isPt ? "Identificar por foto" : "Identify by photo"}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </button>
          </div>
          <button onClick={() => handleSearch()} className="h-16 bg-[#F39237] text-white px-12 rounded-[1.5rem] text-[11px] font-black uppercase active:scale-95 transition-all shadow-xl">BUSCAR</button>
        </div>
        <div className="flex flex-wrap justify-center gap-3 py-2">
          {
            BRANDS.map(brand => (
              <button
                key={brand} onClick={() => { setSelectedBrand(brand); setVisibleCount(BATCH_SIZE); }}
                className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${selectedBrand === brand ? 'bg-[#0E7C7B] border-[#0E7C7B] text-white' : 'bg-[#1a1a1a] border-[#333] text-slate-500 hover:text-white'}`}
              >
                {brand}
              </button>
            ))
          }
        </div>

        <div className="flex flex-wrap justify-center gap-3 py-2">
          <span className="text-[10px] font-black uppercase text-slate-500 flex items-center pr-2">{isPt ? 'MODELOS DESDE:' : 'MODELS SINCE:'}</span>
          {[2000, 2010, 2020, 'All'].map(year => (
            <button
              key={year} onClick={() => { setSelectedYear(year as any); setVisibleCount(BATCH_SIZE); }}
              className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${selectedYear === year ? 'bg-[#F39237] border-[#F39237] text-white' : 'bg-[#1a1a1a] border-[#333] text-slate-500 hover:text-white'}`}
            >
              {year === 'All' ? (isPt ? 'TODOS' : 'ALL') : year}
            </button>
          ))}
        </div>
      </div >

      {isLoading && (
        <div className="flex justify-center py-10">
          <div className="w-10 h-10 border-4 border-[#F39237]/20 border-t-[#F39237] rounded-full animate-spin"></div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
        {filteredRackets.slice(0, visibleCount).map((r, index) => (
          <RacketCard
            key={r.id} racket={r} onOpenDetails={() => setSelectedDetails(r)}
            onImageFound={handleImageFound} onGenerateAiImage={handleGenerateAiImage} isPt={isPt} staggerIndex={index}
            onSelect={(sel: RacketSpec) => setComparisonSelection(prev => prev.find(p => p.id === sel.id) ? prev.filter(p => p.id !== sel.id) : [...prev, sel].slice(-2))}
            isSelected={comparisonSelection.some(p => p.id === r.id)}
          />
        ))}
      </div>

      {
        visibleCount < filteredRackets.length && (
          <div className="flex justify-center mt-16 pb-12">
            <button onClick={() => setVisibleCount(v => v + BATCH_SIZE)} className="group flex flex-col items-center gap-4 active:scale-95 transition-all">
              <div className="w-20 h-20 bg-[#1a1a1a] border border-[#333] rounded-full text-3xl font-light text-slate-400 group-hover:border-[#F39237] group-hover:text-[#F39237] shadow-xl flex items-center justify-center transition-all">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-600 group-hover:text-[#F39237] transition-colors">{isPt ? 'VER MAIS' : 'LOAD MORE'}</span>
            </button>
          </div >
        )
      }

      {/* Camera Modal */}
      {
        isCameraActive && (
          <div className="fixed inset-0 z-[700] bg-black/95 flex flex-col items-center justify-center p-6 animate-in fade-in">
            <div className="relative w-full max-w-xl aspect-[3/4] bg-black rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl">
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
              <canvas ref={canvasRef} className="hidden" />

              {/* Overlay guides */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-[80%] aspect-[1/2] border-2 border-white/20 border-dashed rounded-3xl"></div>
              </div>

              <div className="absolute bottom-10 left-0 right-0 flex justify-center items-center gap-10">
                <button onClick={closeCamera} className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center text-white">✕</button>
                <button
                  onClick={captureAndIdentify} disabled={isIdentifying}
                  className={`w-24 h-24 rounded-full border-4 border-white flex items-center justify-center transition-all ${isIdentifying ? 'bg-white/20 scale-90' : 'bg-white/40 active:scale-90 shadow-[0_0_40px_rgba(255,255,255,0.3)]'}`}
                >
                  {isIdentifying ? <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin"></div> : <div className="w-16 h-16 bg-white rounded-full"></div>}
                </button>
                <div className="w-16 h-16"></div> {/* spacer */}
              </div>
            </div>
            <p className="mt-8 text-[11px] font-black uppercase tracking-[0.3em] text-slate-500 text-center px-10">
              {isIdentifying ? (isPt ? 'ANALISANDO EQUIPAMENTO...' : 'ANALYZING EQUIPMENT...') : (isPt ? 'POSICIONE A RAQUETE NO CENTRO' : 'POSITION THE RACKET IN THE CENTER')}
            </p>
          </div >
        )
      }

      {
        comparisonSelection.length > 0 && (
          <div className="fixed bottom-24 lg:bottom-12 left-1/2 -translate-x-1/2 z-[400] w-full max-w-2xl px-4 animate-in slide-up">
            <div className="bg-[#111]/90 backdrop-blur-2xl border border-white/10 p-4 rounded-[2.5rem] shadow-2xl flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 overflow-x-auto no-scrollbar py-1">
                {comparisonSelection.map(r => (
                  <div key={r.id} className="relative w-14 h-14 bg-black rounded-2xl border border-white/10 p-2 flex-shrink-0">
                    <img src={r.imageUrl} className="w-full h-full object-contain" />
                    <button onClick={() => setComparisonSelection(p => p.filter(x => x.id !== r.id))} className="absolute -top-2 -right-2 w-7 h-7 bg-red-600 rounded-full text-white text-[10px] font-bold">✕</button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <ShareButton
                  title="VS Battle LinkVision"
                  text={`Quem ganha esse duelo? ${comparisonSelection[0]?.name} vs ${comparisonSelection[1]?.name || '??'}. Veja no Lab do LinkVision!`}
                  className="h-16 px-6 bg-white/10 text-white rounded-2xl border border-white/10"
                />
                <button onClick={() => setIsCompareOpen(true)} disabled={comparisonSelection.length < 2} className={`h-16 px-10 rounded-2xl font-black uppercase text-[11px] transition-all ${comparisonSelection.length === 2 ? 'bg-[#F39237] text-white shadow-xl' : 'bg-slate-800 text-slate-500'}`}>COMPARAR VS</button>
              </div>
            </div>
          </div >
        )
      }

      {
        isCompareOpen && (
          <div className="fixed inset-0 z-[500] p-4 flex items-center justify-center overflow-y-auto bg-black/70 backdrop-blur-lg">
            <div className="relative w-full max-w-6xl bg-[#1a1a1a]/95 border border-white/10 rounded-[4rem] p-6 sm:p-16 shadow-2xl animate-in zoom-in-95">
              <div className="sticky top-0 bg-transparent flex justify-between items-center mb-16 pb-8 border-b border-white/5 z-20">
                <h3 className="text-4xl font-black italic uppercase tracking-tighter text-white">LV <span className="text-[#F39237]">VS</span> BATTLE</h3>
                <div className="flex gap-4">
                  <ShareButton
                    title="Resultado VS Battle"
                    text={`O veredito das raquetes saiu no LinkVision: ${comparisonSelection.map(r => r.name).join(' vs ')}`}
                    className="h-14 px-8 bg-[#0E7C7B] text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl"
                    label="COMPARTILHAR"
                  />
                  <button onClick={() => setIsCompareOpen(false)} className="h-14 w-14 bg-red-600/10 text-red-600 rounded-2xl border border-red-600/20 flex items-center justify-center font-black">✕</button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 relative">
                {/* Middle "VS" overlay for desktop */}
                <div className="hidden md:flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-[#F39237] rounded-full border-4 border-[#1a1a1a] items-center justify-center z-10 shadow-2xl">
                  <span className="text-xl font-black italic">VS</span>
                </div>

                {comparisonSelection.map((r, i) => (
                  <div key={r.id} className="bg-[#111]/80 p-8 sm:p-14 rounded-[4rem] space-y-12 flex flex-col group">
                    <div className="aspect-square bg-black/50 p-12 rounded-[3rem] border border-white/5 relative flex items-center justify-center group-hover:bg-[#050505] transition-all overflow-hidden">
                      <img src={r.imageUrl} className="max-h-full max-w-full object-contain transition-transform duration-1000 group-hover:scale-110" />
                      <div className="absolute top-6 left-6 px-6 py-2 bg-[#F39237] text-white text-[11px] font-black rounded-full uppercase">{r.brand}</div>
                    </div>
                    <div className="text-center space-y-3">
                      <h4 className="text-3xl font-black italic uppercase text-white leading-tight">{r.name}</h4>
                      <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em]">{r.recommendedLevel}</p>
                    </div>

                    <div className="space-y-8 pt-10 border-t border-white/5">
                      <SpecBar label="Power" value={r.powerLevel} color="bg-link-salmon" icon={<Icons.Power />} />
                      <SpecBar label="Control" value={r.controlLevel} color="bg-link-teal" icon={<Icons.Control />} />
                      <SpecBar label="Comfort" value={r.comfortLevel} color="bg-link-orange" icon={<Icons.Comfort />} />

                      <div className="grid grid-cols-2 gap-4 mt-8 pt-8 border-t border-white/5">
                        <div className="space-y-1">
                          <p className="text-[8px] font-black uppercase text-slate-600 tracking-widest">Weight</p>
                          <p className="text-sm font-black text-white">{r.weight}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[8px] font-black uppercase text-slate-600 tracking-widest">Head Size</p>
                          <p className="text-sm font-black text-white">{r.headSize}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[8px] font-black uppercase text-slate-600 tracking-widest">Pattern</p>
                          <p className="text-sm font-black text-white">{r.stringPattern}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[8px] font-black uppercase text-slate-600 tracking-widest">Price</p>
                          <p className="text-sm font-black text-[#0E7C7B]">{r.priceDisplay || '$' + r.priceValue}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div >
        )
      }

      {
        selectedDetails && (
          <div className="fixed inset-0 z-[600] p-4 flex items-center justify-center bg-black/60 backdrop-blur-xl">
            <div className="relative w-full max-w-3xl bg-[#1a1a1a]/95 border border-white/10 rounded-[4rem] p-8 sm:p-16 shadow-2xl animate-in zoom-in-95 no-scrollbar max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-12">
                <div className="space-y-3">
                  <span className="text-[11px] font-black text-[#F39237] uppercase tracking-[0.5em]">{selectedDetails.brand}</span>
                  <h3 className="text-4xl font-black italic uppercase text-white tracking-tighter leading-tight">{selectedDetails.name}</h3>
                </div>
                <div className="flex gap-2">
                  <ShareButton
                    title={selectedDetails.name}
                    text={`Confira os detalhes técnicos da ${selectedDetails.name} no LinkVision!`}
                    className="p-5 bg-white/5 border border-white/10 rounded-2xl text-white hover:bg-[#F39237] transition-all"
                  />
                  <button onClick={() => setSelectedDetails(null)} className="p-5 bg-[#232323]/50 border border-white/10 rounded-2xl text-slate-500 hover:text-white transition-all font-black">✕</button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="aspect-[4/5] rounded-[3rem] bg-black/50 p-10 flex items-center justify-center border border-white/5 overflow-hidden">
                  {selectedDetails.imageUrl ? (
                    <img src={selectedDetails.imageUrl} className="max-h-full max-w-full object-contain" />
                  ) : (
                    <button
                      onClick={() => handleGenerateAiImage(selectedDetails)}
                      className="bg-[#0E7C7B] text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl active:scale-95 transition-all"
                    >
                      {isPt ? 'Gerar Imagem IA' : 'Generate AI Image'}
                    </button>
                  )}
                </div>
                <div className="space-y-10">
                  <div className="space-y-6">
                    <SpecBar label="Power" value={selectedDetails.powerLevel} color="bg-link-salmon" icon={<Icons.Power />} />
                    <SpecBar label="Control" value={selectedDetails.controlLevel} color="bg-link-teal" icon={<Icons.Control />} />
                    <SpecBar label="Comfort" value={selectedDetails.comfortLevel} color="bg-link-orange" icon={<Icons.Comfort />} />
                  </div>
                  <div className="bg-[#111]/80 rounded-[2.5rem] p-8 grid grid-cols-2 gap-6 border border-white/5">
                    <div><p className="text-[9px] text-slate-600 font-black uppercase mb-1">Weight</p><p className="text-sm font-black text-white">{selectedDetails.weight}</p></div>
                    <div><p className="text-[9px] text-slate-600 font-black uppercase mb-1">Head</p><p className="text-sm font-black text-white">{selectedDetails.headSize}</p></div>
                    <div><p className="text-[9px] text-slate-600 font-black uppercase mb-1">Pattern</p><p className="text-sm font-black text-white">{selectedDetails.stringPattern}</p></div>
                    <div><p className="text-[9px] text-slate-600 font-black uppercase mb-1">Price</p><p className="text-sm font-black text-[#F39237]">{selectedDetails.priceDisplay || selectedDetails.priceValue || 'N/A'}</p></div>
                  </div>
                </div>
              </div>
            </div>
          </div >
        )
      }
      {
        isShareMenuOpen && (
          <ShareMenu
            rackets={comparisonSelection}
            isPt={isPt}
            onClose={() => setIsShareMenuOpen(false)}
          />
        )
      }
    </div >
  );
};

export default RacketComparison;
