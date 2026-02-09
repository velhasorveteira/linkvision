import React from 'react';

interface CanceledProps {
    onBack: () => void;
}

const Canceled: React.FC<CanceledProps> = ({ onBack }) => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center space-y-8 animate-in zoom-in-95 duration-500">
            <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 border border-red-500/20 shadow-lg animate-pulse">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </div>

            <div className="space-y-4">
                <h1 className="text-4xl font-black italic uppercase tracking-tighter text-white">
                    Pagamento <span className="text-red-500">Cancelado</span>
                </h1>
                <p className="text-slate-400 text-sm font-medium leading-relaxed max-w-md mx-auto">
                    Você cancelou o processo de pagamento. Nenhuma cobrança foi realizada.
                    Se precisar de ajuda ou tiver dúvidas, entre em contato conosco.
                </p>
            </div>

            <button
                onClick={onBack}
                className="px-8 py-4 bg-[#1a1a1a] hover:bg-[#333] border border-[#333] text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-2xl active:scale-95 transition-all flex items-center gap-3"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Voltar para o App
            </button>
        </div>
    );
};

export default Canceled;
