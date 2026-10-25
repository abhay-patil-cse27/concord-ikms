import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  ShieldAlert, 
  FileText, 
  Search,
  Bot,
  BarChart3,
  Lock,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';
import NavItem from './layout/NavItem';

/**
 * Sidebar
 * Modular Yellow Brutalist sidebar navigation.
 * Desktop: Smooth spring transition for expanding and collapsing.
 * Mobile: Slide-in drawer with solid dark backdrop.
 */
export default function Sidebar({
  activeTab,
  setActiveTab,
  isMobileOpen = false,
  onCloseMobile
}) {
  const { hasPermission, user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const navItems = [
    {
      id: 'dashboard',
      label: 'Overview',
      tooltip: 'System Overview & Institutional Health',
      icon: LayoutDashboard,
      accessible: true,
    },
    {
      id: 'departments',
      label: 'Departments',
      tooltip: 'Institutional Academic Departments',
      icon: Building2,
      accessible: hasPermission('departments:read'),
      badge: 'RBAC',
    },
    {
      id: 'users',
      label: 'Users',
      tooltip: 'User Directory & Role Assignments',
      icon: Users,
      accessible: hasPermission('users:read'),
      badge: 'Admin',
    },
    {
      id: 'audit',
      label: 'Audit Logs',
      tooltip: 'Cryptographic SHA-256 Security Audit Ledger',
      icon: ShieldAlert,
      accessible: hasPermission('audit:read'),
      badge: 'SHA-256',
    },
    {
      id: 'documents',
      label: 'Ingestion',
      tooltip: 'Knowledge Ingestion & OCR Pipeline',
      icon: FileText,
      accessible: true,
      badge: 'OCR',
    },
    {
      id: 'search',
      label: 'Search',
      tooltip: 'Hybrid RRF Contextual Search',
      icon: Search,
      accessible: true,
      badge: 'RRF',
    },
    {
      id: 'rag',
      label: 'Grounded Q&A',
      tooltip: 'Grounded Institutional Q&A (Groq LLM)',
      icon: Bot,
      accessible: true,
      badge: 'AI',
    },
    {
      id: 'benchmarks',
      label: 'Benchmarks',
      tooltip: 'System Evaluation & Benchmarks (M7/M8)',
      icon: BarChart3,
      accessible: true,
      badge: 'M7/M8',
    },
  ];

  const handleSelectTab = (id) => {
    setActiveTab(id);
    if (isMobileOpen && onCloseMobile) {
      onCloseMobile();
    }
  };

  const renderNavContent = (isMobile = false) => (
    <div className="h-full flex flex-col justify-between select-none p-3 overflow-hidden">
      {/* Top Header & Collapse Toggle */}
      <div>
        <div className="flex items-center justify-between gap-2 px-1 pb-3 mb-2 border-b-2 border-brutal-black/20 dark:border-brutal-yellow/20">
          {(!collapsed || isMobile) && (
            <span className="font-mono text-[10px] font-black uppercase tracking-widest text-brutal-muted dark:text-brutal-muted-dark truncate">
              Core Navigation
            </span>
          )}

          {/* Desktop collapse toggle */}
          {!isMobile && (
            <button
              type="button"
              onClick={() => setCollapsed(!collapsed)}
              className="hidden md:flex p-1.5 border-2 border-brutal-black dark:border-brutal-yellow bg-brutal-paper dark:bg-brutal-dark-surface hover:bg-brutal-yellow hover:text-brutal-black transition-colors"
              title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
              aria-label={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>
          )}

          {/* Mobile close toggle */}
          {isMobile && onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="p-1.5 border-2 border-brutal-black bg-brutal-yellow text-brutal-black"
              aria-label="Close Navigation Drawer"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Navigation Item Stack */}
        <nav className="flex flex-col gap-1.5" aria-label="Sidebar Navigation">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            const isAccessible = item.accessible;

            if (!isAccessible) {
              return (
                <div
                  key={item.id}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 border-2 border-transparent text-brutal-muted/50 dark:text-brutal-muted-dark/40 font-mono text-xs font-bold uppercase cursor-not-allowed select-none',
                    (collapsed && !isMobile) && 'justify-center'
                  )}
                  title={`${item.label} (Access Restricted)`}
                >
                  <Lock size={16} className="flex-shrink-0" />
                  {(!collapsed || isMobile) && <span className="truncate">{item.label}</span>}
                </div>
              );
            }

            return (
              <NavItem
                key={item.id}
                icon={item.icon}
                label={item.label}
                tooltip={item.tooltip}
                badge={item.badge}
                isActive={isActive}
                isCollapsed={collapsed && !isMobile}
                onClick={() => handleSelectTab(item.id)}
              />
            );
          })}
        </nav>
      </div>

      {/* Footer Scope Card */}
      {(!collapsed || isMobile) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="mt-4 p-3 bg-brutal-paper dark:bg-brutal-dark-surface border-2 border-brutal-black dark:border-brutal-yellow shadow-brutal-sm"
        >
          <div className="flex items-center gap-1.5 mb-1 text-brutal-black dark:text-brutal-yellow">
            <ShieldCheck size={14} />
            <span className="font-mono text-[10px] font-black uppercase tracking-wider">
              Enforced Scope
            </span>
          </div>
          <div className="font-mono text-xs font-black text-brutal-black dark:text-brutal-white truncate">
            {user?.roles?.[0]?.name || user?.role_code || 'STUDENT CSE'}
          </div>
          <div className="font-mono text-[9px] text-brutal-muted dark:text-brutal-muted-dark uppercase mt-0.5">
            0.0% Security Leakage Gate
          </div>
        </motion.div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Animated Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 76 : 256 }}
        transition={{ type: 'spring', stiffness: 420, damping: 32 }}
        className="hidden md:flex flex-col h-full flex-shrink-0 bg-brutal-white dark:bg-brutal-dark border-r-3 border-brutal-black dark:border-brutal-yellow z-30 overflow-hidden"
      >
        {renderNavContent(false)}
      </motion.aside>

      {/* Mobile Slide-in Drawer with Backdrop */}
      <AnimatePresence>
        {isMobileOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex">
            {/* Flat dark backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onCloseMobile}
              className="fixed inset-0 bg-brutal-black/80"
              aria-hidden="true"
            />
            {/* Drawer Panel */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              className="relative w-72 max-w-[85vw] h-full z-10 bg-brutal-white dark:bg-brutal-dark border-r-3 border-brutal-black dark:border-brutal-yellow shadow-brutal-lg"
            >
              {renderNavContent(true)}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
