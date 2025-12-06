import React, { useState, useMemo } from 'react';
import { GameState, User } from '../../types';
import BingoGrid from '../BingoGrid';
import ConfirmDialog from '../common/ConfirmDialog';
import { getUserTheme } from '../../utils/themeStyles';
import { generateSettlementRoast, SettlementSummaryPayload } from '../../services/geminiService';
import SettlementSummaryCard from '../common/SettlementSummaryCard';
import SettlementRoastCard from '../common/SettlementRoastCard';

interface UserStat {
  user: User;
  totalScore: number;
  totalTarget: number;
  completionRate: number;
  completedCount: number;
  totalGoals: number;
}

interface SettlementViewProps {
  gameState: GameState;
  isLocked: boolean;
  isSolo: boolean;
  linesCount: number;
  linesTarget: number;
  groupTotalScore: number;
  groupTarget: number;
  isGroupSafe: boolean;
  goalsByUserId: Map<string, GameState['goals']>;
  activeLines: number[][];
  userStats: UserStat[];
  totalGoals: number;
  completedGoals: number;
  averageCompletionRate: number;
  goalsPerUser: number;
  topPerformer: UserStat | null;
  bottomPerformer: UserStat | null;
  onReturn: () => void;
  onSave: (updatedState: GameState) => void;
}

const SettlementView: React.FC<SettlementViewProps> = ({
  gameState,
  isLocked,
  isSolo,
  linesCount,
  linesTarget,
  groupTotalScore,
  groupTarget,
  isGroupSafe,
  goalsByUserId,
  activeLines,
  userStats,
  totalGoals,
  completedGoals,
  averageCompletionRate,
  goalsPerUser,
  topPerformer,
  bottomPerformer,
  onReturn,
  onSave,
}) => {
  const [roast, setRoast] = useState<string | null>(null);
  const [roastError, setRoastError] = useState<string | null>(null);
  const [roastLoading, setRoastLoading] = useState(false);
  const [showConfirmLock, setShowConfirmLock] = useState(false);

  const settlementSummary = useMemo<SettlementSummaryPayload>(
    () => ({
      year: gameState.config.year,
      isSolo,
      totalGoals,
      completedGoals,
      averageCompletionRate,
      groupScore: Math.round(groupTotalScore),
      groupTarget,
      linesCount,
      linesTarget,
      isGroupSafe,
      topPerformer: topPerformer
        ? {
            name: topPerformer.user.name,
            completionRate: topPerformer.completionRate,
            totalScore: Math.round(topPerformer.totalScore),
          }
        : null,
      bottomPerformer:
        bottomPerformer && bottomPerformer.user.id !== (topPerformer?.user.id ?? '')
          ? {
              name: bottomPerformer.user.name,
              completionRate: bottomPerformer.completionRate,
              totalScore: Math.round(bottomPerformer.totalScore),
            }
          : null,
      users: userStats.map((stat) => ({
        name: stat.user.name,
        completionRate: stat.completionRate,
        totalScore: Math.round(stat.totalScore),
        completedGoals: stat.completedCount,
        totalGoals: stat.totalGoals,
      })),
    }),
    [
      gameState.config.year,
      isSolo,
      totalGoals,
      completedGoals,
      averageCompletionRate,
      groupTotalScore,
      groupTarget,
      linesCount,
      linesTarget,
      isGroupSafe,
      topPerformer,
      bottomPerformer,
      userStats,
    ]
  );

  const hasSummaryData = settlementSummary.users.length > 0;

  const handleGenerateRoast = async () => {
    if (!hasSummaryData) {
      setRoastError('目前沒有可供分析的結算資料。');
      return;
    }

    setRoast(null);
    setRoastError(null);
    setRoastLoading(true);

    try {
      const aiComment = await generateSettlementRoast(settlementSummary);
      setRoast(aiComment);
    } catch (error: unknown) {
      if (error instanceof Error && error.message === 'MISSING_API_KEY') {
        setRoastError('請先設定 Gemini API Key。');
      } else {
        setRoastError('AI 暫時無法提供評語，請稍後再試。');
      }
    } finally {
      setRoastLoading(false);
    }
  };

  const handleConfirmLock = () => {
    onSave({ ...gameState, phase: 'complete' });
    setShowConfirmLock(false);
  };

  return (
    <div className="animate-fade-in pb-12 text-center max-w-2xl mx-auto">
      <div
        className={`mb-6 p-6 rounded-3xl border-4 ${isLocked ? 'border-brand-petrol bg-white dark:bg-[rgb(var(--brand-surface))]' : 'border-accent bg-white/60 dark:bg-black/20'}`}
      >
        <h2 className="text-3xl font-black text-accent dark:text-accent mb-2 flex items-center justify-center gap-2">
          {isLocked ? (
            <>
              <span className="material-symbols-outlined text-[32px]">emoji_events</span>{' '}
              最終結算報告
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-[32px]">preview</span> 結算預覽
            </>
          )}
        </h2>
        <p className="text-accent dark:text-accent/80 mb-6 text-sm">
          {isLocked
            ? '本年度挑戰已結束，感謝大家的努力！'
            : '請確認以下結果，按下「確認結算」後將無法再修改。'}
        </p>

        {/* Result Summary (Hidden in Solo Mode) */}
        {!isSolo && (
          <div className="grid grid-cols-2 gap-4 mb-6 text-left">
            <div className="bg-white dark:bg-[rgb(var(--brand-dark))] p-4 rounded-xl border border-brand-mint/20">
              <div className="text-xs text-accent font-bold uppercase tracking-wider">連線數</div>
              <div
                className={`text-2xl font-black ${linesCount >= linesTarget ? 'text-green-600 dark:text-green-400' : 'text-accent'}`}
              >
                {linesCount} <span className="text-sm text-accent/50">/ {linesTarget} 條</span>
              </div>
            </div>
            <div className="bg-white dark:bg-[rgb(var(--brand-dark))] p-4 rounded-xl border border-brand-mint/20">
              <div className="text-xs text-accent font-bold uppercase tracking-wider">團體總分</div>
              <div
                className={`text-2xl font-black ${groupTotalScore >= groupTarget ? 'text-green-600 dark:text-green-400' : 'text-accent'}`}
              >
                {Math.round(groupTotalScore)}{' '}
                <span className="text-sm text-accent/50">/ {groupTarget}</span>
              </div>
            </div>
          </div>
        )}

        {/* Punishment Display (Hidden in Solo Mode) */}
        {!isSolo && (
          <>
            {!isGroupSafe && (
              <div className="mb-6 bg-white dark:bg-brand-rust/10 p-5 rounded-xl border border-brand-rust/20 dark:border-brand-rust/30 text-left">
                <h4 className="font-bold text-accent mb-1 flex items-center gap-2">
                  <span className="material-symbols-outlined">warning</span> 團體懲罰執行
                </h4>
                <p className="text-accent font-bold text-lg">{gameState.config.groupPenalty}</p>
              </div>
            )}
            {isGroupSafe && (
              <div className="mb-6 bg-brand-mint/30 p-5 rounded-xl border border-brand-mint/50 text-left">
                <h4 className="font-bold text-accent dark:text-accent mb-1 flex items-center gap-2">
                  <span className="material-symbols-outlined">celebration</span> 恭喜！
                </h4>
                <p className="text-accent dark:text-accent font-bold">
                  達成團體目標，免除團體懲罰！
                </p>
              </div>
            )}
          </>
        )}

        {userStats.length > 0 && (
          <SettlementSummaryCard
            userStats={userStats}
            totalGoals={totalGoals}
            completedGoals={completedGoals}
            averageCompletionRate={averageCompletionRate}
            goalsPerUser={goalsPerUser}
            topPerformer={topPerformer}
            bottomPerformer={bottomPerformer}
          />
        )}

        <SettlementRoastCard
          onGenerate={handleGenerateRoast}
          roast={roast}
          roastError={roastError}
          roastLoading={roastLoading}
          hasSummaryData={hasSummaryData}
        />

        {/* Individual Settlement List */}
        <div className="text-left space-y-2">
          <h4 className="font-bold text-accent ml-1 text-sm uppercase tracking-wider">
            {isSolo ? '個人結算' : '個人懲罰清單'}
          </h4>
          {gameState.users.map((user) => {
            const userGoals = goalsByUserId.get(user.id) || [];
            const userTotal = userGoals.reduce((sum, goal) => sum + goal.currentScore, 0);
            const isSafe = userTotal >= (gameState.config.individualSafeScore || 100);
            const theme = getUserTheme(user.colorId);

            return (
              <div
                key={user.id}
                className={`p-3 rounded-xl border grid grid-cols-[auto,1fr] items-center gap-2 ${isSafe ? 'bg-white/50 dark:bg-[rgb(var(--brand-dark))] border-brand-mint/20 opacity-70' : 'bg-white dark:bg-brand-rust/5 border-brand-rust/20'}`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {!isSolo && (
                    <span
                      className={`flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded ${theme.badge}`}
                    >
                      {user.name}
                    </span>
                  )}
                  <span className="whitespace-nowrap text-sm font-bold text-accent dark:text-accent">
                    {isSolo ? '累積 ' : ''}
                    {Math.round(userTotal)} 分
                  </span>
                </div>
                <div className="justify-self-end min-w-0 text-right">
                  {isSafe ? (
                    <span className="text-xs font-bold text-green-600 dark:text-green-400 inline-flex items-center gap-1">
                      Safe{' '}
                      <span className="material-symbols-outlined text-[14px]">check_circle</span>
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-accent break-words leading-snug">
                      {user.individualPenalty}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div
        className="opacity-80 pointer-events-none origin-top transform-gpu"
        style={{ transform: 'scale(0.9)' }}
      >
        <BingoGrid gameState={gameState} onGoalClick={() => {}} highlightLines={activeLines} />
      </div>

      {!isLocked && (
        <div className="fixed bottom-0 left-0 right-0 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] bg-white/90 dark:bg-[rgb(var(--brand-dark))]/90 backdrop-blur-none md:backdrop-blur border-t border-brand-mint/20 flex justify-center gap-4 z-50 transform-gpu will-change-[transform]">
          <button
            onClick={onReturn}
            className="px-6 py-3 bg-white dark:bg-[rgb(var(--brand-surface))] border border-brand-teal/30 text-accent dark:text-accent font-bold rounded-xl"
          >
            返回修改
          </button>
          <button
            onClick={() => setShowConfirmLock(true)}
            className="px-6 py-3 bg-brand-petrol dark:bg-brand-mint text-white dark:text-brand-dark font-bold rounded-xl shadow flex items-center gap-2 hover:bg-brand-petrol/90 dark:hover:bg-brand-mint/80"
          >
            確認並鎖定結算 <span className="material-symbols-outlined text-[18px]">lock</span>
          </button>
        </div>
      )}

      <ConfirmDialog
        isOpen={showConfirmLock}
        title={
          <span className="flex items-center justify-center gap-2 text-accent">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M1 21h22L12 2 1 21zm12-3h-2v2h2v-2zm0-8h-2v6h2V10z" />
            </svg>
            確定鎖定結算？
          </span>
        }
        message={
          '按下確定後，本年度將標記為「已結算」。\n\n所有人將無法再修改進度或目標，\n您確定要繼續嗎？'
        }
        confirmText="確定鎖定"
        isDestructive={true}
        onConfirm={handleConfirmLock}
        onCancel={() => setShowConfirmLock(false)}
      />
    </div>
  );
};

export default SettlementView;
