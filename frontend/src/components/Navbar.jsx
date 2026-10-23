import React, { useState, useRef, useEffect } from 'react';
import { Shield, LogOut, Menu, User, ChevronDown, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './layout/ThemeToggle';
import { BrutalButton, BrutalBadge } from './brutal';
import { cn } from '../lib/utils';

const DEMO_ROLES = [
  { code: 'platform_admin', label: 'Admin', desc: 'Global Clearance' },
  { code: 'dept_admin_cse', label: 'HOD CSE', desc: 'Department Admin' },
  { code: 'faculty_cse', label: 'Faculty', desc: 'Staff Scope' },
  { code: 'student_cse', label: 'Student', desc: 'Read-Only Tenant' },
];

/**
 * Navbar
 * Yellow Brutalist header bar with architectural brand identity,
 * theme toggle, user profile menu with dev-only role switching, and logout.
 */
export default function Navbar({ onToggleMobileMenu }) {
  const { user, logout, switchDemoRole } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [switchingRole, setSwitchingRole] = useState(null);
  const menuRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    }
    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [userMenuOpen]);

  const isDevOrDemo = Boolean(
    import.meta.env.DEV ||
    import.meta.env.VITE_DEMO_MODE === 'true' ||
    import.meta.env.VITE_DEMO === 'true'
  );

  const currentRoleCode = user?.role_code || user?.roles?.[0]?.code || 'student_cse';

  // Format short display name (e.g. "Dr. Sharma" or first name)
  const fullName = user?.full_name || user?.email || 'User';
  const shortName = (() => {
    if (!user) return '';
    if (user.full_name) {
      const parts = user.full_name.trim().split(/\s+/);
      if (parts.length >= 2 && (parts[0].startsWith('Dr.') || parts[0].startsWith('Prof.'))) {
        return `${parts[0]} ${parts[parts.length - 1]}`;
      }
      return parts[0];
    }
    return user.email.split('@')[0];
  })();

  const handleRoleSwitch = async (code) => {
    if (!switchDemoRole || code === currentRoleCode) return;
    try {
      setSwitchingRole(code);
      await switchDemoRole(code);
      setUserMenuOpen(false);
    } catch (err) {
      console.error('Role switch failed', err);
    } finally {
      setSwitchingRole(null);
    }
  };

  return (
    <header className="h-16 w-full bg-brutal-white dark:bg-brutal-dark border-b-3 border-brutal-black dark:border-brutal-yellow shadow-brutal z-40 sticky top-0 px-4 md:px-6 flex items-center justify-between gap-4 select-none">
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

      {/* Right: Theme Toggle, User Profile & Actions */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Theme Mode Toggle */}
        <ThemeToggle />

        {/* Authenticated State: User Menu Dropdown & Logout */}
        {user ? (
          <div className="flex items-center gap-2 pl-2 border-l-2 border-brutal-black/20 dark:border-brutal-yellow/20 relative" ref={menuRef}>
            {/* User Menu Trigger Button */}
            <button
              type="button"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className={cn(
                'flex items-center gap-2 px-2.5 py-1.5 border-2 transition-all font-mono',
                userMenuOpen
                  ? 'bg-brutal-yellow text-brutal-black border-brutal-black shadow-brutal-sm'
                  : 'bg-brutal-paper dark:bg-brutal-dark-surface text-brutal-black dark:text-brutal-white border-brutal-black dark:border-brutal-yellow shadow-brutal-sm hover:bg-brutal-yellow hover:text-brutal-black'
              )}
              title={`Full Name: ${fullName} (Click to open menu)`}
              aria-label="User profile menu"
            >
              <div className="w-6 h-6 bg-brutal-black text-brutal-yellow flex items-center justify-center font-bold text-xs flex-shrink-0">
                {shortName.charAt(0).toUpperCase()}
              </div>
              <div className="text-left hidden sm:block">
                <div className="text-xs font-black truncate max-w-[120px] leading-tight">
                  {shortName}
                </div>
                <div className="text-[9px] uppercase tracking-wider text-brutal-muted dark:text-brutal-muted-dark leading-tight">
                  {user.role_code || 'MEMBER'}
                </div>
              </div>
              <ChevronDown size={14} className={cn('transition-transform duration-150', userMenuOpen && 'rotate-180')} />
            </button>

            {/* User Dropdown Menu */}
            {userMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-brutal-white dark:bg-brutal-dark border-3 border-brutal-black dark:border-brutal-yellow shadow-brutal-lg z-50 p-2">
                {/* Full User Details */}
                <div className="p-2 border-b-2 border-brutal-black/20 dark:border-brutal-yellow/20 mb-2 font-mono">
                  <div className="text-[10px] uppercase font-bold text-brutal-muted dark:text-brutal-muted-dark">
                    Authenticated Account
                  </div>
                  <div className="text-xs font-black text-brutal-black dark:text-brutal-white truncate" title={fullName}>
                    {fullName}
                  </div>
                  <div className="text-[10px] text-brutal-muted dark:text-brutal-muted-dark truncate">
                    {user.email}
                  </div>
                  <div className="mt-1.5 inline-block">
                    <BrutalBadge tone="yellow" size="sm">
                      {user.role_code || 'VERIFIED USER'}
                    </BrutalBadge>
                  </div>
                </div>

                {/* DEV / DEMO Role Switching Dropdown Group */}
                {isDevOrDemo && (
                  <div className="mb-2">
                    <div className="px-2 py-1 font-mono text-[10px] font-black uppercase tracking-widest text-brutal-muted dark:text-brutal-muted-dark">
                      Switch Role (DEV/DEMO)
                    </div>
                    <div className="flex flex-col gap-1 mt-1">
                      {DEMO_ROLES.map((role) => {
                        const isCurrent = currentRoleCode === role.code;
                        const isLoading = switchingRole === role.code;

                        return (
                          <button
                            key={role.code}
                            type="button"
                            disabled={isLoading}
                            onClick={() => handleRoleSwitch(role.code)}
                            className={cn(
                              'w-full flex items-center justify-between px-2.5 py-1.5 font-mono text-xs font-bold uppercase border text-left transition-colors',
                              isCurrent
                                ? 'bg-brutal-yellow text-brutal-black border-brutal-black font-black'
                                : 'bg-brutal-paper dark:bg-brutal-dark-surface text-brutal-black dark:text-brutal-white border-transparent hover:border-brutal-black dark:hover:border-brutal-yellow'
                            )}
                          >
                            <span className="truncate">{role.label}</span>
                            {isCurrent && <Check size={14} className="text-brutal-black" />}
                            {isLoading && <span className="text-[10px]">...</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Sign Out Action */}
                <div className="pt-1 border-t-2 border-brutal-black/20 dark:border-brutal-yellow/20">
                  <button
                    type="button"
                    onClick={() => {
                      setUserMenuOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 font-mono text-xs font-bold uppercase text-brutal-accent hover:bg-brutal-accent hover:text-brutal-white border-2 border-transparent hover:border-brutal-black transition-colors"
                  >
                    <LogOut size={14} />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}

            {/* Direct Logout Icon Button */}
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
        ) : null}
      </div>
    </header>
  );
}
