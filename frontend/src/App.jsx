import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import LoginView from './views/LoginView';
import DashboardView from './views/DashboardView';
import DepartmentsView from './views/DepartmentsView';
import UsersView from './views/UsersView';
import AuditLogsView from './views/AuditLogsView';
import DocumentsView from './views/DocumentsView';
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

export default function App() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', border: '3px solid rgba(56, 189, 248, 0.2)', borderTopColor: 'var(--primary)', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }} />
          <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Initializing CONCORD Platform...</div>
        </div>
        <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!user) {
    return <LoginView />;
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

        return (
          <MilestonePreviewView
            title="Hybrid Keyword & Vector Semantic Retrieval"
            milestone="Milestone 3"
            description="Combining PostgreSQL full-text search with pgvector semantic similarity, reciprocal rank fusion (RRF), cross-encoder reranking, and department authorization scoping."
          />
        );
      default:
        return <DashboardView />;
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <div style={{ display: 'flex', flex: 1, minHeight: 'calc(100vh - var(--navbar-height))' }}>
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        <main style={{ flex: 1, padding: '2rem', overflowY: 'auto', maxWidth: '1400px' }}>
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
