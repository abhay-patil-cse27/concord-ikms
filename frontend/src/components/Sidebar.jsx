import React from 'react';
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  ShieldAlert, 
  FileText, 
  Search,
  Bot,
  Lock,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ activeTab, setActiveTab }) {
  const { hasPermission, user } = useAuth();

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
  ];

  return (
    <aside
      style={{
        width: 'var(--sidebar-width)',
        borderRight: '1px solid var(--border-light)',
        background: 'var(--bg-card)',
        padding: '1.5rem 1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.4rem',
      }}
    >
      <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '0 0.75rem', marginBottom: '0.5rem' }}>
        Core Platform Modules
      </div>

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
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.7rem 0.85rem',
              borderRadius: 'var(--radius-md)',
              background: isActive ? 'rgba(56, 189, 248, 0.12)' : 'transparent',
              color: isActive ? 'var(--primary)' : isLocked ? 'var(--text-dim)' : 'var(--text-muted)',
              border: isActive ? '1px solid rgba(56, 189, 248, 0.25)' : '1px solid transparent',
              cursor: isLocked ? 'not-allowed' : 'pointer',
              opacity: isLocked ? 0.45 : 1,
              transition: 'var(--transition)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Icon size={18} color={isActive ? 'var(--primary)' : isLocked ? 'var(--text-dim)' : 'currentColor'} />
              <span style={{ fontSize: '0.85rem', fontWeight: isActive ? 600 : 500 }}>
                {item.label}
              </span>
            </div>

            {isLocked ? (
              <Lock size={14} color="var(--text-dim)" />
            ) : item.milestone ? (
              <span style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem', borderRadius: '4px', background: 'rgba(255,255,255,0.06)', color: 'var(--text-dim)' }}>
                {item.milestone}
              </span>
            ) : item.badge ? (
              <span style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem', borderRadius: '4px', background: 'rgba(56, 189, 248, 0.1)', color: 'var(--primary)' }}>
                {item.badge}
              </span>
            ) : null}
          </button>
        );
      })}

      <div style={{ marginTop: 'auto', padding: '1rem 0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
          Effective Scope
        </div>
        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary)' }}>
          {user?.roles?.[0]?.name || 'Anonymous'}
        </div>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
          Server-enforced RBAC (ASVS 4.1)
        </div>
      </div>
    </aside>
  );
}
