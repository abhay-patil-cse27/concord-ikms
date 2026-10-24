import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { transitions } from '../../motion/presets';

/**
 * BrutalToast
 * Stark, high-impact alert notification banner with bold border and hard shadow.
 */
export default function BrutalToast({
  isOpen = true,
  onClose,
  type = 'info', // 'info' | 'success' | 'warning' | 'error'
  title,
  message,
  duration = 4000,
  className = '',
}) {
  React.useEffect(() => {
    if (duration && duration > 0 && onClose) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const typeConfig = {
    info: {
      bg: 'bg-brutal-paper text-brutal-black dark:bg-brutal-dark-surface dark:text-brutal-white border-brutal-black dark:border-brutal-yellow',
      icon: Info,
      defaultTitle: 'Information',
    },
    success: {
      bg: 'bg-brutal-success text-brutal-white border-brutal-black shadow-brutal',
      icon: CheckCircle2,
      defaultTitle: 'Action Successful',
    },
    warning: {
      bg: 'bg-brutal-yellow text-brutal-black border-brutal-black shadow-brutal',
      icon: AlertTriangle,
      defaultTitle: 'Notice',
    },
    error: {
      bg: 'bg-brutal-accent text-brutal-black border-brutal-black shadow-brutal',
      icon: AlertTriangle,
      defaultTitle: 'Action Failed',
    },
  };

  const current = typeConfig[type] || typeConfig.info;
  const Icon = current.icon;
  const displayTitle = title || (type === 'error' ? 'Action Failed' : type === 'success' ? 'Confirmed' : null);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.95 }}
          transition={transitions.brutalPunch}
          className={cn(
            'fixed bottom-6 right-6 z-50 max-w-md w-full border-3 p-4 flex items-start gap-3 select-none shadow-brutal-lg',
            current.bg,
            className
          )}
          role="status"
          aria-live="polite"
        >
          <div className="flex-shrink-0 mt-0.5">
            <Icon size={18} strokeWidth={2.5} />
          </div>

          <div className="flex-1 min-w-0">
            {displayTitle && (
              <h5 className="font-display font-black text-sm uppercase tracking-tight leading-tight">
                {displayTitle}
              </h5>
            )}
            {message && (
              <p className="font-mono text-xs mt-1 leading-normal font-bold">
                {message}
              </p>
            )}
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="flex-shrink-0 p-1 border border-current hover:bg-black/10 transition-colors"
              aria-label="Close notification"
            >
              <X size={14} />
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
