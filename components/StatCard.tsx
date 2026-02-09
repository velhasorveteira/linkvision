
import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  colorClass?: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, subValue, colorClass = "text-white" }) => {
  return (
    <div className="bg-[#1a1a1a] border border-[#333] p-4 sm:p-6 rounded-2xl flex flex-col items-center text-center shadow-lg transition-all duration-300 ease-out active:scale-95 sm:hover:scale-[1.03] sm:hover:-translate-y-1 cursor-default group">
      <span className="text-slate-500 text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] mb-1 sm:mb-2 group-hover:text-slate-300 transition-colors whitespace-nowrap overflow-hidden text-ellipsis w-full">
        {label}
      </span>
      <span className={`text-2xl sm:text-4xl font-black italic ${colorClass} tracking-tighter`}>
        {value}
      </span>
      {subValue && (
        <span className="text-slate-600 text-[9px] sm:text-xs mt-1 font-mono opacity-80">
          {subValue}
        </span>
      )}
    </div>
  );
};

export default StatCard;
