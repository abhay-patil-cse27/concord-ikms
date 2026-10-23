import React from 'react';
import { motion } from 'framer-motion';
import { FileUp, GitMerge, Cpu, ShieldCheck } from 'lucide-react';
import { useScrollReveal } from '../../hooks/useScrollReveal';
import { variants } from '../../motion/presets';

const STEPS = [
  {
    step: '01',
    icon: FileUp,
    title: 'Ingestion & OCR',
    desc: 'Upload multi-format institutional assets (.pdf, .xlsx, .docx, .md). OCR parses raw tabular circulars into verified chunk streams.',
  },
  {
    step: '02',
    icon: GitMerge,
    title: 'Dual Indexing & RRF',
    desc: 'Dense vector embeddings paired with sparse BM25 indices. Reciprocal Rank Fusion fuses candidate ranks into an optimal unified list.',
  },
  {
    step: '03',
    icon: Cpu,
    title: 'Grounded LLM Reasoning',
    desc: 'Ultra-fast Groq LLM inference strictly conditioned on extracted evidence chunks, with zero-leakage prompt fencing.',
  },
  {
    step: '04',
    icon: ShieldCheck,
    title: 'Cryptographic Audit',
    desc: 'Every query, evidence citation, and role authorization is permanently anchored to the SHA-256 security audit ledger.',
  },
];

/**
 * HowItWorks
 * Sequential architectural process breakdown with numbered brutal steps.
 */
export default function HowItWorks() {
  const [ref, isRevealed] = useScrollReveal({ threshold: 0.1 });

  return (
    <section ref={ref} className="py-20 px-4 md:px-8 max-w-7xl mx-auto w-full">
      <div className="mb-12 pb-6 border-b-3 border-brutal-black dark:border-brutal-yellow">
        <span className="font-mono text-xs font-black uppercase tracking-widest text-brutal-muted dark:text-brutal-muted-dark">
          Pipeline Flow // 02
        </span>
        <h2 className="font-display font-black text-3xl sm:text-5xl uppercase tracking-tight text-brutal-black dark:text-brutal-white mt-1">
          Execution Lifecycle
        </h2>
      </div>

      <motion.div
        variants={variants.staggerContainer}
        initial="initial"
        animate={isRevealed ? 'animate' : 'initial'}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {STEPS.map((step) => {
          const Icon = step.icon;
          return (
            <motion.div
              key={step.step}
              variants={variants.staggerItem}
              className="bg-brutal-white dark:bg-brutal-dark-surface border-3 border-brutal-black dark:border-brutal-yellow shadow-brutal p-6 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between pb-4 mb-4 border-b-2 border-brutal-black/20 dark:border-brutal-yellow/20">
                  <span className="font-display font-black text-2xl text-brutal-black dark:text-brutal-yellow">
                    {step.step}
                  </span>
                  <div className="w-8 h-8 bg-brutal-paper dark:bg-brutal-dark border-2 border-brutal-black dark:border-brutal-yellow flex items-center justify-center">
                    <Icon size={16} className="text-brutal-black dark:text-brutal-yellow" />
                  </div>
                </div>

                <h3 className="font-display font-black text-base uppercase tracking-tight text-brutal-black dark:text-brutal-white mb-2">
                  {step.title}
                </h3>

                <p className="font-sans text-xs text-brutal-black/80 dark:text-brutal-white/80 leading-relaxed font-normal">
                  {step.desc}
                </p>
              </div>

              <div className="mt-6 pt-3 border-t border-brutal-black/10 dark:border-brutal-yellow/10 font-mono text-[9px] font-bold text-brutal-muted dark:text-brutal-muted-dark uppercase tracking-widest">
                Stage Complete
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </section>
  );
}
