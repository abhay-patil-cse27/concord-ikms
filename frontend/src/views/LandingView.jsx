import React from 'react';
import { Shield, ArrowRight } from 'lucide-react';
import ThemeToggle from '../components/layout/ThemeToggle';
import HeroSection from '../components/landing/HeroSection';
import StatsStrip from '../components/landing/StatsStrip';
import FeatureGrid from '../components/landing/FeatureGrid';
import HowItWorks from '../components/landing/HowItWorks';
import RoleCards from '../components/landing/RoleCards';
import FooterBlock from '../components/landing/FooterBlock';
import { BrutalButton, BrutalBadge } from '../components/brutal';

/**
 * LandingView
 * Asymmetric, high-voltage Yellow Brutalist institutional portal landing.
 * Editorial typography, technical specifications, and zero generic gradients/emojis.
 */
export default function LandingView({ onGoToLogin, onGoToRegister, onSelectDemoRole }) {
  const handleSelectRole = (roleCode) => {
    if (onSelectDemoRole) {
      onSelectDemoRole(roleCode);
    } else if (onGoToLogin) {
      onGoToLogin(roleCode);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-brutal-paper dark:bg-brutal-black text-brutal-black dark:text-brutal-white font-sans selection:bg-brutal-yellow selection:text-brutal-black">
      
      {/* Top Unauthenticated Sticky Navigation Bar */}
      <header className="h-16 w-full bg-brutal-white dark:bg-brutal-dark border-b-3 border-brutal-black dark:border-brutal-yellow shadow-brutal z-40 sticky top-0 px-4 md:px-8 flex items-center justify-between gap-4 select-none">
        
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-brutal-yellow border-2 border-brutal-black shadow-brutal-sm flex items-center justify-center flex-shrink-0">
            <Shield size={20} className="text-brutal-black" strokeWidth={2.5} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-black text-xl tracking-tight uppercase text-brutal-black dark:text-brutal-white">
                CONCORD
              </span>
              <BrutalBadge tone="yellow" size="sm" className="hidden sm:inline-flex">
                KIT IKMS
              </BrutalBadge>
            </div>
            <div className="hidden sm:block font-mono text-[9px] text-brutal-muted dark:text-brutal-muted-dark uppercase tracking-wider -mt-0.5">
              Cognitive Institutional Memory Layer
            </div>
          </div>
        </div>

        {/* Right Action Stack: Theme Toggle & Login/Register Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          
          {onGoToRegister && (
            <BrutalButton
              variant="outline"
              size="md"
              onClick={onGoToRegister}
              className="hidden sm:flex items-center gap-2 px-3 py-2 font-bold text-xs uppercase tracking-wider"
            >
              <span>Register</span>
            </BrutalButton>
          )}

          <BrutalButton
            variant="primary"
            size="md"
            onClick={() => onGoToLogin && onGoToLogin()}
            className="flex items-center gap-2 px-4 py-2 font-black text-xs uppercase tracking-wider"
          >
            <span>Sign In</span>
            <ArrowRight size={14} strokeWidth={2.5} />
          </BrutalButton>
        </div>
      </header>

      {/* Main Landing Canvas */}
      <main className="flex-1 flex flex-col">
        {/* Editorial Asymmetric Hero Section */}
        <HeroSection onGoToLogin={() => onGoToLogin && onGoToLogin()} />

        {/* High-Voltage Status & Metrics Strip */}
        <StatsStrip />

        {/* Asymmetric Technical Capability Grid */}
        <FeatureGrid />

        {/* Sequential Execution Lifecycle */}
        <HowItWorks />

        {/* Governed Role Personas */}
        <RoleCards onSelectRole={handleSelectRole} />
      </main>

      {/* Structural Brutalist Footer */}
      <FooterBlock />
    </div>
  );
}
