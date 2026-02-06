
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { findNearbyCourts, searchCourtsByText } from '../services/geminiService';
import { saveCourtPlace, fetchSavedCourts, deleteSavedCourt, supabase } from '../services/supabase';
import { Language, CourtPlace, HittingPartner } from '../types';
import ShareButton from './ShareButton';

interface CourtExplorerProps {
  language: Language;
}

const INITIAL_COACHES = [
  { id: 'c1', name: 'Ricardo Melo', level: 'Head Coach', region: 'São Paulo', specialty: 'Pro Training', rating: 4.9 },
  { id: 'c2', name: 'Ana Costa', level: 'Youth Trainer', region: 'Curitiba', specialty: 'Fundamentals', rating: 4.7 },
];

const INITIAL_PARTNERS: HittingPartner[] = [
  { id: 'p1', name: 'Rodrigo Silva', rating: 4.9, level: 'Advanced', region: 'São Paulo', isOfficial: true, specialty: 'Backhand Heavy' },
  { id: 'p2', name: 'Camila Torres', rating: 4.8, level: 'Pro', region: 'São Paulo', isOfficial: true, specialty: 'Serve/Volley' },
  { id: 'p3', name: 'Marcos Braz', rating: 4.5, level: 'Intermediate', region: 'São Paulo', isOfficial: false, specialty: 'Consistency' },
];

const CourtExplorer: React.FC<CourtExplorerProps> = ({ language }) => {
  const isPt = language === 'pt';
  const [activeMainTab, setActiveMainTab] = useState<'courts' | 'pros'>('courts');
  const [activeProsSubTab, setActiveProsSubTab] = useState<'coaches' | 'partners'>('coaches');
  const [loading, setLoading] = useState(false);
  const [courts, setCourts] = useState<any[]>([]);
  const [partners, setPartners] = useState<HittingPartner[]>(INITIAL_PARTNERS);
  const [coaches, setCoaches] = useState<any[]>(INITIAL_COACHES);
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [courtQuery, setCourtQuery] = useState('');

  useEffect(() => {
    const checkUser = async () => { if (supabase) { const { data: { user } } = await supabase.auth.getUser(); setUser(user); } };
    checkUser();
  }, []);

  const handleNearbySearch = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!navigator.geolocation) {
        throw new Error(isPt ? "Geolocalização não suportada." : "Geolocation not supported.");
      }
      
      navigator.geolocation.getCurrentPosition(async (pos) => {
        try {
          const result = await findNearbyCourts(pos.coords.latitude, pos.coords.longitude, language);
          setCourts(result.sources || []);
          setLoading(false);
        } catch (e) {
          setError(isPt ? "Erro na busca por proximidade." : "Error searching nearby.");
          setLoading(false);
        }
      }, () => {
        setError(isPt ? "Permissão de localização negada." : "Location permission denied.");
        setLoading(false);
      });
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
    }
  };

  const handleCourtSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!courtQuery.trim()) return;
    setLoading(true); setError(null);
    try {
      const result = await searchCourtsByText(courtQuery, language);
      setCourts(result.sources || []);
    } catch (e) { setError(isPt ? "Erro ao pesquisar." : "Error searching."); }
    finally { setLoading(false); }
  };

  const handleBecomePro = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulação de salvamento
    alert(isPt ? "Pedido de inscrição enviado para análise!" : "Registration request sent for analysis!");
    setIsRegistering(false);
  };

  return (
    <div className="court-find space-y-8 animate-in fade-in max-w-5xl mx-auto pb-20 px-2 sm:px-0">
      <div className="text-center space-y-2">
        <h2 className="text-4xl sm:text-7xl font-black italic uppercase tracking-tighter text-white">BUSCA <span className="text-[#0E7C7B]">HUB</span></h2>
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">{isPt ? 'Quadras e Profissionais' : 'Courts and Professionals'}</p>
      </div>

      <div className="flex bg-[#1a1a1a] p-1.5 rounded-2xl border border-[#333] w-full max-w-[420px] mx-auto shadow-2xl">
        <button onClick={() => setActiveMainTab('courts')} className={`flex-1 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeMainTab === 'courts' ? 'bg-[#0E7C7B] text-white shadow-lg' : 'text-slate-500'}`}>{isPt ? 'Quadras' : 'Courts'}</button>
        <button onClick={() => setActiveMainTab('pros')} className={`flex-1 px-4 py-3 rounded-xl text-[10px] font-black uppercase transition-all tracking-widest ${activeMainTab === 'pros' ? 'bg-[#F39237] text-white shadow-lg' : 'text-slate-500'}`}>{isPt ? 'Pro / Rebat.' : 'Pro / Partner'}</button>
      </div>

      {activeMainTab === 'courts' ? (
        <div className="space-y-8 animate-in slide-up">
          <div className="max-w-xl mx-auto w-full space-y-4">
            <form onSubmit={handleCourtSearch} className="flex gap-2">
              <input 
                type="text" value={courtQuery} onChange={(e) => setCourtQuery(e.target.value)}
                placeholder={isPt ? "Buscar quadras ou clubes..." : "Search courts or clubs..."}
                className="flex-1 h-14 bg-[#1a1a1a] border border-[#333] rounded-2xl px-6 text-sm text-white outline-none focus:border-[#0E7C7B]"
              />
              <button type="submit" disabled={loading} className="h-14 w-14 flex items-center justify-center bg-[#0E7C7B] text-white rounded-2xl shadow-xl active:scale-95 transition-all">
                {loading ? <div className="w-4 h-4 border-2 border-t-white rounded-full animate-spin"></div> : '▶'}
              </button>
            </form>
            <button 
              onClick={handleNearbySearch}
              className="w-full h-12 border border-[#333] bg-[#222]/50 rounded-xl text-[9px] font-black uppercase tracking-widest text-[#0E7C7B] hover:bg-[#0E7C7B]/10 transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" strokeWidth={2}/><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" strokeWidth={2}/></svg>
              {isPt ? 'USAR MINHA LOCALIZAÇÃO' : 'USE MY LOCATION'}
            </button>
          </div>

          {error && (
            <p className="text-center text-red-500 text-xs font-bold uppercase tracking-widest">{error}</p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {courts.length > 0 ? courts.map((c, i) => (
              <div key={i} className="bg-[#1a1a1a] border border-[#333] p-8 rounded-[2rem] hover:border-[#0E7C7B] transition-all flex justify-between items-start group shadow-lg">
                 <div className="space-y-2">
                    <h3 className="text-lg font-black italic uppercase text-white group-hover:text-[#0E7C7B] transition-colors">{c.maps?.title}</h3>
                    <p className="text-[10px] font-black text-slate-500 uppercase leading-relaxed">{c.maps?.address}</p>
                 </div>
                 <div className="flex gap-2">
                    <ShareButton 
                      title={c.maps?.title}
                      text={`Bora jogar aqui? ${c.maps?.title}. Endereço: ${c.maps?.address}`}
                      url={c.maps?.uri}
                      className="p-3 bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:text-[#F39237]"
                    />
                    <a href={c.maps?.uri} target="_blank" className="p-3 bg-[#232323] border border-[#333] rounded-xl text-[#0E7C7B] font-black text-[10px] hover:bg-[#0E7C7B] hover:text-white transition-all shadow-xl">GO</a>
                 </div>
              </div>
            )) : !loading && (
              <div className="col-span-full py-20 text-center opacity-30">
                 <p className="text-[10px] font-black uppercase tracking-widest">{isPt ? 'Nenhuma quadra listada.' : 'No courts listed.'}</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-8 animate-in slide-up">
           <div className="flex flex-col items-center gap-6">
              <div className="flex bg-[#111] p-1 rounded-xl border border-[#333]">
                 <button onClick={() => setActiveProsSubTab('coaches')} className={`px-5 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${activeProsSubTab === 'coaches' ? 'bg-[#0E7C7B] text-white shadow-lg' : 'text-slate-600'}`}>{isPt ? 'Treinadores' : 'Coaches'}</button>
                 <button onClick={() => setActiveProsSubTab('partners')} className={`px-5 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${activeProsSubTab === 'partners' ? 'bg-[#0E7C7B] text-white shadow-lg' : 'text-slate-600'}`}>{isPt ? 'Rebatedores' : 'Partners'}</button>
              </div>
              
              <button 
                onClick={() => setIsRegistering(true)}
                className="px-12 py-3.5 bg-white text-black rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-[#F39237] hover:text-white transition-all active:scale-95"
              >
                {isPt ? 'INSCREVER-SE' : 'SUBSCRIBE'}
              </button>
           </div>

           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(activeProsSubTab === 'coaches' ? coaches : partners).map((pro: any) => (
                <div key={pro.id} className="bg-[#1a1a1a] border border-[#333] p-8 rounded-[2rem] hover:border-[#F39237] transition-all group shadow-lg flex justify-between items-center">
                   <div className="space-y-3">
                      <div className="flex items-center gap-3">
                         <h3 className="text-lg font-black italic uppercase text-white">{pro.name}</h3>
                         <div className="px-2 py-0.5 bg-[#F39237]/10 border border-[#F39237]/20 rounded text-[7px] font-black text-[#F39237] uppercase">{pro.level}</div>
                      </div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{pro.region} • {pro.specialty}</p>
                      <div className="flex items-center gap-1">
                         {[...Array(5)].map((_, i) => (
                           <svg key={i} className={`w-3 h-3 ${i < Math.floor(pro.rating) ? 'text-[#F39237]' : 'text-slate-700'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                         ))}
                         <span className="text-[9px] font-black text-slate-500 ml-2">{pro.rating}</span>
                      </div>
                   </div>
                   <div className="flex gap-2">
                      <ShareButton 
                        title={`Profissional: ${pro.name}`}
                        text={`Confira este ${activeProsSubTab === 'coaches' ? 'treinador' : 'rebatedor'} no LinkVision: ${pro.name} (${pro.level})`}
                        className="p-3 bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:text-[#F39237]"
                      />
                      <button className="h-14 px-6 bg-[#232323] border border-[#333] rounded-2xl text-[#F39237] text-[10px] font-black uppercase tracking-widest hover:bg-[#F39237] hover:text-white transition-all shadow-xl active:scale-95">CHAT</button>
                   </div>
                </div>
              ))}
           </div>
        </div>
      )}

      {/* MODAL DE INSCRIÇÃO PRO */}
      {isRegistering && (
        <div className="fixed inset-0 z-[600] p-6 flex items-center justify-center bg-black/95 backdrop-blur-2xl animate-in fade-in">
           <div className="relative w-full max-w-lg bg-[#1a1a1a] border border-[#333] rounded-[3.5rem] p-10 shadow-2xl animate-in zoom-in-95">
              <h3 className="text-2xl font-black italic uppercase text-center mb-8">{isPt ? 'Inscrição Profissional' : 'Pro Registration'}</h3>
              <form className="space-y-6" onSubmit={handleBecomePro}>
                 <div className="space-y-4">
                    <input type="text" placeholder={isPt ? "Nome Completo" : "Full Name"} className="w-full h-14 bg-[#232323] border border-[#333] rounded-2xl px-6 text-xs text-white outline-none focus:border-[#F39237]" required />
                    <div className="grid grid-cols-2 gap-4">
                       <select className="h-14 bg-[#232323] border border-[#333] rounded-2xl px-6 text-[10px] text-white uppercase font-black outline-none focus:border-[#F39237]">
                          <option value="coach">{isPt ? 'Treinador' : 'Coach'}</option>
                          <option value="partner">{isPt ? 'Rebatedor' : 'Partner'}</option>
                       </select>
                       <input type="text" placeholder={isPt ? "Cidade/UF" : "City/State"} className="h-14 bg-[#232323] border border-[#333] rounded-2xl px-6 text-[10px] text-white outline-none focus:border-[#F39237]" required />
                    </div>
                    <textarea placeholder={isPt ? "Especialidade e Experiência..." : "Specialty and Experience..."} className="w-full h-32 bg-[#232323] border border-[#333] rounded-2xl p-6 text-xs text-white outline-none focus:border-[#F39237] resize-none" required />
                 </div>
                 <button type="submit" className="w-full py-5 bg-[#F39237] text-white rounded-[2rem] font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95 transition-all">ENVIAR CANDIDATURA</button>
              </form>
              <button onClick={() => setIsRegistering(false)} className="absolute top-8 right-8 text-slate-500 font-black hover:text-white transition-colors">✕</button>
           </div>
        </div>
      )}
    </div>
  );
};

export default CourtExplorer;
