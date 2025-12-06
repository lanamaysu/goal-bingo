
import React, { useState, useEffect } from 'react';
import { GameState } from '../types';
import { saveToSheet } from '../services/googleSheetSync';
import BaseModal from './common/BaseModal';
import { Input, Button } from './common/FormElements';
import { Loading } from './common/Loading';

interface SyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameState: GameState;
  onImport: (newState: GameState) => void;
}

const SyncModal: React.FC<SyncModalProps> = ({ isOpen, onClose, gameState, onImport }) => {
  const [sheetUrl, setUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  
  const [inviteLink, setInviteLink] = useState('');
  const [syncStatus, setSyncStatus] = useState<{type: 'success' | 'error' | 'loading', msg: string} | null>(null);
  
  useEffect(() => {
    if (isOpen) {
        // Load Sheet URL
        const url = localStorage.getItem('bingoGlobalSheetUrl') || '';
        setUrl(url);
        if (url) {
            const baseUrl = window.location.origin + window.location.pathname;
            setInviteLink(`${baseUrl}?syncUrl=${encodeURIComponent(url)}`);
        }
        
        // Load API Key
        const key = localStorage.getItem('bingoGeminiApiKey') || '';
        setApiKey(key);

        setSyncStatus(null);
    }
  }, [isOpen]);

  const handleManualSync = async () => {
      if(!sheetUrl) return;
      setSyncStatus({ type: 'loading', msg: '同步中...' });
      try {
          const newState = await saveToSheet(sheetUrl, gameState);
          onImport(newState);
          setSyncStatus({ type: 'success', msg: '同步成功！已更新至最新狀態。' });
      } catch(e) {
          setSyncStatus({ type: 'error', msg: '同步失敗：' + e });
      }
  };

  const handleSaveSettings = () => {
      localStorage.setItem('bingoGlobalSheetUrl', sheetUrl);
      localStorage.setItem('bingoGeminiApiKey', apiKey);
      onClose();
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
                <Button variant="secondary" onClick={onClose}>取消</Button>
                <Button onClick={handleSaveSettings}>
                    儲存設定
                </Button>
            </div>
        }
    >
        <div className="space-y-8">
            
            {/* 1. Sync & Data Section */}
            <div className="space-y-4">
                 <h4 className="font-bold text-brand-petrol dark:text-brand-mint text-sm border-b border-brand-teal/20 pb-2 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">cloud_sync</span>
                    資料同步 (Google Sheets)
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
                            className="text-xs text-brand-teal hover:underline font-bold disabled:opacity-50 flex items-center gap-1"
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
                            <span className={`text-xs ${syncStatus.type === 'success' ? 'text-green-600' : 'text-brand-rust'}`}>
                                {syncStatus.msg}
                            </span>
                        )}
                    </div>
                </div>

                {/* Invite Link */}
                {inviteLink && !isSolo && (
                    <div className="bg-brand-teal/5 p-3 rounded-xl border border-brand-teal/20 space-y-2">
                        <h4 className="font-bold text-brand-petrol dark:text-brand-mint text-xs">邀請連結 (分享給隊友)</h4>
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                readOnly 
                                value={inviteLink} 
                                className="flex-1 text-[10px] p-2 rounded border border-brand-teal/20 text-brand-petrol bg-white/50 dark:bg-black/20 outline-none" 
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
                 <h4 className="font-bold text-brand-petrol dark:text-brand-mint text-sm border-b border-brand-teal/20 pb-2 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                    AI 金鑰 (Gemini API)
                </h4>
                <div className="bg-brand-purple/5 dark:bg-brand-purple/10 p-4 rounded-xl text-xs text-brand-purple dark:text-purple-200 border border-brand-purple/10">
                    <p className="mb-2">啟用 AI 輔助需要您自己的 API Key。</p>
                    <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="underline font-bold flex items-center gap-1 hover:text-brand-petrol">
                        前往 Google AI Studio 取得免費 Key <span className="material-symbols-outlined text-[12px]">open_in_new</span>
                    </a>
                </div>
                <Input 
                    label="Gemini API Key"
                    type={showKey ? "text" : "password"}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    rightElement={
                        <button onClick={() => setShowKey(!showKey)} className="hover:text-brand-petrol transition-colors">
                             <span className="material-symbols-outlined text-[20px]">{showKey ? 'visibility_off' : 'visibility'}</span>
                        </button>
                    }
                />
            </div>

            {/* 3. Game Config Info (Read Only) */}
            <div className="pt-4 border-t border-brand-teal/10">
                <div className="text-xs text-brand-teal/60 mb-2 font-bold">目前遊戲參數 (唯讀)</div>
                <div className="grid grid-cols-2 gap-y-1 gap-x-4 text-xs text-brand-teal">
                    <div>年度: <span className="font-mono text-brand-petrol dark:text-brand-mint">{config.year}</span></div>
                    <div>模式: <span className="text-brand-petrol dark:text-brand-mint">{isSolo ? '個人' : '團體'} ({config.totalPlayers}人)</span></div>
                </div>
            </div>

        </div>
    </BaseModal>
  );
};

export default SyncModal;
