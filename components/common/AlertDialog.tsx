import React from 'react';
import BaseModal from './BaseModal';
import { Button } from './FormElements';

interface AlertDialogProps {
  isOpen: boolean;
  title?: React.ReactNode;
  message: string;
  onClose: () => void;
}

const AlertDialog: React.FC<AlertDialogProps> = ({ isOpen, title = '提示', message, onClose }) => {
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="sm"
      title={title}
      hideCloseButton={true}
      footer={
        <Button onClick={onClose} className="w-full">
          知道了
        </Button>
      }
    >
      <div className="text-accent dark:text-accent text-sm leading-relaxed text-center font-medium whitespace-pre-wrap">
        {message}
      </div>
    </BaseModal>
  );
};

export default AlertDialog;
