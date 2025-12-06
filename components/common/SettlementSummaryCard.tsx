import React from 'react';
import { User } from '../../types';
import { getUserTheme } from '../../utils/themeStyles';

interface UserStat {
  user: User;
  totalScore: number;
  totalTarget: number;
  completionRate: number;
  completedCount: number;
  totalGoals: number;
}

interface SettlementSummaryCardProps {
  userStats: UserStat[];
  totalGoals: number;
  completedGoals: number;
  averageCompletionRate: number;
  goalsPerUser: number;
  topPerformer: UserStat | null;
  bottomPerformer: UserStat | null;
}

const SettlementSummaryCard: React.FC<SettlementSummaryCardProps> = ({
  userStats,
  totalGoals,
  completedGoals,
  averageCompletionRate,
  goalsPerUser,
  topPerformer,
  bottomPerformer,
}) => {
  const shouldShowBadges = userStats.length > 0 && topPerformer;
  const showBottomBadge = userStats.length > 1;

  return (
    <div className="mb-6 bg-white dark:bg-[rgb(var(--brand-surface))] p-5 rounded-2xl border border-brand-mint/20 text-left">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <div className="text-xs text-brand-teal font-bold uppercase tracking-wider">
            年度完成概覽
          </div>
          <div className="text-2xl font-black text-brand-petrol dark:text-brand-mint">
            {completedGoals}/{totalGoals} 項目達標
          </div>
        </div>
        <div className="text-sm text-brand-teal font-bold">平均達成率 {averageCompletionRate}%</div>
      </div>
      <div className="mt-4 space-y-3">
        {userStats.map((stat) => {
          const theme = getUserTheme(stat.user.colorId);
          const goalCount = stat.totalGoals || goalsPerUser || 0;
          const completionLabel =
            goalCount > 0
              ? `${stat.completedCount}/${goalCount} 完成`
              : `${stat.completedCount} 項完成`;
          const barWidth = Math.min(100, Math.max(0, stat.completionRate));

          return (
            <div
              key={stat.user.id}
              className="bg-brand-mint/10 dark:bg-black/20 p-3 rounded-xl border border-brand-mint/20"
            >
              <div className="flex items-center justify-between text-sm font-bold text-brand-petrol dark:text-brand-mint">
                <span className="flex items-center gap-2 min-w-0">
                  <span
                    className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded ${theme.badge}`}
                  >
                    {stat.user.name}
                  </span>
                  <span className="text-xs font-semibold text-brand-teal whitespace-nowrap">
                    {completionLabel}
                  </span>
                </span>
                <span className="text-brand-teal text-xs sm:text-sm">
                  {Math.round(stat.totalScore)} 分・{stat.completionRate}%
                </span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-white dark:bg-[rgb(var(--brand-dark))] overflow-hidden">
                <div
                  className="h-full bg-brand-teal dark:bg-brand-mint transition-all duration-500 ease-out"
                  style={{ width: `${barWidth}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
      {shouldShowBadges && topPerformer && (
        <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold">
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-brand-mint/40 text-brand-petrol rounded-full">
            <span className="material-symbols-outlined text-[14px]">military_tech</span>
            MVP：{topPerformer.user.name} ({topPerformer.completionRate}%)
          </span>
          {showBottomBadge && bottomPerformer && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-brand-rust/10 text-brand-rust rounded-full">
              <span className="material-symbols-outlined text-[14px]">hourglass_bottom</span>
              加油：{bottomPerformer.user.name} ({bottomPerformer.completionRate}%)
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default SettlementSummaryCard;
