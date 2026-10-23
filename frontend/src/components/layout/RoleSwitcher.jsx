import React, { useState } from 'react';
import { UserCheck, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';
import { BrutalButton } from '../brutal';

const DEMO_ROLES = [
  { code: 'platform_admin', label: 'Admin', desc: 'Global Clearance' },
  { code: 'dept_admin_cse', label: 'HOD CSE', desc: 'Department Admin' },
  { code: 'faculty_cse', label: 'Faculty', desc: 'Staff Scope' },
  { code: 'student_cse', label: 'Student', desc: 'Read-Only Tenant' },
];

/**
 * RoleSwitcher
 * Tactile pill group allowing instant switching across institutional personas.
 */
export default function RoleSwitcher({ className = '' }) {
  const { user, switchDemoRole } = useAuth();
  const [loadingCode, setLoadingCode] = useState(null);

  const handleSwitch = async (roleCode) => {
    try {
      setLoadingCode(roleCode);
      await switchDemoRole(roleCode);
    } catch (e) {
      console.error('Failed to switch demo role:', e);
    } finally {
      setLoadingCode(null);
    }
  };

  const currentRoleCode = user?.role_code || user?.roles?.[0]?.code || 'student_cse';

  return (
    <div className={cn('flex items-center gap-1.5 p-1 bg-brutal-paper dark:bg-brutal-dark border-2 border-brutal-black dark:border-brutal-yellow shadow-brutal-sm', className)}>
      <span className="hidden lg:flex items-center gap-1.5 font-mono text-[10px] font-black uppercase text-brutal-black dark:text-brutal-white px-2">
        <UserCheck size={12} className="text-brutal-black dark:text-brutal-yellow" />
        Role:
      </span>

      <div className="flex items-center gap-1">
        {DEMO_ROLES.map((role) => {
          const isActive = currentRoleCode === role.code;
          const isLoading = loadingCode === role.code;

          return (
            <button
              key={role.code}
              type="button"
              disabled={isLoading}
              onClick={() => handleSwitch(role.code)}
              className={cn(
                'px-2.5 py-1 font-mono text-[11px] font-black uppercase tracking-tight border-2 transition-all duration-75',
                isActive
                  ? 'bg-brutal-yellow text-brutal-black border-brutal-black shadow-brutal-sm -translate-y-0.5'
                  : 'bg-brutal-white dark:bg-brutal-dark-surface text-brutal-black dark:text-brutal-white border-brutal-black/30 dark:border-brutal-yellow/30 hover:border-brutal-black hover:bg-brutal-paper'
              )}
              title={role.desc}
            >
              {isLoading ? '...' : role.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
