
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
        ${isEmpty 
            ? 'bg-gray-50 dark:bg-white/5 border-dashed border-gray-300 dark:border-white/10' 
            : 'bg-white dark:bg-brand-surface border-solid border-brand-mint/30 dark:border-brand-teal/30'
        }
      `}
    >
      <div className="flex justify-between items-start mb-1">
        <div className={`text-xs ${isEmpty ? 'text-gray-400 dark:text-gray-500' : 'text-gray-400 dark:text-brand-mint/60'}`}>
            目標 {index + 1}
        </div>
        {goal.structure?.type && !isEmpty ? (
          <span className={`text-[10px] px-1.5 py-0.5 rounded border font-bold ${
            goal.structure.type === 'habit' 
                ? 'bg-brand-teal/10 text-brand-teal border-brand-teal/20 dark:text-brand-mint dark:border-brand-mint/30' 
            : goal.structure.type === 'step' 
                ? 'bg-brand-rust/10 text-brand-rust border-brand-rust/20 dark:text-orange-200 dark:border-brand-rust/30' 
            : 'bg-gray-50 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
          }`}>
            {goal.structure.type === 'habit' ? '規律型' : '階段型'}
          </span>
        ) : (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-400 dark:bg-white/10 dark:text-gray-500">
            待設定
          </span>
        )}
      </div>
      <div className={`font-bold text-lg ${isEmpty ? 'text-gray-400 dark:text-gray-600' : 'text-gray-800 dark:text-brand-mint'}`}>
        {isEmpty ? '(點擊以設定目標)' : goal.title}
      </div>
    </div>
  );
};

export default GoalListItem;
