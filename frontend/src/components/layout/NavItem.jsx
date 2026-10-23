import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import { transitions } from '../../motion/presets';

/**
 * NavItem
 * Monospaced architectural navigation link with mechanical hover and active yellow state.
 */
export default function NavItem({
  icon: Icon,
  label,
  badge,
  badgeTone = 'yellow',
  isActive = false,
  isCollapsed = false,
  onClick,
  className = '',
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ x: isActive ? 0 : 3 }}
      whileTap={{ x: 1 }}
      transition={transitions.brutalPunch}
      className={cn(
        'w-full flex items-center gap-3 px-3.5 py-3 border-2 select-none font-mono text-xs font-bold uppercase tracking-wider transition-colors duration-100',
        isActive
          ? 'bg-brutal-yellow text-brutal-black border-brutal-black shadow-brutal translate-x-1 font-black'
          : 'bg-transparent text-brutal-black dark:text-brutal-white border-transparent hover:border-brutal-black dark:hover:border-brutal-yellow hover:bg-brutal-paper dark:hover:bg-brutal-dark-surface',
        isCollapsed && 'justify-center px-2',
        className
      )}
      title={isCollapsed ? label : undefined}
    >
      {Icon && (
        <span className={cn('flex-shrink-0', isActive ? 'text-brutal-black' : 'text-brutal-black dark:text-brutal-white')}>
          <Icon size={18} />
        </span>
      )}

      {!isCollapsed && (
        <span className="flex-1 text-left truncate">
          {label}
        </span>
      )}

      {!isCollapsed && badge && (
        <span
          className={cn(
            'flex-shrink-0 px-1.5 py-0.5 text-[10px] font-black border font-mono',
            isActive
              ? 'bg-brutal-black text-brutal-white border-brutal-black'
              : 'bg-brutal-yellow text-brutal-black border-brutal-black'
          )}
        >
          {badge}
        </span>
      )}
    </motion.button>
  );
}
