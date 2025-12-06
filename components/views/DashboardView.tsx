
import React, { useState } from 'react';
import { Goal } from '../../types';
import BingoGrid from '../BingoGrid';
import { getWinningLines } from '../../utils/constants';
import ConfirmDialog from '../common/ConfirmDialog';
import { getUserTheme } from '../../utils/themeStyles';
import { useGame } from '../../contexts/GameContext';

interface DashboardViewProps {
  onGoalClick: (goal: Goal) => void;
}

const DashboardView: React.FC<DashboardViewProps> = ({ onGoalClick }) => {
  const { gameState, saveAndSync } = useGame();
  
  const [showPreview, setShowPreview] = useState(false);
  const [showConfirmLock, setShowConfirmLock] = useState(false);

  if (!gameState) return null;

  // Generate lines dynamically based on the current config
  const gridSize = gameState.config.gridSize || 3;
  const isSolo = gameState.config.totalPlayers === 1;
  const phase = gameState.phase;
  
  // Only calculate winning lines if NOT solo mode
  const winningLines = isSolo ? [] : getWinningLines(gridSize);

  // Determine winning lines for highlighting
  const activeLines = winningLines.filter(line => line.every(idx => {
      const gId = gameState.gridMapping[idx];
      const g = gameState.goals.find(x => x.id === gId);
      // Fallback for missing goals (safe guard)
      if (!g) return false;
      return g.currentScore >= g.targetScore;
  }));
  
  // --- Settlement Logic ---
  const isSettlementMode = phase === 'review' || phase === 'complete' || showPreview;
  const isLocked = phase === 'complete';

  const groupTotalScore = gameState.goals.reduce((sum, g) => sum + g.currentScore, 0);
  const groupTarget = gameState.config.groupTargetScore;
  const linesCount = activeLines.length;
  const linesTarget = gameState.config.minLinesForSafe || 1;
  
  const isGroupSafe = linesCount >= linesTarget || groupTotalScore >= groupTarget;

  if (isSettlementMode) {
    return (
        <div className="animate-fade-in pb-12 text-center max-w-2xl mx-auto">
            <div className={`mb-6 p-6 rounded-3xl border-4 ${isLocked ? 'border-brand-petrol bg-white dark:bg-brand-surface' : 'border-brand-teal bg-white/60 dark:bg-black/20'}`}>
                <h2 className="text-3xl font-black text-brand-petrol dark:text-brand-mint mb-2 flex items-center justify-center gap-2">
                    {isLocked ? (
                        <>
                            <span className="material-symbols-outlined text-[32px]">emoji_events</span> 最終結算報告
                        </>
                    ) : (
                        <>
                            <span className="material-symbols-outlined text-[32px]">preview</span> 結算預覽
                        </>
                    )}
                </h2>
                <p className="text-brand-teal dark:text-brand-teal/80 mb-6 text-sm">
                    {isLocked ? '本年度挑戰已結束，感謝大家的努力！' : '請確認以下結果，按下「確認結算」後將無法再修改。'}
                </p>
                
                {/* Result Summary (Hidden in Solo Mode) */}
                {!isSolo && (
                    <div className="grid grid-cols-2 gap-4 mb-6 text-left">
                         <div className="bg-white dark:bg-brand-dark p-4 rounded-xl border border-brand-mint/20">
                             <div className="text-xs text-brand-teal font-bold uppercase tracking-wider">連線數</div>
                             <div className={`text-2xl font-black ${linesCount >= linesTarget ? 'text-green-600 dark:text-green-400' : 'text-brand-rust'}`}>
                                 {linesCount} <span className="text-sm text-gray-400 dark:text-gray-500">/ {linesTarget} 條</span>
                             </div>
                         </div>
                         <div className="bg-white dark:bg-brand-dark p-4 rounded-xl border border-brand-mint/20">
                             <div className="text-xs text-brand-teal font-bold uppercase tracking-wider">團體總分</div>
                             <div className={`text-2xl font-black ${groupTotalScore >= groupTarget ? 'text-green-600 dark:text-green-400' : 'text-brand-rust'}`}>
                                 {Math.round(groupTotalScore)} <span className="text-sm text-gray-400 dark:text-gray-500">/ {groupTarget}</span>
                             </div>
                         </div>
                    </div>
                )}

                {/* Punishment Display (Hidden in Solo Mode) */}
                {!isSolo && (
                    <>
                        {!isGroupSafe && (
                            <div className="mb-6 bg-white dark:bg-brand-rust/10 p-5 rounded-xl border border-brand-rust/20 dark:border-brand-rust/30 text-left">
                                <h4 className="font-bold text-brand-rust mb-1 flex items-center gap-2"><span className="material-symbols-outlined">warning</span> 團體懲罰執行</h4>
                                <p className="text-brand-rust font-bold text-lg">{gameState.config.groupPenalty}</p>
                            </div>
                        )}
                        {isGroupSafe && (
                            <div className="mb-6 bg-brand-mint/30 p-5 rounded-xl border border-brand-mint/50 text-left">
                                <h4 className="font-bold text-brand-petrol dark:text-brand-mint mb-1 flex items-center gap-2"><span className="material-symbols-outlined">celebration</span> 恭喜！</h4>
                                <p className="text-brand-petrol dark:text-brand-mint font-bold">達成團體目標，免除團體懲罰！</p>
                            </div>
                        )}
                    </>
                )}
                
                {/* Personal Penalties */}
                <div className="text-left space-y-2">
                    <h4 className="font-bold text-brand-teal ml-1 text-sm uppercase tracking-wider">
                        {isSolo ? '個人結算' : '個人懲罰清單'}
                    </h4>
                    {gameState.users.map(u => {
                        const userGoals = gameState.goals.filter(g => g.userId === u.id);
                        const userTotal = userGoals.reduce((sum, g) => sum + g.currentScore, 0);
                        const isSafe = userTotal >= (gameState.config.individualSafeScore || 100);
                        const theme = getUserTheme(u.colorId);

                        return (
                            <div key={u.id} className={`p-3 rounded-xl border flex justify-between items-center ${isSafe ? 'bg-white/50 dark:bg-brand-dark border-brand-mint/20 opacity-70' : 'bg-white dark:bg-brand-rust/5 border-brand-rust/20'}`}>
                                <div className="flex items-center gap-2">
                                    {!isSolo && <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${theme.badge}`}>{u.name}</span>}
                                    <span className="text-sm font-bold text-brand-petrol dark:text-brand-mint">
                                        {isSolo ? '總分 ' : ''}{Math.round(userTotal)} 分
                                    </span>
                                </div>
                                {isSafe ? (
                                    <span className="text-xs font-bold text-green-600 dark:text-green-400 flex items-center gap-1">Safe <span className="material-symbols-outlined text-[14px]">check_circle</span></span>
                                ) : (
                                    <span className="text-xs font-bold text-brand-rust">{u.individualPenalty}</span>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Grid Visualization (Read Only) */}
            <div className="opacity-80 pointer-events-none scale-90 origin-top">
                <BingoGrid gameState={gameState} onGoalClick={()=>{}} highlightLines={activeLines} />
            </div>

            {/* Actions */}
            {!isLocked && (
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 dark:bg-brand-dark/90 backdrop-blur border-t border-brand-mint/20 flex justify-center gap-4 z-50">
                    <button 
                        onClick={() => setShowPreview(false)} 
                        className="px-6 py-3 bg-white dark:bg-brand-surface border border-brand-teal/30 text-brand-petrol dark:text-brand-mint font-bold rounded-xl hover:bg-brand-mint/20"
                    >
                        返回修改
                    </button>
                    <button 
                        onClick={() => setShowConfirmLock(true)} 
                        className="px-6 py-3 bg-brand-petrol text-white font-bold rounded-xl hover:bg-brand-petrol/90 shadow-lg flex items-center gap-2"
                    >
                        確認並鎖定結算 <span className="material-symbols-outlined text-[18px]">lock</span>
                    </button>
                </div>
            )}
            
            <ConfirmDialog 
                isOpen={showConfirmLock}
                title={<span className="flex items-center justify-center gap-2 text-brand-rust"><span className="material-symbols-outlined">warning</span> 確定鎖定結算？</span>}
                message={"按下確定後，本年度將標記為「已結算」。\n\n所有人將無法再修改進度或目標，\n您確定要繼續嗎？"}
                confirmText="確定鎖定"
                isDestructive={true}
                onConfirm={() => {
                    saveAndSync({...gameState, phase: 'complete'});
                    setShowConfirmLock(false);
                    setShowPreview(false);
                }}
                onCancel={() => setShowConfirmLock(false)}
            />
        </div>
    );
  }

  return (
    <div className="animate-fade-in pb-24 space-y-6">
        <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
                <h2 className="text-3xl font-black text-brand-petrol dark:text-brand-mint flex items-center gap-2">
                    <span className="material-symbols-outlined text-[32px] text-brand-rust">local_fire_department</span> 執行中
                </h2>
                {isSolo && <span className="text-xs bg-brand-mint/30 text-brand-petrol px-2 py-1 rounded-full font-bold">個人挑戰</span>}
            </div>
            <button 
                onClick={() => setShowPreview(true)}
                className="px-4 py-2 bg-brand-mint/20 text-brand-petrol dark:text-brand-mint border border-brand-mint/50 rounded-lg font-bold text-sm hover:bg-brand-mint/40 transition-colors flex items-center gap-1"
            >
                <span className="material-symbols-outlined text-[16px]">visibility</span> 預覽結算
            </button>
        </div>
        
        <div className="py-4">
            <BingoGrid 
                gameState={gameState} 
                onGoalClick={onGoalClick}
                highlightLines={activeLines}
            />
        </div>
        
        {/* Status Box - Only show if there's info to show. In Solo, we might just show Total Score. */}
        <div className="bg-white dark:bg-brand-surface p-4 rounded-xl border border-brand-mint/20 text-sm">
            <h4 className="font-bold text-brand-teal mb-2">當前狀態</h4>
            <div className={`grid ${isSolo ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}>
                {!isSolo && (
                    <div>
                        <span className="block text-xs text-brand-teal/60">目前連線</span>
                        <span className={`font-bold text-lg ${activeLines.length >= (gameState.config.minLinesForSafe||1) ? 'text-green-600 dark:text-green-400' : 'text-brand-petrol dark:text-brand-mint'}`}>
                            {activeLines.length} 條
                        </span>
                    </div>
                )}
                <div>
                   <span className="block text-xs text-brand-teal/60">{isSolo ? '個人總分' : '團體總分'}</span>
                   <span className="font-bold text-lg text-brand-petrol dark:text-brand-mint">
                       {Math.round(gameState.goals.reduce((s,g)=>s+g.currentScore,0))}
                   </span>
                </div>
            </div>
        </div>
    </div>
  );
};

export default DashboardView;
