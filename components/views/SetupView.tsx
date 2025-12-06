import React, { useState, useMemo } from 'react';
import { User, Goal } from '../../types';
import BrainstormModal from '../BrainstormModal';
import ConfirmDialog from '../common/ConfirmDialog';
import { GoalSuggestion } from '../../services/geminiService';
import AlertDialog from '../common/AlertDialog';
import GoalListItem from '../setup/GoalListItem';
import TeamStatusList from '../setup/TeamStatusList';
import { validatePersonalSetup, validateGroupSetup } from '../../utils/validation';
import { applySuggestionsToGoals, replaceGoalWithSuggestion } from '../../utils/goalHelpers';
import BaseModal from '../common/BaseModal';
import { Input, Button } from '../common/FormElements';
import { useGame } from '../../contexts/GameContext';

interface SetupViewProps {
  onSelectGoal: (goal: Goal) => void;
}

const SetupView: React.FC<SetupViewProps> = ({ onSelectGoal }) => {
  // Access global state from Context
  const {
    gameState,
    currentUser,
    saveAndSync,
    updateGameStateLocal,
    startGame,
    resetGame,
    isValidating,
  } = useGame();

  const [brainstormUser, setBrainstormUser] = useState<User | null>(null);
  const [brainstormPenalty, setBrainstormPenalty] = useState<{
    type: 'individual' | 'group';
    user?: User;
  } | null>(null);
  const [showStartConfirm, setShowStartConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [pendingReplacements, setPendingReplacements] = useState<GoalSuggestion[]>([]);

  if (!gameState || !currentUser) return null; // Safe guard

  const allReady = gameState.users.length > 0 && gameState.users.every((u) => u.isReady);
  // Memoize goals by userId for O(1) lookup instead of O(n) filter each render
  const goalsByUser = useMemo(() => {
    const map = new Map<string, Goal[]>();
    gameState.goals.forEach((g) => {
      if (!map.has(g.userId)) map.set(g.userId, []);
      map.get(g.userId)!.push(g);
    });
    return map;
  }, [gameState.goals]);
  const myGoals = goalsByUser.get(currentUser.id) || [];
  const isSolo = gameState.config.totalPlayers === 1;

  const handleToggleReady = () => {
    if (!currentUser.isReady) {
      const error = validatePersonalSetup(currentUser, myGoals);
      if (error) {
        setValidationError(error);
        return;
      }
    }
    const updatedUser = { ...currentUser, isReady: !currentUser.isReady };
    saveAndSync({
      ...gameState,
      users: gameState.users.map((u) => (u.id === currentUser.id ? updatedUser : u)),
    });
  };

  const persistUserGoals = (goalsForUser: Goal[]) => {
    const updatedMap = new Map(goalsForUser.map((g) => [g.id, g]));
    const newGoals = gameState.goals.map((g) => updatedMap.get(g.id) || g);
    const updatedGameState = { ...gameState, goals: newGoals };
    updateGameStateLocal(updatedGameState);
    saveAndSync(updatedGameState);
  };

  const handleApplyGoals = (suggestions: GoalSuggestion[]) => {
    const userGoals = goalsByUser.get(currentUser.id) || [];
    const { updatedGoals, pending } = applySuggestionsToGoals(
      userGoals,
      suggestions,
      gameState.config
    );

    const hasChanges = updatedGoals.some((goal, index) => goal !== userGoals[index]);
    if (hasChanges) {
      persistUserGoals(updatedGoals);
    }

    if (pending.length > 0) {
      setPendingReplacements(pending);
    }
  };

  const handleApplyPenalty = (penalty: string) => {
    if (brainstormPenalty?.type === 'group') {
      updateGameStateLocal({
        ...gameState,
        config: { ...gameState.config, groupPenalty: penalty },
      });
    } else if (brainstormPenalty?.user) {
      const u = brainstormPenalty.user;
      updateGameStateLocal({
        ...gameState,
        users: gameState.users.map((us) =>
          us.id === u.id ? { ...us, individualPenalty: penalty } : us
        ),
      });
    }
  };

  const handleStartGameClick = () => {
    const error = validateGroupSetup(gameState.config);
    if (error) {
      setValidationError(error);
      return;
    }
    setShowStartConfirm(true);
  };

  const confirmStartGame = () => {
    startGame();
    setShowStartConfirm(false);
  };

  const confirmResetGame = () => {
    resetGame();
    setShowResetConfirm(false);
  };

  const activeReplacement = pendingReplacements[0] || null;

  const handleReplaceGoal = (goalIndex: number) => {
    if (!activeReplacement) return;
    const userGoals = goalsByUser.get(currentUser.id) || [];
    const nextGoals = replaceGoalWithSuggestion(
      userGoals,
      goalIndex,
      activeReplacement,
      gameState.config
    );
    persistUserGoals(nextGoals);
    setPendingReplacements((queue) => queue.slice(1));
  };

  const handleSkipReplacement = () => {
    setPendingReplacements((queue) => queue.slice(1));
  };

  const getStartConfirmMessage = () => {
    const currentCount = gameState.users.length;
    const expectedCount = gameState.config.totalPlayers;
    let msg =
      '確定要鎖定所有目標並開始遊戲嗎？\n\n開始後將無法新增成員或修改目標內容。\n系統將隨機產生九宮格配置。';
    if (currentCount !== expectedCount) {
      msg = `⚠️ 注意：設定為 ${expectedCount} 人，目前僅有 ${currentCount} 位成員。\n\n如果繼續，九宮格將會出現缺漏，\n您確定要強制開始嗎？`;
    }
    return msg;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-20">
      <div className="text-center space-y-6">
        <h2 className="text-3xl font-black text-brand-petrol dark:text-brand-mint tracking-tight">
          {gameState.config.year} <span className="text-brand-teal">PLANNING</span>
        </h2>
        <TeamStatusList users={gameState.users} totalPlayers={gameState.config.totalPlayers} />
      </div>

      <div className={`grid gap-8 ${isSolo ? 'max-w-xl mx-auto' : 'md:grid-cols-2'}`}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-brand-petrol dark:text-brand-mint flex items-center gap-2">
              <span className="material-symbols-outlined text-[24px] text-brand-teal">person</span>{' '}
              我的設定
            </h3>
            <button
              onClick={() => setBrainstormUser(currentUser)}
              className="text-xs bg-brand-purple/15 text-brand-purple dark:text-purple-200 border border-brand-purple/30 px-3 py-1.5 rounded-full transition-colors font-bold flex items-center gap-1 shadow-sm"
            >
              <span className="material-symbols-outlined text-[12px]">auto_awesome</span> AI 靈感
            </button>
          </div>

          <div className="space-y-3">
            {myGoals.map((goal, i) => (
              <GoalListItem
                key={goal.id}
                goal={goal}
                index={i}
                onClick={() => onSelectGoal(goal)}
              />
            ))}
          </div>

          <div className="bg-white dark:bg-[rgb(var(--brand-surface))] p-5 rounded-2xl border border-brand-teal/20 shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <label className="text-sm font-bold text-brand-teal">個人懲罰 (若未達成)</label>
              <button
                onClick={() =>
                  setBrainstormPenalty({
                    type: 'individual',
                    user: currentUser,
                  })
                }
                className="text-xs text-brand-purple bg-brand-purple/15 px-2 py-1 rounded border border-brand-purple/30 flex items-center gap-1 shadow-sm font-bold"
              >
                <span className="material-symbols-outlined text-[12px]">lightbulb</span> 發想
              </button>
            </div>
            <Input
              value={currentUser.individualPenalty || ''}
              onChange={(e) => {
                const updatedUser = {
                  ...currentUser,
                  individualPenalty: e.target.value,
                };
                updateGameStateLocal({
                  ...gameState,
                  users: gameState.users.map((u) => (u.id === currentUser.id ? updatedUser : u)),
                });
              }}
              placeholder="例如：請大家喝星巴克..."
              className="font-bold"
            />
          </div>

          <button
            onClick={handleToggleReady}
            disabled={isValidating}
            className={`w-full py-4 rounded-2xl font-bold text-white transition-colors shadow flex items-center justify-center gap-2
                    ${currentUser.isReady ? 'bg-brand-teal' : 'bg-brand-petrol'}
                    ${isValidating ? 'opacity-70 cursor-not-allowed' : ''}
                `}
          >
            {isValidating ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                同步中...
              </>
            ) : currentUser.isReady ? (
              <>
                <span className="material-symbols-outlined text-[20px]">check_circle</span>{' '}
                已準備完成 (取消)
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[20px]">rocket_launch</span>{' '}
                我設定好了！
              </>
            )}
          </button>

          {isSolo && allReady && (
            <div className="pt-6 border-t border-brand-teal/10 animate-fade-in">
              <button
                onClick={handleStartGameClick}
                className="w-full py-4 bg-gradient-to-r from-brand-petrol to-brand-teal text-white font-black text-xl rounded-2xl shadow transition-shadow flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[20px]">lock</span>{' '}
                鎖定目標，開始個人挑戰！
              </button>
              <p className="text-center text-xs text-brand-teal mt-3">
                按下後將鎖定目標並進入執行期
              </p>
            </div>
          )}
        </div>

        {!isSolo && (
          <div
            className={`space-y-6 transition-opacity duration-300 ${
              allReady ? 'opacity-100' : 'opacity-50 pointer-events-none'
            }`}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-brand-petrol dark:text-brand-mint flex items-center gap-2">
                <span className="material-symbols-outlined text-[24px] text-brand-teal">group</span>{' '}
                團體設定
              </h3>
              {!allReady && (
                <span className="text-xs text-brand-rust font-bold bg-brand-rust/10 px-2 py-1 rounded">
                  等待全員 Ready 解鎖
                </span>
              )}
            </div>

            <div className="bg-white dark:bg-[rgb(var(--brand-surface))] p-6 rounded-2xl shadow-sm border border-brand-teal/20 space-y-5">
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-bold text-brand-teal">團體懲罰 (全員未達標)</label>
                  <button
                    onClick={() => setBrainstormPenalty({ type: 'group' })}
                    className="text-xs text-brand-purple bg-brand-purple/15 px-2 py-1 rounded border border-brand-purple/30 flex items-center gap-1 shadow-sm font-bold"
                  >
                    <span className="material-symbols-outlined text-[12px]">lightbulb</span> 發想
                  </button>
                </div>
                <Input
                  value={gameState.config.groupPenalty}
                  placeholder="輸入團體懲罰..."
                  onChange={(e) =>
                    updateGameStateLocal({
                      ...gameState,
                      config: {
                        ...gameState.config,
                        groupPenalty: e.target.value,
                      },
                    })
                  }
                  className="font-bold"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-brand-teal block mb-2">
                    連線目標 (條)
                  </label>
                  <Input
                    type="number"
                    value={gameState.config.minLinesForSafe}
                    onChange={(e) =>
                      updateGameStateLocal({
                        ...gameState,
                        config: {
                          ...gameState.config,
                          minLinesForSafe: parseInt(e.target.value),
                        },
                      })
                    }
                    className="text-center font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-brand-teal block mb-2">團體總分</label>
                  <Input
                    type="number"
                    step="10"
                    value={gameState.config.groupTargetScore}
                    onChange={(e) =>
                      updateGameStateLocal({
                        ...gameState,
                        config: {
                          ...gameState.config,
                          groupTargetScore: parseFloat(e.target.value),
                        },
                      })
                    }
                    className="text-center font-bold"
                  />
                </div>
              </div>
            </div>

            {allReady && (
              <div className="pt-6 border-t border-brand-teal/10">
                <button
                  onClick={handleStartGameClick}
                  className="w-full py-4 bg-gradient-to-r from-brand-petrol to-brand-teal text-white font-black text-xl rounded-2xl shadow transition-shadow flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[20px]">lock</span>{' '}
                  鎖定目標，開始遊戲！
                </button>
                <p className="text-center text-xs text-brand-teal mt-3">
                  按下後將隨機打亂九宮格並進入執行期
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-12 pt-8 border-t-2 border-dashed border-brand-teal/20">
        <div className="flex justify-between items-center bg-brand-rust/5 p-4 rounded-xl border border-brand-rust/10">
          <div>
            <h4 className="font-bold text-brand-rust flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">refresh</span> 重置隊伍
            </h4>
            <p className="text-xs text-brand-rust/70 mt-1">
              此動作將清除所有成員與目標，讓隊伍重新加入。
            </p>
          </div>
          <button
            onClick={() => setShowResetConfirm(true)}
            className="px-4 py-2 bg-white dark:bg-[rgb(var(--brand-dark))] border border-brand-rust/30 text-brand-rust font-bold rounded-xl transition-colors text-sm"
          >
            重置設定
          </button>
        </div>
      </div>

      <BrainstormModal
        isOpen={!!brainstormUser}
        onClose={() => setBrainstormUser(null)}
        targetName={brainstormUser?.name || ''}
        mode="goal"
        maxSelectable={myGoals.length}
        onApplyGoal={handleApplyGoals}
      />
      <BrainstormModal
        isOpen={!!brainstormPenalty}
        onClose={() => setBrainstormPenalty(null)}
        targetName={brainstormPenalty?.user?.name || '團體'}
        mode="penalty"
        onApplyPenalty={handleApplyPenalty}
      />

      <ConfirmDialog
        isOpen={showStartConfirm}
        title={
          gameState.users.length !== gameState.config.totalPlayers ? (
            <span className="flex items-center justify-center gap-2 text-brand-rust">
              <span className="material-symbols-outlined">warning</span> 強制開始遊戲
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2 text-brand-petrol dark:text-brand-mint">
              <span className="material-symbols-outlined">rocket_launch</span> 開始遊戲
            </span>
          )
        }
        message={getStartConfirmMessage()}
        confirmText="確定開始"
        isDestructive={gameState.users.length !== gameState.config.totalPlayers}
        onConfirm={confirmStartGame}
        onCancel={() => setShowStartConfirm(false)}
      />

      <ConfirmDialog
        isOpen={showResetConfirm}
        title={
          <span className="flex items-center justify-center gap-2 text-brand-rust">
            <span className="material-symbols-outlined">warning</span> 確定重置隊伍？
          </span>
        }
        message={
          '這將會：\n1. 清除所有已加入的成員\n2. 清除所有已設定的目標\n3. 讓其他人必須重新加入遊戲\n\n此動作無法復原！'
        }
        confirmText="確定重置"
        cancelText="取消"
        isDestructive={true}
        onConfirm={confirmResetGame}
        onCancel={() => setShowResetConfirm(false)}
      />

      <AlertDialog
        isOpen={!!validationError}
        title={
          <span className="flex items-center justify-center gap-2 text-brand-rust">
            <span className="material-symbols-outlined">error</span> 設定尚未完成
          </span>
        }
        message={validationError || ''}
        onClose={() => setValidationError(null)}
      />

      <BaseModal
        isOpen={pendingReplacements.length > 0 && !!activeReplacement}
        onClose={handleSkipReplacement}
        title={
          <span className="flex items-center gap-2 text-brand-petrol dark:text-brand-mint">
            <span className="material-symbols-outlined">sync_alt</span> 選擇要替換的目標
          </span>
        }
        maxWidth="lg"
        className="pt-0"
      >
        {activeReplacement && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-[rgb(var(--brand-surface))] border border-brand-teal/20 rounded-2xl p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-accent tracking-wider uppercase">
                    AI 建議
                  </div>
                  <div className="text-lg font-black text-brand-petrol dark:text-brand-mint mt-1">
                    {activeReplacement.title}
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-1 rounded bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300">
                  {activeReplacement.type === 'habit' ? '規律型' : '階段型'}
                </span>
              </div>
              <p className="text-sm text-brand-petrol/80 dark:text-brand-mint/80 mt-3 whitespace-pre-wrap leading-relaxed">
                {activeReplacement.description}
              </p>
              <div className="text-[11px] text-brand-purple mt-3 font-mono">
                計分：{activeReplacement.breakdown}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-bold text-brand-petrol dark:text-brand-mint mb-2">
                選擇要替換的目標
              </h4>
              <div className="space-y-2">
                {myGoals.map((goal, index) => (
                  <button
                    key={goal.id}
                    onClick={() => handleReplaceGoal(index)}
                    className="w-full text-left p-3 rounded-xl border border-brand-mint/30 dark:border-brand-teal/30 bg-white dark:bg-[rgb(var(--brand-surface))] hover:border-accent hover:bg-accent/10 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-bold text-brand-petrol dark:text-brand-mint">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-brand-mint/60 dark:bg-black/30 text-xs font-black">
                          {index + 1}
                        </span>
                        <span>{goal.title || `目標 ${index + 1}`}</span>
                      </div>
                      <span className="text-xs text-brand-petrol/60 dark:text-brand-mint/60">
                        點擊以取代
                      </span>
                    </div>
                    {goal.description && (
                      <div className="text-[11px] text-brand-petrol/70 dark:text-brand-mint/70 mt-1 line-clamp-2">
                        {goal.description}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <Button variant="secondary" onClick={handleSkipReplacement} className="text-xs">
                跳過此靈感
              </Button>
            </div>
          </div>
        )}
      </BaseModal>
    </div>
  );
};

export default SetupView;
