import React, { useState, useMemo } from 'react';
import { Goal, User, GameState } from '../../types';
import { getWinningLines } from '../../utils/constants';
import { useGame } from '../../contexts/GameContext';
import SettlementView from './SettlementView';
import NormalGameView from './NormalGameView';

interface DashboardViewProps {
  onGoalClick: (goal: Goal) => void;
  onOpenSettings: () => void;
}

interface UserStat {
  user: User;
  totalScore: number;
  totalTarget: number;
  completionRate: number;
  completedCount: number;
  totalGoals: number;
}

const DashboardView: React.FC<DashboardViewProps> = ({ onGoalClick, onOpenSettings }) => {
  const { gameState, saveAndSync } = useGame();

  const [showPreview, setShowPreview] = useState(false);

  if (!gameState) return null;

  const hasGridMappingIssue =
    gameState.phase === 'active' &&
    gameState.gridMapping.length === 0 &&
    gameState.goals.length > 0;

  const gridSize = gameState.config.gridSize || 3;
  const isSolo = gameState.config.totalPlayers === 1;
  const phase = gameState.phase;
  const goalsPerUser = gameState.config.goalsPerUser ?? 0;

  const winningLines = isSolo ? [] : getWinningLines(gridSize);

  const goalMap = useMemo(() => new Map(gameState.goals.map((g) => [g.id, g])), [gameState.goals]);

  const goalsByUserId = useMemo(() => {
    const map = new Map<string, typeof gameState.goals>();
    gameState.goals.forEach((g) => {
      if (!map.has(g.userId)) map.set(g.userId, []);
      map.get(g.userId)!.push(g);
    });
    return map;
  }, [gameState.goals]);

  const activeLines = useMemo(
    () =>
      winningLines.filter((line) =>
        line.every((idx) => {
          const gId = gameState.gridMapping[idx];
          const g = goalMap.get(gId);
          if (!g) return false;
          return g.currentScore >= g.targetScore;
        })
      ),
    [winningLines, gameState.gridMapping, goalMap]
  );

  const isSettlementMode = phase === 'review' || phase === 'complete' || showPreview;
  const isLocked = phase === 'complete';

  const groupStats = useMemo(() => {
    const totalScore = gameState.goals.reduce((sum, g) => sum + g.currentScore, 0);
    const target = gameState.config.groupTargetScore;
    const minLines = gameState.config.minLinesForSafe || 1;
    return { totalScore, target, minLines };
  }, [gameState.goals, gameState.config.groupTargetScore, gameState.config.minLinesForSafe]);

  const groupTotalScore = groupStats.totalScore;
  const groupTarget = groupStats.target;
  const linesCount = activeLines.length;
  const linesTarget = groupStats.minLines;

  const isGroupSafe = linesCount >= linesTarget || groupTotalScore >= groupTarget;

  const userStats = useMemo<UserStat[]>(() => {
    return gameState.users.map((user) => {
      const userGoals = goalsByUserId.get(user.id) || [];
      const totalScore = userGoals.reduce((sum, goal) => sum + goal.currentScore, 0);
      const totalTarget = userGoals.reduce((sum, goal) => sum + (goal.targetScore || 100), 0);
      const fallbackTarget =
        totalTarget || userGoals.length * 100 || (goalsPerUser || 1) * 100 || 100;
      const safeTarget = fallbackTarget > 0 ? fallbackTarget : 1;
      const completionRate = Math.round((totalScore / safeTarget) * 100);
      const completedCount = userGoals.filter(
        (goal) => goal.currentScore >= goal.targetScore
      ).length;

      return {
        user,
        totalScore,
        totalTarget: safeTarget,
        completionRate,
        completedCount,
        totalGoals: userGoals.length,
      };
    });
  }, [gameState.users, goalsByUserId, goalsPerUser]);

  const totalGoals = gameState.goals.length;
  const completedGoals = useMemo(
    () => gameState.goals.filter((goal) => goal.currentScore >= goal.targetScore).length,
    [gameState.goals]
  );

  const averageCompletionRate = useMemo(() => {
    if (!userStats.length) return 0;
    const total = userStats.reduce((sum, stat) => sum + stat.completionRate, 0);
    return Math.round(total / userStats.length);
  }, [userStats]);

  const sortedByCompletion = useMemo(
    () => [...userStats].sort((a, b) => b.completionRate - a.completionRate),
    [userStats]
  );

  const topPerformer = sortedByCompletion[0] || null;
  const bottomPerformer =
    sortedByCompletion.length > 1 ? sortedByCompletion[sortedByCompletion.length - 1] : null;

  if (isSettlementMode) {
    return (
      <SettlementView
        gameState={gameState}
        isLocked={isLocked}
        isSolo={isSolo}
        linesCount={linesCount}
        linesTarget={linesTarget}
        groupTotalScore={groupTotalScore}
        groupTarget={groupTarget}
        isGroupSafe={isGroupSafe}
        goalsByUserId={goalsByUserId}
        activeLines={activeLines}
        userStats={userStats}
        totalGoals={totalGoals}
        completedGoals={completedGoals}
        averageCompletionRate={averageCompletionRate}
        goalsPerUser={goalsPerUser}
        topPerformer={topPerformer}
        bottomPerformer={bottomPerformer}
        onReturn={() => setShowPreview(false)}
        onSave={saveAndSync}
      />
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Non-blocking warning banner */}
      {hasGridMappingIssue && (
        <div className="mb-4 bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-400 dark:border-amber-500 p-3 rounded-r-lg animate-fade-in">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 text-[20px]">
                warning
              </span>
              <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">
                檢測到網格資料異常，可能影響連線顯示
              </p>
            </div>
            <button
              onClick={onOpenSettings}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[14px]">build</span>
              診斷修復
            </button>
          </div>
        </div>
      )}

      <NormalGameView
        gameState={gameState}
        onGoalClick={onGoalClick}
        activeLines={activeLines}
        onShowPreview={() => setShowPreview(true)}
      />
    </div>
  );
};

export default DashboardView;
