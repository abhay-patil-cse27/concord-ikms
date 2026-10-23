import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { variants } from '../../motion/presets';
import BrutalButton from './BrutalButton';

/**
 * BrutalModal
 * Cinema-scale, high-contrast modal with heavy black borders, hard offset shadow, and tactile close button.
 */
export default function BrutalModal({
  isOpen,
  onClose,
  title,
  subtitle,
  badge,
  children,
  footer,
  maxWidth = 'max-w-2xl',
  className = '',
}) {
  // Lock body scroll on modal open
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

  const modalRef = React.useRef(null);

  // Focus trap and Escape key handler
  useEffect(() => {
    if (!isOpen) return;

    // Focus the first interactive element or modal itself
    const modalEl = modalRef.current;
    if (!modalEl) return;

    const focusableElements = modalEl.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (firstElement) {
      firstElement.focus();
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
        return;
      }

      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Flat stark dark backdrop without blur */}
          <motion.div
            variants={variants.modalBackdrop}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={onClose}
            className="fixed inset-0 bg-brutal-black/85"
          />

          {/* Modal Container */}
          <motion.div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            variants={variants.modalContent}
            initial="initial"
            animate="animate"
            exit="exit"
            className={cn(
              'relative w-full z-10 bg-brutal-white dark:bg-brutal-dark',
              'border-3 border-brutal-black dark:border-brutal-yellow',
              'shadow-brutal-lg dark:shadow-brutal-dark-lg my-8',
              maxWidth,
              className
            )}
          >
            {/* Modal Header */}
            <div className="bg-brutal-yellow px-5 py-4 border-b-3 border-brutal-black flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                {badge && (
                  <span className="font-mono text-xs font-black uppercase px-2 py-0.5 border-2 border-brutal-black bg-brutal-black text-brutal-white shadow-brutal-sm">
                    {badge}
                  </span>
                )}
                <div className="min-w-0">
                  <h3 className="font-display font-black text-lg uppercase tracking-tight text-brutal-black truncate">
                    {title}
                  </h3>
                  {subtitle && (
                    <p className="font-mono text-xs font-bold text-brutal-black/75 truncate">
                      {subtitle}
                    </p>
                  )}
                </div>
              </div>

              <BrutalButton
                variant="dark"
                size="sm"
                onClick={onClose}
                aria-label="Close modal"
                className="px-2 py-1.5"
              >
                <X size={16} />
              </BrutalButton>
            </div>

            {/* Modal Body */}
            <div className="p-6 max-h-[75vh] overflow-y-auto">
              {children}
            </div>

            {/* Modal Footer */}
            {footer && (
              <div className="bg-brutal-paper dark:bg-brutal-dark-surface px-6 py-4 border-t-2 border-brutal-black dark:border-brutal-yellow flex items-center justify-end gap-3">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
