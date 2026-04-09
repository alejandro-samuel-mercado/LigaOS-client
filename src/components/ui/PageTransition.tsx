'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';

/**
 * PageTransition wrapper using framer-motion.
 * Provides smooth fade-in and slide-up animations during navigation.
 */
export const PageTransition = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname();

  return (
    <AnimatePresence initial={false}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};
