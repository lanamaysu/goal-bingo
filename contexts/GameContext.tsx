
import React, { createContext, useContext, ReactNode } from 'react';
import { useBingoGame } from '../hooks/useBingoGame';

// Infer the return type of the hook to ensure type safety in the context
type GameContextType = ReturnType<typeof useBingoGame>;

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const game = useBingoGame();

  return (
    <GameContext.Provider value={game}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
