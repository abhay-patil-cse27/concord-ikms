import React from 'react';
import { motion } from 'framer-motion';
import { User, Shield, Check, X, ShieldAlert } from 'lucide-react';
import { BrutalTable, BrutalBadge } from '../brutal';
import { variants } from '../../motion/presets';

/**
 * UsersTable
 * Brutal table displaying user identities, assigned roles, status chips, and registration date.
 */
export default function UsersTable({ users, onToggleStatus }) {
  const headers = [
    'User Identity',
    'Email Address',
    'Assigned Role(s)',
    'Status',
    { label: 'Registered', className: 'text-right' },
  ];

  return (
    <div className="w-full">
      <BrutalTable headers={headers} stickyHeader>
        {users.map((u) => (
          <motion.tr
            key={u.id}
            variants={variants.staggerItem}
            className="border-b-2 border-brutal-black/20 dark:border-brutal-yellow/20 font-mono text-xs hover:bg-brutal-yellow/10 transition-colors"
          >
            {/* Identity */}
            <td className="p-3.5 whitespace-nowrap">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 bg-brutal-black text-brutal-yellow border border-brutal-black flex items-center justify-center font-bold text-xs flex-shrink-0">
                  {u.full_name ? u.full_name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div>
                  <div className="font-sans font-bold text-sm text-brutal-black dark:text-brutal-white truncate max-w-xs">
                    {u.full_name || 'Institutional Member'}
                  </div>
                  {u.registration_number && (
                    <div className="text-[10px] text-brutal-muted dark:text-brutal-muted-dark font-mono">
                      ID: {u.registration_number}
                    </div>
                  )}
                </div>
              </div>
            </td>

            {/* Email */}
            <td className="p-3.5 whitespace-nowrap text-brutal-black/80 dark:text-brutal-white/80">
              {u.email}
            </td>

            {/* Roles */}
            <td className="p-3.5">
              <div className="flex items-center gap-1.5 flex-wrap">
                {u.roles?.map((r) => (
                  <BrutalBadge
                    key={r.code}
                    tone={r.code === 'platform_admin' ? 'yellow' : r.code.includes('dept') ? 'black' : 'paper'}
                    size="sm"
                  >
                    {r.name}
                  </BrutalBadge>
                ))}
              </div>
            </td>

            {/* Status */}
            <td className="p-3.5 whitespace-nowrap">
              <button
                type="button"
                onClick={() => onToggleStatus && onToggleStatus(u)}
                className="cursor-pointer"
                title="Click to toggle account status"
              >
                <BrutalBadge
                  tone={u.is_active ? 'success' : 'accent'}
                  size="sm"
                  dot
                >
                  {u.is_active ? 'ACTIVE' : 'DEACTIVATED'}
                </BrutalBadge>
              </button>
            </td>

            {/* Registered Date */}
            <td className="p-3.5 text-right whitespace-nowrap text-brutal-muted dark:text-brutal-muted-dark text-[11px]">
              {new Date(u.created_at).toLocaleDateString()}
            </td>
          </motion.tr>
        ))}
      </BrutalTable>
    </div>
  );
}
