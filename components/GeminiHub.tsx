
import React, { useState, useRef } from 'react';
// Changed generateRacketImage to generate_racket_image to match services/geminiService.ts
import { generateCoachChat, generate_racket_image, editTennisImage, animateTennisPhoto, transcribeCoachAudio } from '../services/geminiService';
import { AspectRatio, ImageSize, Language } from '../types';

interface GeminiHubProps {
  language: Language;
}

const GeminiHub: React.FC<GeminiHubProps> = ({ language }) => {
  const isPt = language === 'pt';
  const [activeMode, setActiveMode] = useState<'chat' | 'visual'>('chat');
  const [prompt, setPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Chat State
  const [chatLog, setChatLog] = useState<{ role: 'user' | 'bot', content: string, sources?: any[] }[]>([]);
  const [useThinking, setUseThinking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  // Added const to fix "Cannot find name 'mediaRecorderRef'" error
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  // Visual State
  const [imageSize, setImageSize] = useState<ImageSize>('1K');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [resultVideo, setResultVideo] = useState<string | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSendChat = async () => {
    if (!prompt.trim()) return;
    const userMsg = prompt;
    setPrompt('');
    setChatLog(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsProcessing(true);
    try {
      const response = await generateCoachChat(userMsg, chatLog, useThinking);
      setChatLog(prev => [...prev, { role: 'bot', content: response.text, sources: response.sources }]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/wav' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64 = (reader.result as string).split(',')[1];
          setIsProcessing(true);
          const text = await transcribeCoachAudio(base64);
          setPrompt(text);
          setIsProcessing(false);
        };
      };
      recorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Mic access denied", err);
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  const handleImageGen = async () => {
    if (!prompt.trim()) return;

    // Pro models (2K, 4K) require a selected API key as per guidelines.
    if ((imageSize === '2K' || imageSize === '4K') && (window as any).aistudio && !(await (window as any).aistudio.hasSelectedApiKey())) {
      await (window as any).aistudio.openSelectKey();
      // Guidelines: assume success after triggering openSelectKey and proceed.
    }

    setIsProcessing(true);
    setResultVideo(null);
    try {
      // Updated call to generate_racket_image
      const img = await generate_racket_image(prompt, imageSize, aspectRatio);
      setResultImage(img);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImageEdit = async () => {
    if (!uploadPreview || !prompt.trim()) return;
    setIsProcessing(true);
    try {
      const img = await editTennisImage(uploadPreview, prompt);
      setResultImage(img);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVideoAnimate = async () => {
    const source = uploadPreview || resultImage;
    if (!source) return;
    
    // Check if key is selected (Veo/Pro requirement)
    if ((window as any).aistudio && !(await (window as any).aistudio.hasSelectedApiKey())) {
      await (window as any).aistudio.openSelectKey();
      // Guidelines: assume success after triggering openSelectKey and proceed.
    }

    setIsProcessing(true);
    try {
      const video = await animateTennisPhoto(source, prompt, (aspectRatio === '16:9' || aspectRatio === '9:16') ? aspectRatio : '16:9');
      setResultVideo(video);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (re) => setUploadPreview(re.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in">
      <div className="flex bg-[#1a1a1a] p-1 rounded-2xl border border-[#333] w-fit mx-auto">
        <button onClick={() => setActiveMode('chat')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeMode === 'chat' ? 'bg-[#0E7C7B] text-white' : 'text-slate-500'}`}>
          {isPt ? 'Coach Chat' : 'Coach Chat'}
        </button>
        <button onClick={() => setActiveMode('visual')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeMode === 'visual' ? 'bg-[#F39237] text-white' : 'text-slate-500'}`}>
          {isPt ? 'Visual Studio' : 'Visual Studio'}
        </button>
      </div>

      {activeMode === 'chat' ? (
        <div className="bg-[#1a1a1a] border border-[#333] rounded-[3rem] p-8 flex flex-col h-[700px] shadow-2xl">
          <div className="flex-1 overflow-y-auto space-y-6 no-scrollbar pr-4 mb-6">
            {chatLog.map((chat, i) => (
              <div key={i} className={`flex ${chat.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-up`}>
                <div className={`max-w-[80%] p-5 rounded-3xl ${chat.role === 'user' ? 'bg-[#0E7C7B] text-white' : 'bg-[#232323] text-slate-200 border border-[#333]'}`}>
                  <p className="text-sm leading-relaxed">{chat.content}</p>
                  {chat.sources && chat.sources.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2">Sources:</p>
                      <div className="flex flex-wrap gap-2">
                        {chat.sources.map((s, si) => (
                          <a key={si} href={s.web?.uri} target="_blank" className="text-[10px] bg-black/20 px-2 py-1 rounded hover:underline">{s.web?.title}</a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isProcessing && (
              <div className="flex justify-start animate-pulse">
                <div className="bg-[#232323] p-4 rounded-full border border-[#333]">
                  <div className="w-2 h-2 bg-[#0E7C7B] rounded-full animate-bounce"></div>
                </div>
              </div>
            )}
          </div>
          <div className="space-y-4">
             <div className="flex items-center gap-4 px-4">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className={`w-8 h-4 rounded-full relative transition-all ${useThinking ? 'bg-[#0E7C7B]' : 'bg-[#333]'}`}>
                    <input type="checkbox" checked={useThinking} onChange={(e) => setUseThinking(e.target.checked)} className="hidden" />
                    <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${useThinking ? 'left-4.5' : 'left-0.5'}`} />
                  </div>
                  <span className="text-[10px] font-black uppercase text-slate-500 group-hover:text-white">{isPt ? 'Modo Reflexivo' : 'Thinking Mode'}</span>
                </label>
             </div>
             <div className="relative">
                <input 
                  type="text" 
                  value={prompt} 
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                  placeholder={isPt ? "Pergunte sobre técnica, raquetes..." : "Ask about technique, rackets..."}
                  className="w-full bg-[#232323] border border-[#333] rounded-2xl py-6 px-8 pr-32 text-sm text-white focus:border-[#0E7C7B] outline-none"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-2">
                  <button onClick={isRecording ? stopRecording : startRecording} className={`p-3 rounded-xl transition-all ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-[#1a1a1a] text-slate-500 hover:text-white'}`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                  </button>
                  <button onClick={handleSendChat} disabled={isProcessing} className="bg-[#0E7C7B] text-white p-3 rounded-xl hover:scale-105 active:scale-95 transition-all">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
                  </button>
                </div>
             </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <div className="bg-[#1a1a1a] border border-[#333] rounded-[3rem] p-8 space-y-8 shadow-2xl">
            <h3 className="text-xl font-black italic uppercase tracking-tighter text-[#F39237]">AI Visual Studio</h3>
            
            <div className="space-y-6">
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Size</label>
                    <select value={imageSize} onChange={(e) => setImageSize(e.target.value as ImageSize)} className="w-full bg-[#232323] border border-[#333] rounded-xl p-3 text-xs text-white outline-none">
                      {['1K', '2K', '4K'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Aspect Ratio</label>
                    <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value as AspectRatio)} className="w-full bg-[#232323] border border-[#333] rounded-xl p-3 text-xs text-white outline-none">
                      {['1:1', '2:3', '3:2', '3:4', '4:3', '9:16', '16:9', '21:9'].map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
               </div>

               <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Photo Reference / Upload</label>
                  <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-[#333] rounded-3xl p-8 bg-[#232323] hover:border-[#F39237] cursor-pointer transition-all flex flex-col items-center">
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" />
                    {uploadPreview ? <img src={uploadPreview} className="max-h-40 rounded-xl" /> : <svg className="w-10 h-10 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>}
                  </div>
               </div>

               <textarea 
                value={prompt} 
                onChange={(e) => setPrompt(e.target.value)} 
                placeholder={isPt ? "Descreva o que criar ou editar..." : "Describe what to create or edit..."}
                className="w-full bg-[#232323] border border-[#333] rounded-2xl p-6 text-sm text-white focus:border-[#F39237] outline-none h-32 resize-none"
               />

               <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button onClick={handleImageGen} disabled={isProcessing} className="bg-[#1a1a1a] border border-[#333] py-4 rounded-xl text-[9px] font-black uppercase tracking-widest text-[#F39237] hover:bg-[#F39237] hover:text-white transition-all">Generate Image</button>
                  <button onClick={handleImageEdit} disabled={!uploadPreview || isProcessing} className="bg-[#1a1a1a] border border-[#333] py-4 rounded-xl text-[9px] font-black uppercase tracking-widest text-[#0E7C7B] hover:bg-[#0E7C7B] hover:text-white transition-all">Edit Photo</button>
                  <button onClick={handleVideoAnimate} disabled={isProcessing} className="bg-[#1a1a1a] border border-[#333] py-4 rounded-xl text-[9px] font-black uppercase tracking-widest text-link-salmon hover:bg-link-salmon hover:text-white transition-all">Animate Video</button>
               </div>
            </div>
          </div>

          <div className="bg-[#1a1a1a] border border-[#333] rounded-[3rem] p-8 shadow-2xl min-h-[400px] flex items-center justify-center relative overflow-hidden">
             {!resultImage && !resultVideo && !isProcessing && (
               <p className="text-slate-600 text-xs font-black uppercase tracking-widest italic">{isPt ? 'Resultado aparecerá aqui' : 'Results will appear here'}</p>
             )}
             {isProcessing && (
               <div className="flex flex-col items-center gap-4">
                  <div className="w-12 h-12 border-4 border-[#F39237]/20 border-t-[#F39237] rounded-full animate-spin"></div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#F39237]">{isPt ? 'Processando Drills AI...' : 'Processing AI Drills...'}</p>
               </div>
             )}
             {resultImage && !isProcessing && !resultVideo && (
               <img src={resultImage} className="max-w-full rounded-[2rem] shadow-2xl animate-in zoom-in-95" />
             )}
             {resultVideo && !isProcessing && (
               <video src={resultVideo} controls autoPlay loop className="max-w-full rounded-[2rem] shadow-2xl animate-in zoom-in-95" />
             )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GeminiHub;
