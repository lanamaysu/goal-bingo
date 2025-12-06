import React, { useState, useEffect } from 'react';
import { GameConfig, Goal } from './types';
import GoalModal from './components/GoalModal';
import SyncModal from './components/SyncModal';
import SetupInstructionsModal from './components/SetupInstructionsModal';
import JoinTeamModal from './components/JoinTeamModal';
import GameConfigModal from './components/GameConfigModal';
import AlertDialog from './components/common/AlertDialog';
import FloatingClearButton from './components/common/FloatingClearButton';
import AppHeader from './components/AppHeader';
import { APPS_SCRIPT_TEMPLATE } from './utils/constants';
import storage from './utils/storage';

// Context & Hooks
import { GameProvider, useGame } from './contexts/GameContext';
import { useTheme } from './hooks/useTheme';

// Views
import LandingView from './components/views/LandingView';
import RegisterView from './components/views/RegisterView';
import SetupView from './components/views/SetupView';
import GridReviewView from './components/views/GridReviewView';
import DashboardView from './components/views/DashboardView';
import EmptyYearView from './components/views/EmptyYearView';

// Common
import { PageLoading, Loading } from './components/common/Loading';

// --- Main App Content (Inner Component to consume Context) ---
const AppContent: React.FC = () => {
  const game = useGame();
  const { theme, toggleTheme, appTheme, setAppTheme } = useTheme();

  // UI States (Local UI interactions)
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [isSyncOpen, setIsSyncOpen] = useState(false);
  const [isSetupInstructionsOpen, setIsSetupInstructionsOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isCreatingYear, setIsCreatingYear] = useState(false);
  const [isConfiguring, setIsConfiguring] = useState(false);

  const [newYearInput, setNewYearInput] = useState('');
  const [regName, setRegName] = useState('');
  const [alertConfig, setAlertConfig] = useState<{ isOpen: boolean; msg: string }>({
    isOpen: false,
    msg: '',
  });
  const [isClearStorageOpen, setIsClearStorageOpen] = useState(false);

  const selectedGoal =
    selectedGoalId && game.gameState
      ? game.gameState.goals.find((g) => g.id === selectedGoalId) || null
      : null;

  const showAlert = (msg: string) => {
    setAlertConfig({ isOpen: true, msg });
  };

  const handleClearStorage = () => {
    setIsClearStorageOpen(true);
  };

  const performClearStorage = () => {
    try {
      // Use centralized storage helper to clear v2 and legacy keys
      storage.clearAllKeys();
    } catch (e) {
      console.error('Error clearing storage', e);
    }
    // Reload to reset app state
    window.location.reload();
  };

  // Auto-join & Auto-cleanup Logic
  useEffect(() => {
    // Auto-cleanup: Clear legacy keys on app load
    try {
      storage.clearLegacyKeys();
    } catch (e) {
      console.error('Error clearing legacy keys on load', e);
    }

    const params = new URLSearchParams(window.location.search);
    const syncUrl = params.get('syncUrl');
    if (syncUrl) {
      try {
        const decodedUrl = decodeURIComponent(syncUrl);
        if (decodedUrl.startsWith('https://script.google.com')) {
          // Write to the new v2 storage schema so the app remembers this URL
          storage.initFromUrlParam(decodedUrl);
          game.initNewGame(decodedUrl);
          showAlert('已透過邀請連結加入隊伍！（已儲存至新版設定）');
          window.history.replaceState({}, '', window.location.pathname);
        }
      } catch (e) {
        console.error('Invalid invite link', e);
      }
    }
  }, []);

  const handleCreateTeamUrl = (url: string) => {
    if (url && url.startsWith('https://')) {
      game.initNewGame(url);
      // Immediately open the configuration modal for the new team
      setIsConfiguring(true);
    } else {
      showAlert('網址格式不正確，請確認網址開頭為 https://');
    }
  };

  const handleConfigConfirm = (config: GameConfig) => {
    game.initializeConfig(config);
    setIsConfiguring(false);
  };

  // --- Render Logic (State Based Routing) ---

  // 1. No Sheet Connected -> Landing Page
  if (!game.sheetUrl) {
    return (
      <div
        className="bg-brand-mint/30 dark:bg-[rgb(var(--brand-dark))] min-h-screen text-accent dark:text-accent transition-colors duration-300"
        style={{ minHeight: '100dvh' }}
      >
        <div className="absolute top-4 right-4 z-50">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full bg-white/20 hover:bg-white/40 dark:hover:bg-[rgb(var(--brand-surface))] text-accent dark:text-accent transition-colors flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-[20px]">
              {theme === 'dark' ? 'light_mode' : 'dark_mode'}
            </span>
          </button>
        </div>
        <FloatingClearButton
          isOpen={isClearStorageOpen}
          onOpen={handleClearStorage}
          onConfirm={performClearStorage}
          onCancel={() => setIsClearStorageOpen(false)}
        />
        <LandingView
          onJoinTeam={() => setIsJoinModalOpen(true)}
          onCreateTeam={() => setIsSetupInstructionsOpen(true)}
        />
        <SetupInstructionsModal
          isOpen={isSetupInstructionsOpen}
          onClose={() => setIsSetupInstructionsOpen(false)}
          onConfirm={handleCreateTeamUrl}
          codeTemplate={APPS_SCRIPT_TEMPLATE}
        />
        <JoinTeamModal
          isOpen={isJoinModalOpen}
          onClose={() => setIsJoinModalOpen(false)}
          onConfirm={(url) => game.setUrl(url)}
        />
        <AlertDialog
          isOpen={alertConfig.isOpen}
          message={alertConfig.msg}
          onClose={() => setAlertConfig({ ...alertConfig, isOpen: false })}
        />
      </div>
    );
  }

  // 2. Loading State
  if (game.isLoading && !game.gameState) {
    return (
      <>
        <PageLoading subtitle={`正在讀取 ${game.activeYear} 年度紀錄...`} />
        <FloatingClearButton
          isOpen={isClearStorageOpen}
          onOpen={handleClearStorage}
          onConfirm={performClearStorage}
          onCancel={() => setIsClearStorageOpen(false)}
        />
      </>
    );
  }

  // 3. Connected but uninitialized (New Year)
  if (game.gameState && game.gameState.config.totalPlayers === 0) {
    if (isConfiguring) {
      return (
        <GameConfigModal
          year={game.activeYear}
          onConfirm={handleConfigConfirm}
          onCancel={() => setIsConfiguring(false)}
        />
      );
    }
    return (
      <div
        className="bg-brand-mint/30 dark:bg-[rgb(var(--brand-dark))] min-h-screen transition-colors duration-300"
        style={{ minHeight: '100dvh' }}
      >
        <div className="absolute top-4 right-4 z-50">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full bg-white/20 hover:bg-white/40 dark:hover:bg-[rgb(var(--brand-surface))] text-accent dark:text-accent transition-colors flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-[20px]">
              {theme === 'dark' ? 'light_mode' : 'dark_mode'}
            </span>
          </button>
        </div>
        <FloatingClearButton
          isOpen={isClearStorageOpen}
          onOpen={handleClearStorage}
          onConfirm={performClearStorage}
          onCancel={() => setIsClearStorageOpen(false)}
        />
        <EmptyYearView
          year={game.activeYear}
          onSwitchYear={(y) => game.setActiveYear(y)}
          onInitialize={() => setIsConfiguring(true)}
        />
      </div>
    );
  }

  // Fallback
  if (!game.gameState)
    return (
      <div className="min-h-screen flex items-center justify-center text-accent/60">
        初始化遊戲資料中...
        <FloatingClearButton
          isOpen={isClearStorageOpen}
          onOpen={handleClearStorage}
          onConfirm={performClearStorage}
          onCancel={() => setIsClearStorageOpen(false)}
        />
      </div>
    );

  // 4. Configured but user not registered
  if (!game.currentUser) {
    const isFull = game.gameState.users.length >= game.gameState.config.totalPlayers;
    const isStarted = game.gameState.phase !== 'setup';
    const showRecoveryMode = isFull || isStarted;

    return (
      <div
        className="bg-brand-mint/30 dark:bg-[rgb(var(--brand-dark))] min-h-screen transition-colors duration-300"
        style={{ minHeight: '100dvh' }}
      >
        <div className="absolute top-4 right-4 z-50">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full bg-white/20 hover:bg-white/40 dark:hover:bg-[rgb(var(--brand-surface))] text-accent dark:text-accent transition-colors flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-[20px]">
              {theme === 'dark' ? 'light_mode' : 'dark_mode'}
            </span>
          </button>
        </div>
        <FloatingClearButton
          isOpen={isClearStorageOpen}
          onOpen={handleClearStorage}
          onConfirm={performClearStorage}
          onCancel={() => setIsClearStorageOpen(false)}
        />
        <RegisterView
          year={game.activeYear}
          name={regName}
          isSaving={game.isValidating}
          errorMsg={game.errorMsg}
          isGameFull={showRecoveryMode}
          existingUsers={game.gameState.users}
          onNameChange={setRegName}
          onRegister={async (colorId) => {
            const success = await game.registerUser(regName, colorId);
            if (success) {
              const recovered = game.gameState?.users.find((u) => u.name === regName);
              if (recovered) showAlert(`歡迎回來，${regName}！已恢復您的資料。`);
            }
          }}
        />
      </div>
    );
  }

  // 5. Fully Active (Main Dashboard/Setup)
  return (
    <div
      className="min-h-screen bg-brand-mint/30 dark:bg-[rgb(var(--brand-dark))] pb-20 transition-colors duration-300 text-accent dark:text-accent will-change-contents"
      style={{ minHeight: '100dvh' }}
    >
      {/* Header */}
      <AppHeader
        activeYear={game.activeYear}
        availableYears={game.availableYears}
        onYearChange={game.setActiveYear}
        isValidating={game.isValidating}
        currentUserName={game.currentUser.name}
        isDarkTheme={theme === 'dark'}
        onToggleTheme={toggleTheme}
        onOpenSettings={() => setIsSyncOpen(true)}
        onCreateYear={() => setIsCreatingYear(true)}
      />

      {/* Main Content: NO PROPS NEEDED HERE ANYMORE! */}
      <main className="pt-8 container mx-auto px-4 md:px-6 max-w-5xl">
        {game.gameState && game.gameState.phase === 'setup' ? (
          <SetupView onSelectGoal={(g) => setSelectedGoalId(g.id)} />
        ) : game.gameState && game.gameState.phase === 'grid-review' ? (
          <GridReviewView
            gameState={game.gameState}
            onGridChange={(newMapping) => {
              if (!game.gameState) return;
              game.updateGameStateLocal({
                phase: game.gameState.phase,
                users: game.gameState.users,
                goals: game.gameState.goals,
                gridMapping: newMapping,
                config: game.gameState.config,
              });
            }}
            onConfirm={game.confirmGridAndStartGame}
          />
        ) : game.gameState ? (
          <DashboardView onGoalClick={(g) => setSelectedGoalId(g.id)} />
        ) : null}
      </main>

      {/* Modals */}
      {selectedGoal && game.currentUser && (
        <GoalModal
          goal={selectedGoal}
          isSetupPhase={game.gameState.phase === 'setup'}
          onClose={() => setSelectedGoalId(null)}
        />
      )}

      <SyncModal
        isOpen={isSyncOpen}
        onClose={() => setIsSyncOpen(false)}
        gameState={game.gameState}
        onImport={(s) => game.saveAndSync(s)}
        isDarkTheme={theme === 'dark'}
        onToggleTheme={toggleTheme}
        currentUserName={game.currentUser?.name || ''}
        onUpdateUserName={(name) => {
          if (!game.gameState || !game.currentUser) return;
          const updatedUsers = game.gameState.users.map((u) =>
            u.id === game.currentUser!.id ? { ...u, name } : u
          );
          game.saveAndSync({ ...game.gameState, users: updatedUsers });
        }}
        currentAppTheme={appTheme}
        onUpdateAppTheme={(id) => setAppTheme(id)}
      />

      {isCreatingYear && (
        <div className="fixed inset-0 bg-brand-petrol/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[rgb(var(--brand-surface))] rounded-2xl p-6 shadow-2xl w-full max-w-sm animate-fade-in">
            <h3 className="font-bold text-lg mb-4 text-accent dark:text-accent">開啟新年度</h3>
            <input
              type="number"
              value={newYearInput}
              onChange={(e) => setNewYearInput(e.target.value)}
              className="border-2 border-accent/20 dark:border-accent/20 p-3 rounded-xl w-full mb-6 outline-none focus:border-accent bg-white/50 dark:bg-brand-dark text-accent text-center text-xl font-bold"
              placeholder="YYYY"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsCreatingYear(false)}
                className="px-5 py-2 text-accent font-bold hover:bg-white/30 dark:hover:bg-white/10 rounded-xl transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => {
                  game.createNewYear(newYearInput);
                  setIsCreatingYear(false);
                }}
                className="px-5 py-2 bg-brand-petrol dark:bg-brand-mint text-foreground dark:text-brand-dark rounded-xl font-bold hover:bg-brand-petrol/90 dark:hover:bg-brand-mint/80 shadow-lg"
              >
                建立
              </button>
            </div>
          </div>
        </div>
      )}

      <AlertDialog
        isOpen={alertConfig.isOpen}
        message={alertConfig.msg}
        onClose={() => setAlertConfig({ ...alertConfig, isOpen: false })}
      />
    </div>
  );
};

// Root Component wraps Content in Provider
const App: React.FC = () => {
  return (
    <GameProvider>
      <AppContent />
    </GameProvider>
  );
};

export default App;
