
import React, { useState, useEffect, useMemo } from 'react';
import { Tournament, Language } from '../types';
import { supabase } from '../services/supabase';
import ShareButton from './ShareButton';

interface TournamentHubProps {
  language: Language;
  user: any;
}

const MOCK_TOURNAMENTS: Tournament[] = [
  {
    id: 't-1',
    creatorId: 'admin',
    name: 'Open Verão LinkVision',
    location: 'Academia PlayTennis, SP',
    description: 'O maior torneio do litoral paulista agora no hub!',
    rules: 'Melhor de 3 sets, super tiebreak no terceiro. Respeito total às chamadas de linha da IA.',
    courtType: 'Hard',
    categories: ['Classe A', 'Classe B'],
    prizes: 'R$ 5.000,00 + Voucher LV',
    drawSize: 32,
    gender: 'all',
    format: 'singles',
    status: 'open',
    participants: ['user-1', 'user-2'],
    startDate: '2024-05-15'
  },
  {
    id: 't-2',
    creatorId: 'admin',
    name: 'Copa Saibro Masters',
    location: 'Clube Pinheiros, SP',
    description: 'Desafio clássico em quadras lentas.',
    rules: 'Regras oficiais ITF. Uso obrigatório do app para validação de scores.',
    courtType: 'Clay',
    categories: ['Pro', 'Elite'],
    prizes: 'Troféu + Brindes Wilson',
    drawSize: 16,
    gender: 'male',
    format: 'singles',
    status: 'open',
    participants: [],
    startDate: '2024-06-20'
  }
];

const TournamentHub: React.FC<TournamentHubProps> = ({ language, user }) => {
  const isPt = language === 'pt';
  const [activeTab, setActiveTab] = useState<'open' | 'create'>('open');
  const [tournaments, setTournaments] = useState<Tournament[]>(MOCK_TOURNAMENTS);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState<Partial<Tournament>>({
    name: '', location: '', description: '', rules: '', courtType: 'Hard',
    categories: [], prizes: '', drawSize: 16, gender: 'all', format: 'singles',
    status: 'open', startDate: ''
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return alert(isPt ? "Login necessário para criar um torneio." : "Login required to create a tournament.");
    setIsSubmitting(true);
    // Simulação de delay de rede
    setTimeout(() => {
      const newT: Tournament = { 
        ...formData, 
        id: crypto.randomUUID(), 
        creatorId: user.id, 
        participants: [], 
        status: 'open' 
      } as Tournament;
      setTournaments([newT, ...tournaments]);
      setIsSubmitting(false);
      setActiveTab('open');
      alert(isPt ? "Torneio criado com sucesso!" : "Tournament created successfully!");
    }, 1200);
  };

  const handleJoin = (id: string) => {
    if (!user) return alert(isPt ? "Login necessário para se inscrever." : "Login required to join.");
    setTournaments(prev => prev.map(t => t.id === id ? { ...t, participants: [...t.participants, user.id] } : t));
    alert(isPt ? "Inscrição realizada!" : "Registration successful!");
  };

  return (
    <div className="space-y-10 animate-in fade-in max-w-6xl mx-auto px-2 pb-20">
      <div className="text-center space-y-4">
        <h2 className="text-5xl sm:text-8xl font-black italic uppercase tracking-tighter text-white">LV <span className="text-[#0E7C7B]">TORNEIOS</span></h2>
        <div className="h-1 w-24 bg-[#F39237] mx-auto rounded-full"></div>
      </div>

      <div className="flex bg-[#111] p-1.5 rounded-2xl border border-[#333] w-full max-w-[360px] mx-auto shadow-2xl">
         <button onClick={() => setActiveTab('open')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'open' ? 'bg-[#0E7C7B] text-white shadow-lg' : 'text-slate-500'}`}>
           {isPt ? 'Inscreva-se' : 'Open Tourneys'}
         </button>
         <button onClick={() => setActiveTab('create')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'create' ? 'bg-[#F39237] text-white shadow-lg' : 'text-slate-500'}`}>
           {isPt ? 'Criar Novo' : 'Create New'}
         </button>
      </div>

      {activeTab === 'open' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-up">
          {tournaments.map(t => (
            <div key={t.id} className="bg-[#1a1a1a] border border-[#333] rounded-[3rem] overflow-hidden flex flex-col hover:border-[#0E7C7B] transition-all group shadow-2xl">
               <div className="h-48 bg-[#111] relative overflow-hidden flex items-center justify-center p-8">
                  <div className="absolute top-4 left-4 bg-[#F39237] text-white text-[8px] font-black uppercase px-3 py-1 rounded-full">{t.courtType}</div>
                  <div className="absolute top-4 right-4 z-20">
                     <ShareButton 
                      title={`Convite: ${t.name}`}
                      text={`Bora jogar o torneio ${t.name}? Local: ${t.location}. Inscreva-se pelo LinkVision!`}
                      className="p-3 bg-black/40 backdrop-blur-md border border-white/10 rounded-full text-white hover:bg-[#F39237] transition-all"
                     />
                  </div>
                  <svg className="w-20 h-20 text-slate-800" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
               </div>
               <div className="p-8 space-y-6 flex-1 flex flex-col">
                  <div className="space-y-2">
                     <h3 className="text-2xl font-black italic uppercase text-white tracking-tighter leading-tight">{t.name}</h3>
                     <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t.location}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 py-4 border-t border-white/5">
                     <div className="space-y-1">
                        <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Premiação</span>
                        <p className="text-[10px] font-black text-[#0E7C7B] uppercase">{t.prizes}</p>
                     </div>
                     <div className="space-y-1">
                        <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Inscritos</span>
                        <p className="text-[10px] font-black text-white uppercase">{t.participants?.length || 0} / {t.drawSize}</p>
                     </div>
                  </div>
                  <button 
                    onClick={() => handleJoin(t.id)}
                    className={`mt-auto w-full h-14 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${user && t.participants?.includes(user.id) ? 'bg-slate-800 text-slate-500' : 'bg-[#0E7C7B] text-white shadow-xl active:scale-95'}`}
                  >
                    {user && t.participants?.includes(user.id) ? 'JÁ INSCRITO' : 'INSCREVER-SE AGORA'}
                  </button>
               </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'create' && (
        <div className="max-w-2xl mx-auto w-full animate-in slide-up">
          <form onSubmit={handleCreate} className="bg-[#1a1a1a] border border-[#333] rounded-[3rem] p-10 space-y-6 shadow-2xl">
            <h3 className="text-xl font-black italic uppercase tracking-widest text-[#F39237] text-center mb-4">Informações do Torneio</h3>
            
            <div className="space-y-4">
              <input 
                type="text" 
                placeholder="Nome do Torneio" 
                className="w-full bg-[#232323] border border-[#333] rounded-2xl py-5 px-6 text-xs text-white outline-none focus:border-[#F39237]" 
                required 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
              <input 
                type="text" 
                placeholder="Localização (Ex: Clube Pinheiros, SP)" 
                className="w-full bg-[#232323] border border-[#333] rounded-2xl py-5 px-6 text-xs text-white outline-none focus:border-[#F39237]" 
                required 
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <select 
                  className="bg-[#232323] border border-[#333] rounded-2xl py-4 px-6 text-[10px] text-white uppercase font-black outline-none focus:border-[#F39237]"
                  value={formData.courtType}
                  onChange={(e) => setFormData({...formData, courtType: e.target.value as any})}
                >
                  <option value="Hard">Rápida (Hard)</option>
                  <option value="Clay">Saibro (Clay)</option>
                  <option value="Grass">Grama (Grass)</option>
                  <option value="Indoors">Coberta (Indoors)</option>
                </select>
                <input 
                  type="number" 
                  placeholder="Vagas (Chave)" 
                  className="bg-[#232323] border border-[#333] rounded-2xl py-4 px-6 text-[10px] text-white outline-none focus:border-[#F39237]" 
                  required 
                  value={formData.drawSize}
                  onChange={(e) => setFormData({...formData, drawSize: parseInt(e.target.value)})}
                />
              </div>

              <textarea 
                placeholder="Descrição e Premiação..." 
                className="w-full h-32 bg-[#232323] border border-[#333] rounded-2xl p-6 text-xs text-white outline-none focus:border-[#F39237] resize-none" 
                required 
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />

              <div className="space-y-2">
                <label className="text-[8px] font-black uppercase text-slate-500 tracking-widest ml-4">Data de Início</label>
                <input 
                  type="date" 
                  className="w-full bg-[#232323] border border-[#333] rounded-2xl py-5 px-6 text-xs text-white outline-none focus:border-[#F39237]" 
                  required 
                  value={formData.startDate}
                  onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full py-6 bg-[#0E7C7B] text-white rounded-[2rem] font-black uppercase text-[11px] tracking-[0.3em] shadow-xl hover:scale-102 active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  PROCESSANDO...
                </>
              ) : 'CRIAR TORNEIO'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default TournamentHub;
