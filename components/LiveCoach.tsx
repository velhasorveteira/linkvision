
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { Language } from '../types';

interface LiveCoachProps {
  language: Language;
}

const LiveCoach: React.FC<LiveCoachProps> = ({ language }) => {
  const isPt = language === 'pt';
  const [isActive, setIsActive] = useState(false);
  const [transcription, setTranscription] = useState('');
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionRef = useRef<any>(null);

  const decodeAudio = (base64: string) => {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  };

  const decodeAudioData = async (data: Uint8Array, ctx: AudioContext) => {
    const dataInt16 = new Int16Array(data.buffer);
    const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;
    return buffer;
  };

  const encodeAudio = (data: Float32Array) => {
    const int16 = new Int16Array(data.length);
    for (let i = 0; i < data.length; i++) int16[i] = data[i] * 32768;
    const bytes = new Uint8Array(int16.buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  };

  const startSession = async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const inputCtx = new AudioContext({ sampleRate: 16000 });
    const outputCtx = new AudioContext({ sampleRate: 24000 });
    audioContextRef.current = outputCtx;

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    const sessionPromise = ai.live.connect({
      model: 'gemini-2.5-flash-native-audio-preview-12-2025',
      callbacks: {
        onopen: () => {
          const source = inputCtx.createMediaStreamSource(stream);
          const processor = inputCtx.createScriptProcessor(4096, 1, 1);
          processor.onaudioprocess = (e) => {
            const inputData = e.inputBuffer.getChannelData(0);
            sessionPromise.then(session => {
              session.sendRealtimeInput({
                media: { data: encodeAudio(inputData), mimeType: 'audio/pcm;rate=16000' }
              });
            });
          };
          source.connect(processor);
          processor.connect(inputCtx.destination);
          setIsActive(true);
        },
        onmessage: async (msg: LiveServerMessage) => {
          if (msg.serverContent?.outputTranscription) {
            setTranscription(prev => prev + msg.serverContent!.outputTranscription!.text);
          }
          const base64Audio = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
          if (base64Audio) {
            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
            const buffer = await decodeAudioData(decodeAudio(base64Audio), outputCtx);
            const source = outputCtx.createBufferSource();
            source.buffer = buffer;
            source.connect(outputCtx.destination);
            source.start(nextStartTimeRef.current);
            nextStartTimeRef.current += buffer.duration;
            activeSourcesRef.current.add(source);
            source.onended = () => activeSourcesRef.current.delete(source);
          }
          if (msg.serverContent?.interrupted) {
            activeSourcesRef.current.forEach(s => s.stop());
            activeSourcesRef.current.clear();
            nextStartTimeRef.current = 0;
          }
        },
        onerror: (e) => console.error("Live API Error", e),
        onclose: () => setIsActive(false),
      },
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
        systemInstruction: "You are LinkVision Live Coach. Talk to the athlete in real-time. Keep it brief, technical, and motivating.",
        outputAudioTranscription: {}
      }
    });

    sessionRef.current = await sessionPromise;
  };

  const stopSession = () => {
    sessionRef.current?.close();
    setIsActive(false);
  };

  return (
    <div className="max-w-2xl mx-auto bg-[#1a1a1a] border border-[#333] rounded-[3rem] p-10 text-center space-y-8 shadow-2xl">
      <div className="relative inline-block">
        <div className={`w-32 h-32 rounded-full flex items-center justify-center border-4 transition-all duration-700 ${isActive ? 'border-[#0E7C7B] bg-[#0E7C7B]/10 animate-pulse' : 'border-[#333] bg-black/20'}`}>
          <svg className={`w-12 h-12 ${isActive ? 'text-[#0E7C7B]' : 'text-slate-700'}`} fill="currentColor" viewBox="0 0 24 24"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>
        </div>
        {isActive && <div className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full animate-ping"></div>}
      </div>

      <div className="space-y-4">
        <h2 className="text-3xl font-black italic uppercase tracking-tighter">{isActive ? (isPt ? 'Coach Online' : 'Coach Live') : (isPt ? 'Voz em Tempo Real' : 'Real-time Voice')}</h2>
        <p className="text-slate-400 text-sm max-w-sm mx-auto italic">{isPt ? 'Converse agora com o LinkVision para feedback instantâneo.' : 'Talk now to LinkVision for instant feedback.'}</p>
      </div>

      <button 
        onClick={isActive ? stopSession : startSession}
        className={`px-12 py-5 rounded-2xl font-black uppercase tracking-[0.2em] transition-all shadow-xl ${isActive ? 'bg-[#E26D5C] hover:scale-105' : 'bg-[#0E7C7B] hover:scale-105 shadow-[#0E7C7B]/20'}`}
      >
        {isActive ? (isPt ? 'Encerrar Sessão' : 'Stop Session') : (isPt ? 'Iniciar Treino de Voz' : 'Start Voice Training')}
      </button>

      {transcription && (
        <div className="mt-8 p-6 bg-black/30 rounded-2xl border border-[#333] text-left">
           <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Live Transcription:</p>
           <p className="text-xs text-slate-300 italic">"{transcription}"</p>
        </div>
      )}
    </div>
  );
};

export default LiveCoach;
