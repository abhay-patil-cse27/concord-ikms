import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { variants } from '../../motion/presets';

/**
 * PageTransition
 * Wraps view content with editorial entry motion and respects reduced-motion.
 */
export default function PageTransition({ children, activeKey }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={activeKey}
        variants={variants.page}
        initial="initial"
        animate="animate"
        exit="exit"
        className="w-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
