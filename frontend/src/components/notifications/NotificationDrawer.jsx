import React, { useState, useEffect } from 'react';
import {
  Bell,
  X,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  ShieldCheck,
  Info,
  Clock,
  ArrowRight,
  Trash2,
  Cpu,
} from 'lucide-react';
import { BrutalBadge, BrutalButton } from '../brutal';
import { cn } from '../../lib/utils';
import { api } from '../../api/client';

/**
 * NotificationDrawer
 * Expandable Yellow Brutalist slide-over drawer displaying institutional
 * clearance requests, governance signals, and system bulletins.
 */
export default function NotificationDrawer({
  isOpen,
  onClose,
  user,
  pendingApprovalsCount = 0,
}) {

  // Initial institutional notifications generated based on user state
  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem(`ikms_notifs_${user?.id || 'guest'}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }

    const initial = [
      {
        id: 'notif-identity-cleared',
        title: 'Institutional Clearance Verified',
        message: `Account clearance active for ${user?.full_name || 'KIT Member'} with role ${user?.role_code || 'Verified User'}.`,
        type: 'success',
        timestamp: 'Just now',
        read: false,
        icon: 'ShieldCheck',
      },
      {
        id: 'notif-ledger-active',
        title: 'Audit Ledger Operational',
        message: 'Cryptographic SHA-256 tamper-evident ledger tracking institutional compliance.',
        type: 'info',
        timestamp: '10m ago',
        read: true,
        icon: 'Info',
      },
      {
        id: 'notif-security-baseline',
        title: 'OWASP ASVS L2 Enforcement',
        message: 'Strict role-based access control and tenant isolation rules enforced across API gateways.',
        type: 'info',
        timestamp: '1h ago',
        read: true,
        icon: 'Info',
      },
    ];

    return initial;
  });

  useEffect(() => {
    if (user?.id) {
      localStorage.setItem(`ikms_notifs_${user.id}`, JSON.stringify(notifications));
    }
  }, [notifications, user?.id]);

  // Synchronize live active AI engine status when notification drawer opens
  useEffect(() => {
    if (!isOpen) return;
    api.getLLMStatus()
      .then((res) => {
        if (res?.status) {
          const { is_local, display_name } = res.status;
          setNotifications((prev) => {
            const hasEngineNotice = prev.some((n) => n.id === 'notif-engine-active');
            const engineNotice = {
              id: 'notif-engine-active',
              title: is_local ? 'Local Campus Node Active' : 'Groq Cloud Engine Active',
              message: `Inference routing currently directed to ${display_name}.`,
              type: 'info',
              timestamp: 'Live',
              read: false,
              icon: 'Cpu',
            };
            if (hasEngineNotice) {
              return prev.map((n) => (n.id === 'notif-engine-active' ? engineNotice : n));
            }
            return [engineNotice, ...prev];
          });
        }
      })
      .catch(() => {});
  }, [isOpen]);

  if (!isOpen) return null;

  const unreadCount =
    notifications.filter((n) => !n.read).length + (pendingApprovalsCount > 0 ? 1 : 0);

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const dismissNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const getIcon = (iconName) => {
    switch (iconName) {
      case 'ShieldCheck':
        return <ShieldCheck size={18} className="text-emerald-500" strokeWidth={2.5} />;
      case 'AlertTriangle':
        return <AlertTriangle size={18} className="text-amber-500" strokeWidth={2.5} />;
      case 'UserCheck':
        return <UserCheck size={18} className="text-brutal-black dark:text-brutal-yellow" strokeWidth={2.5} />;
      case 'Cpu':
        return <Cpu size={18} className="text-brutal-black dark:text-brutal-yellow" strokeWidth={2.5} />;
      default:
        return <Info size={18} className="text-blue-500" strokeWidth={2.5} />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-md bg-brutal-white dark:bg-brutal-dark border-l-4 border-brutal-black dark:border-brutal-yellow shadow-brutal-lg h-full flex flex-col justify-between"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-4 bg-brutal-yellow text-brutal-black border-b-3 border-brutal-black flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-brutal-black text-brutal-yellow flex items-center justify-center border-2 border-brutal-black shadow-brutal-sm">
              <Bell size={18} strokeWidth={2.5} />
            </div>
            <div>
              <div className="font-display font-black text-sm uppercase tracking-wider">
                Notifications Center
              </div>
              <div className="font-mono text-[10px] uppercase font-bold tracking-tight text-brutal-black/80">
                Institutional Alert & Clearance Hub
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 bg-brutal-white text-brutal-black border-2 border-brutal-black shadow-brutal-sm hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
            aria-label="Close notification drawer"
          >
            <X size={16} strokeWidth={3} />
          </button>
        </div>

        {/* Action Controls Subheader */}
        <div className="px-4 py-2.5 bg-brutal-paper dark:bg-brutal-dark-surface border-b-2 border-brutal-black/20 dark:border-brutal-yellow/20 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="font-bold text-brutal-black dark:text-brutal-white">
              Status:
            </span>
            <BrutalBadge tone={unreadCount > 0 ? 'accent' : 'yellow'} size="sm">
              {unreadCount} Unread
            </BrutalBadge>
          </div>

          <div className="flex items-center gap-3">
            {notifications.some((n) => !n.read) && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="text-[11px] font-bold text-brutal-black dark:text-brutal-yellow hover:underline flex items-center gap-1"
              >
                <CheckCircle2 size={13} />
                <span>Mark Read</span>
              </button>
            )}
            {notifications.length > 0 && (
              <button
                type="button"
                onClick={clearAll}
                className="text-[11px] font-bold text-brutal-accent hover:underline flex items-center gap-1"
              >
                <Trash2 size={13} />
                <span>Clear</span>
              </button>
            )}
          </div>
        </div>

        {/* Notification Scrollable Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono">
          {/* Priority Clearance Banner for Admins/HODs */}
          {pendingApprovalsCount > 0 && (
            <div className="p-3 bg-brutal-yellow/20 dark:bg-brutal-yellow/10 border-2 border-brutal-black dark:border-brutal-yellow shadow-brutal-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 bg-brutal-accent border border-brutal-black animate-ping" />
                  <span className="font-display font-black text-xs uppercase tracking-wide text-brutal-black dark:text-brutal-white">
                    Action Required
                  </span>
                </div>
                <BrutalBadge tone="accent" size="sm">
                  {pendingApprovalsCount} Pending
                </BrutalBadge>
              </div>

              <div className="text-xs text-brutal-black dark:text-brutal-white mt-2 leading-relaxed">
                Institutional applicant accounts are awaiting departmental verification and clearance.
              </div>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  window.location.hash = '#users';
                }}
                className="mt-3 w-full py-1.5 px-2 bg-brutal-black text-brutal-yellow border-2 border-brutal-black font-display font-black text-xs uppercase tracking-wider shadow-brutal-sm hover:translate-x-0.5 hover:translate-y-0.5 transition-all flex items-center justify-center gap-1.5"
              >
                <span>Open Approval Queue</span>
                <ArrowRight size={14} strokeWidth={2.5} />
              </button>
            </div>
          )}

          {/* Regular Notifications List */}
          {notifications.length === 0 && pendingApprovalsCount === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-brutal-black/30 dark:border-brutal-yellow/30 text-brutal-muted dark:text-brutal-muted-dark">
              <Bell size={32} className="mb-2 opacity-40" />
              <div className="font-display font-bold text-xs uppercase">No Notifications</div>
              <div className="text-[11px] mt-1">All institutional dispatches are read and up to date.</div>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={cn(
                  'p-3 border-2 transition-all relative',
                  n.read
                    ? 'bg-brutal-paper dark:bg-brutal-dark-surface border-brutal-black/30 dark:border-brutal-yellow/30 opacity-80'
                    : 'bg-brutal-white dark:bg-brutal-dark border-brutal-black dark:border-brutal-yellow shadow-brutal-sm'
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1 bg-brutal-paper dark:bg-brutal-dark border border-brutal-black/40 dark:border-brutal-yellow/40">
                      {getIcon(n.icon)}
                    </div>
                    <div className="text-xs font-black text-brutal-black dark:text-brutal-white">
                      {n.title}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => dismissNotification(n.id)}
                    className="text-brutal-muted dark:text-brutal-muted-dark hover:text-brutal-accent transition-colors p-0.5"
                    title="Dismiss"
                  >
                    <X size={13} />
                  </button>
                </div>

                <p className="text-[11px] text-brutal-black/80 dark:text-brutal-white/80 mt-1.5 leading-snug">
                  {n.message}
                </p>

                <div className="mt-2 flex items-center justify-between text-[10px] text-brutal-muted dark:text-brutal-muted-dark">
                  <span className="flex items-center gap-1">
                    <Clock size={11} />
                    {n.timestamp}
                  </span>
                  {!n.read && (
                    <span className="w-2 h-2 rounded-full bg-brutal-accent" title="Unread" />
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Drawer Footer Status */}
        <div className="p-3 bg-brutal-paper dark:bg-brutal-dark-surface border-t-2 border-brutal-black dark:border-brutal-yellow flex items-center justify-between font-mono text-[10px]">
          <span className="text-brutal-muted dark:text-brutal-muted-dark uppercase tracking-wider">
            IKMS PROTOCOL NOTIFICATION SYSTEM
          </span>
          <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            LIVE
          </span>
        </div>
      </div>
    </div>
  );
}
