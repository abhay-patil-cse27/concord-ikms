import React, { useState } from 'react';
import { 
  Shield, 
  ArrowRight, 
  CheckCircle2, 
  Search, 
  FileText, 
  Lock, 
  Sparkles, 
  Database,
  Layers,
  ChevronRight,
  Sun,
  Moon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function LandingView({ onGoToLogin }) {
  const { theme, toggleTheme } = useTheme();

  const features = [
    {
      icon: Search,
      title: 'Hybrid Knowledge Retrieval',
      desc: 'Combining BM25 term weighting with deep dense embeddings via Reciprocal Rank Fusion (RRF) for verified accuracy.',
      tag: 'Milestone 3 Active',
    },
    {
      icon: Layers,
      title: 'Dynamic Multi-Modal Ingestion',
      desc: 'Instant parsing for Excel spreadsheets (.xlsx), PDF circulars, Word docs (.docx), Markdown, and CSV tables.',
      tag: 'Dynamic Ingestion',
    },
    {
      icon: Lock,
      title: 'Governed Role-Based Access',
      desc: 'Strict server-side OWASP ASVS 4.1 authorization isolating students, faculty, department HODs, and administrators.',
      tag: 'Cryptographic RBAC',
    },
    {
      icon: Database,
      title: 'Provable Integrity & Provenance',
      desc: 'SHA-256 cryptographic deduplication ensuring no corrupted records, duplicate documents, or unverified claims.',
      tag: 'Auditable Memory',
    },
  ];

  const personas = [
    { role: 'Platform Admin', desc: 'Oversees college-wide knowledge base and security audits.' },
    { role: 'Department HOD', desc: 'Governs departmental circulars and staff access.' },
    { role: 'Faculty Member', desc: 'Uploads syllabi, exam rubrics, and searches records.' },
    { role: 'Enrolled Student', desc: 'Queries approved circulars and curriculum requirements.' },
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
      {/* Top Navigation */}
      <header
        style={{
          height: 'var(--navbar-height)',
          borderBottom: '1px solid var(--border-light)',
          background: 'var(--bg-glass)',
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 10px var(--primary-glow)',
            }}
          >
            <Shield size={20} color="#ffffff" />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
              CONCORD
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              KIT Institutional Knowledge Management
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={toggleTheme}
            title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0.5rem',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-light)',
              color: 'var(--text-main)',
              cursor: 'pointer',
              transition: 'var(--transition)',
            }}
          >
            {theme === 'light' ? <Moon size={16} color="var(--primary)" /> : <Sun size={16} color="var(--primary)" />}
          </button>

          <button
            onClick={onGoToLogin}
            className="btn btn-primary"
            style={{ padding: '0.55rem 1.25rem', fontSize: '0.85rem' }}
          >
            Sign In to Portal <ArrowRight size={15} />
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section
        style={{
          padding: '5rem 2rem 4rem',
          maxWidth: '1200px',
          margin: '0 auto',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
        className="animate-fade-in"
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'var(--status-info-bg)',
            border: '1px solid rgba(2, 132, 199, 0.25)',
            borderRadius: 'var(--radius-full)',
            padding: '0.35rem 0.9rem',
            marginBottom: '1.5rem',
            fontSize: '0.8rem',
            fontWeight: 600,
            color: 'var(--primary)',
          }}
        >
          <Sparkles size={14} /> Kolhapur Institute of Technology • Mega Project 2026–27
        </div>

        <h1
          style={{
            fontSize: 'clamp(2.2rem, 5vw, 3.5rem)',
            fontWeight: 800,
            lineHeight: 1.15,
            marginBottom: '1.25rem',
            maxWidth: '900px',
            color: 'var(--text-main)',
          }}
        >
          Unified Cognitive Memory for Institutional Knowledge
        </h1>

        <p
          style={{
            fontSize: '1.1rem',
            color: 'var(--text-muted)',
            maxWidth: '720px',
            lineHeight: 1.6,
            marginBottom: '2.5rem',
          }}
        >
          An enterprise-grade platform unifying college circulars, department syllabi, and administrative records into verifiable, auditable intelligence with cryptographic provenance.
        </p>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            onClick={onGoToLogin}
            className="btn btn-primary"
            style={{ padding: '0.8rem 1.8rem', fontSize: '1rem' }}
          >
            Launch Institutional Dashboard <ArrowRight size={18} />
          </button>

          <a
            href="https://github.com/abhay-patil-cse27/concord-ikms"
            target="_blank"
            rel="noreferrer"
            className="btn btn-secondary"
            style={{ padding: '0.8rem 1.5rem', fontSize: '0.95rem' }}
          >
            View Repository
          </a>
        </div>
      </section>

      {/* Feature Grid */}
      <section style={{ padding: '3rem 2rem 5rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text-main)' }}>
            Engineered with Institutional Rigor
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Built as a modular monolith adhering to clean architecture, OWASP ASVS 4.1 security, and hybrid retrieval.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={i}
                className="glass-panel"
                style={{
                  padding: '1.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  transition: 'var(--transition)',
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--status-info-bg)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--primary)',
                  }}
                >
                  <Icon size={22} />
                </div>
                <div>
                  <span className="badge badge-info" style={{ fontSize: '0.7rem', marginBottom: '0.5rem' }}>
                    {f.tag}
                  </span>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                    {f.title}
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>
                    {f.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Persona Scope Section */}
      <section style={{ padding: '3rem 2rem', background: 'var(--bg-subtle)', borderTop: '1px solid var(--border-light)' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text-main)' }}>
            Role-Based Access Governance
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>
            Each persona operates within an isolated cryptographic security context.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            {personas.map((p, idx) => (
              <div
                key={idx}
                style={{
                  padding: '1.25rem',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-md)',
                  textAlign: 'left',
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                  {p.role}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {p.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ marginTop: 'auto', borderTop: '1px solid var(--border-light)', padding: '2rem', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
        CONCORD © 2026–27 • Department of Computer Science & Engineering • Kolhapur Institute of Technology
      </footer>
    </div>
  );
}
