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
  const [selectedRole, setSelectedRole] = useState(null);

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
      <div className="min-h-screen flex items-center justify-center bg-brutal-paper dark:bg-brutal-black">
        <div className="text-center">
          <div className="w-11 h-11 border-3 border-brutal-black dark:border-brutal-yellow border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <div className="font-mono text-xs uppercase tracking-widest text-brutal-black dark:text-brutal-yellow font-bold">
            Initializing CONCORD Platform...
          </div>
        </div>
      </div>
    );
  }

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
