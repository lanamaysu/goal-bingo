
import React from 'react';

interface LandingViewProps {
  onJoinTeam: () => void;
  onCreateTeam: () => void;
}

const LandingView: React.FC<LandingViewProps> = ({ onJoinTeam, onCreateTeam }) => (
  <div className="min-h-screen flex flex-col items-center justify-center p-6 animate-fade-in" style={{ minHeight: '100dvh' }}>
    <div className="max-w-md w-full bg-white dark:bg-brand-surface rounded-3xl shadow-soft p-10 text-center border border-white/20">
      <div className="inline-flex items-center justify-center w-20 h-20 bg-brand-mint/50 dark:bg-brand-mint/20 rounded-full mb-6 text-brand-petrol dark:text-brand-mint">
        <span className="material-symbols-outlined text-[40px]">track_changes</span>
      </div>
      <h1 className="text-4xl font-black text-brand-petrol dark:text-white mb-3 tracking-tight">年度九宮格</h1>
      <p className="text-brand-teal dark:text-brand-teal/80 mb-10 font-medium leading-relaxed">
        與朋友一起達成目標，互相監督、一起成長！<br/>
        讓夢想在方格中連線。
      </p>
      
      <div className="space-y-4">
        <button 
          onClick={onJoinTeam}
          className="w-full py-4 bg-white dark:bg-brand-dark border-2 border-brand-mint dark:border-brand-teal/30 text-brand-petrol dark:text-brand-mint font-bold rounded-2xl transition-all flex items-center justify-center gap-3 group"
        >
          <span className="material-symbols-outlined text-[20px] text-brand-teal transition-colors">group</span>
          加入現有隊伍
        </button>
        
        <div className="relative py-2">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-brand-teal/20"></div></div>
          <div className="relative flex justify-center text-xs font-bold uppercase tracking-wider"><span className="px-3 bg-white dark:bg-brand-surface text-brand-teal/60">OR</span></div>
        </div>

        <button 
          onClick={onCreateTeam}
          className="w-full py-4 bg-brand-petrol text-white font-bold rounded-2xl transition-all shadow-lg flex items-center justify-center gap-3"
        >
          <span className="material-symbols-outlined text-[20px]">add_circle</span>
          建立新隊伍
        </button>
      </div>
    </div>
  </div>
);

export default LandingView;
