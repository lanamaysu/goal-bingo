import React, { useState } from 'react';
import BaseModal from './common/BaseModal';
import { Input, Button } from './common/FormElements';

interface JoinTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (url: string) => void;
}

const JoinTeamModal: React.FC<JoinTeamModalProps> = ({ isOpen, onClose, onConfirm }) => {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    const trimmedUrl = url.trim();
    if (!trimmedUrl) return;

    // Security: Strict HTTPS check
    if (!trimmedUrl.startsWith('https://')) {
      setError('基於安全性，網址必須以 https:// 開頭');
      return;
    }

    // Basic validation for GAS Web App URL
    if (!trimmedUrl.includes('script.google.com/macros/s/')) {
      setError('網址格式錯誤。請確認網址包含 "script.google.com/macros/s/"');
      return;
    }

    onConfirm(trimmedUrl);
    setError('');
    onClose();
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <span className="flex items-center gap-2">
          <span className="material-symbols-outlined">link</span> 加入隊伍
        </span>
      }
      footer={
        <div className="flex justify-end gap-3 w-full">
          <Button variant="secondary" onClick={onClose}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={!url.trim()}>
            加入
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-accent dark:text-accent/80">
          請輸入隊伍的 Google Apps Script 網址 (Web App URL)。
        </p>
        <div>
          <Input
            autoFocus
            placeholder="https://script.google.com/macros/s/..."
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              if (error) setError('');
            }}
            className={error ? 'border-brand-rust focus:border-brand-rust' : ''}
          />
          {error && (
            <p className="mt-2 text-xs text-accent font-bold flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">error</span> {error}
            </p>
          )}
        </div>
      </div>
    </BaseModal>
  );
};

export default JoinTeamModal;
