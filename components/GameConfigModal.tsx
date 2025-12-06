
import React, { useState, useEffect } from 'react';
import { GameConfig } from '../types';
import { DEFAULT_CONFIG } from '../utils/constants';
import BaseModal from './common/BaseModal';
import { Button } from './common/FormElements';

interface GameConfigModalProps {
  year: string;
  onConfirm: (config: GameConfig) => void;
  onCancel?: () => void;
}

const GameConfigModal: React.FC<GameConfigModalProps> = ({ year, onConfirm, onCancel }) => {
  const [totalPlayers, setTotalPlayers] = useState(3);
  const [goalsPerUser, setGoalsPerUser] = useState(3);
  const [activeMonths, setActiveMonths] = useState(11);
  const [error, setError] = useState<string | null>(null);
  const [gridSize, setGridSize] = useState(3);

  useEffect(() => {
    if (totalPlayers === 1) {
        setActiveMonths(12);
    }
  }, [totalPlayers]);

  useEffect(() => {
      const totalGoals = totalPlayers * goalsPerUser;
      
      if (totalPlayers === 1) {
          const calculatedGrid = Math.ceil(Math.sqrt(totalGoals));
          setGridSize(Math.max(calculatedGrid, 1));
          setError(null);
      } else {
          const sqrt = Math.sqrt(totalGoals);
          if (Number.isInteger(sqrt)) {
              setGridSize(sqrt);
              setError(null);
          } else {
              setError(`總目標數 ${totalGoals} (${totalPlayers}人 x ${goalsPerUser}個) 無法排成正方形。`);
          }
      }
  }, [totalPlayers, goalsPerUser]);

  const handleConfirm = () => {
      if (error) return;
      
      const totalPossiblePoints = totalPlayers * goalsPerUser * 100;
      
      const config: GameConfig = {
          ...DEFAULT_CONFIG,
          year: year,
          totalPlayers,
          goalsPerUser,
          activeMonths,
          gridSize,
          groupTargetScore: totalPossiblePoints * 0.6 
      };
      onConfirm(config);
  };

  const calculateWeeks = () => Math.round((activeMonths / 12) * 52);
  const isSolo = totalPlayers === 1;

  return (
    <BaseModal
        isOpen={true}
        onClose={() => {}}
        hideCloseButton={!onCancel}
        title={
            <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-brand-teal">settings</span>
                {year} 遊戲規則設定
            </div>
        }
        footer={
            <div className="flex gap-3 w-full">
                {onCancel && (
                    <Button variant="secondary" onClick={onCancel} className="flex-1">取消</Button>
                )}
                <Button 
                    onClick={handleConfirm}
                    disabled={!!error}
                    className="flex-1"
                >
                    {isSolo ? '開始個人挑戰' : '確認並建立隊伍'}
                </Button>
            </div>
        }
    >
        <div className="text-center mb-6">
            <p className="text-brand-teal dark:text-brand-teal/80 text-sm">
                {isSolo ? '單人自我挑戰模式 (無連線規則)' : '請設定人數、週期與目標，建立完美的 Bingo 方陣。'}
            </p>
        </div>

        <div className="space-y-6">
            <div>
                <label className="block text-sm font-bold text-brand-petrol dark:text-brand-mint mb-2">參加人數</label>
                <div className="flex items-center gap-4 bg-brand-mint/10 dark:bg-black/20 p-3 rounded-xl">
                    <input 
                        type="range" min="1" max="10" step="1"
                        value={totalPlayers} onChange={e => setTotalPlayers(parseInt(e.target.value))}
                        className="flex-1 accent-brand-petrol cursor-pointer"
                    />
                    <span className="font-mono font-bold text-xl w-8 text-center text-brand-petrol dark:text-brand-mint">{totalPlayers}</span>
                </div>
            </div>

            <div>
                <label className="block text-sm font-bold text-brand-petrol dark:text-brand-mint mb-2">每人目標數量</label>
                <div className="flex items-center gap-4 bg-brand-mint/10 dark:bg-black/20 p-3 rounded-xl">
                    <input 
                        type="range" min="1" max={isSolo ? 25 : 9} step="1"
                        value={goalsPerUser} onChange={e => setGoalsPerUser(parseInt(e.target.value))}
                        className="flex-1 accent-brand-petrol cursor-pointer"
                    />
                    <span className="font-mono font-bold text-xl w-8 text-center text-brand-petrol dark:text-brand-mint">{goalsPerUser}</span>
                </div>
            </div>

            <div className={`bg-brand-teal/5 dark:bg-brand-teal/10 p-4 rounded-xl border border-brand-teal/20 transition-opacity ${isSolo ? 'opacity-50' : ''}`}>
                <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-bold text-brand-teal dark:text-brand-mint">有效月份 (計分週期)</label>
                    {isSolo && <span className="text-[10px] bg-brand-teal text-brand-mint px-2 py-0.5 rounded">單人全年度</span>}
                </div>
                
                <div className="flex items-center gap-4 mb-1">
                    <input 
                        type="range" min="1" max="12" step="1"
                        disabled={isSolo}
                        value={activeMonths} onChange={e => setActiveMonths(parseInt(e.target.value))}
                        className="flex-1 accent-brand-teal cursor-pointer"
                    />
                    <span className="font-mono font-bold text-xl w-8 text-center text-brand-teal dark:text-brand-mint">{activeMonths}</span>
                </div>
                {!isSolo && (
                    <div className="text-xs text-brand-petrol/60 dark:text-brand-mint/60 text-right">
                        扣除 {12 - activeMonths} 個休息月，約等於 {calculateWeeks()} 週
                    </div>
                )}
            </div>

            <div className={`p-4 rounded-xl border transition-colors ${error ? 'bg-brand-rust/5 border-brand-rust/20' : 'bg-brand-mint/20 border-brand-mint/30'}`}>
                {error ? (
                    <div className="flex items-start gap-2 text-brand-rust font-bold">
                        <span className="material-symbols-outlined">warning</span>
                        <div className="text-sm">{error}</div>
                    </div>
                ) : (
                    <div className="text-center">
                        <div className="text-brand-petrol dark:text-brand-mint font-bold mb-1 flex items-center justify-center gap-1">
                            <span className="material-symbols-outlined text-[18px]">check_circle</span> 設定完美！
                        </div>
                        <div className="text-xs text-brand-teal">
                            {isSolo ? (
                                <span>個人總計 <span className="font-black text-lg">{goalsPerUser}</span> 個目標</span>
                            ) : (
                                <span>總共 {totalPlayers * goalsPerUser} 個目標，構成 <span className="font-black text-lg">{gridSize} x {gridSize}</span> Bingo 盤面</span>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    </BaseModal>
  );
};

export default GameConfigModal;
