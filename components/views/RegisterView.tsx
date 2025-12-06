import React, { useState, useEffect } from 'react';
import { Input, Button } from '../common/FormElements';
import { USER_THEME_PALETTE } from '../../utils/themeStyles';
import { User } from '../../types';
import { Loading } from '../common/Loading';

interface RegisterViewProps {
  year: string;
  name: string;
  isSaving?: boolean;
  errorMsg?: string;
  isGameFull?: boolean;
  existingUsers?: User[]; // New Prop
  onNameChange: (name: string) => void;
  onRegister: (colorId: number) => void;
}

const RegisterView: React.FC<RegisterViewProps> = ({
  year,
  name,
  isSaving,
  errorMsg,
  isGameFull = false,
  existingUsers = [],
  onNameChange,
  onRegister,
}) => {
  const [selectedColorId, setSelectedColorId] = useState(0);

  // If game is full, we are strictly in "Recovery Mode"
  const isRecoveryMode = isGameFull;

  // Auto-detect existing user color - use Map for O(1) lookup
  useEffect(() => {
    if (name && existingUsers.length > 0) {
      // Build lowercase name map for O(1) lookup
      const nameMap = new Map(existingUsers.map((u) => [u.name.trim().toLowerCase(), u]));
      const match = nameMap.get(name.trim().toLowerCase());
      if (match) {
        setSelectedColorId(match.colorId);
      }
    }
  }, [name, existingUsers]);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6 animate-fade-in"
      style={{ minHeight: '100dvh' }}
    >
      <div className="max-w-sm w-full bg-white dark:bg-[rgb(var(--brand-surface))] rounded-3xl shadow-soft p-8 border border-white/20">
        <div className="text-center mb-8">
          <div
            className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 rotate-3 ${isRecoveryMode ? 'bg-brand-purple/20 text-accent' : 'bg-brand-teal/20 text-accent'}`}
          >
            <span className="material-symbols-outlined text-[32px]">
              {isRecoveryMode ? 'badge' : 'person_add'}
            </span>
          </div>
          <h2 className="text-2xl font-black text-accent dark:text-accent">
            {isRecoveryMode ? '歡迎回來！' : '歡迎加入！'}
          </h2>
          <p className="text-accent dark:text-accent/80 text-sm font-medium mt-2">
            {isRecoveryMode
              ? `請輸入您在 ${year} 登記的暱稱以繼續`
              : `輸入您的暱稱以加入 ${year} 年度挑戰`}
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 bg-white dark:bg-brand-rust/10 border border-brand-rust dark:border-brand-rust/30 text-accent text-sm font-bold rounded-xl flex items-center gap-2 shadow-sm">
            <span className="material-symbols-outlined text-[18px]">warning</span> {errorMsg}
          </div>
        )}

        <div className="space-y-6">
          <div className="relative">
            <Input
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder={isRecoveryMode ? '輸入您原本的暱稱' : '您的暱稱'}
              className="text-center text-lg font-bold py-4"
              disabled={isSaving}
            />
          </div>

          {!isRecoveryMode && (
            <div className="animate-fade-in">
              <label className="block text-center text-xs font-bold text-accent dark:text-accent/80 mb-3 uppercase tracking-wider">
                選擇代表色
              </label>
              <div className="flex justify-center flex-wrap gap-3">
                {USER_THEME_PALETTE.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => setSelectedColorId(theme.id)}
                    disabled={isSaving}
                    className={`
                                w-8 h-8 rounded-full border-2 transition-all duration-300 relative
                                ${theme.badge} 
                                ${
                                  selectedColorId === theme.id
                                    ? `scale-110 ring-4 ring-offset-2 ring-offset-white dark:ring-offset-brand-surface ${theme.ring}`
                                    : 'opacity-70 border-transparent'
                                }
                            `}
                  >
                    {selectedColorId === theme.id && (
                      <span className="material-symbols-outlined text-[16px] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                        check
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          <Button
            onClick={() => onRegister(selectedColorId)}
            disabled={!name.trim() || isSaving}
            className={`w-full py-4 text-lg mt-4 ${isRecoveryMode ? 'bg-brand-petrol' : ''}`}
          >
            {isSaving ? (
              <Loading text={isRecoveryMode ? '驗證身份中...' : '處理中...'} size="text-[20px]" />
            ) : (
              <>
                <span>{isRecoveryMode ? '恢復身份' : '加入遊戲'}</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RegisterView;
