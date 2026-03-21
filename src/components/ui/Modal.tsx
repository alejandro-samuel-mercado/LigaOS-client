'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { type ReactNode, useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-6 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              className="pointer-events-auto flex flex-col w-full max-w-xl max-h-[85vh] bg-bg-card border-4 border-black shadow-[24px_24px_0px_0px_rgba(0,0,0,1)] relative"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-accent-primary" />
              
              {/* Header */}
              <div className="flex items-center justify-between border-b-4 border-black px-8 py-6 bg-black text-white">
                <h3 className="text-2xl font-black italic tracking-tighter uppercase leading-none">{title}</h3>
                <button
                  onClick={onClose}
                  className="bg-accent-primary text-black p-2 hover:bg-white transition-colors border-2 border-black active:translate-y-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                >
                  <X size={24} strokeWidth={3} />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto px-8 py-10 scrollbar-hide">
                {children}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
