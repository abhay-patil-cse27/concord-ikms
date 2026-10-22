import React, { useState } from 'react';
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
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ activeTab, setActiveTab }) {
  const { hasPermission, user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const navItems = [
    {
      id: 'dashboard',
      label: 'System Overview',
      icon: LayoutDashboard,
      accessible: true,
    },
    {
      id: 'departments',
      label: 'Departments',
      icon: Building2,
      accessible: hasPermission('departments:read'),
      badge: 'RBAC',
    },
    {
      id: 'users',
      label: 'Institutional Users',
      icon: Users,
      accessible: hasPermission('users:read'),
      badge: 'Admin',
    },
    {
      id: 'audit',
      label: 'Security Audit Logs',
      icon: ShieldAlert,
      accessible: hasPermission('audit:read'),
      badge: 'Security',
    },
    {
      id: 'documents',
      label: 'Knowledge Ingestion',
      icon: FileText,
      accessible: true,
      milestone: 'M2',
    },
    {
      id: 'search',
      label: 'Contextual Search',
      icon: Search,
      accessible: true,
      milestone: 'M3',
    },
    {
      id: 'rag',
      label: 'Grounded Q&A (Groq)',
      icon: Bot,
      accessible: true,
      milestone: 'M4',
    },
    {
      id: 'benchmarks',
      label: 'Evaluation & Benchmarks',
      icon: BarChart3,
      accessible: true,
      milestone: 'M7',
      badge: 'Metrics',
    },
  ];

  const sidebarWidth = collapsed ? '72px' : '260px';

  return (
    <aside
      style={{
        width: sidebarWidth,
        minWidth: sidebarWidth,
        maxWidth: sidebarWidth,
        height: 'calc(100vh - var(--navbar-height))',
        position: 'sticky',
        top: 'var(--navbar-height)',
        borderRight: '1px solid var(--border-light)',
        background: 'var(--bg-card)',
        padding: collapsed ? '1.25rem 0.5rem' : '1.25rem 0.85rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.35rem',
        transition: 'width 0.28s cubic-bezier(0.16, 1, 0.3, 1), padding 0.28s ease',
        zIndex: 90,
        overflowX: 'hidden',
        overflowY: 'auto',
      }}
    >
      {/* Header with Collapse Toggle */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          padding: '0 0.5rem',
          marginBottom: '0.75rem',
        }}
      >
        {!collapsed && (
          <span
            style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              color: 'var(--text-dim)',
              textTransform: 'uppercase',
              letterSpacing: '0.07em',
              whiteSpace: 'nowrap',
            }}
          >
            Modules
          </span>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="btn btn-secondary"
          style={{
            padding: '0.35rem',
            borderRadius: '6px',
            border: '1px solid var(--border-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            background: 'var(--bg-secondary)',
          }}
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          aria-label={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
        </button>
      </div>

      {/* Navigation Items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', flex: 1 }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const isLocked = !item.accessible;

          return (
            <button
              key={item.id}
              onClick={() => {
                if (item.accessible) {
                  setActiveTab(item.id);
                }
              }}
              disabled={isLocked}
              className={`sidebar-nav-btn ${isActive ? 'active' : ''}`}
              title={collapsed ? item.label : undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: collapsed ? 'center' : 'space-between',
                padding: collapsed ? '0.75rem 0' : '0.65rem 0.85rem',
                borderRadius: 'var(--radius-md)',
                color: isActive ? 'var(--primary)' : isLocked ? 'var(--text-dim)' : 'var(--text-muted)',
                border: isActive ? '1px solid rgba(56, 189, 248, 0.25)' : '1px solid transparent',
                cursor: isLocked ? 'not-allowed' : 'pointer',
                opacity: isLocked ? 0.45 : 1,
                width: '100%',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  minWidth: 0,
                }}
              >
                <Icon
                  size={18}
                  style={{ flexShrink: 0 }}
                  color={isActive ? 'var(--primary)' : isLocked ? 'var(--text-dim)' : 'currentColor'}
                />
                {!collapsed && (
                  <span
                    style={{
                      fontSize: '0.85rem',
                      fontWeight: isActive ? 600 : 500,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {item.label}
                  </span>
                )}
              </div>

              {!collapsed && (
                <div>
                  {isLocked ? (
                    <Lock size={13} color="var(--text-dim)" />
                  ) : item.milestone ? (
                    <span
                      style={{
                        fontSize: '0.65rem',
                        padding: '0.1rem 0.4rem',
                        borderRadius: '4px',
                        background: 'rgba(255,255,255,0.06)',
                        color: 'var(--text-dim)',
                      }}
                    >
                      {item.milestone}
                    </span>
                  ) : item.badge ? (
                    <span
                      style={{
                        fontSize: '0.65rem',
                        padding: '0.1rem 0.4rem',
                        borderRadius: '4px',
                        background: 'rgba(56, 189, 248, 0.1)',
                        color: 'var(--primary)',
                      }}
                    >
                      {item.badge}
                    </span>
                  ) : null}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer Scope Indicator */}
      {!collapsed && (
        <div
          className="animate-fade-in"
          style={{
            marginTop: 'auto',
            padding: '0.85rem 0.75rem',
            background: 'rgba(255,255,255,0.02)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-light)',
          }}
        >
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
            Effective Scope
          </div>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary)' }}>
            {user?.roles?.[0]?.name || 'Anonymous'}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '0.15rem' }}>
            Server-enforced RBAC
          </div>
        </div>
      )}
    </aside>
  );
}
