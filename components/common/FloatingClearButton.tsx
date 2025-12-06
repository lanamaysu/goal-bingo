import React from 'react';
import ConfirmDialog from './ConfirmDialog';

interface Props {
  isOpen: boolean;
  onOpen: () => void;
  onConfirm: () => void;
  onCancel: () => void;
}

const FloatingClearButton: React.FC<Props> = ({ isOpen, onOpen, onConfirm, onCancel }) => {
  return (
    <>
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={onOpen}
          title="清空 Storage"
          className="p-2 rounded-full bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-300 shadow-lg flex items-center justify-center"
        >
          <span className="material-symbols-outlined">delete_forever</span>
        </button>
      </div>

      <ConfirmDialog
        isOpen={isOpen}
        title="清空應用儲存"
        message={
          '這將會移除本地所有 Goal Bingo 的暫存設定（包含試算表網址、Gemini 設定、使用者 ID 等）。此操作無法復原。確定要清空嗎？'
        }
        confirmText="清空並重新載入"
        cancelText="取消"
        isDestructive={true}
        onConfirm={() => {
          onConfirm();
        }}
        onCancel={onCancel}
      />
    </>
  );
};

export default FloatingClearButton;
