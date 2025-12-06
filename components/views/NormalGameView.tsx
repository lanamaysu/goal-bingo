import React from 'react';
import { Goal, GameState } from '../../types';
import BingoGrid from '../BingoGrid';

interface NormalGameViewProps {
  gameState: GameState;
  onGoalClick: (goal: Goal) => void;
  activeLines: number[][];
  onShowPreview: () => void;
}

const NormalGameView: React.FC<NormalGameViewProps> = ({
  gameState,
  onGoalClick,
  activeLines,
  onShowPreview,
}) => (
  <div className="flex flex-col h-full">
    <BingoGrid gameState={gameState} onGoalClick={onGoalClick} highlightLines={activeLines} />

    <div className="flex-1 flex flex-col items-center justify-center p-6 gap-4">
      <button
        onClick={onShowPreview}
        className="px-6 py-3 bg-brand-petrol text-white font-bold rounded-xl shadow hover:bg-brand-petrol/90"
      >
        查看結算預覽
      </button>
    </div>
  </div>
);

export default NormalGameView;
