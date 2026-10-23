import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';
import { BrutalCard } from '../brutal';
import { variants } from '../../motion/presets';

const SUGGESTIONS = [
  'What is the minimum attendance threshold required to appear for semester end examinations?',
  'Summarize the grading system and CGPA calculation rules under Autonomous Regulations 2024.',
  'What are the mandatory guidelines and credit requirements for the 8th-semester industry internship?',
  'List the course outcomes and evaluation scheme for Advanced Database Management Systems in CSE.',
];

/**
 * SuggestedPrompts
 * Displayed when an inquiry session is fresh and has zero messages.
 */
export default function SuggestedPrompts({ onSelectPrompt }) {
  return (
    <div className="py-8 px-4 max-w-3xl mx-auto w-full flex flex-col items-center gap-6">
      <div className="text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-brutal-yellow text-brutal-black border-2 border-brutal-black font-mono text-[11px] font-black uppercase mb-3 shadow-brutal-sm">
          <Sparkles size={13} />
          <span>Grounded Institutional Memory</span>
        </div>
        <h2 className="font-display font-black text-2xl sm:text-3xl uppercase tracking-tight text-brutal-black dark:text-brutal-white">
          How can CONCORD assist you?
        </h2>
        <p className="font-sans text-xs text-brutal-black/70 dark:text-brutal-white/70 max-w-md mx-auto mt-1">
          Inquiries are verified against verified circulars, course handbooks, and examination policies.
        </p>
      </div>

      <motion.div
        variants={variants.staggerContainer}
        initial="initial"
        animate="animate"
        className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full"
      >
        {SUGGESTIONS.map((text, i) => (
          <motion.div key={i} variants={variants.staggerItem}>
            <button
              type="button"
              onClick={() => onSelectPrompt(text)}
              className="w-full text-left p-4 bg-brutal-white dark:bg-brutal-dark-surface border-2 border-brutal-black dark:border-brutal-yellow shadow-brutal-sm hover:shadow-brutal hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-brutal-yellow hover:text-brutal-black transition-all flex flex-col justify-between h-full group"
            >
              <span className="font-mono text-xs font-bold leading-relaxed line-clamp-3">
                "{text}"
              </span>
              <div className="flex items-center justify-end gap-1 mt-3 text-[10px] font-mono font-black uppercase text-brutal-muted dark:text-brutal-muted-dark group-hover:text-brutal-black">
                <span>Inquire</span>
                <ArrowRight size={12} />
              </div>
            </button>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
