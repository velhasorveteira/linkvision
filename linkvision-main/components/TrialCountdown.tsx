
import React, { useState, useEffect } from 'react';
import { useAuth } from '../services/auth';

interface TrialCountdownProps {
    isPt: boolean;
}

const TrialCountdown: React.FC<TrialCountdownProps> = ({ isPt }) => {
    const { user, isTrialActive } = useAuth();
    const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number } | null>(null);

    useEffect(() => {
        if (!user || !isTrialActive) return;

        const calculateTimeLeft = () => {
            const creationTime = user.metadata.creationTime;
            if (!creationTime) return;

            const createdDate = new Date(creationTime).getTime();
            const trialDuration = 15 * 24 * 60 * 60 * 1000;
            const expiryDate = createdDate + trialDuration;
            const now = new Date().getTime();
            const diff = expiryDate - now;

            if (diff <= 0) {
                setTimeLeft(null);
                return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

            setTimeLeft({ days, hours, minutes });
        };

        calculateTimeLeft();
        const timer = setInterval(calculateTimeLeft, 60000); // Update every minute

        return () => clearInterval(timer);
    }, [user, isTrialActive]);

    if (!isTrialActive || !timeLeft) return null;

    return (
        <div className="flex items-center gap-2 px-6 py-2 bg-[#F39237]/10 border border-[#F39237]/20 rounded-full shadow-[0_0_20px_rgba(243,146,55,0.1)]">
            <div className="w-1.5 h-1.5 bg-[#F39237] rounded-full animate-pulse"></div>
            <span className="text-[9px] font-black text-[#F39237] uppercase tracking-[0.2em]">
                {isPt ? 'TEMPO DE ANÁLISE FREE:' : 'FREE ANALYSIS TIME:'} {timeLeft.days}-{timeLeft.hours}-{timeLeft.minutes}
            </span>
        </div>
    );
};

export default TrialCountdown;
