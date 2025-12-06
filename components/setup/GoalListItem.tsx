import React from 'react';
import { Goal } from '../../types';

interface GoalListItemProps {
  goal: Goal;
  index: number;
  onClick: () => void;
}

const GoalListItem: React.FC<GoalListItemProps> = ({ goal, index, onClick }) => {
  const isEmpty = !goal.title || !goal.title.trim() || goal.title.includes('(點擊設定目標)');

  return (
    <div
      onClick={onClick}
      className={`
        p-4 rounded-xl cursor-pointer transition-all border-2
        ${
          isEmpty
            ? 'bg-white/50 dark:bg-black/10 border-dashed border-accent/20 dark:border-accent/10'
            : 'bg-white dark:bg-[rgb(var(--brand-surface))] border-solid border-brand-mint/30 dark:border-brand-teal/30'
        }
      `}
    >
      <div className="flex justify-between items-start mb-1">
        <div className={`text-xs ${isEmpty ? 'text-accent/40' : 'text-accent/60'}`}>
          目標 {index + 1}
        </div>
        {goal.structure?.type && !isEmpty ? (
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded border font-bold ${
              goal.structure.type === 'habit'
                ? 'bg-brand-teal/10 text-accent border-brand-teal/20 dark:text-accent dark:border-brand-mint/30'
                : goal.structure.type === 'step'
                  ? 'bg-brand-rust/10 text-accent border-brand-rust/20 dark:text-orange-200 dark:border-brand-rust/30'
                  : 'bg-white/50 dark:bg-black/20 text-accent/60 border border-accent/10 dark:border-accent/10'
            }`}
          >
            {goal.structure.type === 'habit' ? '規律型' : '階段型'}
          </span>
        ) : (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/50 dark:bg-black/20 text-accent/60 border border-accent/10">
            待設定
          </span>
        )}
      </div>
      <div className={`font-bold text-lg ${isEmpty ? 'text-accent/40' : 'text-accent'}`}>
        {isEmpty ? '(點擊以設定目標)' : goal.title}
      </div>
    </div>
  );
};

export default GoalListItem;
