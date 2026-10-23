import React from 'react';
import { motion } from 'framer-motion';
import { useScrollReveal } from '../../hooks/useScrollReveal';
import { transitions } from '../../motion/presets';

const STATS = [
  { value: '100%', label: 'RRF Top-K Hit Rate', detail: 'Reciprocal Rank Fusion Benchmark' },
  { value: '< 250ms', label: 'Retrieval Latency', detail: 'Hybrid Vector & Exact Match' },
  { value: '0.0%', label: 'Cross-Tenant Leakage', detail: 'OWASP ASVS 4.1 Enforced Gate' },
  { value: 'SHA-256', label: 'Cryptographic Ledger', detail: 'Tamper-Evident Institutional Audit' },
];

/**
 * StatsStrip
 * Bold architectural metric bar highlighting verified institutional performance figures.
 */
export default function StatsStrip() {
  const [ref, isRevealed] = useScrollReveal({ threshold: 0.15 });

  return (
    <section
      ref={ref}
      className="w-full bg-brutal-black text-brutal-white border-y-3 border-brutal-black dark:border-brutal-yellow py-12 px-4 md:px-8 select-none"
    >
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {STATS.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={isRevealed ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
            transition={{ ...transitions.smoothEase, delay: i * 0.08 }}
            className="border-l-3 border-brutal-yellow pl-4 flex flex-col justify-between"
          >
            <div>
              <div className="font-display font-black text-3xl sm:text-4xl text-brutal-yellow tracking-tight uppercase">
                {stat.value}
              </div>
              <div className="font-mono text-xs font-bold uppercase tracking-wider text-brutal-white mt-1">
                {stat.label}
              </div>
            </div>
            <div className="font-mono text-[10px] text-brutal-muted-dark uppercase tracking-wider mt-2">
              {stat.detail}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
