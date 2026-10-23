import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import { transitions } from '../../motion/presets';

/**
 * BrutalTabs
 * Segmented brutalist tab bar with bold yellow highlight and tactile switching.
 */
export default function BrutalTabs({
  tabs,
  activeTab,
  onChange,
  className = '',
  tabClassName = '',
}) {
  return (
    <div className={cn('flex flex-wrap gap-2 border-b-2 border-brutal-black dark:border-brutal-yellow pb-2', className)}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        const Icon = tab.icon;

        return (
          <motion.button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            whileHover={{ y: -2 }}
            whileTap={{ y: 1 }}
            transition={transitions.brutalPunch}
            className={cn(
              'flex items-center gap-2 font-mono text-xs font-black uppercase tracking-wider px-4 py-2 border-2 select-none transition-all duration-100',
              isActive
                ? 'bg-brutal-yellow text-brutal-black border-brutal-black shadow-brutal -translate-y-0.5'
                : 'bg-brutal-white dark:bg-brutal-dark text-brutal-black dark:text-brutal-white border-brutal-black dark:border-brutal-yellow hover:bg-brutal-paper dark:hover:bg-brutal-dark-surface shadow-brutal-sm',
              tabClassName
            )}
          >
            {Icon && <Icon size={14} className={isActive ? 'text-brutal-black' : 'text-brutal-muted dark:text-brutal-muted-dark'} />}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={cn(
                  'px-1.5 py-0.2 text-[10px] font-black border',
                  isActive
                    ? 'bg-brutal-black text-brutal-white border-brutal-black'
                    : 'bg-brutal-paper dark:bg-brutal-dark text-brutal-black dark:text-brutal-white border-brutal-black dark:border-brutal-yellow'
                )}
              >
                {tab.count}
              </span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
