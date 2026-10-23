/**
 * Shared Motion & Animation Presets for Yellow Brutalist UI.
 * Standardizes transitions, reveal eases, hover lifts, and staggers.
 * Respects reduced-motion preferences.
 */

export const transitions = {
  springTactile: { type: 'spring', stiffness: 450, damping: 28 },
  springSnappy: { type: 'spring', stiffness: 500, damping: 25 },
  smoothEase: { duration: 0.28, ease: [0.16, 1, 0.3, 1] },
  brutalPunch: { duration: 0.18, ease: [0.2, 0.8, 0.2, 1] },
};

export const variants = {
  // Page / Route level entry
  page: {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0, transition: transitions.smoothEase },
    exit: { opacity: 0, y: -8, transition: { duration: 0.15 } }
  },

  // Stagger container for card grids
  staggerContainer: {
    initial: {},
    animate: {
      transition: {
        staggerChildren: 0.06,
        delayChildren: 0.04
      }
    }
  },

  // Individual staggered card reveal
  staggerItem: {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0, transition: transitions.smoothEase }
  },

  // Tactile button click / hover shift
  tactileButton: {
    rest: { x: 0, y: 0 },
    hover: { x: -2, y: -2, transition: { duration: 0.12 } },
    tap: { x: 2, y: 2, transition: { duration: 0.06 } }
  },

  // Brutalist card hover lift
  brutalCard: {
    rest: { x: 0, y: 0 },
    hover: { x: -3, y: -3, transition: { duration: 0.15 } }
  },

  // Modal scale & punch
  modalBackdrop: {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.2 } },
    exit: { opacity: 0, transition: { duration: 0.15 } }
  },
  modalContent: {
    initial: { opacity: 0, scale: 0.94, y: 14 },
    animate: { opacity: 1, scale: 1, y: 0, transition: transitions.springTactile },
    exit: { opacity: 0, scale: 0.96, y: 10, transition: { duration: 0.15 } }
  }
};
