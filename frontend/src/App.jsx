import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import AppShell from './components/layout/AppShell';
import LoginView from './views/LoginView';
import DashboardView from './views/DashboardView';
import DepartmentsView from './views/DepartmentsView';
import UsersView from './views/UsersView';
import AuditLogsView from './views/AuditLogsView';
import DocumentsView from './views/DocumentsView';
import SearchView from './views/SearchView';
import RAGAssistantView from './views/RAGAssistantView';
import BenchmarkView from './views/BenchmarkView';
import { FileText, Search, Clock } from 'lucide-react';


function MilestonePreviewView({ title, milestone, description }) {
  return (
    <div className="animate-fade-in glass-panel" style={{ padding: '3rem', textAlign: 'center', maxWidth: '650px', margin: '4rem auto' }}>
      <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(56, 189, 248, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', border: '1px solid rgba(56, 189, 248, 0.25)' }}>
        <Clock size={28} color="var(--primary)" />
      </div>
      <span className="badge badge-info" style={{ marginBottom: '1rem' }}>
        Scheduled for {milestone}
      </span>
      <h2 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '0.75rem', color: '#fff' }}>
        {title}
      </h2>
      <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '2rem' }}>
        {description}
      </p>
      <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', borderTop: '1px solid var(--border-light)', paddingTop: '1.25rem' }}>
        Foundation slice (M1) is currently verified and running. This feature will activate in subsequent milestones.
      </div>
    </div>
  );
}

import LandingView from './views/LandingView';

const VALID_ROUTES = ['dashboard', 'departments', 'users', 'audit', 'documents', 'search', 'rag', 'benchmarks'];

function getRouteFromHash() {
  const hash = window.location.hash.replace(/^#\/?/, '').toLowerCase().trim();
  return VALID_ROUTES.includes(hash) ? hash : 'dashboard';
}

export default function App() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTabState] = useState(getRouteFromHash);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Sync state when URL hash changes (Back/Forward buttons or direct paste)
  useEffect(() => {
    const handleHashChange = () => {
      const route = getRouteFromHash();
      setActiveTabState(route);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Setter that updates both React state and URL hash
  const setActiveTab = (newTab) => {
    if (VALID_ROUTES.includes(newTab)) {
      window.location.hash = `#/${newTab}`;
      setActiveTabState(newTab);
    }
  };

  // Ensure default URL has valid hash on initial load
  useEffect(() => {
    if (!window.location.hash) {
      window.location.hash = `#/dashboard`;
    }
  }, []);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', border: '3px solid var(--border-light)', borderTopColor: 'var(--primary)', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }} />
          <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Initializing CONCORD Platform...</div>
        </div>
      </div>
    );
  }

  const [selectedRole, setSelectedRole] = useState(null);

  if (!user) {
    if (showLoginModal) {
      return (
        <LoginView
          onBack={() => {
            setShowLoginModal(false);
            setSelectedRole(null);
          }}
          preselectedRole={selectedRole}
        />
      );
    }
    return (
      <LandingView
        onGoToLogin={(role) => {
          setSelectedRole(role || null);
          setShowLoginModal(true);
        }}
      />
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'departments':
        return <DepartmentsView />;
      case 'users':
        return <UsersView />;
      case 'audit':
        return <AuditLogsView />;
      case 'documents':
        return <DocumentsView />;
      case 'search':
        return <SearchView />;
      case 'rag':
        return <RAGAssistantView />;
      case 'benchmarks':
        return <BenchmarkView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <AppShell activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderContent()}
    </AppShell>
  );
}
