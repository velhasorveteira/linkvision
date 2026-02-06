
import React, { useState, useEffect, useCallback } from 'react';
// import { analyzeGameplayVideo, translateInterface } from './services/geminiService';
// import { signInWithGoogle, signOut, saveAnalysisToDb, supabase } from './services/supabase';
import { analyzeGameplayVideo, translateInterface } from './services/geminiService';
import { AuthProvider, useAuth } from './services/auth';
import Login from './components/Login';
import { AppState, Language, VideoQuality } from './types';
import AnalysisDashboard from './components/AnalysisDashboard';
import RacketComparison from './components/RacketComparison';
import RealTimeJudge from './components/RealTimeJudge';
import NewsHub from './components/NewsHub';
import CourtExplorer from './components/CourtExplorer';
import RankingHub from './components/RankingHub';
import SettingsModal from './components/SettingsModal';
import TournamentHub from './components/TournamentHub';

const DEFAULT_UI = {
  newsView: 'News',
  judgeView: 'Análise',
  videoTab: 'Vídeo',
  realtimeTab: 'Live',
  courtsView: 'Busca',
  racketsView: 'Vs Raquetes',
  rankingView: 'Ranking',
  torneiosView: 'Torneios',
  selectGameplay: 'Upload de Partida',
  applyJudgment: 'Analisar Pontuação',
  processing: 'Contabilizando Acertos e Erros...',
  login: 'Entrar',
  backToStart: 'Novo Veredito',
  autoAnalyze: 'Auto-Análise'
};

// Aumentado para 1GB para permitir vídeos longos e de alta qualidade
const MAX_VIDEO_SIZE = 1024 * 1024 * 1024;

const LinkVisionLogo = () => (
  <svg width="28" height="28" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="sm:w-10 sm:h-10">
    <ellipse cx="50" cy="35" rx="30" ry="35" stroke="#0E7C7B" strokeWidth="6" />
    <circle cx="50" cy="35" r="5" fill="#0E7C7B" />
    <circle cx="65" cy="45" r="18" fill="#F39237" />
  </svg>
);

const Toast = ({ message, visible, onClose }: { message: string, visible: boolean, onClose: () => void }) => {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [visible, onClose]);

  if (!visible) return null;

  return (
    <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-[400] bg-[#0E7C7B] text-white px-8 py-3 rounded-full font-black uppercase text-[10px] tracking-widest shadow-2xl flex items-center gap-3 animate-in slide-up border border-white/20">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
      {message}
    </div>
  );
};

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => {
    const savedLang = localStorage.getItem('linkvision_lang') || 'pt';
    const savedQuality = (localStorage.getItem('linkvision_quality') as VideoQuality) || '720p';
    const savedAutoStart = localStorage.getItem('linkvision_autostart') === 'true';
    return {
      view: 'news',
      judgeMode: 'video',
      videoFile: null,
      isAnalyzing: false,
      result: null,
      history: [],
      savedPlaces: [],
      error: null,
      language: savedLang,
      videoQuality: savedQuality,
      autoStart: savedAutoStart,
      isFeedbackOpen: false,
      user: null,
      isLanguageModalOpen: false,
      isSettingsModalOpen: false
    };
  });

  const [ui, setUi] = useState(DEFAULT_UI);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [toast, setToast] = useState<{ message: string, visible: boolean }>({ message: '', visible: false });

  const { user, loading, logout } = useAuth();

  // Removido useEffect do Supabase

  useEffect(() => {
    const translate = async () => {
      if (state.language === 'pt') { setUi(DEFAULT_UI); return; }
      try {
        const translated = await translateInterface(state.language, DEFAULT_UI);
        setUi(translated);
      } catch (e) {
        console.error("Translation failed", e);
      }
    };
    translate();
    localStorage.setItem('linkvision_lang', state.language);
  }, [state.language]);

  const executeAnalysis = useCallback(async (file: File) => {
    setState(p => ({ ...p, isAnalyzing: true, error: null }));
    setUploadProgress(0);

    try {
      const reader = new FileReader();

      reader.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(percent);
        }
      };

      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        try {
          const base64 = (reader.result as string).split(',')[1];
          const result = await analyzeGameplayVideo(base64, file.type, state.language, state.videoQuality);
          setState(p => ({ ...p, result, isAnalyzing: false }));
          if (state.user) saveAnalysisToDb(state.user.id, result);
        } catch (err: any) {
          setState(p => ({ ...p, isAnalyzing: false, error: err.message }));
        }
      };
    } catch (e: any) {
      setState(p => ({ ...p, isAnalyzing: false, error: e.message }));
    }
  }, [state.language, state.videoQuality, user]);

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > MAX_VIDEO_SIZE) {
        setState(p => ({ ...p, error: state.language === 'pt' ? "Vídeo muito grande (máx 1GB)." : "Video too large (max 1GB)." }));
        return;
      }
      setState(p => ({ ...p, videoFile: file, result: null, error: null }));
      if (state.autoStart) {
        executeAnalysis(file);
      }
    }
  };

  const handleAnalyzeVideo = () => {
    if (state.videoFile) {
      executeAnalysis(state.videoFile);
    }
  };

  const toggleAutoStart = () => {
    const newValue = !state.autoStart;
    setState(p => ({ ...p, autoStart: newValue }));
    localStorage.setItem('linkvision_autostart', String(newValue));
  };

  const mainNavItems = [
    { id: 'judge', label: ui.judgeView, icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg> },
    { id: 'rackets', label: ui.racketsView, icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg> },
    { id: 'news', label: ui.newsView, icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2" /></svg> },
    { id: 'torneios', label: ui.torneiosView, icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
    { id: 'ranking', label: ui.rankingView, icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg> },
    { id: 'courts', label: ui.courtsView, icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg> },
  ];

  return (
    <div className="min-h-screen-ios flex flex-col bg-[#232323] text-white overflow-x-hidden">
      <header className="sticky top-0 z-[100] bg-[#232323]/95 backdrop-blur-lg border-b border-[#333] px-4 sm:px-6 py-3 flex items-center justify-between shadow-2xl h-16">
        <div className="flex items-center gap-2 sm:gap-3">
          <LinkVisionLogo />
          <h1 className="text-lg sm:text-xl font-black italic uppercase tracking-tighter">LINK<span className="text-[#0E7C7B]">VISION</span></h1>
        </div>

        <nav className="hidden lg:flex gap-1 bg-[#1a1a1a] p-1 rounded-full border border-[#333]">
          {mainNavItems.map(v => (
            <button key={v.id} onClick={() => setState(p => ({ ...p, view: v.id as any }))} className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${state.view === v.id ? 'bg-[#0E7C7B] text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>
              {v.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setState(p => ({ ...p, isSettingsModalOpen: true }))}
            className="h-10 px-3 sm:px-4 flex items-center gap-2 rounded-xl bg-[#1a1a1a] border border-[#333] active:scale-95 transition-all"
          >
            <span className="text-[10px] font-black uppercase text-[#F39237]">{state.language.toUpperCase()}</span>
          </button>
          {user ? (
            <button onClick={() => logout()} className="w-10 h-10 rounded-full bg-red-500/10 text-red-500 border border-red-500/20 flex items-center justify-center active:scale-90 transition-all">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7" /></svg>
            </button>
          ) : null}
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6 sm:py-10 pb-44 lg:pb-12">
        <div key={state.view} className="animate-in fade-in slide-in-from-bottom-5">
          {state.view === 'judge' && (
            <div className="space-y-6 sm:space-y-10">
              <div className="flex bg-[#1a1a1a] p-1.5 rounded-2xl border border-[#333] w-full max-w-[320px] mx-auto shadow-2xl">
                <button
                  onClick={() => setState(p => ({ ...p, judgeMode: 'video' }))}
                  className={`flex-1 h-12 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${state.judgeMode === 'video' ? 'bg-[#0E7C7B] text-white shadow-xl' : 'text-slate-500'}`}
                >
                  {ui.videoTab}
                </button>
                <button
                  onClick={() => setState(p => ({ ...p, judgeMode: 'realtime' }))}
                  className={`flex-1 h-12 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${state.judgeMode === 'realtime' ? 'bg-[#F39237] text-white shadow-xl' : 'text-slate-500'}`}
                >
                  {ui.realtimeTab}
                </button>
              </div>

              {state.error && (
                <div className="max-w-md mx-auto p-4 bg-red-500/10 border border-red-500/50 rounded-2xl text-center text-red-500 text-xs font-bold animate-in slide-up uppercase tracking-widest">
                  {state.error}
                </div>
              )}

              {state.judgeMode === 'video' && (
                !state.result ? (
                  <div className="space-y-8">
                    <div className="flex flex-col items-center justify-center py-16 sm:py-24 bg-[#1a1a1a] rounded-[3rem] border border-[#333] border-dashed hover:border-[#0E7C7B] transition-all group px-6 text-center shadow-xl relative overflow-hidden">
                      <input type="file" className="hidden" id="video-upload" accept="video/*" onChange={handleVideoUpload} />
                      <label htmlFor="video-upload" className="cursor-pointer flex flex-col items-center gap-6 w-full max-w-xs z-10">
                        <div className="w-20 h-20 bg-[#0E7C7B]/10 rounded-full flex items-center justify-center text-[#0E7C7B] group-active:scale-110 transition-all border border-[#0E7C7B]/20 shadow-[0_0_40px_rgba(14,124,123,0.1)]">
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" strokeWidth={3} /></svg>
                        </div>
                        <div className="space-y-2">
                          <span className="text-sm font-black uppercase tracking-widest text-slate-300 block line-clamp-1">{state.videoFile ? state.videoFile.name : ui.selectGameplay}</span>
                          <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest opacity-60">MP4, MOV | Suporta arquivos grandes</p>
                        </div>
                      </label>

                      {/* BARRA DE PROGRESSO DE CARREGAMENTO */}
                      {state.isAnalyzing && (
                        <div className="absolute inset-x-0 bottom-0 h-1 bg-[#111]">
                          <div
                            className="h-full bg-[#0E7C7B] transition-all duration-300 shadow-[0_0_10px_#0E7C7B]"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      )}

                      {state.videoFile && !state.isAnalyzing && (
                        <button onClick={handleAnalyzeVideo} className="mt-10 w-full max-w-[240px] h-14 bg-[#0E7C7B] text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-2xl active:scale-95 transition-all z-10">
                          {ui.applyJudgment}
                        </button>
                      )}

                      {state.isAnalyzing && (
                        <div className="mt-10 flex flex-col items-center gap-4 z-10">
                          <div className="relative">
                            <div className="w-12 h-12 border-4 border-[#0E7C7B]/20 border-t-[#0E7C7B] rounded-full animate-spin"></div>
                            <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black text-[#0E7C7B]">{uploadProgress}%</span>
                          </div>
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#0E7C7B] animate-pulse">
                            {uploadProgress < 100 ? 'Lendo Arquivo...' : ui.processing}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* AUTO-ANALYZE TOGGLE */}
                    <div className="flex justify-center">
                      <button
                        onClick={toggleAutoStart}
                        className="flex items-center gap-4 bg-[#1a1a1a] border border-[#333] px-6 py-4 rounded-3xl hover:border-[#0E7C7B] transition-all group"
                      >
                        <div className={`w-12 h-6 rounded-full relative transition-all ${state.autoStart ? 'bg-[#0E7C7B]' : 'bg-[#333]'}`}>
                          <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${state.autoStart ? 'left-7' : 'left-1'}`} />
                        </div>
                        <div className="flex flex-col items-start">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-300 group-hover:text-white">{ui.autoAnalyze}</span>
                          <span className="text-[8px] text-slate-600 font-bold uppercase tracking-tighter">{state.autoStart ? 'ENABLED' : 'DISABLED'}</span>
                        </div>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex justify-center sm:justify-start">
                      <button onClick={() => setState(p => ({ ...p, result: null, videoFile: null }))} className="h-12 px-6 bg-[#1a1a1a] border border-[#333] rounded-xl text-[9px] font-black uppercase text-[#F39237] tracking-widest flex items-center gap-2 active:scale-95 transition-all">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                        {ui.backToStart}
                      </button>
                    </div>
                    <AnalysisDashboard
                      result={state.result}
                      language={state.language}
                      onCalibrate={() => { }}
                      videoUrl={state.videoFile ? URL.createObjectURL(state.videoFile) : undefined}
                      autoPlay={state.autoStart}
                    />
                  </div>
                )
              )}

              {state.judgeMode === 'realtime' && (
                <RealTimeJudge language={state.language} onFinish={(res) => setState(p => ({ ...p, result: res, judgeMode: 'video' }))} />
              )}
            </div>
          )}

          {state.view === 'news' && <NewsHub language={state.language} />}
          {state.view === 'torneios' && <TournamentHub language={state.language} user={user} />}
          {state.view === 'rackets' && <RacketComparison language={state.language} />}
          {state.view === 'courts' && <CourtExplorer language={state.language} />}
          {state.view === 'ranking' && <RankingHub language={state.language} />}
        </div>
      </main>

      <Toast message={toast.message} visible={toast.visible} onClose={() => setToast({ ...toast, visible: false })} />

      {state.isSettingsModalOpen && (
        <SettingsModal
          currentLang={state.language}
          currentQuality={state.videoQuality}
          onSelectLang={(lang) => setState(p => ({ ...p, language: lang }))}
          onSelectQuality={(q) => setState(p => ({ ...p, videoQuality: q }))}
          onClose={() => setState(p => ({ ...p, isSettingsModalOpen: false }))}
        />
      )}

      {/* Navegação Móvel Aprimorada para Safe Areas */}
      <nav className="fixed bottom-0 left-0 right-0 lg:hidden bg-[#111111]/95 backdrop-blur-2xl border-t border-white/5 flex justify-around items-end px-2 safe-bottom pt-4 z-[200] shadow-[0_-15px_40px_rgba(0,0,0,0.8)] min-h-[5.5rem]">
        {mainNavItems.map(item => (
          <button
            key={item.id}
            onClick={() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
              setState(p => ({ ...p, view: item.id as any }));
            }}
            className={`flex flex-col items-center gap-1.5 p-1 flex-1 transition-all duration-500 relative pb-2 ${state.view === item.id ? 'text-[#0E7C7B]' : 'text-slate-500'}`}
          >
            <div className={`transition-all duration-500 ${state.view === item.id ? 'transform -translate-y-2 scale-110' : ''}`}>
              {item.icon}
            </div>
            <span className={`text-[7px] font-black uppercase tracking-widest transition-all duration-500 ${state.view === item.id ? 'opacity-100' : 'opacity-40'}`}>
              {item.label}
            </span>
            {state.view === item.id && (
              <div className="absolute bottom-0 w-1.5 h-1.5 bg-[#0E7C7B] rounded-full shadow-[0_0_15px_#0E7C7B]"></div>
            )}
          </button>
        ))}
      </nav>
    </div>
  );
};

const AppWithAuth: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#232323] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#0E7C7B]/20 border-t-[#0E7C7B] rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return <App />;
};

const Root: React.FC = () => (
  <AuthProvider>
    <AppWithAuth />
  </AuthProvider>
);

export default Root;
