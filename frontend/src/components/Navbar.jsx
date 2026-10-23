import React from 'react';
import { Shield, LogOut, Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import RoleSwitcher from './layout/RoleSwitcher';
import ThemeToggle from './layout/ThemeToggle';
import { BrutalButton, BrutalBadge } from './brutal';

/**
 * Navbar
 * Yellow Brutalist header bar with architectural brand identity,
 * tactile role switcher, theme toggle, and mobile menu trigger.
 */
export default function Navbar({ onToggleMobileMenu }) {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 w-full bg-brutal-white dark:bg-brutal-dark border-b-3 border-brutal-black dark:border-brutal-yellow z-40 sticky top-0 px-4 md:px-6 flex items-center justify-between gap-4 select-none">
      {/* Left: Mobile Toggle & Brand Identity */}
      <div className="flex items-center gap-3 md:gap-4">
        {onToggleMobileMenu && (
          <button
            type="button"
            onClick={onToggleMobileMenu}
            className="md:hidden p-2 border-2 border-brutal-black dark:border-brutal-yellow bg-brutal-yellow text-brutal-black shadow-brutal-sm"
            aria-label="Toggle Navigation Menu"
          >
            <Menu size={18} />
          </button>
        )}

        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-brutal-yellow border-2 border-brutal-black shadow-brutal-sm flex items-center justify-center flex-shrink-0">
            <Shield size={20} className="text-brutal-black" strokeWidth={2.5} />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-black text-lg md:text-xl tracking-tight uppercase text-brutal-black dark:text-brutal-white">
                CONCORD
              </span>
              <BrutalBadge tone="yellow" size="sm" className="hidden sm:inline-flex">
                KIT IKMS
              </BrutalBadge>
            </div>
            <div className="hidden sm:block font-mono text-[10px] text-brutal-muted dark:text-brutal-muted-dark uppercase tracking-wider -mt-0.5">
              Cognitive Institutional Memory
            </div>
          </div>
        </div>
      </div>

      {/* Right: Role Quick-Switcher, Theme Toggle, User Status, Logout */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Role Switcher */}
        {user && <RoleSwitcher className="hidden sm:flex" />}

        {/* Theme Mode Toggle */}
        <ThemeToggle />

        {/* User Card & Logout */}
        {user && (
          <div className="flex items-center gap-2 pl-2 border-l-2 border-brutal-black/20 dark:border-brutal-yellow/20">
            <div className="hidden xl:block text-right">
              <div className="font-mono text-xs font-bold text-brutal-black dark:text-brutal-white truncate max-w-[140px]">
                {user.full_name || user.email}
              </div>
              <div className="font-mono text-[10px] text-brutal-muted dark:text-brutal-muted-dark uppercase">
                {user.role_code || 'VERIFIED USER'}
              </div>
            </div>

            <BrutalButton
              variant="secondary"
              size="sm"
              onClick={logout}
              title="Sign Out"
              aria-label="Sign out"
              className="px-2.5 py-1.5"
            >
              <LogOut size={15} />
            </BrutalButton>
          </div>
        )}
      </div>
    </header>
  );
}
