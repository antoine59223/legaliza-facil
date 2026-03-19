import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function BottomSheet({ isOpen, onClose, title, children }: BottomSheetProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-zinc-950/95"
          />
          <motion.div
            initial={{ scale: 0.9, x: '-50%', y: '-45%', opacity: 0 }}
            animate={{ scale: 1, x: '-50%', y: '-50%', opacity: 1 }}
            exit={{ scale: 0.9, x: '-50%', y: '-45%', opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed top-1/2 left-1/2 z-[101] bg-zinc-900 border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.6)] rounded-2xl w-[95%] max-w-[500px] max-h-[75vh] flex flex-col overflow-hidden will-change-transform"
          >
            {/* Header / Grabber area */}
            <div className="p-6 pb-0">
              <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-6" />
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-white">{title}</h2>
                <button onClick={onClose} className="p-2 rounded-full glass-button text-zinc-400 hover:text-white">
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Internal Scrollable Content */}
            <div className="overflow-y-auto flex-grow px-6 pb-8 custom-scrollbar scroll-smooth selection-list-content">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
