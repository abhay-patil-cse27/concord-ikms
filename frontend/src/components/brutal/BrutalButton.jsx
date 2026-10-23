import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import { transitions } from '../../motion/presets';

/**
 * BrutalButton
 * Tactile, hard-offset-shadowed button with deliberate mechanical press and lift states.
 *
 * Variants:
 *  - primary: High-voltage yellow hero with solid black border & offset shadow
 *  - secondary: Clean white / slate surface with hard black offset shadow
 *  - dark: Solid pitch black with yellow hard offset shadow (cinema contrast)
 *  - danger: Restrained hazard alert crimson
 *  - ghost: Minimalist bordered pill without heavy shadow
 *
 * Sizes: 'sm', 'md', 'lg'
 */
export default function BrutalButton({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  loading = false,
  icon: Icon,
  iconPosition = 'left',
  onClick,
  type = 'button',
  ...props
}) {
  const baseClasses = `
    inline-flex items-center justify-center font-mono font-bold uppercase tracking-wider
    border-2 border-brutal-black select-none cursor-pointer transition-colors duration-100
    disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none
  `;

  const sizeClasses = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2.5 gap-2',
    lg: 'text-base px-6 py-3.5 gap-2.5',
  };

  const variantClasses = {
    primary: `
      bg-brutal-yellow text-brutal-black
      shadow-brutal hover:shadow-brutal-hover active:shadow-brutal-active
      hover:bg-brutal-yellow-hover dark:shadow-brutal-dark-sm
    `,
    secondary: `
      bg-brutal-white text-brutal-black dark:bg-brutal-dark dark:text-brutal-white dark:border-brutal-yellow
      shadow-brutal hover:shadow-brutal-hover active:shadow-brutal-active
      hover:bg-brutal-paper dark:hover:bg-brutal-dark-surface
    `,
    dark: `
      bg-brutal-black text-brutal-white border-brutal-black
      shadow-brutal-dark hover:shadow-brutal-dark-lg active:shadow-brutal-active
      hover:bg-brutal-dark
    `,
    danger: `
      bg-brutal-accent text-brutal-white border-brutal-black
      shadow-brutal hover:shadow-brutal-hover active:shadow-brutal-active
      hover:bg-brutal-accent-hover
    `,
    ghost: `
      bg-transparent text-brutal-black dark:text-brutal-white border-brutal-black dark:border-brutal-white
      hover:bg-brutal-yellow hover:text-brutal-black hover:shadow-brutal-sm
    `,
  };

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      whileHover={disabled ? undefined : { x: -2, y: -2 }}
      whileTap={disabled ? undefined : { x: 2, y: 2 }}
      transition={transitions.brutalPunch}
      className={cn(baseClasses, sizeClasses[size], variantClasses[variant], className)}
      {...props}
    >
      {loading && (
        <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent animate-spin rounded-full" />
      )}
      {!loading && Icon && iconPosition === 'left' && <Icon size={size === 'sm' ? 14 : size === 'lg' ? 18 : 16} />}
      <span>{children}</span>
      {!loading && Icon && iconPosition === 'right' && <Icon size={size === 'sm' ? 14 : size === 'lg' ? 18 : 16} />}
    </motion.button>
  );
}
