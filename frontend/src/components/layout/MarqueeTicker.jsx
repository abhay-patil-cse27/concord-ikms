import React from 'react';
import { cn } from '../../lib/utils';

/**
 * MarqueeTicker
 * Editorial ticker tape with continuous institutional status updates.
 * Automatically respects prefers-reduced-motion.
 */
export default function MarqueeTicker({
  items = [
    'CONCORD IKMS v1.0.0 ACTIVE',
    'AUTONOMOUS REGULATIONS 2024 VERIFIED',
    'OWASP ASVS 4.1 RBAC ENFORCED',
    'HYBRID RRF RETRIEVAL 100% HIT RATE',
    'CRYPTOGRAPHIC SHA-256 AUDIT LEDGER',
    'ZERO CROSS-TENANT DATA LEAKAGE'
  ],
  className = '',
}) {
  const repeatedText = [...items, ...items, ...items].join('  ///  ');

  return (
    <div className={cn('relative w-full overflow-hidden whitespace-nowrap bg-brutal-black text-brutal-yellow py-1.5 border-b-3 border-brutal-black dark:border-brutal-yellow shadow-brutal select-none font-mono text-[11px] font-black tracking-widest uppercase flex items-center z-20', className)}>
      <div className="inline-block animate-marquee motion-reduce:animate-none">
        {repeatedText}
      </div>
      <div className="inline-block animate-marquee motion-reduce:hidden" aria-hidden="true">
        {repeatedText}
      </div>
    </div>
  );
}
