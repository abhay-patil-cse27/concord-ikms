import React from 'react';
import { motion } from 'framer-motion';
import { Search, Layers, Lock, Database } from 'lucide-react';
import { BrutalCard, BrutalBadge } from '../brutal';
import { useScrollReveal } from '../../hooks/useScrollReveal';
import { variants } from '../../motion/presets';

const FEATURES = [
  {
    icon: Search,
    code: 'FEAT-01',
    tag: 'RRF RETRIEVAL',
    title: 'Hybrid Knowledge Retrieval',
    desc: 'Combines BM25 exact term weighting with deep dense embeddings via Reciprocal Rank Fusion for provable institutional accuracy.',
    badgeTone: 'yellow',
  },
  {
    icon: Layers,
    code: 'FEAT-02',
    tag: 'MULTI-MODAL',
    title: 'Dynamic Ingestion Pipeline',
    desc: 'Instant OCR and multi-modal parsing across PDF circulars, Excel sheets (.xlsx), Word regulations (.docx), and Markdown tables.',
    badgeTone: 'paper',
  },
  {
    icon: Lock,
    code: 'FEAT-03',
    tag: 'OWASP 4.1',
    title: 'Governed RBAC Isolation',
    desc: 'Strict server-enforced role authorizations cryptographically isolating students, faculty staff, department HODs, and administrators.',
    badgeTone: 'black',
  },
  {
    icon: Database,
    code: 'FEAT-04',
    tag: 'SHA-256',
    title: 'Cryptographic Provenance',
    desc: 'SHA-256 hash deduplication ensuring zero corrupted institutional records, duplicate circulars, or ungrounded model hallucinations.',
    badgeTone: 'yellow',
  },
];

/**
 * FeatureGrid
 * Asymmetric technical grid displaying core architectural capabilities.
 */
export default function FeatureGrid() {
  const [sectionRef, isRevealed] = useScrollReveal({ threshold: 0.1 });

  return (
    <section ref={sectionRef} className="py-20 px-4 md:px-8 max-w-7xl mx-auto w-full">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12 pb-6 border-b-3 border-brutal-black dark:border-brutal-yellow">
        <div>
          <span className="font-mono text-xs font-black uppercase tracking-widest text-brutal-muted dark:text-brutal-muted-dark">
            Capability Matrix // 01
          </span>
          <h2 className="font-display font-black text-3xl sm:text-5xl uppercase tracking-tight text-brutal-black dark:text-brutal-white mt-1">
            Engineered for Rigor
          </h2>
        </div>
        <p className="font-mono text-xs max-w-md text-brutal-black/70 dark:text-brutal-white/70">
          Constructed on clean architectural boundaries, zero external lock-in, and reproducible benchmark evaluations.
        </p>
      </div>

      {/* Grid of Technical Feature Cards */}
      <motion.div
        variants={variants.staggerContainer}
        initial="initial"
        animate={isRevealed ? 'animate' : 'initial'}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {FEATURES.map((item, idx) => {
          const Icon = item.icon;
          return (
            <motion.div key={item.code} variants={variants.staggerItem}>
              <BrutalCard
                hoverable
                tone="default"
                className="h-full flex flex-col justify-between p-6 border-3"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-6">
                    <div className="w-10 h-10 bg-brutal-yellow border-2 border-brutal-black flex items-center justify-center shadow-brutal-sm">
                      <Icon size={20} className="text-brutal-black" strokeWidth={2.5} />
                    </div>
                    <span className="font-mono text-[10px] font-black text-brutal-muted dark:text-brutal-muted-dark">
                      {item.code}
                    </span>
                  </div>

                  <div className="mb-2">
                    <BrutalBadge tone={item.badgeTone} size="sm">
                      {item.tag}
                    </BrutalBadge>
                  </div>

                  <h3 className="font-display font-black text-lg uppercase tracking-tight text-brutal-black dark:text-brutal-white mb-2">
                    {item.title}
                  </h3>

                  <p className="font-sans text-xs text-brutal-black/80 dark:text-brutal-white/80 leading-relaxed font-normal">
                    {item.desc}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t-2 border-brutal-black/10 dark:border-brutal-yellow/10 font-mono text-[10px] font-black text-brutal-muted dark:text-brutal-muted-dark uppercase tracking-wider">
                  Verified Gate /// Active
                </div>
              </BrutalCard>
            </motion.div>
          );
        })}
      </motion.div>
    </section>
  );
}
