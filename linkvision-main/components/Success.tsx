import React from 'react';

interface SuccessProps {
    onBack: () => void;
}

const Success: React.FC<SuccessProps> = ({ onBack }) => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center space-y-8 animate-in zoom-in-95 duration-500">
            <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center text-green-500 border border-green-500/20 shadow-lg animate-bounce">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
            </div>

            <div className="space-y-4">
                <h1 className="text-4xl font-black italic uppercase tracking-tighter text-white">
                    Pagamento <span className="text-green-500">Realizado!</span>
                </h1>
                <p className="text-slate-400 text-sm font-medium leading-relaxed max-w-md mx-auto">
                    Obrigado pela sua assinatura. Sua conta Premium foi ativada com sucesso e todos os recursos foram desbloqueados.
                </p>
            </div>

            <button
                onClick={onBack}
                className="px-8 py-4 bg-[#0E7C7B] hover:bg-[#0c6a69] text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-2xl active:scale-95 transition-all flex items-center gap-3"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Começar a Usar
            </button>
        </div>
    );
};

export default Success;
