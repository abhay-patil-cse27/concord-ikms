import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { cn } from '../../lib/utils';
import { BrutalButton } from '../brutal';

/**
 * ThemeToggle
 * High-contrast mechanical toggle for Light and Yellow Brutalist Dark mode.
 */
export default function ThemeToggle({ className = '' }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <BrutalButton
      variant={isDark ? 'primary' : 'secondary'}
      size="sm"
      onClick={toggleTheme}
      aria-label="Toggle theme mode"
      className={cn('px-2.5 py-1.5', className)}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Brutal Dark Mode'}
    >
      {isDark ? (
        <Sun size={15} className="text-brutal-black" />
      ) : (
        <Moon size={15} className="text-brutal-black" />
      )}
    </BrutalButton>
  );
}
