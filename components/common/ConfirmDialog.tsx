
import React from 'react';
import BaseModal from './BaseModal';
import { Button } from './FormElements';

interface ConfirmDialogProps {
  isOpen: boolean;
  title?: React.ReactNode;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ 
  isOpen, title = "確認", message, confirmText = "確定", cancelText = "取消", isDestructive = false, onConfirm, onCancel 
}) => {
  return (
    <BaseModal
        isOpen={isOpen}
        onClose={onCancel}
        maxWidth="sm"
        title={title}
        hideCloseButton={true}
        footer={
            <div className="flex gap-3 w-full">
                <Button variant="secondary" onClick={onCancel} className="flex-1">
                    {cancelText}
                </Button>
                <Button 
                    variant={isDestructive ? 'danger' : 'primary'}
                    onClick={onConfirm}
                    className="flex-1"
                >
                    {confirmText}
                </Button>
            </div>
        }
    >
        <div className="text-brand-petrol dark:text-brand-mint text-sm leading-relaxed text-center font-medium whitespace-pre-wrap">
          {message}
        </div>
    </BaseModal>
  );
};

export default ConfirmDialog;
