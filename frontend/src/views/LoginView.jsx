import React, { useState } from 'react';
import { Shield, ArrowRight, UserCheck, Key, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginView({ onBack }) {
  const { login, demoLogin, error } = useAuth();
  const [email, setEmail] = useState('admin@concord.kit.edu');
  const [password, setPassword] = useState('Admin@12345');
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState(null);

  const demoAccounts = [
    {
      role: 'platform_admin',
      title: 'Platform Administrator',
      email: 'admin@concord.kit.edu',
      desc: 'Institutional oversight across all departments, audit inspection, user & schema governance.',
      badge: 'Superuser',
    },
    {
      role: 'dept_admin',
      title: 'Department Admin (HOD CSE)',
      email: 'deptadmin.cse@concord.kit.edu',
      desc: 'Department-level policy control, document ingestion, and departmental audit logs.',
      badge: 'Dept Scope',
    },
    {
      role: 'faculty',
      title: 'CSE Faculty Member',
      email: 'faculty.cse@concord.kit.edu',
      desc: 'Academic staff access, course notice uploads, and authorized document search.',
      badge: 'Staff',
    },
    {
      role: 'student',
      title: 'Enrolled Student',
      email: 'student.cse@concord.kit.edu',
      desc: 'Read-only access to published circulars, academic syllabi, and student Q&A.',
      badge: 'Student',
    },
  ];

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setLocalError(null);
    try {
      await login(email, password);
    } catch (err) {
      setLocalError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSelect = async (roleCode) => {
    setLoading(true);
    setLocalError(null);
    try {
      await demoLogin(roleCode);
    } catch (err) {
      setLocalError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ width: '100%', maxWidth: '1000px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2.5rem', alignItems: 'center' }}>
        
        {/* Left Column: Mission & Demo Switcher */}
        <div>
          {onBack && (
            <button
              onClick={onBack}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.85rem',
                color: 'var(--text-muted)',
                marginBottom: '1rem',
                cursor: 'pointer',
              }}
            >
              ← Back to Overview
            </button>
          )}

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'var(--status-info-bg)', border: '1px solid rgba(2, 132, 199, 0.25)', borderRadius: 'var(--radius-full)', padding: '0.35rem 0.85rem', marginBottom: '1.25rem' }}>
            <Shield size={16} color="var(--primary)" />
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary)' }}>CONCORD Institutional Gateway</span>
          </div>

          <h1 style={{ fontSize: '2.25rem', fontWeight: 700, lineHeight: 1.15, marginBottom: '1rem', color: 'var(--text-main)' }}>
            Institutional Identity & Personas
          </h1>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', marginBottom: '2rem', lineHeight: 1.6 }}>
            Context-Oriented Cognitive Memory Layer for Multi-Source Knowledge Integration, Adaptive Retrieval, and Governed Institutional Intelligence.
          </p>

          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.75rem' }}>
            Select Institutional Persona to Pre-fill Credentials:
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {demoAccounts.map((acc) => (
              <button
                key={acc.role}
                type="button"
                onClick={() => {
                  setEmail(acc.email);
                  // Populate matching pre-seeded password
                  if (acc.role === 'platform_admin') setPassword('Admin@12345');
                  else if (acc.role === 'dept_admin') setPassword('Dept@12345');
                  else if (acc.role === 'faculty') setPassword('Faculty@12345');
                  else if (acc.role === 'student') setPassword('Student@12345');
                }}
                className="glass-panel"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.85rem 1rem',
                  textAlign: 'left',
                  cursor: 'pointer',
                  border: email === acc.email ? '1px solid var(--primary)' : '1px solid var(--border-card)',
                  background: email === acc.email ? 'var(--status-info-bg)' : 'var(--bg-card)',
                  transition: 'var(--transition)',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>{acc.title}</span>
                    <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>{acc.badge}</span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>{acc.email}</div>
                </div>
                <ArrowRight size={16} color="var(--primary)" />
              </button>
            ))}
          </div>
        </div>

        {/* Right Column: Password Login Form */}
        <div className="glass-panel" style={{ padding: '2.5rem' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 600, marginBottom: '0.35rem' }}>Sign In with Credentials</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Standard JWT password authentication with server-enforced access checks.
            </p>
          </div>

          {(localError || error) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', background: 'var(--status-danger-bg)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', color: 'var(--status-danger)', fontSize: '0.85rem' }}>
              <AlertCircle size={16} />
              <span>{localError || error}</span>
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                Institutional Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@concord.kit.edu"
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                Account Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                style={{ width: '100%' }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.8rem', marginTop: '0.5rem' }}
            >
              {loading ? 'Authenticating...' : 'Sign In to Dashboard'}
            </button>
          </form>

          <div style={{ marginTop: '1.5rem', padding: '0.85rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', fontSize: '0.75rem', color: 'var(--text-dim)', textAlign: 'center' }}>
            Secured via PBKDF2 / Bcrypt & HMAC-SHA256 tokens per OWASP ASVS 5.0.
          </div>
        </div>

      </div>
    </div>
  );
}
