import React from 'react';
import { motion } from 'framer-motion';
import { Shield, ArrowRight, Terminal, Lock, Cpu } from 'lucide-react';
import { BrutalButton, BrutalBadge } from '../brutal';
import { useMagnetic } from '../../hooks/useMagnetic';
import { transitions } from '../../motion/presets';

/**
 * HeroSection
 * Asymmetric editorial masthead with oversized typography, technical metadata callouts,
 * and high-voltage Yellow Brutalist action triggers.
 */
export default function HeroSection({ onGoToLogin }) {
  const { ref: magneticRef, position, handleMouseMove, handleMouseLeave } = useMagnetic({ strength: 0.2 });

  return (
    <section className="relative w-full border-b-3 border-brutal-black dark:border-brutal-yellow bg-brutal-paper dark:bg-brutal-dark overflow-hidden py-16 md:py-24 px-4 md:px-8">
      {/* Structural Asymmetric Layout */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        
        {/* Left Column: Massive Editorial Heading & System Tags (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="flex flex-wrap items-center gap-2">
            <BrutalBadge tone="yellow" size="md">
              CONCORD // IKMS v1.0.0
            </BrutalBadge>
            <BrutalBadge tone="black" size="md">
              KOLHAPUR INSTITUTE OF TECHNOLOGY
            </BrutalBadge>
            <span className="font-mono text-xs font-bold text-brutal-muted dark:text-brutal-muted-dark uppercase tracking-wider">
              REGULATIONS 2024 VERIFIED
            </span>
          </div>

          <h1 className="font-display font-black text-4xl sm:text-6xl md:text-7xl uppercase tracking-tight leading-[0.95] text-brutal-black dark:text-brutal-white">
            Unified <span className="bg-brutal-yellow text-brutal-black px-2 shadow-brutal-sm inline-block">Cognitive Memory</span> for Institutional Knowledge
          </h1>

          <p className="font-sans text-base sm:text-lg md:text-xl text-brutal-black/80 dark:text-brutal-white/80 max-w-2xl font-medium leading-relaxed">
            Enterprise-grade cognitive retrieval platform unifying college circulars, curriculum syllabi, and administrative records into verifiable, auditable intelligence with cryptographic SHA-256 provenance.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-4">
            <div
              ref={magneticRef}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              className="inline-block"
            >
              <motion.div
                animate={{ x: position.x, y: position.y }}
                transition={transitions.brutalPunch}
              >
                <BrutalButton
                  variant="primary"
                  size="lg"
                  onClick={onGoToLogin}
                  className="px-8 py-4 text-sm font-black tracking-widest uppercase flex items-center gap-3 shadow-brutal-lg hover:shadow-brutal"
                >
                  <span>Launch Portal</span>
                  <ArrowRight size={18} strokeWidth={3} />
                </BrutalButton>
              </motion.div>
            </div>

            <a
              href="https://github.com/abhay-patil-cse27/concord-ikms"
              target="_blank"
              rel="noreferrer"
              className="px-6 py-4 border-2 border-brutal-black dark:border-brutal-yellow bg-brutal-white dark:bg-brutal-dark-surface font-mono text-xs font-bold uppercase tracking-wider text-brutal-black dark:text-brutal-white shadow-brutal hover:bg-brutal-yellow hover:text-brutal-black transition-colors"
            >
              System Repository [v1.0]
            </a>
          </div>
        </div>

        {/* Right Column: Architectural Specification Card (4 cols) */}
        <div className="lg:col-span-4 w-full">
          <div className="bg-brutal-white dark:bg-brutal-dark-surface border-3 border-brutal-black dark:border-brutal-yellow shadow-brutal-lg p-6 flex flex-col gap-5">
            <div className="flex items-center justify-between pb-3 border-b-2 border-brutal-black/20 dark:border-brutal-yellow/20">
              <span className="font-mono text-xs font-black uppercase tracking-wider flex items-center gap-2 text-brutal-black dark:text-brutal-yellow">
                <Terminal size={16} />
                System Specification
              </span>
              <span className="w-2.5 h-2.5 bg-brutal-yellow border border-brutal-black" />
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-brutal-black/10 dark:border-brutal-yellow/10">
                <span className="text-brutal-muted dark:text-brutal-muted-dark uppercase">Architecture</span>
                <span className="font-black text-brutal-black dark:text-brutal-white">Modular Monolith</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-brutal-black/10 dark:border-brutal-yellow/10">
                <span className="text-brutal-muted dark:text-brutal-muted-dark uppercase">Hybrid Search</span>
                <span className="font-black text-brutal-black dark:text-brutal-white">BM25 + RRF Vector</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-brutal-black/10 dark:border-brutal-yellow/10">
                <span className="text-brutal-muted dark:text-brutal-muted-dark uppercase">Security Baseline</span>
                <span className="font-black text-brutal-black dark:text-brutal-white">OWASP ASVS 4.1</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-brutal-black/10 dark:border-brutal-yellow/10">
                <span className="text-brutal-muted dark:text-brutal-muted-dark uppercase">Audit Ledger</span>
                <span className="font-black text-brutal-black dark:text-brutal-white">Cryptographic SHA-256</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-brutal-muted dark:text-brutal-muted-dark uppercase">Isolation Gate</span>
                <span className="font-black text-brutal-black dark:text-brutal-yellow">Zero Tenant Leakage</span>
              </div>
            </div>

            <div className="mt-2 p-3 bg-brutal-yellow text-brutal-black border-2 border-brutal-black font-mono text-[11px] font-black uppercase leading-tight">
              Institutional Clearance Required. Multi-Source Ingestion Pipeline Ready.
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
