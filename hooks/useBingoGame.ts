import { useState, useEffect, useMemo, useCallback } from 'react';
import useSWR, { mutate } from 'swr';
import { v4 as uuidv4 } from 'uuid';
import { GameState, Goal, User, GameConfig } from '../types';
import { loadFromSheet, saveToSheet, fetchAvailableYears } from '../services/googleSheetSync';
import { DEFAULT_CONFIG } from '../utils/constants';
import { isValidGasUrl } from '../utils/urlSecurity';
import storage from '../utils/storage';

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

const createNewState = (year: string): GameState => ({
  phase: 'setup',
  users: [],
  goals: [],
  gridMapping: [],
  config: { year, ...DEFAULT_CONFIG },
});

export const useBingoGame = () => {
  const [sheetUrl, setSheetUrlState] = useState<string>(() => {
    return storage.getSheetUrl() || '';
  });
  const [currentUserId, setCurrentUserId] = useState<string>(() => storage.getUserId() || '');
  const [activeYear, setActiveYear] = useState<string>(new Date().getFullYear().toString());
  const [errorMsg, setErrorMsg] = useState('');

  const [lastFailedState, setLastFailedState] = useState<GameState | null>(null);
  const [lastSyncError, setLastSyncError] = useState<Error | null>(null);

  const { data: availableYears = [] } = useSWR(
    sheetUrl ? ['availableYears', sheetUrl] : null,
    ([_, url]) => fetchYears(url),
    {
      revalidateOnFocus: true,
      dedupingInterval: 60000,
    }
  );

  const swrKey = sheetUrl && activeYear ? [sheetUrl, activeYear] : null;

  const {
    data: serverGameState,
    error: fetchError,
    isLoading: isInitialLoading,
    isValidating,
    mutate: mutateGameState,
  } = useSWR(swrKey, fetchGameState, {
    revalidateOnFocus: false,
    keepPreviousData: true,
    refreshInterval: 0,
    dedupingInterval: 120000,
    onError: (err) => {
      console.error(err);
      setErrorMsg('無法連接雲端，請檢查網址或網路。');
    },
  });

  useEffect(() => {
    if (isInitialLoading) {
      return;
    }
    if (availableYears.length === 0) {
      return;
    }
    if (!availableYears.includes(activeYear)) {
      console.warn(
        `Active year ${activeYear} not found in available years, switching to ${availableYears[0]}`
      );
      setActiveYear(availableYears[0]);
    }
  }, [availableYears, isInitialLoading]);

  const gameState = useMemo(() => {
    if (serverGameState) return serverGameState;
    if (isInitialLoading) return null;
    return createNewState(activeYear);
  }, [serverGameState, activeYear, isInitialLoading]);

  const currentUser = useMemo(
    () => gameState?.users.find((u) => u.id === currentUserId) || null,
    [gameState, currentUserId]
  );
  const setUrl = (url: string) => {
    if (!isValidGasUrl(url)) {
      throw new Error(
        '無效的 Google Apps Script URL。請確認網址格式為: https://script.google.com/macros/s/[deployment-id]/exec'
      );
    }
    setSheetUrlState(url);
    try {
      // eslint-disable-next-line no-console
      console.log('[useBingoGame] setUrl ->', url);
    } catch (e) {}
    try {
      storage.setSheetUrl(url);
      storage.clearLegacyKeys();
    } catch (e) {
      // ignore storage errors
    }
  };
  const saveAndSync = useCallback(
    async (newState: GameState) => {
      if (!sheetUrl) return;
      const previousState = gameState;
      await mutateGameState(newState, false);

      try {
        const mergedState = await saveToSheet(sheetUrl, newState);

        if (!mergedState || typeof mergedState !== 'object') {
          console.warn('⚠️ Server returned invalid merged state');
          await mutateGameState();
          setErrorMsg('同步異常，已重新載入資料。請重試您的操作。');
          return;
        }

        if (newState.goals && newState.goals.length > 0) {
          if (!mergedState.goals || mergedState.goals.length === 0) {
            console.warn('⚠️ Server returned invalid merged state - missing goals');
            await mutateGameState();
            setErrorMsg('同步異常，已重新載入資料。請重試您的操作。');
            return;
          }

          const originalGoalIds = new Set(newState.goals.map((g) => g.id));
          const mergedGoalIds = new Set(mergedState.goals.map((g) => g.id));
          const lostGoals = Array.from(originalGoalIds).filter((id) => !mergedGoalIds.has(id));

          if (lostGoals.length > 0) {
            console.error('❌ 嚴重：同步時遺失了目標！', lostGoals);
            // 不信任這個合併結果，強制重新載入
            await mutateGameState();
            setErrorMsg('同步失敗：資料遺失，已重新載入。請重試您的操作。');
            return;
          }
        }

        await mutateGameState(mergedState, false);

        mutate(['availableYears', sheetUrl]);
        setErrorMsg('');
      } catch (e) {
        console.error('Sync failed', e);
        const error = e as Error;
        setLastFailedState(newState);
        setLastSyncError(error);
        if (previousState) {
          await mutateGameState(previousState, false);
        } else {
          await mutateGameState();
        }
        if (error.message.includes('Network') || error.message.includes('Failed to fetch')) {
          setErrorMsg('網路連線異常，操作已復原。請檢查網路後重試。');
        } else if (error.message.includes('Server busy')) {
          setErrorMsg('伺服器忙碌中，操作已復原。請稍後重試。');
        } else {
          setErrorMsg('同步失敗，操作已復原。請檢查網路連線或設定後重試。');
        }
      }
    },
    [sheetUrl, gameState, mutateGameState]
  );

  const retrySyncFailed = useCallback(async () => {
    if (!lastFailedState) {
      setErrorMsg('沒有待重試的操作');
      return;
    }
    console.log('🔄 Retrying failed sync...');
    setErrorMsg('');
    setLastSyncError(null);
    await saveAndSync(lastFailedState);
  }, [lastFailedState, saveAndSync]);

  const updateGameStateLocal = useCallback(
    (newState: GameState) => {
      mutateGameState(newState, false);
    },
    [mutateGameState]
  );

  const initializeConfig = (config: GameConfig) => {
    const newState: GameState = {
      phase: 'setup',
      users: [],
      goals: [],
      gridMapping: [],
      config: config,
    };

    if (config.year !== activeYear) {
      setActiveYear(config.year);
    }
    saveAndSync(newState);
  };

  const registerUser = async (name: string, colorId: number): Promise<boolean> => {
    if (!name.trim()) return false;
    if (!gameState) return false;

    setErrorMsg('');

    const existingUser = gameState.users.find((u) => u.name === name);
    if (existingUser) {
      setCurrentUserId(existingUser.id);
      try {
        storage.setUserId(existingUser.id);
      } catch (e) {
        // ignore storage errors
      }

      if (existingUser.colorId !== colorId) {
        const updatedUser = { ...existingUser, colorId };
        const newUsers = gameState.users.map((u) => (u.id === existingUser.id ? updatedUser : u));
        const newState = { ...gameState, users: newUsers };
        await saveAndSync(newState);
      }
      return true;
    }

    if (
      gameState.config.totalPlayers > 0 &&
      gameState.users.length >= gameState.config.totalPlayers
    ) {
      setErrorMsg(
        `隊伍已滿員 (${gameState.users.length}/${gameState.config.totalPlayers})，無法加入。`
      );
      return false;
    }

    const newUserId = `u_${uuidv4()}`;

    const newUser: User = {
      id: newUserId,
      name,
      colorId: colorId,
      individualPenalty: '',
      isReady: false,
    };

    const goalsCount = gameState.config.goalsPerUser || 3;
    const newGoals: Goal[] = Array.from({ length: goalsCount }).map((_, i) => ({
      id: uuidv4(),
      userId: newUserId,
      title: '',
      description: '',
      targetScore: 100,
      currentScore: 0,
      logs: [],
      lastUpdated: Date.now(),
      version: 0,
    }));

    const newState = {
      ...gameState,
      users: [...gameState.users, newUser],
      goals: [...gameState.goals, ...newGoals],
    };

    setCurrentUserId(newUserId);
    try {
      storage.setUserId(newUserId);
    } catch (e) {
      // ignore storage errors
    }
    await saveAndSync(newState);
    return true;
  };

  const createNewYear = (year: string) => {
    setActiveYear(year);
  };

  const updateGoal = (updatedGoal: Goal) => {
    if (!gameState) return;
    const goalWithVersion = {
      ...updatedGoal,
      version: (updatedGoal.version || 0) + 1,
      lastUpdated: Date.now(),
    };
    const newState = {
      ...gameState,
      goals: gameState.goals.map((g) => (g.id === goalWithVersion.id ? goalWithVersion : g)),
    };
    saveAndSync(newState);
  };

  const updateGoalLocal = (updatedGoal: Goal) => {
    if (!gameState) return;
    const goalWithVersion = {
      ...updatedGoal,
      version: (updatedGoal.version || 0) + 1,
      lastUpdated: Date.now(),
    };
    const newState = {
      ...gameState,
      goals: gameState.goals.map((g) => (g.id === goalWithVersion.id ? goalWithVersion : g)),
    };
    updateGameStateLocal(newState);
  };

  const startGame = () => {
    if (!gameState) return;
    const gridSize = gameState.config.gridSize;
    const gridCells = gridSize * gridSize;
    const allGoalIds = gameState.goals.map((g) => g.id);
    const shuffled = [...allGoalIds].sort(() => Math.random() - 0.5).slice(0, gridCells);

    saveAndSync({
      ...gameState,
      gridMapping: shuffled,
      phase: 'grid-review',
    });
  };

  const confirmGridAndStartGame = () => {
    if (!gameState) return;
    saveAndSync({
      ...gameState,
      phase: 'active',
      gridMapping:
        gameState.gridMapping && gameState.gridMapping.length > 0
          ? gameState.gridMapping
          : gameState.goals
              .map((g) => g.id)
              .slice(0, gameState.config.gridSize * gameState.config.gridSize),
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
        year: gameState.config.year,
      },
    };
    await saveAndSync(resetState);

    setCurrentUserId('');
    try {
      storage.removeUserId();
    } catch (e) {
      // ignore storage errors
    }
  };

  const fixMissingGridMapping = async () => {
    if (!gameState) return;
    const gridSize = gameState.config.gridSize;
    const gridCells = gridSize * gridSize;
    const allGoalIds = gameState.goals.map((g) => g.id);
    const shuffled = [...allGoalIds].sort(() => Math.random() - 0.5).slice(0, gridCells);

    const fixedState = {
      ...gameState,
      gridMapping: shuffled,
    };
    await saveAndSync(fixedState);
  };

  return {
    sheetUrl,
    activeYear,
    availableYears,
    gameState,
    currentUser,
    isLoading: isInitialLoading,
    isValidating,
    isSaving: isValidating,
    errorMsg,
    lastSyncError,
    setActiveYear,
    setUrl,
    saveAndSync,
    retrySyncFailed,
    updateGameStateLocal,
    fetchCloudState: () => mutateGameState(),
    initializeConfig,
    registerUser,
    createNewYear,
    updateGoal,
    updateGoalLocal,
    startGame,
    confirmGridAndStartGame,
    resetGame,
    fixMissingGridMapping,
    initNewGame: (url: string) => {
      setUrl(url);
    },
  };
};
