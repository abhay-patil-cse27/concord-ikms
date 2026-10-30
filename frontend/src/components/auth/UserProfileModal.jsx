import React from 'react';
import { 
  Shield, 
  Building2, 
  Hash, 
  Mail, 
  Key, 
  Clock, 
  CheckCircle2, 
  LogOut,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { BrutalModal, BrutalBadge, BrutalButton } from '../brutal';
import { useAuth } from '../../context/AuthContext';

/**
 * UserProfileModal
 * Official KIT Autonomous Institutional Digital Identity Card.
 * Displays user identity, academic department, registration PRN/EmpID,
 * active ASVS permissions, and cryptographic session fingerprint.
 */
export default function UserProfileModal({ isOpen, onClose }) {
  const { user, logout } = useAuth();

  if (!isOpen || !user) return null;

  const role = user.roles?.[0] || { name: 'Institutional Member', code: user.role_code || 'student' };
  const roleCode = role.code || user.role_code || 'student';
  const permissions = role.permissions || [];
  const deptName = user.department?.name || user.department?.code || (user.primary_department_id ? 'Assigned Academic Dept' : 'Institutional Platform');
  const regNo = user.registration_number || (roleCode === 'platform_admin' ? 'ROOT-SUPERADMIN' : 'PRN-NOT-LOGGED');

  return (
    <BrutalModal
      isOpen={isOpen}
      onClose={onClose}
      title="Institutional Digital Identity Card"
      size="lg"
    >
      <div className="space-y-6">
        {/* Top Digital ID Card Frame */}
        <div className="bg-brutal-paper dark:bg-brutal-dark-surface border-3 border-brutal-black dark:border-brutal-yellow p-5 sm:p-6 shadow-brutal flex flex-col gap-4">
          {/* Header Strip */}
          <div className="flex items-center justify-between pb-3 border-b-2 border-brutal-black/20 dark:border-brutal-yellow/20">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-brutal-yellow border-2 border-brutal-black flex items-center justify-center font-black text-xs text-brutal-black shadow-brutal-sm">
                KIT
              </div>
              <div>
                <div className="font-display font-black text-xs tracking-tight uppercase text-brutal-black dark:text-brutal-white">
                  Kolhapur Institute of Technology
                </div>
                <div className="font-mono text-[9px] text-brutal-muted dark:text-brutal-muted-dark uppercase tracking-wider">
                  Autonomous Regulations 2024 • Academic Memory Node
                </div>
              </div>
            </div>

            <BrutalBadge tone="success" size="sm" dot>
              {user.approval_status ? user.approval_status.toUpperCase() : 'ACTIVE'}
            </BrutalBadge>
          </div>

          {/* Identity Block */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-1">
            <div className="w-16 h-16 bg-brutal-black text-brutal-yellow border-2 border-brutal-black dark:border-brutal-yellow flex items-center justify-center font-display font-black text-2xl flex-shrink-0 shadow-brutal-sm">
              {user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
            </div>

            <div className="space-y-1">
              <h2 className="font-display font-black text-xl uppercase tracking-tight text-brutal-black dark:text-brutal-white">
                {user.full_name || 'Institutional Member'}
              </h2>
              
              <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
                <div className="flex items-center gap-1 text-brutal-black/80 dark:text-brutal-white/80">
                  <Mail size={12} className="text-brutal-muted" />
                  <span>{user.email}</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1 font-bold text-brutal-black dark:text-brutal-yellow">
                  <Building2 size={12} />
                  <span>{deptName}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <BrutalBadge
                  tone={roleCode === 'platform_admin' ? 'yellow' : roleCode.includes('dept') ? 'black' : 'paper'}
                  size="sm"
                >
                  {role.name || roleCode.toUpperCase()}
                </BrutalBadge>
                
                <div className="flex items-center gap-1 font-mono text-[11px] font-bold text-brutal-muted dark:text-brutal-muted-dark bg-brutal-white dark:bg-brutal-dark px-2 py-0.5 border border-brutal-black/30 dark:border-brutal-yellow/30">
                  <Hash size={11} />
                  <span>ID: {regNo}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Permissions & Scopes */}
        <div className="border-2 border-brutal-black dark:border-brutal-yellow bg-brutal-white dark:bg-brutal-dark p-4 shadow-brutal-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="font-mono text-xs font-black uppercase tracking-wider text-brutal-black dark:text-brutal-white flex items-center gap-2">
              <Key size={14} className="text-brutal-yellow" />
              <span>Granted Access Scopes (ASVS 4.1 RBAC)</span>
            </div>
            <span className="font-mono text-[10px] text-brutal-muted">
              {roleCode === 'platform_admin' ? 'Superuser Scope' : `${permissions.length} Grants`}
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5 pt-1">
            {roleCode === 'platform_admin' ? (
              <span className="font-mono text-xs font-black text-brutal-black dark:text-brutal-yellow bg-brutal-yellow/20 px-2.5 py-1 border border-brutal-black dark:border-brutal-yellow">
                * SYSTEM:ADMIN (FULL INSTITUTIONAL CATALOG & LEDGER OVERRIDE)
              </span>
            ) : permissions.length > 0 ? (
              permissions.map((p) => (
                <span
                  key={typeof p === 'string' ? p : p.code}
                  className="font-mono text-[10px] font-bold px-2 py-0.5 bg-brutal-paper dark:bg-brutal-dark-surface border border-brutal-black/30 dark:border-brutal-yellow/30 text-brutal-black dark:text-brutal-white"
                >
                  {typeof p === 'string' ? p : p.code}
                </span>
              ))
            ) : (
              <span className="font-mono text-[11px] text-brutal-muted italic">
                Standard read-only academic catalog privileges.
              </span>
            )}
          </div>
        </div>

        {/* Security & Cryptographic Session Footprint */}
        <div className="p-3 bg-brutal-paper dark:bg-brutal-dark border-2 border-brutal-black/20 dark:border-brutal-yellow/20 font-mono text-[11px] space-y-1.5 text-brutal-muted dark:text-brutal-muted-dark">
          <div className="flex justify-between">
            <span>Session Protocol:</span>
            <span className="text-brutal-black dark:text-brutal-white font-bold">HMAC-SHA256 JWT Bearer</span>
          </div>
          <div className="flex justify-between">
            <span>Token Security Boundary:</span>
            <span className="text-brutal-black dark:text-brutal-white font-bold">Client-Scoped In-Memory State</span>
          </div>
          <div className="flex justify-between">
            <span>Account UUID:</span>
            <span className="text-brutal-black dark:text-brutal-white font-mono text-[10px]">
              {user.id || 'usr-local-session'}
            </span>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center justify-between pt-2 border-t-2 border-brutal-black/20 dark:border-brutal-yellow/20">
          <BrutalButton
            variant="outline"
            size="sm"
            onClick={onClose}
            className="font-mono text-xs uppercase font-bold"
          >
            Close Card
          </BrutalButton>

          <BrutalButton
            variant="accent"
            size="sm"
            onClick={() => {
              onClose();
              logout();
            }}
            className="font-mono text-xs uppercase font-bold flex items-center gap-1.5"
          >
            <LogOut size={13} />
            <span>Sign Out</span>
          </BrutalButton>
        </div>
      </div>
    </BrutalModal>
  );
}

