import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import { transitions } from '../../motion/presets';

/**
 * BrutalCard
 * Structural, heavy-bordered container with intentional offset drop shadow and optional yellow header bar.
 *
 * Variants:
 *  - default: Stark off-white panel with solid black borders and 4px offset shadow
 *  - yellow: Hero card flooded with bold brutal-yellow
 *  - dark: Cinema dark panel with high-contrast yellow accent border & shadow
 *  - paper: Subtle warm architectural paper texture tone
 *  - ghost: Un-shadowed bordered panel
 */
export default function BrutalCard({
  children,
  title,
  subtitle,
  badge,
  badgeVariant = 'black',
  action,
  headerVariant = 'default',
  variant = 'default',
  tone,
  interactive = false,
  hoverable,
  className = '',
  headerClassName = '',
  bodyClassName = '',
  onClick,
  ...props
}) {
  const isInteractive = Boolean(interactive || hoverable);
  const activeVariant = tone || variant;
  const variantStyles = {
    default: 'bg-brutal-white dark:bg-brutal-dark border-brutal-black dark:border-brutal-yellow shadow-brutal dark:shadow-brutal-dark',
    yellow: 'bg-brutal-yellow text-brutal-black border-brutal-black shadow-brutal',
    dark: 'bg-brutal-black text-brutal-white border-brutal-yellow shadow-brutal-dark',
    paper: 'bg-brutal-paper text-brutal-black border-brutal-black shadow-brutal',
    ghost: 'bg-transparent border-brutal-black dark:border-brutal-white',
  };

  const headerVariantStyles = {
    default: 'bg-brutal-paper dark:bg-brutal-dark-surface border-b-2 border-brutal-black dark:border-brutal-yellow',
    yellow: 'bg-brutal-yellow text-brutal-black border-b-2 border-brutal-black',
    black: 'bg-brutal-black text-brutal-white border-b-2 border-brutal-black dark:border-brutal-yellow',
    clean: 'border-b-2 border-brutal-black dark:border-brutal-yellow',
  };

  const hasHeader = Boolean(title || subtitle || badge || action);

  return (
    <motion.div
      onClick={onClick}
      whileHover={isInteractive ? { x: -3, y: -3 } : undefined}
      transition={transitions.brutalPunch}
      className={cn(
        'border-2 border-brutal-black dark:border-brutal-yellow transition-all duration-150',
        isInteractive && 'cursor-pointer hover:shadow-brutal-hover dark:hover:shadow-brutal-dark-lg',
        variantStyles[activeVariant] || variantStyles.default,
        className
      )}
      {...props}
    >
      {hasHeader && (
        <div className={cn('px-5 py-3.5 flex items-center justify-between gap-3', headerVariantStyles[headerVariant], headerClassName)}>
          <div className="flex items-center gap-2.5 min-w-0">
            {badge && (
              <span className="font-mono text-xs font-black uppercase px-2 py-0.5 border border-brutal-black bg-brutal-yellow text-brutal-black shadow-brutal-sm">
                {badge}
              </span>
            )}
            <div className="min-w-0">
              {title && (
                <h3 className="font-display font-extrabold text-base uppercase tracking-tight text-brutal-black dark:text-brutal-white truncate">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="font-mono text-xs text-brutal-muted dark:text-brutal-muted-dark truncate">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          {action && <div className="flex-shrink-0">{action}</div>}
        </div>
      )}
      <div className={cn('p-5', bodyClassName)}>
        {children}
      </div>
    </motion.div>
  );
}
