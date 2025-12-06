import React, { useState } from 'react';
import BaseModal from './common/BaseModal';
import { Input, Button } from './common/FormElements';
import { Loading } from './common/Loading';

interface SetupInstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (url: string) => void;
  codeTemplate: string;
}

const SetupInstructionsModal: React.FC<SetupInstructionsModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  codeTemplate,
}) => {
  const [url, setUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const handleCopy = () => {
    navigator.clipboard.writeText(codeTemplate);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = () => {
    const trimmedUrl = url.trim();
    if (!trimmedUrl) return;

    // Security: Basic validation for GAS Web App URL + strict HTTPS
    if (!trimmedUrl.startsWith('https://')) {
      setError('基於安全性，網址必須以 https:// 開頭');
      return;
    }

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
      maxWidth="2xl"
      title={
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined">build</span>
          建立新隊伍 (Google Apps Script 設定)
        </div>
      }
      footer={
        <div className="flex justify-end gap-3 w-full">
          <Button variant="secondary" onClick={onClose}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={!url.trim()}>
            驗證並建立隊伍{' '}
            <span className="material-symbols-outlined text-[18px] ml-1">rocket_launch</span>
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Step 1: Copy Code */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h4 className="font-bold text-brand-petrol dark:text-brand-mint">
              步驟 1：複製後端程式碼
            </h4>
            {copied && (
              <span className="text-xs text-brand-teal font-bold animate-pulse">
                已複製到剪貼簿！
              </span>
            )}
          </div>
          <div className="relative group">
            {/* Changed bg-gray-800 to bg-brand-petrol for brand consistency */}
            <pre className="bg-brand-petrol text-brand-mint/90 p-4 rounded-xl text-xs font-mono h-32 overflow-y-auto border border-brand-teal/20 custom-scrollbar">
              {codeTemplate}
            </pre>
            <button
              onClick={handleCopy}
              className="absolute top-2 right-2 bg-white text-brand-petrol px-3 py-1 rounded text-xs font-bold shadow transition-all flex items-center gap-1"
            >
              {copied ? (
                <>
                  <span className="material-symbols-outlined text-[14px]">check</span> Copied
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[14px]">content_copy</span>{' '}
                  複製程式碼
                </>
              )}
            </button>
          </div>
        </div>

        {/* Step 2: Instructions */}
        <div className="space-y-3 bg-brand-teal/5 p-4 rounded-xl border border-brand-teal/20 text-sm text-brand-petrol dark:text-brand-mint/80">
          <h4 className="font-bold text-brand-teal mb-2">步驟 2：部署到 Google 試算表</h4>
          <ol className="list-decimal list-inside space-y-1 ml-1">
            <li>
              建立一個新的{' '}
              <a
                href="https://sheets.new"
                target="_blank"
                rel="noreferrer"
                className="text-brand-teal underline font-bold"
              >
                Google 試算表
              </a>
              。
            </li>
            <li>
              點擊選單列的 <b>「擴充功能 (Extensions)」</b> &gt; <b>「Apps Script」</b>。
            </li>
            <li>
              將編輯器中的內容清空，<b>貼上</b> 剛才複製的程式碼。
            </li>
            <li>
              點擊右上角的 <b>「部署 (Deploy)」</b> &gt; <b>「新增部署 (New deployment)」</b>。
            </li>
            <li>
              點擊左上角的齒輪圖示 &gt; 選擇 <b>「網頁應用程式 (Web app)」</b>。
            </li>
            <li>
              <span className="text-brand-rust font-bold">重要：</span>將「存取權限 (Who has
              access)」設為 <b>「任何人 (Anyone)」</b>。
            </li>
            <li>點擊「部署」，並授予必要的權限。</li>
            <li>
              複製產生的 <b>「網頁應用程式網址 (Web App URL)」</b>。
            </li>
          </ol>
        </div>

        {/* Step 3: Paste URL */}
        <div className="space-y-2">
          <h4 className="font-bold text-brand-petrol dark:text-brand-mint">
            步驟 3：貼上網址並開始
          </h4>
          <Input
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              if (error) setError('');
            }}
            placeholder="https://script.google.com/macros/s/..."
            className={error ? 'border-brand-rust focus:border-brand-rust' : ''}
          />
          {error ? (
            <p className="text-xs text-brand-rust font-bold flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">error</span> {error}
            </p>
          ) : (
            <p className="text-xs text-brand-teal/60">
              請確保網址以 https://script.google.com 開頭
            </p>
          )}
        </div>
      </div>
    </BaseModal>
  );
};

export default SetupInstructionsModal;
