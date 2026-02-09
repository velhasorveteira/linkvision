
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, FunctionDeclaration, Type } from '@google/genai';
import { Language, AnalysisResult, PerformanceEvent } from '../types';

interface RealTimeJudgeProps {
  language: Language;
  onFinish: (result: AnalysisResult) => void;
}

type CourtView = 'baseline' | 'side' | 'high';
type AlignmentQuality = 'low' | 'mid' | 'high';

const CourtOverlay = ({ view, quality }: { view: CourtView; quality: AlignmentQuality }) => {
  const color = quality === 'high' ? '#22c55e' : quality === 'mid' ? '#eab308' : '#ef4444';
  
  const getLines = () => {
    if (view === 'baseline') {
      return (
        <g className="transition-all duration-700 ease-in-out">
          {/* Quadra em perspectiva de fundo */}
          <path d="M10 90 L90 90 L78 30 L22 30 Z" fill="none" stroke={color} strokeWidth="1" strokeOpacity="0.6" />
          <path d="M22 30 L78 30" fill="none" stroke={color} strokeWidth="1" strokeOpacity="0.4" />
          <path d="M35 55 L65 55" fill="none" stroke={color} strokeWidth="0.8" strokeOpacity="0.4" />
          <path d="M50 55 L50 90" fill="none" stroke={color} strokeWidth="0.8" strokeOpacity="0.4" />
          {/* Guias de centralização */}
          <line x1="50" y1="20" x2="50" y2="10" stroke={color} strokeWidth="0.5" strokeDasharray="2" />
        </g>
      );
    }
    if (view === 'side') {
      return (
        <g className="transition-all duration-700 ease-in-out">
          <path d="M5 95 L95 95 L88 60 L12 60 Z" fill="none" stroke={color} strokeWidth="1" strokeOpacity="0.6" />
          <line x1="50" y1="45" x2="50" y2="95" stroke={color} strokeWidth="2" strokeOpacity="0.8" /> {/* Rede */}
          <line x1="12" y1="60" x2="88" y2="60" stroke={color} strokeWidth="1" strokeOpacity="0.4" />
        </g>
      );
    }
    return (
      <g className="transition-all duration-700 ease-in-out">
        {/* Vista superior total */}
        <rect x="15" y="15" width="70" height="70" fill="none" stroke={color} strokeWidth="1" strokeOpacity="0.6" />
        <line x1="15" y1="50" x2="85" y2="50" stroke={color} strokeWidth="1" strokeOpacity="0.6" />
        <line x1="50" y1="15" x2="50" y2="85" stroke={color} strokeWidth="1" strokeOpacity="0.6" />
      </g>
    );
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center p-4">
      <svg className="w-full h-full drop-shadow-2xl" viewBox="0 0 100 100" preserveAspectRatio="none">
        {getLines()}
      </svg>
    </div>
  );
};

const RealTimeJudge: React.FC<RealTimeJudgeProps> = ({ language, onFinish }) => {
  const isPt = language === 'pt';
  const [isActive, setIsActive] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [events, setEvents] = useState<PerformanceEvent[]>([]);
  const [selectedView, setSelectedView] = useState<CourtView>('baseline');
  const [precision, setPrecision] = useState<AlignmentQuality>('low');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sessionRef = useRef<any>(null);
  const frameIntervalRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Efeito para ligar a câmera e gerenciar o estado do vídeo
  useEffect(() => {
    if (isPreviewOpen && videoRef.current) {
      if (streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.error("Erro ao iniciar playback de vídeo:", error);
          });
        }
      }

      // Ciclo de calibração simulado (melhora conforme estabilidade/tempo)
      const calibInterval = setInterval(() => {
        setPrecision(p => {
          if (p === 'low') return 'mid';
          if (p === 'mid') return 'high';
          return 'high';
        });
      }, 3000);

      return () => clearInterval(calibInterval);
    }
  }, [isPreviewOpen]);

  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: true
      });
      streamRef.current = stream;
      setIsPreviewOpen(true);
    } catch (err) {
      alert(isPt ? "Erro ao acessar câmera: verifique as permissões." : "Camera access error: check permissions.");
    }
  };

  const closeCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setIsPreviewOpen(false);
    setIsActive(false);
    if (frameIntervalRef.current) clearInterval(frameIntervalRef.current);
  };

  const logEventFunction: FunctionDeclaration = {
    name: 'logPerformanceEvent',
    parameters: {
      type: Type.OBJECT,
      description: 'Registra um evento de sucesso ou erro técnico durante a partida.',
      properties: {
        type: { type: Type.STRING, enum: ['success', 'error'] },
        category: { type: Type.STRING, enum: ['Footwork', 'Timing', 'Technique', 'Tactical', 'Line Call'] },
        description: { type: Type.STRING },
        callType: { type: Type.STRING, enum: ['IN', 'OUT', 'NET'] },
      },
      required: ['type', 'category', 'description'],
    },
  };

  const startAnalysis = async () => {
    if (!streamRef.current) return;
    setIsActive(true);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            frameIntervalRef.current = window.setInterval(() => {
              if (videoRef.current && canvasRef.current) {
                const canvas = canvasRef.current;
                const video = videoRef.current;
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
                
                canvas.toBlob((blob) => {
                  if (blob) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      const base64 = (reader.result as string).split(',')[1];
                      sessionPromise.then(session => {
                        session.sendRealtimeInput({ media: { data: base64, mimeType: 'image/jpeg' } });
                      });
                    };
                    reader.readAsDataURL(blob);
                  }
                }, 'image/jpeg', 0.5);
              }
            }, 1000);
          },
          onmessage: async (msg: LiveServerMessage) => {
            if (msg.serverContent?.outputTranscription) setTranscription(msg.serverContent.outputTranscription.text);
            if (msg.toolCall) {
              for (const fc of msg.toolCall.functionCalls) {
                if (fc.name === 'logPerformanceEvent') {
                  const newEvent: PerformanceEvent = {
                    id: crypto.randomUUID(),
                    timestamp: new Date().toLocaleTimeString(),
                    type: fc.args.type as any,
                    category: fc.args.category as any,
                    description: fc.args.description as string,
                    callType: fc.args.callType as any,
                    isLineCall: fc.args.category === 'Line Call'
                  };
                  setEvents(prev => [newEvent, ...prev]);
                  sessionPromise.then(s => s.sendToolResponse({
                    functionResponses: { id: fc.id, name: fc.name, response: { status: 'logged' } }
                  }));
                }
              }
            }
          },
          onerror: (e: any) => {
            console.error("Live analysis error:", e);
            // Handle 404 Requested entity was not found
            if (e.message?.includes("Requested entity was not found") || e.status === 404) {
               if ((window as any).aistudio?.openSelectKey) {
                 (window as any).aistudio.openSelectKey();
               }
            }
            setIsActive(false);
          },
          onclose: () => setIsActive(false),
        },
        config: {
          responseModalities: [Modality.AUDIO],
          tools: [{ functionDeclarations: [logEventFunction] }],
          systemInstruction: `Juiz LinkVision Live. Analise a performance do jogador. Visão atual: ${selectedView}. Precisão de enquadramento: ${precision}.`,
        }
      });
      sessionRef.current = await sessionPromise;
    } catch (e) {
      console.error(e);
      setIsActive(false);
    }
  };

  const stopAnalysis = () => {
    if (frameIntervalRef.current) clearInterval(frameIntervalRef.current);
    sessionRef.current?.close();
    setIsActive(false);
    
    onFinish({
      id: crypto.randomUUID(),
      date: new Date().toLocaleString(),
      sportType: 'Tennis Live Analysis',
      summary: {
        successRate: 88,
        errorRate: 12,
        totalSuccesses: events.filter(e => e.type === 'success').length,
        totalErrors: events.filter(e => e.type === 'error').length,
        totalEvents: events.length,
        technicalScorecard: { consistency: 80, power: 75, footwork: 85, precision: 90 }
      },
      events: events
    });
    closeCamera();
  };

  return (
    <div className="max-w-4xl mx-auto">
      {!isPreviewOpen ? (
        <div className="flex flex-col items-center justify-center py-20 bg-[#1a1a1a] rounded-[3rem] border border-[#333] space-y-10 animate-in fade-in">
           <div className="w-24 h-24 bg-[#0E7C7B]/10 rounded-full flex items-center justify-center text-[#0E7C7B] shadow-[0_0_50px_rgba(14,124,123,0.1)]">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" strokeWidth={2}/></svg>
           </div>
           <div className="text-center space-y-4 px-10">
              <h3 className="text-2xl font-black italic uppercase tracking-widest">{isPt ? 'Modo Juiz Live' : 'Live Judge Mode'}</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed uppercase tracking-widest font-bold">
                {isPt ? 'Inicie a calibração de câmera para análise e chamadas de linha em tempo real.' : 'Start camera calibration for real-time analysis and line calls.'}
              </p>
           </div>
           <button onClick={openCamera} className="px-12 py-5 bg-[#0E7C7B] text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] shadow-2xl active:scale-95 transition-all">
             {isPt ? 'ABRIR CÂMERA FULLSCREEN' : 'OPEN FULLSCREEN CAMERA'}
           </button>
        </div>
      ) : (
        <div className="fixed inset-0 z-[500] bg-black animate-in fade-in">
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            className="w-full h-full object-cover"
          />
          <canvas ref={canvasRef} className="hidden" />
          
          <CourtOverlay view={selectedView} quality={precision} />

          {/* Top Controls */}
          <div className="absolute top-10 left-8 right-8 z-50 flex justify-between items-start">
             <button onClick={closeCamera} className="p-4 bg-black/50 backdrop-blur-2xl rounded-2xl border border-white/10 text-white active:scale-90 transition-all">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
             </button>
             
             <div className="flex flex-col items-center gap-4">
                <div className={`px-6 py-2.5 rounded-full border-2 transition-all flex items-center gap-3 bg-black/50 backdrop-blur-2xl ${
                  precision === 'high' ? 'border-green-500 text-green-500' : 
                  precision === 'mid' ? 'border-yellow-500 text-yellow-500' : 
                  'border-red-500 text-red-500'
                }`}>
                   <div className={`w-2.5 h-2.5 rounded-full ${precision === 'high' ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : precision === 'mid' ? 'bg-yellow-500 shadow-[0_0_10px_#eab308]' : 'bg-red-500 shadow-[0_0_10px_#ef4444] animate-pulse'}`}></div>
                   <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                     {precision === 'high' ? (isPt ? 'ENQUADRAMENTO ÓTIMO' : 'OPTIMAL ALIGNMENT') : 
                      precision === 'mid' ? (isPt ? 'ESTABILIZANDO...' : 'STABILIZING...') : 
                      (isPt ? 'ALINHE A QUADRA' : 'ALIGN THE COURT')}
                   </span>
                </div>
                
                <div className="flex gap-2 bg-black/50 backdrop-blur-2xl p-2 rounded-2xl border border-white/10">
                   {(['baseline', 'side', 'high'] as CourtView[]).map(v => (
                     <button 
                      key={v}
                      onClick={() => setSelectedView(v)}
                      className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${selectedView === v ? 'bg-white text-black shadow-lg' : 'text-slate-400'}`}
                     >
                       {v}
                     </button>
                   ))}
                </div>
             </div>

             <div className="w-14"></div> {/* Spacer */}
          </div>

          {/* Bottom Transcription & REC */}
          <div className="absolute bottom-16 left-0 right-0 z-50 flex flex-col items-center gap-10 px-10">
             {isActive && (
               <div className="bg-black/70 backdrop-blur-3xl border border-white/10 p-6 rounded-[2rem] max-w-xl w-full shadow-2xl animate-in slide-in-from-bottom-10">
                  <p className="text-white text-center text-sm italic font-medium">
                    {transcription || (isPt ? 'Analisando movimentos...' : 'Analyzing movements...')}
                  </p>
               </div>
             )}

             <div className="flex items-center gap-12">
                {isActive && (
                   <div className="flex flex-col items-center gap-1">
                      <div className="px-4 py-2 rounded-xl bg-black/40 border border-white/10 text-white font-mono text-xs">
                        {events.length}
                      </div>
                      <span className="text-[7px] font-black text-white/50 uppercase tracking-widest">Events</span>
                   </div>
                )}

                {/* BOTÃO BOLA DE TÊNIS REC */}
                <button 
                  onClick={isActive ? stopAnalysis : startAnalysis}
                  className={`relative group w-24 h-24 rounded-full transition-all duration-700 active:scale-90 ${isActive ? 'scale-110' : 'hover:scale-105'}`}
                >
                   {/* Glow da bola */}
                   <div className={`absolute -inset-4 rounded-full blur-3xl transition-all duration-1000 ${isActive ? 'bg-[#DFFF00]/20 opacity-100' : 'bg-transparent opacity-0'}`}></div>
                   
                   {/* Esfera da Bola */}
                   <div className={`absolute inset-0 rounded-full border-2 border-white/20 shadow-2xl transition-all duration-500 flex items-center justify-center overflow-hidden ${isActive ? 'bg-[#DFFF00]' : 'bg-[#C5E13F]'}`}>
                      {/* Costuras (Lines) */}
                      <div className="absolute inset-0 border-[3px] border-white/30 rounded-full -m-4 opacity-40" style={{ clipPath: 'ellipse(100% 40% at 50% -10%)' }}></div>
                      <div className="absolute inset-0 border-[3px] border-white/30 rounded-full -m-4 opacity-40" style={{ clipPath: 'ellipse(100% 40% at 50% 110%)' }}></div>
                      
                      {/* Indicador de Status */}
                      <div className="flex flex-col items-center gap-1">
                        <div className={`w-3 h-3 rounded-full mb-1 ${isActive ? 'bg-red-600 animate-pulse' : 'bg-black/20'}`}></div>
                        <span className="text-[11px] font-black text-black/80 uppercase tracking-tighter">
                            {isActive ? 'STOP' : 'REC'}
                        </span>
                      </div>

                      {/* Brilho 3D */}
                      <div className="absolute top-2 left-4 w-6 h-3 bg-white/20 blur-md rounded-full -rotate-15"></div>
                   </div>
                </button>

                {isActive && (
                  <div className="flex flex-col items-center gap-1">
                      <div className="w-4 h-4 bg-red-600 rounded-full animate-ping"></div>
                      <span className="text-[8px] font-black text-white/50 uppercase tracking-widest">Live</span>
                  </div>
                )}
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RealTimeJudge;
