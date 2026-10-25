import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getShuffledThinkingVerbs } from '../../constants/thinkingVerbs';

/**
 * ThinkingIndicator
 * Dynamic academic loading indicator that smoothly rotates through erudite thinking verbs
 * with a high-contrast Yellow Brutalist design and subtle slide-and-fade motion.
 */
export default function ThinkingIndicator() {
  const [verbs, setVerbs] = useState(() => getShuffledThinkingVerbs());
  const [index, setIndex] = useState(0);

  useEffect(() => {
    // Rotate word every 1.6 seconds
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % verbs.length);
    }, 1600);

    return () => clearInterval(interval);
  }, [verbs.length]);

  const currentVerb = verbs[index] || 'Synthesizing';

  return (
    <div className="flex items-center gap-3 p-3.5 bg-brutal-white dark:bg-brutal-dark-surface border-2 border-brutal-black dark:border-brutal-yellow w-fit shadow-brutal-sm select-none">
      {/* Brutalist Tactile Pulsing Blocks */}
      <div className="flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 bg-brutal-yellow border border-brutal-black animate-pulse" />
        <span className="w-2.5 h-2.5 bg-brutal-black dark:bg-brutal-yellow border border-brutal-black animate-pulse delay-150" />
        <span className="w-2.5 h-2.5 bg-brutal-yellow border border-brutal-black animate-pulse delay-300" />
      </div>

      {/* Dynamic Animated Verb */}
      <div className="relative h-5 flex items-center overflow-hidden min-w-[170px]">
        <AnimatePresence mode="wait">
          <motion.span
            key={currentVerb}
            initial={{ opacity: 0, y: 7 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -7 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="font-mono text-xs font-black uppercase tracking-wider text-brutal-black dark:text-brutal-white absolute left-0"
          >
            {currentVerb}
            <span className="inline-block animate-pulse ml-0.5 text-brutal-accent">...</span>
          </motion.span>
        </AnimatePresence>
      </div>
    </div>
  );
}
