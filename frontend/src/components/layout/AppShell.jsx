import React, { useState } from 'react';
import Navbar from '../Navbar';
import Sidebar from '../Sidebar';
import MarqueeTicker from './MarqueeTicker';
import PageTransition from './PageTransition';

/**
 * AppShell
 * Full-height Yellow Brutalist frame coordinating Navbar, MarqueeTicker,
 * collapsible/mobile Sidebar, and animated page view transitions.
 */
export default function AppShell({ activeTab, setActiveTab, children }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-brutal-paper dark:bg-brutal-black text-brutal-black dark:text-brutal-white font-sans">
      {/* Top Header Navbar */}
      <Navbar onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)} />

      {/* Marquee Institutional Status Ticker */}
      <MarqueeTicker />

      {/* Main App Body Frame */}
      <div className="flex flex-1 h-[calc(100vh-theme(spacing.16)-29px)] overflow-hidden">
        {/* Sidebar Navigation */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isMobileOpen={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
        />

        {/* Scrollable Main Content Canvas */}
        <main className={`flex-1 overflow-y-auto h-full max-w-full ${activeTab === 'rag' ? 'p-2 md:p-4' : 'p-4 md:p-8'}`}>
          <div className={`${activeTab === 'rag' ? 'max-w-full h-full' : 'max-w-7xl mx-auto pb-12'}`}>
            <PageTransition activeKey={activeTab}>
              {children}
            </PageTransition>
          </div>
        </main>
      </div>
    </div>
  );
}
