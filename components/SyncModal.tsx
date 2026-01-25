import React, { useState, useEffect } from 'react';
import { GameState } from '../types';
import { saveToSheet } from '../services/googleSheetSync';
import BaseModal from './common/BaseModal';
import ConfirmDialog from './common/ConfirmDialog';
import { Input, Button } from './common/FormElements';
import { Loading } from './common/Loading';
import storage from '../utils/storage';
import { APP_THEME_OPTIONS } from '../hooks/useTheme';

interface SyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameState: GameState;
  onImport: (newState: GameState) => void;
  // Mobile: Move theme and name controls into global settings
  isDarkTheme: boolean;
  onToggleTheme: () => void;
  currentUserName: string;
  onUpdateUserName: (name: string) => void;
  // App-wide accent color theme
  currentAppTheme: string;
  onUpdateAppTheme: (id: string) => void;
}

const SyncModal: React.FC<SyncModalProps> = ({
  isOpen,
  onClose,
  gameState,
  onImport,
  isDarkTheme,
  onToggleTheme,
  currentUserName,
  onUpdateUserName,
  currentAppTheme,
  onUpdateAppTheme,
}) => {
  const [sheetUrl, setUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [selectedAppTheme, setSelectedAppTheme] = useState<string>('teal');
  const [initialAppTheme, setInitialAppTheme] = useState<string>('teal');
  const [tempDarkTheme, setTempDarkTheme] = useState<boolean>(isDarkTheme);
  const [initialDarkTheme, setInitialDarkTheme] = useState<boolean>(isDarkTheme);

  const [inviteLink, setInviteLink] = useState('');
  const [syncStatus, setSyncStatus] = useState<{
    type: 'success' | 'error' | 'loading';
    msg: string;
  } | null>(null);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
  const [isFixing, setIsFixing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Clean legacy keys (we no longer parse old storage schema)
      try {
        storage.clearLegacyKeys();
      } catch (e) {
        // ignore
      }

      // Load values from the new storage schema (v2). If not present, prompt user to input.
      const storedSheet = storage.getSheetUrl();

      if (storedSheet) {
        setUrl(storedSheet);
        const baseUrl = window.location.origin + window.location.pathname;
        setInviteLink(`${baseUrl}?syncUrl=${encodeURIComponent(storedSheet)}`);
      } else {
        setUrl('');
        setInviteLink('');
      }

      // Load API Key (v2)
      const key = storage.getApiKey() || '';
      setApiKey(key);

      // Load current display name
      setDisplayName(currentUserName || '');

      // Load app theme
      const theme = currentAppTheme || 'teal';
      setSelectedAppTheme(theme);
      setInitialAppTheme(theme);

      // Track dark theme for rollback
      setTempDarkTheme(isDarkTheme);
      setInitialDarkTheme(isDarkTheme);

      setSyncStatus(null);
    }
  }, [isOpen]);

  const handleManualSync = async () => {
    if (!sheetUrl) return;
    setSyncStatus({ type: 'loading', msg: '同步中...' });
    try {
      const newState = await saveToSheet(sheetUrl, gameState);
      onImport(newState);
      setSyncStatus({ type: 'success', msg: '同步成功！已更新至最新狀態。' });
    } catch (e) {
      setSyncStatus({ type: 'error', msg: '同步失敗：' + e });
    }
  };

  const handleSaveSettings = () => {
    // Save sheet URL (v2 schema)
    try {
      storage.setSheetUrl(sheetUrl);
    } catch (e) {
      // ignore
    }

    // Save API key (v2) via storage helper
    try {
      storage.setApiKey(apiKey);
      storage.clearLegacyKeys();
    } catch (e) {
      // ignore
    }
    // Update display name if changed
    if (displayName && displayName !== currentUserName) {
      onUpdateUserName(displayName);
    }
    // Update app theme if changed
    if (selectedAppTheme && selectedAppTheme !== currentAppTheme) {
      onUpdateAppTheme(selectedAppTheme);
    }
    onClose();
  };

  const handleCancel = () => {
    // Roll back dark theme if changed during modal session
    if (tempDarkTheme !== initialDarkTheme) {
      onToggleTheme();
    }
    // Roll back app theme if changed during modal session
    if (selectedAppTheme !== initialAppTheme) {
      onUpdateAppTheme(initialAppTheme);
    }
    onClose();
  };

  const handleToggleTheme = () => {
    onToggleTheme();
    setTempDarkTheme((prev) => !prev);
  };

  const handleSelectAppTheme = (id: string) => {
    setSelectedAppTheme(id);
    onUpdateAppTheme(id);
  };

  const performClearStorage = () => {
    try {
      storage.clearAllKeys();
    } catch (e) {
      console.error('Error clearing storage', e);
    }
    window.location.reload();
  };

  const handleFixGridMapping = async () => {
    setIsFixing(true);
    try {
      const gridSize = gameState.config.gridSize;
      const gridCells = gridSize * gridSize;
      const allGoalIds = gameState.goals.map((g) => g.id);
      const shuffled = [...allGoalIds].sort(() => Math.random() - 0.5).slice(0, gridCells);

      const fixedState = {
        ...gameState,
        gridMapping: shuffled,
      };

      await saveToSheet(sheetUrl, fixedState);
      onImport(fixedState);
      setSyncStatus({ type: 'success', msg: '✅ 網格已修復並同步！' });
    } catch (e) {
      setSyncStatus({ type: 'error', msg: '修復失敗：' + e });
    } finally {
      setIsFixing(false);
    }
  };

  // Diagnostics
  const hasGridMappingIssue =
    gameState.phase === 'active' &&
    gameState.gridMapping.length === 0 &&
    gameState.goals.length > 0;

  const { config } = gameState;
  const isSolo = config.totalPlayers === 1;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleCancel}
      title={
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined">settings</span>
          全域設定
        </div>
      }
      footer={
        <div className="flex justify-end gap-3 w-full">
          <Button variant="secondary" onClick={handleCancel}>
            取消
          </Button>
          <Button onClick={handleSaveSettings}>儲存設定</Button>
        </div>
      }
    >
      <div className="space-y-8">
        {/* 0. Personal & Appearance Section */}
        <div className="space-y-4">
          <h4 className="font-bold text-accent dark:text-accent text-sm border-b border-accent/20 pb-2 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">person</span>
            外觀與個人
          </h4>

          <div className="space-y-3">
            <Input
              label="顯示名稱"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="輸入你的名稱..."
            />

            <div className="p-3 rounded-xl border border-accent/20 bg-white/50 dark:bg-black/20 flex items-center justify-between">
              <div className="text-xs text-accent font-bold">深色模式</div>
              <Button
                variant="ghost"
                onClick={handleToggleTheme}
                className="px-3 py-1 text-xs h-auto text-accent"
              >
                {tempDarkTheme ? '淺色' : '深色'}
              </Button>
            </div>

            {/* App Theme Selector */}
            <div className="space-y-2">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {APP_THEME_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelectAppTheme(opt.id)}
                    className={`flex items-center gap-2 p-3 rounded-xl border text-xs transition-colors ${selectedAppTheme === opt.id ? 'border-brand-petrol dark:border-brand-mint' : 'border-accent/20'} bg-white/70 dark:bg-black/30`}
                    aria-pressed={selectedAppTheme === opt.id}
                  >
                    <span
                      className="inline-block w-5 h-5 rounded"
                      style={{ backgroundColor: opt.swatch }}
                    />
                    <span className="text-accent">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 1. Sync & Data Section */}
        <div className="space-y-4">
          <h4 className="font-bold text-accent dark:text-accent text-sm border-b border-accent/20 pb-2 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">cloud_sync</span>
            資料同步 (Google 試算表)
          </h4>

          <div className="space-y-2">
            <Input
              label="Google Apps Script 網址"
              value={sheetUrl}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://script.google.com/..."
            />
            <div className="flex justify-between items-center pt-1">
              <button
                type="button"
                onClick={handleManualSync}
                disabled={syncStatus?.type === 'loading' || !sheetUrl}
                className="text-xs text-accent font-bold disabled:opacity-50 flex items-center gap-1"
              >
                {syncStatus?.type === 'loading' ? (
                  <Loading text="同步中..." size="text-[14px]" />
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[14px]">sync</span> 強制手動同步
                  </>
                )}
              </button>
              {syncStatus && syncStatus.type !== 'loading' && (
                <span
                  className={`text-xs ${syncStatus.type === 'success' ? 'text-green-600' : 'text-accent'}`}
                >
                  {syncStatus.msg}
                </span>
              )}
            </div>
          </div>

          {/* Invite Link */}
          {inviteLink && !isSolo && (
            <div className="bg-accent/10 p-3 rounded-xl border border-accent/20 space-y-2">
              <h4 className="font-bold text-accent dark:text-accent text-xs">
                邀請連結 (分享給隊友)
              </h4>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={inviteLink}
                  className="flex-1 text-[10px] p-2 rounded border border-accent/20 text-accent bg-white/50 dark:bg-black/20 outline-none focus:border-accent/40"
                />
                <Button
                  variant="secondary"
                  onClick={() => {
                    navigator.clipboard.writeText(inviteLink);
                    alert('已複製連結！');
                  }}
                  className="px-3 py-1 text-xs h-auto"
                >
                  複製
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* 2. AI Settings Section */}
        <div className="space-y-4">
          <h4 className="font-bold text-accent dark:text-accent text-sm border-b border-accent/20 pb-2 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
            AI 金鑰 (Gemini API)
          </h4>
          <div className="bg-brand-purple/5 dark:bg-brand-purple/10 p-4 rounded-xl text-xs text-accent dark:text-purple-200 border border-brand-purple/10">
            <p className="mb-2">啟用 AI 輔助需要您自己的 API Key。</p>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              className="underline font-bold flex items-center gap-1"
            >
              前往 Google AI Studio 取得免費 Key{' '}
              <span className="material-symbols-outlined text-[12px]">open_in_new</span>
            </a>
          </div>
          <Input
            label="Gemini API Key"
            type={showKey ? 'text' : 'password'}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="AIzaSy..."
            rightElement={
              <button onClick={() => setShowKey(!showKey)} className="transition-colors">
                <span className="material-symbols-outlined text-[20px]">
                  {showKey ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            }
          />
        </div>

        {/* 3. Game Config Info (Read Only) */}
        <div className="pt-4 border-t border-accent/10">
          <div className="text-xs text-accent/60 mb-2 font-bold">目前遊戲參數 (唯讀)</div>
          <div className="grid grid-cols-2 gap-y-1 gap-x-4 text-xs text-accent">
            <div>
              年度: <span className="font-mono text-accent dark:text-accent">{config.year}</span>
            </div>
            <div>
              模式:{' '}
              <span className="text-accent dark:text-accent">
                {isSolo ? '個人' : '團體'} ({config.totalPlayers}人)
              </span>
            </div>
          </div>
        </div>

        {/* 4. Diagnostics Section */}
        <div className="pt-4 border-t border-accent/10">
          <h4 className="font-bold text-accent dark:text-accent text-sm border-b border-accent/20 pb-2 flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-[18px]">medical_services</span>
            資料健康檢查
          </h4>

          <div className="space-y-3">
            {/* GridMapping Check */}
            <div
              className={`p-3 rounded-lg border ${
                hasGridMappingIssue
                  ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-400 dark:border-amber-500'
                  : 'bg-green-50 dark:bg-green-900/10 border-green-400 dark:border-green-500'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`material-symbols-outlined text-[18px] ${
                        hasGridMappingIssue
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-green-600 dark:text-green-400'
                      }`}
                    >
                      {hasGridMappingIssue ? 'warning' : 'check_circle'}
                    </span>
                    <span className="text-sm font-bold text-accent dark:text-accent">九宮格</span>
                  </div>
                  <p className="text-xs text-accent/70 dark:text-accent/60">
                    {hasGridMappingIssue
                      ? `異常：需要 ${gameState.config.gridSize * gameState.config.gridSize} 個目標 ID，目前為空`
                      : `正常：已設定 ${gameState.gridMapping.length} 個目標`}
                  </p>
                </div>
                {hasGridMappingIssue && (
                  <button
                    onClick={handleFixGridMapping}
                    disabled={isFixing}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {isFixing ? '修復中...' : '立即修復'}
                  </button>
                )}
              </div>
            </div>

            {/* Goals Check */}
            <div className="p-3 rounded-lg border bg-blue-50 dark:bg-blue-900/10 border-blue-400 dark:border-blue-500">
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-[18px] text-blue-600 dark:text-blue-400">
                  info
                </span>
                <span className="text-sm font-bold text-accent dark:text-accent">目標清單</span>
              </div>
              <p className="text-xs text-accent/70 dark:text-accent/60">
                共 {gameState.goals.length} 個目標 ({gameState.users.length} 位玩家 ×{' '}
                {gameState.config.goalsPerUser} 個)
              </p>
            </div>

            {/* Manual Sync Button */}
            <button
              onClick={handleManualSync}
              disabled={!sheetUrl || syncStatus?.type === 'loading'}
              className="w-full py-2 bg-brand-teal hover:bg-brand-teal/90 dark:bg-brand-mint dark:hover:bg-brand-mint/80 text-white dark:text-brand-dark font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">sync</span>
              {syncStatus?.type === 'loading' ? '同步中...' : '手動重新同步'}
            </button>

            {syncStatus && (
              <div
                className={`p-3 rounded-lg text-sm ${
                  syncStatus.type === 'success'
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200'
                    : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'
                }`}
              >
                {syncStatus.msg}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Clear storage action (destructive) */}
      <div className="pt-6">
        <div className="p-4 rounded-xl border border-accent/10 bg-white/50 dark:bg-black/20">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs font-bold text-accent">清除本機資料</div>
              <div className="text-[12px] text-accent mt-1">
                此操作會移除所有本機設定與遊戲資料，無法復原。
              </div>
            </div>
            <div>
              <button
                onClick={() => setIsClearConfirmOpen(true)}
                className="px-3 py-2 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700"
              >
                清空本機資料
              </button>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={isClearConfirmOpen}
        title={
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-accent">delete_forever</span>
            確認清除本機資料
          </div>
        }
        message={
          '此操作會刪除本瀏覽器中所有與本 App 有關的本機設定與遊戲資料（包含 sheet/keys/使用者設定）。確定要繼續嗎？'
        }
        confirmText="清除並重整"
        cancelText="取消"
        isDestructive={true}
        onConfirm={() => {
          setIsClearConfirmOpen(false);
          performClearStorage();
        }}
        onCancel={() => setIsClearConfirmOpen(false)}
      />
    </BaseModal>
  );
};

export default SyncModal;
