import React, { useMemo } from 'react';
import { GameState, Goal, User } from '../types';
import { getUserColorClasses } from '../utils/themeStyles';

interface BingoGridProps {
  gameState: GameState;
  onGoalClick: (goal: Goal) => void;
  highlightLines?: number[][]; // Indices of winning lines
  isDraggable?: boolean; // Enable dragging mode
  onDragStart?: (index: number) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (targetIndex: number) => void;
  draggedIndex?: number | null;
}

// Separate Cell component to allow memoization
interface GridCellProps {
  goalId: string;
  index: number;
  goalMap: Map<string, Goal>;
  userMap: Map<string, User>;
  highlightedIndices: Set<number>;
  onGoalClick: (goal: Goal) => void;
  isDraggable?: boolean;
  onDragStart?: (index: number) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (targetIndex: number) => void;
  isDragged?: boolean;
}

const BingoGridCell = React.memo<GridCellProps>(
  ({
    goalId,
    index,
    goalMap,
    userMap,
    highlightedIndices,
    onGoalClick,
    isDraggable,
    onDragStart,
    onDragOver,
    onDrop,
    isDragged,
  }) => {
    const goal = goalMap.get(goalId);
    const user = goal ? userMap.get(goal.userId) : null;

    if (!goal || !user) {
      return (
        <div className="bg-gray-100 dark:bg-white/5 rounded-2xl border-2 border-dashed border-gray-200 dark:border-brand-mint/10 transition-colors" />
      );
    }

    const isComplete = goal.currentScore >= goal.targetScore;
    const isWinning = highlightedIndices.has(index);
    const colorClasses = getUserColorClasses(user.colorId);

    return (
      <button
        draggable={isDraggable}
        onDragStart={() => isDraggable && onDragStart?.(index)}
        onDragOver={(e) => {
          if (isDraggable) {
            e.preventDefault();
            e.dataTransfer!.dropEffect = 'move';
            onDragOver?.(e);
          }
        }}
        onDrop={(e) => {
          if (isDraggable) {
            e.preventDefault();
            e.stopPropagation();
            onDrop?.(index);
          }
        }}
        onClick={() => !isDraggable && onGoalClick(goal)}
        className={`
        relative rounded-2xl p-2 flex flex-col items-center justify-center text-center
        group overflow-hidden border-2 transform-gpu transition-opacity
        ${isWinning ? 'ring-4 ring-brand-rust ring-offset-2 ring-offset-white dark:ring-offset-brand-surface z-10' : ''}
        ${isDraggable && isDragged ? 'opacity-50' : ''}
        ${colorClasses}
        ${isComplete ? 'opacity-100' : 'opacity-90 dark:opacity-80'}
      `}
      >
        {/* Progress Background Overlay for incomplete items */}
        {!isComplete && goal.currentScore > 0 && (
          <div
            className="absolute bottom-0 left-0 right-0 bg-current opacity-10"
            style={{ height: `${(goal.currentScore / goal.targetScore) * 100}%` }}
          />
        )}

        {/* Owner Badge */}
        <div
          className={`
         absolute top-0 left-0 w-full py-0.5 text-[8px] sm:text-[10px] font-black uppercase tracking-widest
         bg-white/50 dark:bg-black/40
      `}
        >
          {user.name}
        </div>

        <div className="z-10 mt-3 flex flex-col items-center w-full px-1">
          <p className={`text-xs sm:text-sm font-bold line-clamp-3 leading-tight`}>{goal.title}</p>
        </div>

        {/* Status Indicator */}
        <div className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2">
          {isComplete && (
            <div className="bg-brand-petrol dark:bg-brand-mint text-brand-mint dark:text-brand-petrol rounded-full p-0.5 shadow-sm flex items-center justify-center">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M9 16.2l-3.5-3.5-1.4 1.4L9 19 20.3 7.7l-1.4-1.4z" />
              </svg>
            </div>
          )}
          {!isComplete && goal.currentScore > 0 && (
            <span className="text-[10px] font-mono bg-white/80 dark:bg-black/40 px-1.5 py-0.5 rounded-md shadow-sm font-bold">
              {Math.floor(goal.currentScore)}%
            </span>
          )}
        </div>
      </button>
    );
  }
);

BingoGridCell.displayName = 'BingoGridCell';

const BingoGrid: React.FC<BingoGridProps> = ({
  gameState,
  onGoalClick,
  highlightLines = [],
  isDraggable = false,
  onDragStart,
  onDragOver,
  onDrop,
  draggedIndex,
}) => {
  const { gridMapping, goals, users, config } = gameState;
  const gridSize = config.gridSize || 3;

  // Memoize goal and user lookup maps for O(1) access
  const goalMap = useMemo(() => new Map(goals.map((g) => [g.id, g])), [goals]);
  const userMap = useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);
  const highlightedIndices = useMemo(() => new Set(highlightLines.flat()), [highlightLines]);

  return (
    <div className="w-full max-w-md mx-auto bg-white dark:bg-[rgb(var(--brand-surface))] p-3 rounded-3xl shadow-sm relative">
      {/* Grid Container */}
      <div
        className="grid gap-2 sm:gap-3"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
          aspectRatio: '1 / 1',
        }}
      >
        {gridMapping.map((goalId, index) => (
          <BingoGridCell
            key={goalId}
            goalId={goalId}
            index={index}
            goalMap={goalMap}
            userMap={userMap}
            highlightedIndices={highlightedIndices}
            onGoalClick={onGoalClick}
            isDraggable={isDraggable}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDrop={onDrop}
            isDragged={isDraggable && draggedIndex === index}
          />
        ))}
      </div>
    </div>
  );
};

export default React.memo(BingoGrid);
