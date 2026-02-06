
import React, { useState, useMemo } from 'react';
import { Language, RankedAthlete } from '../types';
import ShareButton from './ShareButton';

interface RankingHubProps {
  language: Language;
}

const MOCK_RANKING: RankedAthlete[] = [
  { id: '1', name: 'Marcos Aurelio', points: 1540, level: 'Pro', age: 24, category: 'singles', gender: 'male', winRate: 85 },
  { id: '2', name: 'Sofia Mendes', points: 1420, level: 'A', age: 21, category: 'singles', gender: 'female', winRate: 78 },
  { id: '3', name: 'Carlos & Andre', points: 1200, level: 'B', age: 30, category: 'doubles', gender: 'male', winRate: 72 },
  { id: '4', name: 'Julia & Pedro', points: 1150, level: 'A', age: 28, category: 'doubles', gender: 'mixed', winRate: 70 },
];

const RankingHub: React.FC<RankingHubProps> = ({ language }) => {
  const isPt = language === 'pt';
  const [activeTab, setActiveTab] = useState<'singles' | 'doubles'>('singles');
  const [activeGender, setActiveGender] = useState<'male' | 'female' | 'mixed'>('male');
  const [isRegistering, setIsRegistering] = useState(false);

  const filteredRanking = useMemo(() => {
    return MOCK_RANKING.filter(a => a.category === activeTab && a.gender === activeGender)
      .sort((a, b) => b.points - a.points);
  }, [activeTab, activeGender]);

  return (
    <div className="space-y-10 animate-in fade-in max-w-5xl mx-auto px-2 pb-20">
      <div className="text-center space-y-4">
        <h2 className="text-5xl sm:text-8xl font-black italic uppercase tracking-tighter text-white">LV <span className="text-[#F39237]">RANKING</span></h2>
        <div className="h-0.5 w-24 bg-[#0E7C7B] mx-auto rounded-full"></div>
      </div>

      <div className="space-y-6">
        <div className="flex bg-[#111] p-1.5 rounded-2xl border border-[#333] w-full max-w-[320px] mx-auto shadow-inner">
           <button onClick={() => setActiveTab('singles')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'singles' ? 'bg-[#0E7C7B] text-white shadow-lg' : 'text-slate-600'}`}>Simples</button>
           <button onClick={() => setActiveTab('doubles')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'doubles' ? 'bg-[#0E7C7B] text-white shadow-lg' : 'text-slate-600'}`}>Duplas</button>
        </div>

        <div className="flex justify-center gap-2">
           {(['male', 'female', 'mixed'] as const).map(g => (
             <button 
              key={g} onClick={() => setActiveGender(g)}
              className={`px-6 py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all ${activeGender === g ? 'bg-[#F39237] border-[#F39237] text-white' : 'border-[#333] text-slate-500 hover:text-white'}`}
             >
               {isPt ? (g === 'male' ? 'Masculino' : g === 'female' ? 'Feminino' : 'Misto') : g.toUpperCase()}
             </button>
           ))}
        </div>
      </div>

      <div className="bg-[#1a1a1a] border border-[#333] rounded-[3rem] p-8 shadow-2xl">
         <div className="flex justify-between items-center mb-10">
            <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-[0.4em]">{isPt ? 'Top Atletas LinkVision' : 'LinkVision Top Athletes'}</h3>
            <button onClick={() => setIsRegistering(true)} className="px-5 py-2.5 bg-white text-black rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-[#F39237] hover:text-white transition-all">ENTRAR NO RANKING</button>
         </div>

         <div className="space-y-4">
            {filteredRanking.length > 0 ? filteredRanking.map((a, i) => (
              <div key={a.id} className="group bg-[#111] p-6 rounded-[2rem] border border-white/5 flex items-center justify-between hover:border-[#F39237] transition-all">
                 <div className="flex items-center gap-6">
                    <span className={`text-2xl font-black italic ${i === 0 ? 'text-[#F39237]' : 'text-slate-800'}`}>#{i + 1}</span>
                    <div>
                       <h4 className="text-lg font-black italic text-white uppercase">{a.name}</h4>
                       <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Nível {a.level} • {a.age} anos</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-4">
                    <div className="text-right">
                       <p className="text-xl font-black text-white">{a.points}</p>
                       <p className="text-[8px] font-black text-[#0E7C7B] uppercase tracking-widest">{a.winRate}% Win Rate</p>
                    </div>
                    <ShareButton 
                      title={`Atleta Rankeado LinkVision`}
                      text={`O atleta ${a.name} está na posição #${i+1} do LinkVision Ranking com ${a.points} pontos!`}
                      className="p-3 bg-white/5 border border-white/10 rounded-xl text-slate-500 hover:text-[#F39237] transition-all"
                    />
                 </div>
              </div>
            )) : (
              <div className="py-20 text-center text-slate-700 font-black uppercase text-[10px] tracking-widest italic">{isPt ? 'Ranking em processamento...' : 'Ranking processing...'}</div>
            )}
         </div>
      </div>
      
      {/* Position Share Highlight for "Self" if logged in could be here */}

      {isRegistering && (
        <div className="fixed inset-0 z-[600] p-6 flex items-center justify-center bg-black/95 backdrop-blur-2xl">
           <div className="relative w-full max-w-lg bg-[#1a1a1a] border border-[#333] rounded-[3.5rem] p-10 shadow-2xl animate-in zoom-in-95">
              <h3 className="text-2xl font-black italic uppercase text-center mb-8">Cadastro Ranking LV</h3>
              <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); setIsRegistering(false); alert(isPt ? "Bem vindo ao Ranking Oficial!" : "Welcome to Official Ranking!"); }}>
                 <div className="space-y-4">
                    <input type="text" placeholder="Nome Completo" className="w-full bg-[#232323] border border-[#333] rounded-2xl py-5 px-6 text-xs text-white outline-none" required />
                    <div className="grid grid-cols-2 gap-4">
                       <select className="bg-[#232323] border border-[#333] rounded-2xl py-4 px-6 text-[10px] text-white uppercase font-black outline-none">
                          <option>Nível A</option>
                          <option>Nível B</option>
                          <option>Nível C</option>
                          <option>Nível Pro</option>
                       </select>
                       <input type="number" placeholder="Idade" className="bg-[#232323] border border-[#333] rounded-2xl py-4 px-6 text-[10px] text-white outline-none" required />
                    </div>
                 </div>
                 <button type="submit" className="w-full py-5 bg-[#0E7C7B] text-white rounded-[2rem] font-black uppercase text-[10px] tracking-widest shadow-xl">FINALIZAR CADASTRO</button>
              </form>
              <button onClick={() => setIsRegistering(false)} className="absolute top-8 right-8 text-slate-500 font-black">✕</button>
           </div>
        </div>
      )}
    </div>
  );
};

export default RankingHub;
