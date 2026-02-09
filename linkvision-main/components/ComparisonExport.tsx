
import React from 'react';
import { RacketSpec } from '../types';

interface ComparisonExportProps {
    rackets: RacketSpec[];
    isPt: boolean;
}

const Icons = {
    Power: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
    Control: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    Comfort: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
};

const SpecBar: React.FC<{ label: string, value: number, color: string, icon: React.ReactNode }> = ({ label, value, color, icon }) => (
    <div className="space-y-2 w-full">
        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg bg-white/5 ${color.replace('bg-', 'text-')}`}>{icon}</div>
                <span>{label}</span>
            </div>
            <span className="text-white font-mono text-xs">{value}/10</span>
        </div>
        <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden border border-white/5">
            <div className={`h-full ${color}`} style={{ width: `${value * 10}%` }} />
        </div>
    </div>
);

export const ComparisonExport: React.FC<ComparisonExportProps> = ({ rackets, isPt }) => {
    if (rackets.length < 2) return null;

    return (
        <div
            id="comparison-export-container"
            className="relative w-[450px] h-[800px] bg-[#1a1a1a] flex flex-col p-10 overflow-hidden text-white"
            style={{ fontFamily: "Inter, system-ui, sans-serif" }}
        >
            {/* Background elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[120%] h-[120%] bg-[radial-gradient(circle_at_50%_50%,_rgba(14,124,123,0.1)_0%,_transparent_70%)] pointer-events-none" />

            <header className="relative z-10 flex flex-col items-center gap-2 mb-8">
                <div className="flex items-center gap-3">
                    <svg width="32" height="32" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <ellipse cx="50" cy="35" rx="30" ry="35" stroke="#0E7C7B" strokeWidth="6" />
                        <circle cx="50" cy="35" r="5" fill="#0E7C7B" />
                        <circle cx="65" cy="45" r="18" fill="#F39237" />
                    </svg>
                    <h1 className="text-2xl font-black italic uppercase tracking-tighter">LINK<span className="text-[#0E7C7B]">VISION</span></h1>
                </div>
                <div className="px-4 py-1 bg-[#F39237]/10 border border-[#F39237]/20 rounded-full">
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#F39237]">VS BATTLE</span>
                </div>
            </header>

            <div className="flex-1 flex flex-col gap-6 relative z-10">
                {rackets.map((r, i) => (
                    <div key={r.id} className="bg-[#111]/80 rounded-[2.5rem] border border-white/5 p-6 flex flex-col gap-4">
                        <div className="flex gap-6 items-center">
                            <div className="w-32 h-32 bg-black rounded-2xl border border-white/5 p-4 flex items-center justify-center overflow-hidden">
                                <img src={r.imageUrl} alt={r.name} className="max-w-full max-h-full object-contain" />
                            </div>
                            <div className="flex-1 space-y-1">
                                <span className="text-[9px] font-black text-[#F39237] uppercase tracking-widest">{r.brand}</span>
                                <h3 className="text-xl font-black italic uppercase text-white leading-tight">{r.name}</h3>
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{r.recommendedLevel}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 pt-2">
                            <SpecBar label="Power" value={r.powerLevel} color="bg-link-salmon" icon={<Icons.Power />} />
                            <SpecBar label="Control" value={r.controlLevel} color="bg-link-teal" icon={<Icons.Control />} />
                            <SpecBar label="Comfort" value={r.comfortLevel} color="bg-link-orange" icon={<Icons.Comfort />} />
                        </div>

                        <div className="grid grid-cols-3 gap-2 mt-2 py-3 border-t border-white/5">
                            <div className="text-center">
                                <p className="text-[7px] font-black uppercase text-slate-600 tracking-widest">Weight</p>
                                <p className="text-[10px] font-black text-white">{r.weight}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-[7px] font-black uppercase text-slate-600 tracking-widest">Head</p>
                                <p className="text-[10px] font-black text-white">{r.headSize}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-[7px] font-black uppercase text-slate-600 tracking-widest">Pattern</p>
                                <p className="text-[10px] font-black text-white">{r.stringPattern}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Middle VS overlay */}
            <div className="absolute top-[48%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-[#F39237] rounded-full border-4 border-[#1a1a1a] flex items-center justify-center z-20 shadow-2xl">
                <span className="text-xl font-black italic text-white">VS</span>
            </div>

            <footer className="relative z-10 pt-8 flex flex-col items-center gap-4 border-t border-white/5">
                <div className="flex flex-col items-center">
                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500">
                        {isPt ? 'ANALISADO NO LINKVISION LAB' : 'ANALYZED ON LINKVISION LAB'}
                    </p>
                    <p className="text-[11px] font-black text-[#0E7C7B] tracking-widest">linkvision.app</p>
                </div>
            </footer>
        </div>
    );
};

export default ComparisonExport;
