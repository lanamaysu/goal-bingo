
import { useState, useEffect, useMemo, useCallback } from 'react';
import useSWR, { mutate } from 'swr';
import { GameState, Goal, User, GameConfig } from '../types';
import { loadFromSheet, saveToSheet, fetchAvailableYears } from '../services/googleSheetSync';
import { DEFAULT_CONFIG } from '../utils/constants';

// --- Fetchers ---
const fetchGameState = async ([url, year]: [string, string]) => {
  if (!url || !year) return null;
  const data = await loadFromSheet(url, year);
  return data;
};

const fetchYears = async (url: string) => {
    if (!url) return [];
    const years = await fetchAvailableYears(url);
    return years.sort().reverse();
};

// --- Initial State Helper ---
const createNewState = (year: string): GameState => ({
  phase: 'setup',
  users: [],
  goals: [],
  gridMapping: [],
  config: { year, ...DEFAULT_CONFIG }
});

export const useBingoGame = () => {
  // Persistence
  const [sheetUrl, setSheetUrl] = useState<string>(() => localStorage.getItem('bingoGlobalSheetUrl') || '');
  const [currentUserId, setCurrentUserId] = useState<string>(() => localStorage.getItem('bingoUserId') || '');
  const [activeYear, setActiveYear] = useState<string>(new Date().getFullYear().toString());
  const [errorMsg, setErrorMsg] = useState('');

  // --- SWR Hooks ---
  
  // 1. Fetch Available Years
  const { data: availableYears = [] } = useSWR(
      sheetUrl ? ['availableYears', sheetUrl] : null,
      ([_, url]) => fetchYears(url),
      {
          revalidateOnFocus: true,
          dedupingInterval: 60000, // Check for new years less frequently
      }
  );

  // Auto-switch year logic (Effect based on availableYears change)
  useEffect(() => {
      if (availableYears.length > 0 && !availableYears.includes(activeYear)) {
           // If current active year doesn't exist, but we found years, switch to the latest one
           // Only do this if we haven't manually created a new year (which would handle its own state)
           setActiveYear(availableYears[0]);
      }
  }, [availableYears]); // Remove activeYear dependency to prevent loops

  // 2. Fetch Game State (The Core Logic)
  const swrKey = sheetUrl && activeYear ? [sheetUrl, activeYear] : null;
  
  const { 
      data: serverGameState, 
      error: fetchError, 
      isLoading: isInitialLoading, 
      isValidating,
      mutate: mutateGameState 
  } = useSWR(
      swrKey, 
      fetchGameState,
      {
          revalidateOnFocus: true, // This enables the background update
          keepPreviousData: false, // Set to false to force loading state on year switch
          refreshInterval: 0, // Don't poll automatically unless needed, save quota
          onError: (err) => {
              console.error(err);
              setErrorMsg("無法連接雲端，請檢查網址或網路。");
          }
      }
  );

  // --- Derived State ---
  
  const gameState = useMemo(() => {
      // 1. If we have actual server data, use it.
      if (serverGameState) return serverGameState;
      
      // 2. If we are loading (initial or switching keys), return null to trigger global loader.
      if (isInitialLoading) return null;

      // 3. If not loading and no data (server returned null/404), return empty state.
      // This implies "Create New Game" mode for a year that doesn't exist yet.
      return createNewState(activeYear);
  }, [serverGameState, activeYear, isInitialLoading]);

  const currentUser = useMemo(() => gameState?.users.find(u => u.id === currentUserId) || null, [gameState, currentUserId]);

  // --- Actions ---

  const setUrl = (url: string) => {
    setSheetUrl(url);
    localStorage.setItem('bingoGlobalSheetUrl', url);
  };

  // Generic Save Function (Optimistic UI Update + Server Merge Handling)
  const saveAndSync = useCallback(async (newState: GameState) => {
      if (!sheetUrl) return;
      
      // 1. Optimistic Update: Update the local cache immediately so user sees their change
      await mutateGameState(newState, false);
      
      try {
        // 2. Send to Server & Get Merged Result
        // The backend now performs a merge based on 'lastUpdated' timestamps
        const mergedState = await saveToSheet(sheetUrl, newState);
        
        // 3. Update Local Cache with Merged State
        // This ensures if someone else updated Goal B while we updated Goal A,
        // we now see Goal B's update instead of overwriting it with our old cache.
        if (mergedState) {
            mutateGameState(mergedState, false);
        } else {
            // Fallback just in case
            mutateGameState(); 
        }
        
        // Refresh years list if we just created a new year
        mutate(['availableYears', sheetUrl]);
        
      } catch (e) {
        console.error("Sync failed", e);
        setErrorMsg("同步失敗，請檢查網路連線");
        // Force re-fetch to restore valid state from server (undo optimistic update)
        mutateGameState(); 
      }
  }, [sheetUrl, mutateGameState]);

  // Local Update (Just updates the cache, doesn't push to server immediately)
  const updateGameStateLocal = useCallback((newState: GameState) => {
      mutateGameState(newState, false);
  }, [mutateGameState]);

  const initializeConfig = (config: GameConfig) => {
      const newState: GameState = {
          phase: 'setup',
          users: [],
          goals: [],
          gridMapping: [],
          config: config
      };
      
      if (config.year !== activeYear) {
          setActiveYear(config.year);
      }
      saveAndSync(newState);
  };

  const registerUser = async (name: string, colorId: number): Promise<boolean> => {
    if (!name.trim()) return false;
    setErrorMsg('');
    
    // Identity Recovery
    const existingUser = gameState?.users.find(u => u.name === name);
    if (existingUser) {
        setCurrentUserId(existingUser.id);
        localStorage.setItem('bingoUserId', existingUser.id);
        
        // Update color if different (e.g. re-registering for new year or just changing)
        if (existingUser.colorId !== colorId) {
             const updatedUser = { ...existingUser, colorId };
             const newUsers = gameState.users.map(u => u.id === existingUser.id ? updatedUser : u);
             const newState = { ...gameState, users: newUsers };
             await saveAndSync(newState);
        }
        return true; 
    }

    // Validate Team Size
    if (gameState && gameState.config.totalPlayers > 0 && gameState.users.length >= gameState.config.totalPlayers) {
        setErrorMsg(`隊伍已滿員 (${gameState.users.length}/${gameState.config.totalPlayers})，無法加入。`);
        return false;
    }
    
    // Create New User
    if (!gameState) return false;

    const newUserId = `u_${Date.now()}`;
    
    const newUser: User = {
      id: newUserId,
      name,
      colorId: colorId, 
      individualPenalty: '',
      isReady: false
    };

    const goalsCount = gameState.config.goalsPerUser || 3;
    const newGoals: Goal[] = Array.from({ length: goalsCount }).map((_, i) => ({
      id: Date.now() + i,
      userId: newUserId,
      title: '', 
      description: '',
      targetScore: 100,
      currentScore: 0,
      logs: [],
      lastUpdated: Date.now()
    }));

    const newState = {
      ...gameState,
      users: [...gameState.users, newUser],
      goals: [...gameState.goals, ...newGoals]
    };

    setCurrentUserId(newUserId);
    localStorage.setItem('bingoUserId', newUserId);
    await saveAndSync(newState);
    return true;
  };

  const createNewYear = (year: string) => {
    setActiveYear(year);
  };

  const updateGoal = (updatedGoal: Goal) => {
    if (!gameState) return;
    const newState = {
      ...gameState,
      goals: gameState.goals.map(g => g.id === updatedGoal.id ? updatedGoal : g)
    };
    saveAndSync(newState);
  };

  const updateGoalLocal = (updatedGoal: Goal) => {
    if (!gameState) return;
    const newState = {
      ...gameState,
      goals: gameState.goals.map(g => g.id === updatedGoal.id ? updatedGoal : g)
    };
    updateGameStateLocal(newState);
  };

  const startGame = () => {
    if (!gameState) return;
    const gridSize = gameState.config.gridSize;
    const gridCells = gridSize * gridSize;
    const allGoalIds = gameState.goals.map(g => g.id);
    const shuffled = [...allGoalIds].sort(() => Math.random() - 0.5).slice(0, gridCells);
    
    saveAndSync({
      ...gameState,
      gridMapping: shuffled,
      phase: 'active'
    });
  };

  const resetGame = async () => {
      if (!gameState) return;
      const resetState: GameState = {
          phase: 'setup',
          users: [],
          goals: [],
          gridMapping: [],
          config: { 
            ...DEFAULT_CONFIG, 
            year: gameState.config.year 
          }
      };
      await saveAndSync(resetState);
      
      setCurrentUserId('');
      localStorage.removeItem('bingoUserId');
  };

  return {
    sheetUrl,
    activeYear,
    availableYears,
    gameState,
    currentUser,
    isLoading: isInitialLoading, // Will be true when switching keys now
    isValidating, 
    isSaving: isValidating, 
    errorMsg,
    setActiveYear,
    setUrl,
    saveAndSync,
    updateGameStateLocal,
    fetchCloudState: () => mutateGameState(), 
    initializeConfig,
    registerUser,
    createNewYear,
    updateGoal,
    updateGoalLocal,
    startGame,
    resetGame,
    initNewGame: (url: string) => {
        setUrl(url);
    }
  };
};
