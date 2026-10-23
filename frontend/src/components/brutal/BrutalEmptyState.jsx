import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import BrutalButton from './BrutalButton';

/**
 * BrutalEmptyState
 * Bold, high-contrast placeholder for empty collections and zero-result views.
 */
export default function BrutalEmptyState({
  icon: Icon = AlertCircle,
  title = 'No Records Found',
  description = 'No institutional knowledge records match the specified query or filters.',
  actionLabel,
  onAction,
  className = '',
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'border-3 border-dashed border-brutal-black dark:border-brutal-yellow',
        'bg-brutal-paper dark:bg-brutal-dark p-8 md:p-12 text-center my-6',
        className
      )}
    >
      <div className="w-16 h-16 mx-auto mb-4 bg-brutal-yellow border-2 border-brutal-black shadow-brutal flex items-center justify-center">
        <Icon size={28} className="text-brutal-black" />
      </div>

      <h4 className="font-display font-black text-lg md:text-xl uppercase tracking-tight text-brutal-black dark:text-brutal-white mb-2">
        {title}
      </h4>

      <p className="font-mono text-xs md:text-sm text-brutal-muted dark:text-brutal-muted-dark max-w-md mx-auto mb-6">
        {description}
      </p>

      {actionLabel && onAction && (
        <BrutalButton variant="primary" size="md" onClick={onAction}>
          {actionLabel}
        </BrutalButton>
      )}
    </motion.div>
  );
}
