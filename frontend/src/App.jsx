import React, { useState, useEffect, Suspense, lazy } from 'react';
import { useAuth } from './context/AuthContext';
import AppShell from './components/layout/AppShell';
import BrutalSkeleton from './components/brutal/BrutalSkeleton';

// Lazy-loaded Views for High-Performance Code Splitting
const LandingView = lazy(() => import('./views/LandingView'));
const LoginView = lazy(() => import('./views/LoginView'));
const RegisterView = lazy(() => import('./views/RegisterView'));
const DashboardView = lazy(() => import('./views/DashboardView'));
const DepartmentsView = lazy(() => import('./views/DepartmentsView'));
const UsersView = lazy(() => import('./views/UsersView'));
const AuditLogsView = lazy(() => import('./views/AuditLogsView'));
const DocumentsView = lazy(() => import('./views/DocumentsView'));
const SearchView = lazy(() => import('./views/SearchView'));
const RAGAssistantView = lazy(() => import('./views/RAGAssistantView'));
const BenchmarkView = lazy(() => import('./views/BenchmarkView'));

const VALID_ROUTES = ['dashboard', 'departments', 'users', 'audit', 'documents', 'search', 'rag', 'benchmarks'];

function getRouteFromHash() {
  const hash = window.location.hash.replace(/^#\/?/, '').toLowerCase().trim();
  return VALID_ROUTES.includes(hash) ? hash : 'dashboard';
}

function ViewSuspenseFallback() {
  return (
    <div className="space-y-4 p-2 sm:p-6">
      <BrutalSkeleton count={1} height="h-16" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <BrutalSkeleton count={1} height="h-32" />
        <BrutalSkeleton count={1} height="h-32" />
        <BrutalSkeleton count={1} height="h-32" />
      </div>
      <BrutalSkeleton count={3} height="h-24" />
    </div>
  );
}

export default function App() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTabState] = useState(getRouteFromHash);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
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
    if (showRegisterModal) {
      return (
        <Suspense fallback={<ViewSuspenseFallback />}>
          <RegisterView
            onBack={() => setShowRegisterModal(false)}
            onGoToLogin={() => {
              setShowRegisterModal(false);
              setShowLoginModal(true);
            }}
          />
        </Suspense>
      );
    }
    if (showLoginModal) {
      return (
        <Suspense fallback={<ViewSuspenseFallback />}>
          <LoginView
            onBack={() => {
              setShowLoginModal(false);
              setSelectedRole(null);
            }}
            preselectedRole={selectedRole}
            onGoToRegister={() => {
              setShowLoginModal(false);
              setShowRegisterModal(true);
            }}
          />
        </Suspense>
      );
    }
    return (
      <Suspense fallback={<ViewSuspenseFallback />}>
        <LandingView
          onGoToLogin={(role) => {
            setSelectedRole(role || null);
            setShowLoginModal(true);
          }}
          onGoToRegister={() => {
            setShowRegisterModal(true);
          }}
        />
      </Suspense>
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
      <Suspense fallback={<ViewSuspenseFallback />}>
        {renderContent()}
      </Suspense>
    </AppShell>
  );
}
