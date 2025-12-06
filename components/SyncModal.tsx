import React, { useState, useEffect } from 'react';
import { GameState } from '../types';
import { saveToSheet } from '../services/googleSheetSync';
import BaseModal from './common/BaseModal';
import ConfirmDialog from './common/ConfirmDialog';
import { Input, Button } from './common/FormElements';
import { Loading } from './common/Loading';
import { isValidGasUrl } from '../utils/urlSecurity';
import storage from '../utils/storage';

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
  const [geminiProxyUrl, setGeminiProxyUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [selectedAppTheme, setSelectedAppTheme] = useState<string>('teal');

  const [inviteLink, setInviteLink] = useState('');
  const [syncStatus, setSyncStatus] = useState<{
    type: 'success' | 'error' | 'loading';
    msg: string;
  } | null>(null);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);

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
      const storedProxy = storage.getProxyUrl();

      if (storedSheet) {
        setUrl(storedSheet);
        const baseUrl = window.location.origin + window.location.pathname;
        setInviteLink(`${baseUrl}?syncUrl=${encodeURIComponent(storedSheet)}`);
      } else {
        setUrl('');
        setInviteLink('');
      }

      if (storedProxy && isValidGasUrl(storedProxy)) {
        setGeminiProxyUrl(storedProxy);
      } else {
        setGeminiProxyUrl('');
      }

      // Load API Key (v2)
      const key = storage.getApiKey() || '';
      setApiKey(key);

      // Load current display name
      setDisplayName(currentUserName || '');

      // Load app theme
      setSelectedAppTheme(currentAppTheme || 'teal');

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

    // Save Gemini proxy (v2 schema) as full GAS URL if valid
    try {
      if (geminiProxyUrl && isValidGasUrl(geminiProxyUrl)) storage.setProxyUrl(geminiProxyUrl);
      else storage.setProxyUrl('');
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

  const performClearStorage = () => {
    try {
      storage.clearAllKeys();
    } catch (e) {
      console.error('Error clearing storage', e);
    }
    window.location.reload();
  };

  const { config } = gameState;
  const isSolo = config.totalPlayers === 1;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined">settings</span>
          全域設定
        </div>
      }
      footer={
        <div className="flex justify-end gap-3 w-full">
          <Button variant="secondary" onClick={onClose}>
            取消
          </Button>
          <Button onClick={handleSaveSettings}>儲存設定</Button>
        </div>
      }
    >
      <div className="space-y-8">
        {/* 0. Personal & Appearance Section */}
        <div className="space-y-4">
          <h4 className="font-bold text-brand-petrol dark:text-brand-mint text-sm border-b border-accent/20 pb-2 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">person</span>
            外觀與個人
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center justify-between p-3 rounded-xl border border-accent/20 bg-white/50 dark:bg-black/20">
              <div className="text-xs text-accent font-bold">深色模式</div>
              <Button onClick={onToggleTheme} className="px-3 py-1 text-xs h-auto">
                {isDarkTheme ? '切換為淺色' : '切換為深色'}
              </Button>
            </div>
            <div>
              <Input
                label="顯示名稱"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="輸入你的名稱..."
              />
            </div>
          </div>

          {/* App Theme Selector */}
          <div className="space-y-2">
            <div className="text-xs text-accent font-bold">App 配色</div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {[
                { id: 'teal', label: '品牌綠', swatch: '#4A857E' },
                { id: 'rose', label: '陶玫瑰', swatch: '#D66F65' },
                { id: 'gold', label: '麥穗金', swatch: '#D4A373' },
                { id: 'indigo', label: '岩板藍', swatch: '#6B7A8F' },
                { id: 'sage', label: '鼠尾草', swatch: '#7A9E7E' },
                { id: 'lavender', label: '薰衣草', swatch: '#9D8189' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSelectedAppTheme(opt.id)}
                  className={`flex items-center gap-2 p-2 rounded-xl border text-xs transition-colors ${selectedAppTheme === opt.id ? 'border-accent' : 'border-accent/20'} bg-white/50 dark:bg-black/20`}
                  aria-pressed={selectedAppTheme === opt.id}
                >
                  <span
                    className="inline-block w-5 h-5 rounded"
                    style={{ backgroundColor: opt.swatch }}
                  />
                  <span className="text-brand-petrol dark:text-brand-mint">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 1. Sync & Data Section */}
        <div className="space-y-4">
          <h4 className="font-bold text-brand-petrol dark:text-brand-mint text-sm border-b border-accent/20 pb-2 flex items-center gap-2">
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
                  className={`text-xs ${syncStatus.type === 'success' ? 'text-green-600' : 'text-brand-rust'}`}
                >
                  {syncStatus.msg}
                </span>
              )}
            </div>
          </div>

          {/* Invite Link */}
          {inviteLink && !isSolo && (
            <div className="bg-accent/10 p-3 rounded-xl border border-accent/20 space-y-2">
              <h4 className="font-bold text-brand-petrol dark:text-brand-mint text-xs">
                邀請連結 (分享給隊友)
              </h4>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={inviteLink}
                  className="flex-1 text-[10px] p-2 rounded border border-accent/20 text-brand-petrol bg-white/50 dark:bg-black/20 outline-none"
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
          <h4 className="font-bold text-brand-petrol dark:text-brand-mint text-sm border-b border-accent/20 pb-2 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
            AI 金鑰 (Gemini API)
          </h4>
          <div className="bg-brand-purple/5 dark:bg-brand-purple/10 p-4 rounded-xl text-xs text-brand-purple dark:text-purple-200 border border-brand-purple/10">
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
          <div className="pt-3">
            <Input
              label="Gemini Proxy (GAS) 網址（可選）"
              value={geminiProxyUrl}
              onChange={(e) => setGeminiProxyUrl(e.target.value)}
              placeholder="https://script.google.com/.../exec"
            />
            {geminiProxyUrl && (
              <div className="text-xs text-green-600 mt-2">
                已設定 GAS 代理 — 前端 API Key 可省略（將使用代理轉發請求）。
              </div>
            )}
          </div>
          <div className="text-[12px] text-accent/80 mt-2 p-3 rounded border border-accent/10 bg-accent/5">
            <div className="font-bold text-xs mb-1">說明 — 兩種 GAS URL</div>
            <div className="text-[11px]">
              - 資料儲存 (sheet)：儲存在本機鍵值 `{`bingo_v2_sheetUrl`}`，請輸入您用於同步的 Apps
              Script 網址。
              <br />- Gemini 代理 (proxy)：儲存在本機鍵值 `{`bingo_v2_gasProxyUrl`}
              `，如果設定，前端將透過此代理呼叫 Gemini，而不需要在瀏覽器中保留 API Key。
            </div>
            <div className="text-[11px] text-brand-rust mt-1">
              已清除舊版設定（舊的 `bingoGlobalSheetUrl` / `bingoGasDeploymentId` /
              `bingoGeminiApiKey` 不再自動解析）。若未設定，請手動輸入。
            </div>
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
            disabled={!!geminiProxyUrl}
          />
        </div>

        {/* 3. Game Config Info (Read Only) */}
        <div className="pt-4 border-t border-accent/10">
          <div className="text-xs text-accent/60 mb-2 font-bold">目前遊戲參數 (唯讀)</div>
          <div className="grid grid-cols-2 gap-y-1 gap-x-4 text-xs text-accent">
            <div>
              年度:{' '}
              <span className="font-mono text-brand-petrol dark:text-brand-mint">
                {config.year}
              </span>
            </div>
            <div>
              模式:{' '}
              <span className="text-brand-petrol dark:text-brand-mint">
                {isSolo ? '個人' : '團體'} ({config.totalPlayers}人)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Clear storage action (destructive) */}
      <div className="pt-6">
        <div className="p-4 rounded-xl border border-accent/10 bg-white/50 dark:bg-black/20">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs font-bold text-brand-rust">清除本機資料</div>
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
            <span className="material-symbols-outlined text-brand-rust">delete_forever</span>
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
