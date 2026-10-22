import React from 'react';
import { Shield, UserCircle, LogOut, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout, demoLogin } = useAuth();

  const handleRoleSwitch = (roleCode) => {
    demoLogin(roleCode).catch((err) => alert(err.message));
  };

  return (
    <header
      style={{
        height: 'var(--navbar-height)',
        borderBottom: '1px solid var(--border-light)',
        background: 'rgba(10, 13, 20, 0.85)',
        backdropFilter: 'blur(16px)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 2rem',
      }}
    >
      {/* Brand Identity */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px rgba(56, 189, 248, 0.4)',
          }}
        >
          <Shield size={22} color="#041226" />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.15rem', fontWeight: 700, letterSpacing: '-0.02em', color: '#fff' }}>
              CONCORD
            </span>
            <span className="badge badge-info" style={{ fontSize: '0.65rem', padding: '0.15rem 0.45rem' }}>
              KIT Institutional v0.1
            </span>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            Knowledge Integration & Trust-Aware Intelligence Layer
          </div>
        </div>
      </div>

      {/* Right Controls: Demo Role Quick Switcher & User Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        {/* Fast Role Switcher for Evaluators */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            background: 'rgba(255,255,255,0.03)',
            padding: '0.3rem 0.5rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-light)',
          }}
        >
          <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginRight: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
            <RefreshCw size={12} /> Switch Role:
          </span>
          {[
            { code: 'platform_admin', label: 'Admin' },
            { code: 'dept_admin', label: 'HOD' },
            { code: 'faculty', label: 'Faculty' },
            { code: 'student', label: 'Student' },
          ].map((r) => {
            const isActive = user?.roles?.some((role) => role.code === r.code);
            return (
              <button
                key={r.code}
                onClick={() => handleRoleSwitch(r.code)}
                style={{
                  fontSize: '0.72rem',
                  padding: '0.2rem 0.5rem',
                  borderRadius: 'var(--radius-sm)',
                  background: isActive ? 'var(--primary)' : 'transparent',
                  color: isActive ? '#041226' : 'var(--text-muted)',
                  fontWeight: isActive ? 600 : 400,
                  transition: 'all 0.15s ease',
                }}
              >
                {r.label}
              </button>
            );
          })}
        </div>

        {/* User Card */}
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                {user.full_name}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                {user.email}
              </div>
            </div>

            <button
              onClick={logout}
              title="Sign Out"
              className="btn btn-ghost"
              style={{ padding: '0.4rem', borderRadius: 'var(--radius-md)' }}
            >
              <LogOut size={18} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
