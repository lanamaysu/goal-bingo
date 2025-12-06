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
      <h4 className="text-sm font-bold text-brand-petrol dark:text-brand-mint flex items-center gap-2">
        <span className="material-symbols-outlined text-[18px]">chat</span>
        AI 酷辣評語
      </h4>
      <button
        onClick={onGenerate}
        disabled={roastLoading || !hasSummaryData}
        className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors ${
          roastLoading
            ? 'bg-brand-mint/30 text-brand-petrol/60 cursor-wait'
            : hasSummaryData
              ? 'bg-brand-petrol text-white hover:bg-brand-petrol/90'
              : 'bg-gray-200 text-gray-500 cursor-not-allowed dark:bg-black/40 dark:text-gray-500'
        }`}
      >
        <span className="material-symbols-outlined text-[16px]">
          {roastLoading ? 'hourglass_top' : 'whatshot'}
        </span>
        {roastLoading ? 'AI 思考中...' : '生成酷辣評語'}
      </button>
    </div>
    <p className="text-xs text-brand-teal/70 mt-2">讓主持人幫你用一句話總結今年的目標達成情況。</p>
    {roast && (
      <p className="mt-3 text-sm font-bold text-brand-petrol dark:text-brand-mint leading-relaxed">
        {roast}
      </p>
    )}
    {roastError && <p className="mt-3 text-xs font-bold text-brand-rust">{roastError}</p>}
  </div>
);

export default SettlementRoastCard;
