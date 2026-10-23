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
  isOpen,
  onClose,
  type = 'info', // 'info' | 'success' | 'warning' | 'error'
  title,
  message,
  className = '',
}) {
  const typeConfig = {
    info: {
      bg: 'bg-brutal-cyan text-brutal-black',
      border: 'border-brutal-black',
      shadow: 'shadow-brutal',
      icon: Info,
    },
    success: {
      bg: 'bg-brutal-green text-brutal-black',
      border: 'border-brutal-black',
      shadow: 'shadow-brutal',
      icon: CheckCircle2,
    },
    warning: {
      bg: 'bg-brutal-yellow text-brutal-black',
      border: 'border-brutal-black',
      shadow: 'shadow-brutal',
      icon: AlertTriangle,
    },
    error: {
      bg: 'bg-brutal-accent text-brutal-white',
      border: 'border-brutal-black',
      shadow: 'shadow-brutal',
      icon: AlertTriangle,
    },
  };

  const current = typeConfig[type] || typeConfig.info;
  const Icon = current.icon;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.95 }}
          transition={transitions.brutalPunch}
          className={cn(
            'fixed bottom-6 right-6 z-50 max-w-md w-full border-2 p-4 flex items-start gap-3 select-none',
            current.bg,
            current.border,
            current.shadow,
            className
          )}
          role="status"
          aria-live="polite"
        >
          <div className="flex-shrink-0 mt-0.5">
            <Icon size={18} />
          </div>

          <div className="flex-1 min-w-0">
            {title && (
              <h5 className="font-display font-black text-sm uppercase tracking-tight leading-tight">
                {title}
              </h5>
            )}
            {message && (
              <p className="font-mono text-xs mt-1 leading-normal opacity-90">
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
