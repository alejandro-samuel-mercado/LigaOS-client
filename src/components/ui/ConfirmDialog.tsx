'use client';

import { Modal } from './Modal';
import { Button } from './Button';

interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'default' | 'danger';
}

export function ConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmLabel = 'Confirmar',
    cancelLabel = 'Cancelar',
    variant = 'default',
}: ConfirmDialogProps) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <div className="space-y-6">
                <p className="text-text-secondary text-sm leading-relaxed">
                    {message}
                </p>
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        className="flex-1 text-black hover:text-white"
                        onClick={onClose}
                    >
                        {cancelLabel}
                    </Button>
                    <Button
                        className={`flex-1 ${variant === 'danger' ? 'bg-red-600 hover:bg-red-700' : ''}`}
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                    >
                        {confirmLabel}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
