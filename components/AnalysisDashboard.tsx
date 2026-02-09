
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { AnalysisResult, Language, PerformanceEvent } from '../types';
import StatCard from './StatCard';
import ShareButton from './ShareButton';

interface AnalysisDashboardProps {
  result: AnalysisResult;
  language: Language;
  onCalibrate: (eventId: string) => void;
  videoUrl?: string;
  autoPlay?: boolean;
}

const parseTimestampToSeconds = (timestamp: string): number => {
  if (!timestamp) return 0;
  const parts = timestamp.split(':').map(Number);
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return 0;
};

const ServeMap: React.FC<{ events: PerformanceEvent[], language: Language }> = ({ events, language }) => {
  const serves = useMemo(() => {
    return events.filter(e => 
      e.movement?.toLowerCase().includes('saque') || 
      e.movement?.toLowerCase().includes('serve')
    );
  }, [events]);

  const serveStats = useMemo(() => {
    const total = serves.length;
    const ins = serves.filter(s => s.callType === 'IN').length;
    const outs = serves.filter(s => s.callType === 'OUT').length;
    const nets = serves.filter(s => s.callType === 'NET').length;
    return {
      total,
      rate: total > 0 ? Math.round((ins / total) * 100) : 0,
      ins, outs, nets
    };
  }, [serves]);

  const getMarkerPos = (location: string = '') => {
    const loc = location.toLowerCase();
    let x = 50;
    let y = 35; 
    if (loc.includes('t') || loc.includes('centro')) x = 50;
    else if (loc.includes('aberto') || loc.includes('wide')) x = 25;
    else if (loc.includes('corpo') || loc.includes('body')) x = 75;
    if (loc.includes('curto') || loc.includes('short')) y = 30;
    else if (loc.includes('fundo') || loc.includes('deep')) y = 40;
    return { 
      x: x + (Math.random() * 6 - 3), 
      y: y + (Math.random() * 6 - 3) 
    };
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-black/20 border border-white/5 p-4 rounded-2xl text-center">
          <p className="text-[8px] font-black uppercase text-slate-500 mb-1">Aproveitamento</p>
          <p className="text-xl font-black italic text-[#0E7C7B]">{serveStats.rate}%</p>
        </div>
        <div className="bg-black/20 border border-white/5 p-4 rounded-2xl text-center">
          <p className="text-[8px] font-black uppercase text-slate-500 mb-1">Dentro</p>
          <p className="text-xl font-black italic text-white">{serveStats.ins}</p>
        </div>
        <div className="bg-black/20 border border-white/5 p-4 rounded-2xl text-center">
          <p className="text-[8px] font-black uppercase text-slate-500 mb-1">Fora</p>
          <p className="text-xl font-black italic text-[#E26D5C]">{serveStats.outs}</p>
        </div>
        <div className="bg-black/20 border border-white/5 p-4 rounded-2xl text-center">
          <p className="text-[8px] font-black uppercase text-slate-500 mb-1">Rede</p>
          <p className="text-xl font-black italic text-slate-400">{serveStats.nets}</p>
        </div>
      </div>

      <div className="relative aspect-[3/4] max-w-[400px] mx-auto bg-[#1a1a1a] border border-[#333] rounded-[2rem] overflow-hidden p-6 shadow-2xl">
        <svg viewBox="0 0 100 120" className="w-full h-full stroke-white/20 fill-none" strokeWidth="1">
          <line x1="10" y1="10" x2="90" y2="10" />
          <line x1="10" y1="50" x2="90" y2="50" />
          <line x1="5" y1="60" x2="95" y2="60" stroke="#0E7C7B" strokeWidth="2" strokeOpacity="0.5" />
          <line x1="10" y1="70" x2="90" y2="70" strokeOpacity="0.3" />
          <line x1="10" y1="110" x2="90" y2="110" strokeOpacity="0.3" />
          <line x1="10" y1="10" x2="10" y2="110" />
          <line x1="90" y1="10" x2="90" y2="110" />
          <line x1="50" y1="10" x2="50" y2="50" />
          {serves.map((s, i) => {
            const pos = getMarkerPos(s.location);
            return (
              <g key={s.id} className="animate-in zoom-in-95" style={{ animationDelay: `${i * 100}ms` }}>
                <circle cx={pos.x} cy={pos.y} r="3" fill={s.callType === 'IN' ? '#0E7C7B' : s.callType === 'OUT' ? '#E26D5C' : '#666'} />
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

const AnalysisDashboard: React.FC<AnalysisDashboardProps> = ({ result, language, videoUrl, onCalibrate, autoPlay }) => {
  const [activeTab, setActiveTab] = useState<'timeline' | 'servemap'>('timeline');
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [calibratingId, setCalibratingId] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const isPt = language === 'pt';
  const t = {
    total: isPt ? 'Total de Lances' : 'Total Plays',
    success: isPt ? 'Acertos' : 'Successes',
    error: isPt ? 'Erros' : 'Errors',
    rate: isPt ? 'Eficácia' : 'Effectiveness',
    timeline: isPt ? 'Registro de Lances' : 'Play Log',
    serveMap: isPt ? 'Mapa de Saque' : 'Serve Map',
    jump: isPt ? 'Ir para o lance' : 'Jump to play',
    calibrate: isPt ? 'Calibrar' : 'Calibrate'
  };

  const activeEventId = useMemo(() => {
    let activeId = null;
    let closestDiff = Infinity;
    (result.events || []).forEach(event => {
      const eventSeconds = parseTimestampToSeconds(event.timestamp);
      const diff = Math.abs(currentTime - eventSeconds);
      if (diff < 1.5 && diff < closestDiff) {
        closestDiff = diff;
        activeId = (event as any).id;
      }
    });
    return activeId;
  }, [currentTime, result.events]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) videoRef.current.pause();
    else videoRef.current.play();
    setIsPlaying(!isPlaying);
  };

  const jumpToEvent = (timestamp: string) => {
    const seconds = parseTimestampToSeconds(timestamp);
    if (videoRef.current) {
      videoRef.current.currentTime = seconds;
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleCalibrateClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setCalibratingId(id);
    onCalibrate(id);
    // Remove the ID after the animation completes
    setTimeout(() => setCalibratingId(null), 1000);
  };

  const shareText = `Veredito LinkVision: Taxa de acerto de ${Math.round(result.summary.successRate)}% em ${result.summary.totalEvents} lances analisados pela IA!`;

  return (
    <div className="space-y-6 sm:space-y-10 animate-in fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-end gap-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full">
          <StatCard label={t.rate} value={`${Math.round(result.summary.successRate)}%`} colorClass="text-[#0E7C7B]" />
          <StatCard label={t.success} value={result.summary.totalSuccesses} colorClass="text-[#0E7C7B]" />
          <StatCard label={t.error} value={result.summary.totalErrors} colorClass="text-[#E26D5C]" />
          <StatCard label={t.total} value={result.summary.totalEvents} colorClass="text-white" />
        </div>
        <ShareButton 
          title="Minha Análise LinkVision"
          text={shareText}
          label={isPt ? "Compartilhar Veredito" : "Share Verdict"}
          className="h-16 px-8 bg-[#1a1a1a] border border-[#333] rounded-2xl text-[#F39237] hover:border-[#F39237] shadow-xl w-full sm:w-auto whitespace-nowrap"
          variant="minimal"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div className="bg-[#1a1a1a] border border-[#333] p-2 rounded-[2.5rem] overflow-hidden bg-black shadow-2xl relative group h-fit">
           <video 
            ref={videoRef} src={videoUrl} className="w-full h-full object-contain aspect-video cursor-pointer" 
            onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
            onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onClick={togglePlay}
           />
           <div className="absolute bottom-4 left-4 right-4 bg-black/80 backdrop-blur-xl border border-white/10 rounded-3xl p-4 flex flex-col gap-3 transition-all duration-500 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0">
              <div className="flex items-center gap-4">
                 <button onClick={togglePlay} className="p-2 text-white">{isPlaying ? '❚❚' : '▶'}</button>
                 <div className="flex-1 flex flex-col gap-1">
                    <input type="range" min="0" max={duration || 0} step="0.01" value={currentTime} onChange={(e) => videoRef.current && (videoRef.current.currentTime = parseFloat(e.target.value))} className="w-full accent-[#0E7C7B]" />
                 </div>
              </div>
           </div>
        </div>
        
        <div className="bg-[#1a1a1a] border border-[#333] p-8 rounded-[3rem] flex flex-col h-full max-h-[700px] shadow-xl">
           <div className="flex justify-center mb-8">
              <div className="inline-flex bg-[#111] p-1 rounded-2xl border border-[#333]">
                <button onClick={() => setActiveTab('timeline')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${activeTab === 'timeline' ? 'bg-[#0E7C7B] text-white shadow-lg' : 'text-slate-500'}`}>{t.timeline}</button>
                <button onClick={() => setActiveTab('servemap')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${activeTab === 'servemap' ? 'bg-[#F39237] text-white shadow-lg' : 'text-slate-500'}`}>{t.serveMap}</button>
              </div>
           </div>
           
           <div className="flex-1 overflow-y-auto no-scrollbar">
              {activeTab === 'timeline' ? (
                <div ref={listRef} className="space-y-4 pr-2">
                  {(result.events || []).map((event: any) => (
                    <div 
                      key={event.id} data-event-id={event.id} onClick={() => jumpToEvent(event.timestamp)}
                      className={`group relative p-6 rounded-[2rem] border transition-all duration-500 cursor-pointer overflow-hidden ${
                        activeEventId === event.id 
                          ? 'bg-white border-white scale-[1.02] shadow-2xl' 
                          : 'bg-[#232323] border-[#333] hover:border-slate-600'
                      }`}
                    >
                      {/* Calibration Animation Overlay */}
                      {calibratingId === event.id && (
                        <div className="absolute inset-0 bg-[#0E7C7B]/10 animate-pulse pointer-events-none z-10 flex items-center justify-center">
                          <div className="bg-[#0E7C7B] text-white p-3 rounded-full animate-bounce">
                             <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>
                          </div>
                        </div>
                      )}

                      <div className="flex justify-between items-center mb-5">
                        <span className={`text-[10px] font-black font-mono px-3 py-1 rounded-full ${activeEventId === event.id ? 'bg-black text-white' : 'bg-black/40 text-slate-500'}`}>{event.timestamp}</span>
                        <div className="flex items-center gap-3">
                           <button 
                             onClick={(e) => handleCalibrateClick(e, event.id)}
                             className={`p-2 rounded-lg border transition-all ${
                               activeEventId === event.id 
                                 ? 'bg-black/5 border-black/10 text-black hover:bg-black/10' 
                                 : 'bg-white/5 border-white/10 text-slate-500 hover:text-white hover:border-[#0E7C7B]'
                             }`}
                             title={t.calibrate}
                           >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                           </button>
                           <span className={`text-[11px] font-black uppercase tracking-widest ${event.callType === 'IN' ? 'text-[#0E7C7B]' : 'text-[#E26D5C]'}`}>{event.callType}</span>
                           <div className={`w-2 h-2 rounded-full ${event.type === 'success' ? 'bg-[#0E7C7B]' : 'bg-[#E26D5C]'}`}></div>
                        </div>
                      </div>
                      <div className={`text-sm font-black italic uppercase tracking-tighter mb-2 transition-colors ${activeEventId === event.id ? 'text-black' : 'text-white group-hover:text-[#F39237]'}`}>{event.movement}</div>
                      <p className={`text-[11px] italic transition-colors ${activeEventId === event.id ? 'text-slate-600' : 'text-slate-500'}`}>"{event.description}"</p>
                    </div>
                  ))}
                </div>
              ) : (
                <ServeMap events={result.events} language={language} />
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisDashboard;
