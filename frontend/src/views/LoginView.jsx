import React, { useState } from 'react';
import { Shield, ArrowRight, ArrowLeft, AlertCircle, CheckCircle2, Lock, UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { BrutalButton, BrutalCard, BrutalBadge, BrutalInput } from '../components/brutal';
import ThemeToggle from '../components/layout/ThemeToggle';
import { cn } from '../lib/utils';

const DEMO_ACCOUNTS = [
  {
    role: 'platform_admin',
    title: 'Platform Administrator',
    email: 'admin@concord.kit.edu',
    password: 'Admin@12345',
    desc: 'Full college-wide institutional catalog, security ledger audits, and system configuration.',
    badge: 'Superuser',
    badgeTone: 'yellow',
  },
  {
    role: 'dept_admin',
    title: 'Department Admin (HOD CSE)',
    email: 'deptadmin.cse@concord.kit.edu',
    password: 'Dept@12345',
    desc: 'Department policy control, circular and syllabus ingestion, and departmental audit logs.',
    badge: 'HOD Scope',
    badgeTone: 'black',
  },
  {
    role: 'faculty',
    title: 'CSE Faculty Member',
    email: 'faculty.cse@concord.kit.edu',
    password: 'Faculty@12345',
    desc: 'Academic staff access, course circular uploads, exam rubrics, and verified document search.',
    badge: 'Staff Scope',
    badgeTone: 'paper',
  },
  {
    role: 'student',
    title: 'Enrolled Student',
    email: 'student.cse@concord.kit.edu',
    password: 'Student@12345',
    desc: 'Read-only access to published circulars, academic syllabi, and grounded AI assistant.',
    badge: 'Student Scope',
    badgeTone: 'paper',
  },
];

/**
 * LoginView
 * Yellow Brutalist gateway featuring quick-login persona cards,
 * credentials form built with BrutalInput, error/loading/disabled states,
 * and zero generic styling.
 */
export default function LoginView({ onBack, preselectedRole }) {
  const { login, demoLogin, error } = useAuth();
  
  // Initialize credentials (optionally match preselected role)
  const initialAccount = DEMO_ACCOUNTS.find(a => a.role === preselectedRole) || DEMO_ACCOUNTS[0];
  const [email, setEmail] = useState(initialAccount.email);
  const [password, setPassword] = useState(initialAccount.password);
  const [loading, setLoading] = useState(false);
  const [quickLoginRole, setQuickLoginRole] = useState(null);
  const [localError, setLocalError] = useState(null);

  const handleCredentialsSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password || loading) return;

    setLoading(true);
    setLocalError(null);
    try {
      await login(email, password);
    } catch (err) {
      setLocalError(err?.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async (acc) => {
    if (loading) return;
    setLoading(true);
    setQuickLoginRole(acc.role);
    setLocalError(null);
    try {
      // Direct fast authentication via demo endpoint
      await demoLogin(acc.role);
    } catch (err) {
      // Fallback: fill inputs and submit standard password login
      setEmail(acc.email);
      setPassword(acc.password);
      try {
        await login(acc.email, acc.password);
      } catch (innerErr) {
        setLocalError(innerErr?.message || 'Instant login failed.');
      }
    } finally {
      setLoading(false);
      setQuickLoginRole(null);
    }
  };

  const handlePreFill = (acc) => {
    setEmail(acc.email);
    setPassword(acc.password);
    setLocalError(null);
  };

  return (
    <div className="min-h-screen bg-brutal-paper dark:bg-brutal-black text-brutal-black dark:text-brutal-white font-sans flex flex-col selection:bg-brutal-yellow selection:text-brutal-black">
      
      {/* Top Simple Utility Bar */}
      <header className="h-16 w-full bg-brutal-white dark:bg-brutal-dark border-b-3 border-brutal-black dark:border-brutal-yellow shadow-brutal px-4 md:px-8 flex items-center justify-between select-none">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="flex items-center gap-1.5 py-1.5 px-2.5 border-2 border-brutal-black dark:border-brutal-yellow bg-brutal-paper dark:bg-brutal-dark-surface font-mono text-xs font-bold uppercase shadow-brutal-sm hover:bg-brutal-yellow hover:text-brutal-black transition-colors"
            >
              <ArrowLeft size={14} />
              <span>Back</span>
            </button>
          )}

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brutal-yellow border-2 border-brutal-black shadow-brutal-sm flex items-center justify-center">
              <Shield size={18} className="text-brutal-black" strokeWidth={2.5} />
            </div>
            <span className="font-display font-black text-lg tracking-tight uppercase text-brutal-black dark:text-brutal-white">
              CONCORD IKMS
            </span>
          </div>
        </div>

        <ThemeToggle />
      </header>

      {/* Main Authentication Canvas */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8 py-10 md:py-16 flex items-center justify-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* Left Column: Quick Persona Cards (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <BrutalBadge tone="yellow" size="sm">
                  SECURITY GATEWAY
                </BrutalBadge>
                <span className="font-mono text-xs font-bold text-brutal-muted dark:text-brutal-muted-dark uppercase tracking-wider">
                  OWASP ASVS 4.1
                </span>
              </div>
              <h1 className="font-display font-black text-3xl sm:text-4xl md:text-5xl uppercase tracking-tight text-brutal-black dark:text-brutal-white">
                Institutional Personas
              </h1>
              <p className="font-sans text-sm text-brutal-black/80 dark:text-brutal-white/80 mt-2 font-medium">
                Click any pre-configured institutional persona for 1-click authentication or credential pre-fill.
              </p>
            </div>

            {/* Persona Quick-Login List */}
            <div className="flex flex-col gap-3">
              {DEMO_ACCOUNTS.map((acc) => {
                const isSelected = email === acc.email;
                const isLoggingInThis = quickLoginRole === acc.role;

                return (
                  <div
                    key={acc.role}
                    className={cn(
                      'p-4 border-3 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4',
                      isSelected
                        ? 'bg-brutal-white dark:bg-brutal-dark-surface border-brutal-black dark:border-brutal-yellow shadow-brutal translate-x-1'
                        : 'bg-brutal-white/70 dark:bg-brutal-dark-surface/70 border-brutal-black/40 dark:border-brutal-yellow/40 hover:border-brutal-black dark:hover:border-brutal-yellow shadow-brutal-sm'
                    )}
                  >
                    <div className="flex-1 cursor-pointer" onClick={() => handlePreFill(acc)}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-display font-black text-sm uppercase text-brutal-black dark:text-brutal-white">
                          {acc.title}
                        </span>
                        <BrutalBadge tone={acc.badgeTone} size="sm">
                          {acc.badge}
                        </BrutalBadge>
                      </div>
                      <div className="font-mono text-[11px] text-brutal-muted dark:text-brutal-muted-dark truncate">
                        {acc.email}
                      </div>
                      <div className="font-sans text-xs text-brutal-black/70 dark:text-brutal-white/70 mt-1 line-clamp-1">
                        {acc.desc}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => handlePreFill(acc)}
                        className="py-1.5 px-3 border-2 border-brutal-black dark:border-brutal-yellow font-mono text-xs font-bold uppercase bg-brutal-paper dark:bg-brutal-dark hover:bg-brutal-yellow hover:text-brutal-black transition-colors"
                      >
                        Pre-fill
                      </button>
                      <button
                        type="button"
                        disabled={loading}
                        onClick={() => handleQuickDemoLogin(acc)}
                        className="py-1.5 px-3 border-2 border-brutal-black dark:border-brutal-yellow font-mono text-xs font-black uppercase bg-brutal-yellow text-brutal-black shadow-brutal-sm hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                      >
                        <span>{isLoggingInThis ? 'Authorizing...' : 'Instant Login'}</span>
                        <ArrowRight size={13} strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Credentials Form with BrutalCard (5 cols) */}
          <div className="lg:col-span-5 w-full">
            <BrutalCard
              tone="default"
              className="p-6 sm:p-8 border-3 shadow-brutal-lg flex flex-col gap-6"
            >
              <div className="pb-4 border-b-2 border-brutal-black/20 dark:border-brutal-yellow/20">
                <div className="flex items-center gap-2 text-brutal-black dark:text-brutal-yellow mb-1">
                  <Lock size={16} strokeWidth={2.5} />
                  <span className="font-mono text-xs font-black uppercase tracking-wider">
                    Secure JWT Credentials
                  </span>
                </div>
                <h2 className="font-display font-black text-2xl uppercase tracking-tight text-brutal-black dark:text-brutal-white">
                  Sign In to Portal
                </h2>
              </div>

              {/* Error Alert Banner */}
              {(localError || error) && (
                <div className="p-3 bg-brutal-accent/15 border-2 border-brutal-accent text-brutal-black dark:text-brutal-white flex items-start gap-2.5 font-mono text-xs">
                  <AlertCircle size={16} className="text-brutal-accent flex-shrink-0 mt-0.5" />
                  <span className="font-bold">{localError || error}</span>
                </div>
              )}

              {/* Manual Login Form */}
              <form onSubmit={handleCredentialsSubmit} className="flex flex-col gap-4">
                <BrutalInput
                  label="Institutional Email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@concord.kit.edu"
                  disabled={loading}
                />

                <BrutalInput
                  label="Account Password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  disabled={loading}
                />

                <div className="pt-2">
                  <BrutalButton
                    type="submit"
                    variant="primary"
                    size="lg"
                    disabled={loading}
                    loading={loading && !quickLoginRole}
                    className="w-full justify-center text-sm font-black tracking-widest uppercase shadow-brutal hover:shadow-brutal-sm"
                  >
                    <span>{loading ? 'Authenticating...' : 'Sign In to Dashboard'}</span>
                    <ArrowRight size={16} strokeWidth={3} />
                  </BrutalButton>
                </div>
              </form>

              {/* Security Specs Note */}
              <div className="pt-4 border-t-2 border-brutal-black/10 dark:border-brutal-yellow/10 font-mono text-[10px] text-brutal-muted dark:text-brutal-muted-dark uppercase tracking-wide leading-relaxed">
                Secured via PBKDF2 / Bcrypt password hashing & HMAC-SHA256 JWT sessions per OWASP ASVS 4.1.
              </div>
            </BrutalCard>
          </div>

        </div>
      </main>

      {/* Footer Strip */}
      <footer className="border-t-2 border-brutal-black/20 dark:border-brutal-yellow/20 py-4 px-4 text-center font-mono text-[10px] text-brutal-muted dark:text-brutal-muted-dark uppercase select-none">
        CONCORD IKMS • Kolhapur Institute of Technology • Autonomous Regulations 2024
      </footer>
    </div>
  );
}
