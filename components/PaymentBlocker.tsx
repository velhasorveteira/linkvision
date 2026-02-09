import React, { useState } from 'react';
import { createCheckoutSession } from '../services/payment/stripepayment';
import { useAuth } from '../services/auth';

const PaymentBlocker: React.FC = () => {
    const { user, logout, isTrialActive } = useAuth();
    const [isRedirecting, setIsRedirecting] = useState(false);

    const handlePayment = async () => {
        if (!user) return;
        setIsRedirecting(true);
        try {
            await createCheckoutSession(user.uid);
        } catch (error) {
            console.error(error);
            setIsRedirecting(false);
        }
    };

    return (
        <div className="w-full min-h-[60vh] flex items-center justify-center p-4">
            <div className="relative w-full max-w-lg bg-[#1a1a1a] border border-[#333] rounded-[3rem] p-8 sm:p-12 shadow-2xl text-center space-y-8 animate-in zoom-in-95 duration-500">
                <div className="flex justify-center">
                    <div className="w-24 h-24 bg-orange-500/10 rounded-full flex items-center justify-center text-orange-500 border border-orange-500/20 shadow-lg animate-pulse">
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                </div>

                <div className="space-y-4">
                    <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white">
                        Conteúdo <span className="text-[#0E7C7B]">Restrito</span>
                    </h2>
                    <p className="text-slate-400 text-sm font-medium leading-relaxed">
                        {!isTrialActive ? (
                            "Seu período de teste de 15 dias expirou ou esta funcionalidade requer ativação Premium."
                        ) : (
                            "Para desbloquear esta funcionalidade e todas as análises do LINKVISION, é necessário realizar a ativação da sua conta."
                        )}
                    </p>
                </div>

                <div className="pt-4 space-y-4">
                    <button
                        onClick={handlePayment}
                        disabled={isRedirecting}
                        className="w-full h-16 bg-[#0E7C7B] hover:bg-[#0c6a69] text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3 group"
                    >
                        {isRedirecting ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <>
                                <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                Pagar Agora para Desbloquear
                            </>
                        )}
                    </button>

                    <button
                        onClick={() => logout()}
                        className="w-full h-12 bg-transparent text-slate-500 hover:text-white rounded-xl font-bold uppercase text-[10px] tracking-widest transition-colors flex items-center justify-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7" />
                        </svg>
                        Sair da Conta
                    </button>
                </div>

                <div className="pt-2">
                    <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest">
                        Pagamento seguro via <span className="text-white">Stripe</span>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PaymentBlocker;
