
import React from 'react';
import { GameState, Goal } from '../types';
import { getUserColorClasses } from '../utils/themeStyles';

interface BingoGridProps {
  gameState: GameState;
  onGoalClick: (goal: Goal) => void;
  highlightLines?: number[][]; // Indices of winning lines
}

const BingoGrid: React.FC<BingoGridProps> = ({ gameState, onGoalClick, highlightLines = [] }) => {
  const { gridMapping, goals, users, config } = gameState;
  const gridSize = config.gridSize || 3;

  // Helper to find goal and owner
  const getCellData = (goalId: number) => {
    const goal = goals.find(g => g.id === goalId);
    const user = users.find(u => u.id === goal?.userId);
    return { goal, user };
  };

  // Helper to check if a cell index is part of a winning line
  const isHighlighted = (index: number) => {
    return highlightLines.some(line => line.includes(index));
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white dark:bg-brand-surface p-3 rounded-3xl shadow-2xl relative border-4 border-brand-petrol dark:border-brand-dark transition-colors duration-300">
      {/* Grid Container */}
      <div 
        className="grid gap-2 sm:gap-3"
        style={{ 
            display: 'grid',
            gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
            aspectRatio: '1 / 1'
        }}
      >
        {gridMapping.map((goalId, index) => {
          const { goal, user } = getCellData(goalId);
          // If no goal assigned to this slot yet
          if (!goal || !user) return <div key={index} className="bg-gray-100 dark:bg-white/5 rounded-2xl border-2 border-dashed border-gray-200 dark:border-brand-mint/10 transition-colors" />;

          const isComplete = goal.currentScore >= goal.targetScore;
          const isWinning = isHighlighted(index);

          // Get Semantic Color Classes
          const colorClasses = getUserColorClasses(user.colorId);

          return (
            <button
              key={goalId}
              onClick={() => onGoalClick(goal)}
              className={`
                relative rounded-2xl p-2 flex flex-col items-center justify-center text-center transition-all duration-300
                group overflow-hidden border-2
                ${isWinning ? 'ring-4 ring-brand-rust ring-offset-2 ring-offset-white dark:ring-offset-brand-surface z-10 scale-[1.03] shadow-xl' : 'hover:scale-[1.02] hover:shadow-md'}
                ${colorClasses}
                ${isComplete ? 'opacity-100' : 'opacity-90 dark:opacity-80'}
              `}
            >
              {/* Progress Background Overlay for incomplete items */}
              {!isComplete && goal.currentScore > 0 && (
                <div 
                  className="absolute bottom-0 left-0 right-0 bg-current opacity-10 transition-all duration-500"
                  style={{ height: `${(goal.currentScore / goal.targetScore) * 100}%` }}
                />
              )}

              {/* Owner Badge */}
              <div className={`
                 absolute top-0 left-0 w-full py-0.5 text-[8px] sm:text-[10px] font-black uppercase tracking-widest
                 bg-white/40 dark:bg-black/40 backdrop-blur-sm
              `}>
                {user.name}
              </div>
              
              <div className="z-10 mt-3 flex flex-col items-center w-full px-1">
                <p className={`text-xs sm:text-sm font-bold line-clamp-3 leading-tight`}>
                  {goal.title}
                </p>
              </div>

              {/* Status Indicator */}
              <div className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2">
                 {isComplete && (
                   <div className="bg-brand-petrol dark:bg-brand-mint text-brand-mint dark:text-brand-petrol rounded-full p-0.5 shadow-sm flex items-center justify-center">
                       <span className="material-symbols-outlined text-[12px] font-bold">check</span>
                   </div>
                 )}
                 {!isComplete && goal.currentScore > 0 && (
                    <span className="text-[10px] font-mono bg-white/80 dark:bg-black/40 px-1.5 py-0.5 rounded-md backdrop-blur-sm shadow-sm font-bold">
                        {Math.floor(goal.currentScore)}%
                    </span>
                 )}
              </div>
            </button>
          );
        })}
      </div>
      
      {/* Decorative Elements */}
      <div className="absolute -inset-1 rounded-[2rem] border-2 border-brand-petrol/10 dark:border-brand-mint/5 pointer-events-none -z-10"></div>
    </div>
  );
};

export default BingoGrid;
