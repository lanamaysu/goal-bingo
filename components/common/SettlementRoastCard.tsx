import React from 'react';

interface SettlementRoastCardProps {
  onGenerate: () => void | Promise<void>;
  roast: string | null;
  roastError: string | null;
  roastLoading: boolean;
  hasSummaryData: boolean;
}

const SettlementRoastCard: React.FC<SettlementRoastCardProps> = ({
  onGenerate,
  roast,
  roastError,
  roastLoading,
  hasSummaryData,
}) => (
  <div className="mb-6 bg-white dark:bg-[rgb(var(--brand-surface))] p-5 rounded-2xl border border-brand-mint/20 text-left">
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <h4 className="text-sm font-bold text-accent dark:text-accent flex items-center gap-2">
        <span className="material-symbols-outlined text-[18px]">chat</span>
        AI 酷辣評語
      </h4>
      <button
        onClick={onGenerate}
        disabled={roastLoading || !hasSummaryData}
        className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors ${
          roastLoading
            ? 'bg-brand-mint/30 text-accent/60 cursor-wait'
            : hasSummaryData
              ? 'bg-brand-petrol dark:bg-brand-mint text-white dark:text-brand-dark hover:bg-brand-petrol/90 dark:hover:bg-brand-mint/80'
              : 'bg-white/30 text-accent/40 cursor-not-allowed dark:bg-black/20 border border-accent/10'
        }`}
      >
        <span className="material-symbols-outlined text-[16px]">
          {roastLoading ? 'hourglass_top' : 'whatshot'}
        </span>
        {roastLoading ? 'AI 思考中...' : '生成酷辣評語'}
      </button>
    </div>
    <p className="text-xs text-accent/70 mt-2">讓主持人幫你用一句話總結今年的目標達成情況。</p>
    {roast && (
      <p className="mt-3 text-sm font-bold text-accent dark:text-accent leading-relaxed">{roast}</p>
    )}
    {roastError && <p className="mt-3 text-xs font-bold text-accent">{roastError}</p>}
  </div>
);

export default SettlementRoastCard;
