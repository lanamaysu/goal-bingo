
import React, { useState } from 'react';

interface EmptyYearViewProps {
  year: string;
  onSwitchYear: (year: string) => void;
  onInitialize: () => void;
}

const EmptyYearView: React.FC<EmptyYearViewProps> = ({ year, onSwitchYear, onInitialize }) => {
  const [inputYear, setInputYear] = useState(year);

  const handleSwitch = () => {
    if (inputYear && inputYear.length === 4) {
      onSwitchYear(inputYear);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-brand-mint/30 dark:bg-[rgb(var(--brand-dark))] transition-colors duration-300 animate-fade-in" style={{ minHeight: '100dvh' }}>
      <div className="max-w-md w-full bg-white dark:bg-[rgb(var(--brand-surface))] rounded-3xl shadow-xl p-8 text-center space-y-6 border border-white/20 dark:border-brand-teal/20">
        <div className="space-y-2">
            <h2 className="text-4xl font-black text-brand-mint dark:text-brand-mint/10 opacity-50 dark:opacity-100">{year}</h2>
            <h1 className="text-xl font-bold text-brand-petrol dark:text-brand-mint">尚未建立遊戲資料</h1>
            <p className="text-brand-teal dark:text-brand-teal/80 text-sm">此年份還沒有任何 Bingo 遊戲紀錄。</p>
        </div>

        <div className="bg-brand-mint/10 dark:bg-black/20 p-6 rounded-2xl border border-brand-mint/20 dark:border-white/5 space-y-4">
             <div className="space-y-2">
                 <label className="text-xs font-bold text-brand-teal dark:text-brand-teal/70 uppercase tracking-wider">切換至其他年份</label>
                 <div className="flex gap-2">
                     <input 
                        type="number" 
                        value={inputYear}
                        onChange={(e) => setInputYear(e.target.value)}
                        className="flex-1 p-2 bg-white dark:bg-[rgb(var(--brand-dark))] border-2 border-transparent focus:border-brand-teal rounded-xl text-center font-bold text-lg text-brand-petrol dark:text-brand-mint outline-none transition-all"
                        placeholder="YYYY"
                     />
                     <button 
                        onClick={handleSwitch}
                        disabled={inputYear === year || inputYear.length !== 4}
                        className="px-4 bg-white dark:bg-[rgb(var(--brand-dark))] border-2 border-brand-teal/20 text-brand-teal font-bold rounded-xl disabled:opacity-50 transition-colors"
                     >
                        前往
                     </button>
                 </div>
             </div>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-brand-teal/20"></div></div>
          <div className="relative flex justify-center text-sm"><span className="px-2 bg-white dark:bg-[rgb(var(--brand-surface))] text-brand-teal/60 font-bold">OR</span></div>
        </div>

        <button 
          onClick={onInitialize}
          className="w-full py-4 bg-brand-petrol text-white font-bold rounded-2xl transition-all shadow flex flex-col items-center group"
        >
          <span className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] transition-transform">auto_awesome</span> 
              建立 {year} 年度新遊戲
          </span>
          <span className="text-[10px] font-normal opacity-70 mt-1">設定人數與規則</span>
        </button>
      </div>
    </div>
  );
};

export default EmptyYearView;
