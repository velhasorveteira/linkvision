
import React, { useState } from 'react';
import { toPng } from 'html-to-image';
import { RacketSpec } from '../types';
import ComparisonExport from './ComparisonExport';
import { shareContent } from '../utils/shareUtils';

interface ShareMenuProps {
    rackets: RacketSpec[];
    isPt: boolean;
    onClose: () => void;
}

const ShareMenu: React.FC<ShareMenuProps> = ({ rackets, isPt, onClose }) => {
    const [isExporting, setIsExporting] = useState(false);

    const handleCopyLink = async () => {
        const title = isPt ? "Comparativo de Raquetes" : "Racket Comparison";
        const text = isPt
            ? `Confira o duelo: ${rackets[0].name} vs ${rackets[1]?.name || '??'} no LinkVision!`
            : `Check out this matchup: ${rackets[0].name} vs ${rackets[1]?.name || '??'} on LinkVision!`;

        await shareContent(title, text);
        onClose();
    };

    const handleExportPng = async () => {
        setIsExporting(true);
        try {
            const element = document.getElementById('comparison-export-container');
            if (!element) throw new Error("Export container not found");

            // Set scale for high quality
            const dataUrl = await toPng(element, {
                quality: 1.0,
                pixelRatio: 2,
                backgroundColor: '#1a1a1a'
            });

            const response = await fetch(dataUrl);
            const blob = await response.blob();
            const file = new File([blob], `linkvision-vs-${rackets[0].name.toLowerCase().replace(/\s/g, '-')}.png`, { type: 'image/png' });

            if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: 'VS Battle LinkVision',
                    text: `Resultado do comparativo: ${rackets[0].name} vs ${rackets[1].name}`
                });
            } else {
                // Fallback for desktop: download
                const link = document.createElement('a');
                link.download = `lv-vs-battle.png`;
                link.href = dataUrl;
                link.click();
            }
        } catch (err) {
            console.error("Export failed:", err);
            alert(isPt ? "Erro ao gerar imagem." : "Error generating image.");
        } finally {
            setIsExporting(false);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-[800] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
            <div className="relative w-full max-w-sm bg-[#1a1a1a] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl space-y-6 animate-in zoom-in-95">
                <div className="text-center space-y-2">
                    <h4 className="text-xl font-black italic uppercase text-white">{isPt ? 'COMPARTILHAR' : 'SHARE'}</h4>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{isPt ? 'Escolha como divulgar seu duelo' : 'Choose how to share your matchup'}</p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    <button
                        onClick={handleCopyLink}
                        className="flex items-center gap-4 p-5 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all group"
                    >
                        <div className="w-12 h-12 bg-[#0E7C7B]/10 rounded-xl flex items-center justify-center text-[#0E7C7B] group-hover:scale-110 transition-transform">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                        </div>
                        <div className="text-left">
                            <p className="text-[11px] font-black uppercase text-white">{isPt ? 'Copiar Link' : 'Copy Link'}</p>
                            <p className="text-[9px] font-medium text-slate-500 uppercase tracking-widest">{isPt ? 'Compartilhar duelo via link' : 'Share matchup via link'}</p>
                        </div>
                    </button>

                    <button
                        onClick={handleExportPng}
                        disabled={isExporting}
                        className="flex items-center gap-4 p-5 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all group disabled:opacity-50"
                    >
                        <div className="w-12 h-12 bg-[#F39237]/10 rounded-xl flex items-center justify-center text-[#F39237] group-hover:scale-110 transition-transform">
                            {isExporting ? (
                                <div className="w-6 h-6 border-2 border-[#F39237]/30 border-t-[#F39237] rounded-full animate-spin"></div>
                            ) : (
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            )}
                        </div>
                        <div className="text-left">
                            <p className="text-[11px] font-black uppercase text-white">{isPt ? 'Exportar Image (9:16)' : 'Export Image (9:16)'}</p>
                            <p className="text-[9px] font-medium text-slate-500 uppercase tracking-widest">{isPt ? 'Stories Instagram / WhatsApp' : 'Instagram Stories / WhatsApp'}</p>
                        </div>
                    </button>
                </div>

                <button
                    onClick={onClose}
                    className="w-full py-4 text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 hover:text-white transition-colors"
                >
                    {isPt ? 'FECHAR' : 'CLOSE'}
                </button>
            </div>

            {/* Hidden container for export capture */}
            <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
                <ComparisonExport rackets={rackets} isPt={isPt} />
            </div>
        </div>
    );
};

export default ShareMenu;
