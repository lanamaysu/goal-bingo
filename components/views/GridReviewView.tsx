import React, { useState } from 'react';
import { GameState } from '../../types';
import BingoGrid from '../BingoGrid';

interface GridReviewViewProps {
  gameState: GameState;
  onGridChange: (newGridMapping: string[]) => void;
  onConfirm: () => void;
}

const GridReviewView: React.FC<GridReviewViewProps> = ({ gameState, onGridChange, onConfirm }) => {
  const { gridMapping: initialGridMapping } = gameState;
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [localGridMapping, setLocalGridMapping] = useState<string[]>(initialGridMapping);

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer!.dropEffect = 'move';
  };

  const handleDrop = (targetIndex: number) => {
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      return;
    }

    const newMapping = [...localGridMapping];
    [newMapping[draggedIndex], newMapping[targetIndex]] = [
      newMapping[targetIndex],
      newMapping[draggedIndex],
    ];

    setLocalGridMapping(newMapping);
    setDraggedIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleConfirm = () => {
    onGridChange(localGridMapping);
    onConfirm();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in pb-20 flex flex-col items-center">
      <div className="text-center space-y-4 w-full">
        <h2 className="text-3xl font-black text-brand-petrol dark:text-brand-mint tracking-tight">
          <span className="material-symbols-outlined text-[28px] align-middle mr-2">
            auto_awesome
          </span>
          調整九宮格位置
        </h2>
        <p className="text-brand-petrol/70 dark:text-brand-mint/70">
          拖曳卡片調整目標的位置，或點擊「隨機打亂」重新產生
        </p>
      </div>

      {/* BingoGrid with Dragging Support */}
      <div className="mb-8" onDragEnd={handleDragEnd}>
        <BingoGrid
          gameState={{ ...gameState, gridMapping: localGridMapping }}
          onGoalClick={() => {}}
          isDraggable={true}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          draggedIndex={draggedIndex}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 w-full max-w-md">
        <button
          onClick={() => {
            const shuffled = [...localGridMapping].sort(() => Math.random() - 0.5);
            setLocalGridMapping(shuffled);
          }}
          className="flex-1 px-4 py-3 bg-brand-purple/15 text-brand-purple border border-brand-purple/30 font-bold rounded-xl transition-colors hover:bg-brand-purple/25 flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]">shuffle</span>
          隨機打亂
        </button>

        <button
          onClick={handleConfirm}
          className="flex-1 px-4 py-3 bg-gradient-to-r from-brand-petrol to-brand-teal text-white font-black rounded-xl shadow transition-shadow hover:shadow-lg flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          確認開始執行
        </button>
      </div>

      <div className="bg-brand-teal/5 border border-brand-teal/20 rounded-xl p-4 w-full max-w-md">
        <p className="text-sm text-brand-petrol dark:text-brand-mint">
          <span className="font-bold">💡 提示：</span>
          拖曳卡片可以重新排列九宮格的目標位置。您可以多次隨機打亂或手動調整，直到滿意為止。
        </p>
      </div>
    </div>
  );
};

export default GridReviewView;
