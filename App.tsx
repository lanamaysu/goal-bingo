
import React, { useState, useEffect } from 'react';
import { GameConfig, Goal } from './types';
import GoalModal from './components/GoalModal';
import SyncModal from './components/SyncModal';
import SetupInstructionsModal from './components/SetupInstructionsModal';
import JoinTeamModal from './components/JoinTeamModal';
import GameConfigModal from './components/GameConfigModal';
import AlertDialog from './components/common/AlertDialog';
import { APPS_SCRIPT_TEMPLATE } from './utils/constants';

// Context & Hooks
import { GameProvider, useGame } from './contexts/GameContext';
import { useTheme } from './hooks/useTheme';

// Views
import LandingView from './components/views/LandingView';
import RegisterView from './components/views/RegisterView';
import SetupView from './components/views/SetupView';
import DashboardView from './components/views/DashboardView';
import EmptyYearView from './components/views/EmptyYearView';

// Common
import { PageLoading, Loading } from './components/common/Loading';

// --- Main App Content (Inner Component to consume Context) ---
const AppContent: React.FC = () => {
  const game = useGame();
  const { theme, toggleTheme } = useTheme();
  
  // UI States (Local UI interactions)
  const [selectedGoalId, setSelectedGoalId] = useState<number | null>(null);
  const [isSyncOpen, setIsSyncOpen] = useState(false);
  const [isSetupInstructionsOpen, setIsSetupInstructionsOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isCreatingYear, setIsCreatingYear] = useState(false);
  const [isConfiguring, setIsConfiguring] = useState(false); 
  
  const [newYearInput, setNewYearInput] = useState('');
  const [regName, setRegName] = useState('');
  const [alertConfig, setAlertConfig] = useState<{isOpen: boolean, msg: string}>({ isOpen: false, msg: '' });

  const selectedGoal = selectedGoalId && game.gameState 
      ? game.gameState.goals.find(g => g.id === selectedGoalId) || null 
      : null;

  const showAlert = (msg: string) => {
      setAlertConfig({ isOpen: true, msg });
  };

  // Auto-Join Logic
  useEffect(() => {
      const params = new URLSearchParams(window.location.search);
      const syncUrl = params.get('syncUrl');
      if (syncUrl) {
          try {
              const decodedUrl = decodeURIComponent(syncUrl);
              if (decodedUrl.startsWith('https://script.google.com')) {
                  game.initNewGame(decodedUrl);
                  showAlert("已透過邀請連結加入隊伍！");
                  window.history.replaceState({}, '', window.location.pathname);
              }
          } catch (e) {
              console.error("Invalid invite link", e);
          }
      }
  }, []);

  const handleCreateTeamUrl = (url: string) => {
    if (url && url.startsWith("https://")) {
        game.initNewGame(url);
    } else {
        showAlert("網址格式不正確，請確認網址開頭為 https://");
    }
  };

  const handleConfigConfirm = (config: GameConfig) => {
      game.initializeConfig(config);
      setIsConfiguring(false);
  };

  // Compute available years
  const yearOptions = Array.from(new Set([...game.availableYears, game.activeYear]))
        .filter(y => y)
        .sort().reverse();

  // --- Render Logic (State Based Routing) ---

  // 1. No Sheet Connected -> Landing Page
  if (!game.sheetUrl) {
    return (
      <div className="bg-brand-mint/30 dark:bg-brand-dark min-h-screen text-brand-petrol dark:text-brand-mint transition-colors duration-300" style={{ minHeight: '100dvh' }}>
         <div className="absolute top-4 right-4 z-50">
            <button onClick={toggleTheme} className="p-2 rounded-full bg-white/20 hover:bg-white/40 dark:hover:bg-brand-surface text-brand-petrol dark:text-brand-mint transition-colors flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">
                    {theme === 'dark' ? 'light_mode' : 'dark_mode'}
                </span>
            </button>
         </div>
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
      return <PageLoading subtitle={`正在讀取 ${game.activeYear} 年度紀錄...`} />;
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
          <div className="bg-brand-mint/30 dark:bg-brand-dark min-h-screen transition-colors duration-300" style={{ minHeight: '100dvh' }}>
             <div className="absolute top-4 right-4 z-50">
                <button onClick={toggleTheme} className="p-2 rounded-full bg-white/20 hover:bg-white/40 dark:hover:bg-brand-surface text-brand-petrol dark:text-brand-mint transition-colors flex items-center justify-center">
                    <span className="material-symbols-outlined text-[20px]">
                        {theme === 'dark' ? 'light_mode' : 'dark_mode'}
                    </span>
                </button>
             </div>
             <EmptyYearView 
                year={game.activeYear}
                onSwitchYear={(y) => game.setActiveYear(y)}
                onInitialize={() => setIsConfiguring(true)}
             />
          </div>
      );
  }

  // Fallback
  if (!game.gameState) return <div className="min-h-screen flex items-center justify-center text-gray-500">初始化遊戲資料中...</div>;
  
  // 4. Configured but user not registered
  if (!game.currentUser) {
      const isFull = game.gameState.users.length >= game.gameState.config.totalPlayers;
      const isStarted = game.gameState.phase !== 'setup';
      const showRecoveryMode = isFull || isStarted;

      return (
        <div className="bg-brand-mint/30 dark:bg-brand-dark min-h-screen transition-colors duration-300" style={{ minHeight: '100dvh' }}>
             <div className="absolute top-4 right-4 z-50">
                <button onClick={toggleTheme} className="p-2 rounded-full bg-white/20 hover:bg-white/40 dark:hover:bg-brand-surface text-brand-petrol dark:text-brand-mint transition-colors flex items-center justify-center">
                    <span className="material-symbols-outlined text-[20px]">
                        {theme === 'dark' ? 'light_mode' : 'dark_mode'}
                    </span>
                </button>
             </div>
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
                        const recovered = game.gameState?.users.find(u => u.name === regName);
                        if (recovered) showAlert(`歡迎回來，${regName}！已恢復您的資料。`);
                    }
                }}
            />
        </div>
      );
  }

  // 5. Fully Active (Main Dashboard/Setup)
  return (
    <div className="min-h-screen bg-brand-mint/30 dark:bg-brand-dark pb-20 transition-colors duration-300 text-brand-petrol dark:text-brand-mint will-change-contents" style={{ minHeight: '100dvh' }}>
      {/* Header */}
            <header className="px-3 sm:px-4 py-2 bg-white/80 dark:bg-brand-surface/90 backdrop-blur-none md:backdrop-blur-md shadow-sm sticky top-0 z-40 border-b border-brand-teal/20 flex items-center justify-between transform-gpu will-change-[transform]">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="bg-brand-petrol text-brand-mint p-1.5 rounded-lg shadow-sm flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">track_changes</span>
            </div>
            <h1 className="text-xl font-black text-brand-petrol dark:text-brand-mint hidden md:block tracking-tight">GOAL BINGO</h1>
            
            <div className="relative group">
                <select 
                  value={game.activeYear} 
                  onChange={(e) => game.setActiveYear(e.target.value)}
                  className="bg-brand-mint/50 dark:bg-brand-dark/50 text-brand-petrol dark:text-brand-mint text-sm font-bold py-1.5 pl-3 pr-8 rounded-lg cursor-pointer outline-none hover:bg-brand-mint dark:hover:bg-brand-dark transition-colors appearance-none"
                >
                  {yearOptions.map(y => (
                      <option key={y} value={y}>{y}</option>
                  ))}
                </select>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-50 flex items-center">
                    <span className="material-symbols-outlined text-[14px]">expand_more</span>
                </div>
            </div>

             <button onClick={() => setIsCreatingYear(true)} className="hidden sm:flex p-1.5 bg-gray-100 dark:bg-white/10 rounded-lg text-gray-500 dark:text-gray-300 hover:bg-brand-mint hover:text-brand-petrol dark:hover:bg-brand-mint/20 transition-all items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">add</span>
             </button>
        </div>
        
        <div className="flex items-center gap-1.5 sm:gap-3 justify-end">
            {game.isValidating ? (
                <div className="hidden sm:flex items-center gap-1.5 text-xs text-brand-rust font-medium bg-brand-rust/10 px-2 py-1 rounded-full">
                    <Loading size="text-[14px]" />
                    <span className="hidden sm:inline">Syncing</span>
                </div>
            ) : (
                 <div className="hidden sm:flex text-brand-teal/50 items-center" title="已同步">
                    <span className="material-symbols-outlined text-[14px]">cloud_done</span>
                 </div>
            )}
            
            {/* Username pill hidden on small screens to save space */}
            <div className={`hidden sm:block text-xs px-3 py-1.5 rounded-full border border-brand-petrol/20 dark:border-brand-mint/20 font-bold bg-white/50 dark:bg-black/20`}>
                {game.currentUser.name}
            </div>
            {/* Compact account icon for mobile */}
            <div className="sm:hidden text-brand-teal/70" title={game.currentUser.name}>
                <span className="material-symbols-outlined text-[20px]">account_circle</span>
            </div>
            
            <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 dark:text-brand-teal transition-colors flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">
                    {theme === 'dark' ? 'light_mode' : 'dark_mode'}
                </span>
            </button>

            <button 
                onClick={() => setIsSyncOpen(true)}
                className="p-2 bg-gray-100 dark:bg-white/10 rounded-lg hover:bg-brand-mint dark:hover:bg-brand-mint/20 text-brand-petrol dark:text-brand-mint transition-colors flex items-center justify-center"
            >
                <span className="material-symbols-outlined text-[20px]">settings</span>
            </button>
        </div>
      </header>

      {/* Main Content: NO PROPS NEEDED HERE ANYMORE! */}
      <main className="pt-8 container mx-auto px-4 md:px-6 max-w-5xl">
        {game.gameState.phase === 'setup' ? (
            <SetupView onSelectGoal={(g) => setSelectedGoalId(g.id)} />
        ) : (
            <DashboardView onGoalClick={(g) => setSelectedGoalId(g.id)} />
        )}
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
      />

      {isCreatingYear && (
          <div className="fixed inset-0 bg-brand-petrol/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-brand-surface rounded-2xl p-6 shadow-2xl w-full max-w-sm animate-fade-in">
                  <h3 className="font-bold text-lg mb-4 text-brand-petrol dark:text-brand-mint">開啟新年度</h3>
                  <input 
                    type="number" 
                    value={newYearInput} 
                    onChange={e => setNewYearInput(e.target.value)} 
                    className="border-2 border-gray-200 dark:border-brand-dark p-3 rounded-xl w-full mb-6 outline-none focus:border-brand-teal bg-gray-50 dark:bg-brand-dark dark:text-brand-mint text-center text-xl font-bold" 
                    placeholder="YYYY" 
                  />
                  <div className="flex justify-end gap-3">
                      <button onClick={()=>setIsCreatingYear(false)} className="px-5 py-2 text-gray-500 dark:text-gray-400 font-bold hover:bg-gray-100 dark:hover:bg-brand-dark rounded-xl">取消</button>
                      <button onClick={() => {
                          game.createNewYear(newYearInput);
                          setIsCreatingYear(false);
                      }} className="px-5 py-2 bg-brand-petrol text-white rounded-xl font-bold hover:bg-brand-petrol/90 shadow-lg">建立</button>
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
}

export default App;
