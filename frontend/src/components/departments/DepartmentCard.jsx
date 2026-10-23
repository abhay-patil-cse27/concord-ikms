import React from 'react';
import { motion } from 'framer-motion';
import { Building2, ShieldCheck, FileText } from 'lucide-react';
import { BrutalCard, BrutalBadge } from '../brutal';
import { variants } from '../../motion/presets';

/**
 * DepartmentCard
 * Displays department identity with filled yellow block document quota bar on a black track.
 */
export default function DepartmentCard({ dept, docCount = 0, quotaMax = 50 }) {
  const percentage = Math.min(100, Math.round((docCount / quotaMax) * 100));

  return (
    <motion.div variants={variants.staggerItem}>
      <BrutalCard
        tone="default"
        className="p-5 border-3 h-full flex flex-col justify-between"
      >
        <div>
          {/* Card Header */}
          <div className="flex items-center justify-between pb-3 mb-3 border-b-2 border-brutal-black/20 dark:border-brutal-yellow/20">
            <BrutalBadge tone="yellow" size="md">
              {dept.code}
            </BrutalBadge>

            <BrutalBadge tone="success" size="sm">
              ACTIVE SCOPE
            </BrutalBadge>
          </div>

          <h3 className="font-display font-black text-lg uppercase tracking-tight text-brutal-black dark:text-brutal-white mb-2">
            {dept.name}
          </h3>

          <p className="font-sans text-xs text-brutal-black/70 dark:text-brutal-white/70 leading-relaxed line-clamp-2 mb-4 font-medium">
            {dept.description || 'Institutional syllabus and departmental circulars.'}
          </p>
        </div>

        {/* Quota Progress Bar (filled yellow block on black track) */}
        <div className="space-y-3 pt-3 border-t-2 border-brutal-black/10 dark:border-brutal-yellow/10">
          <div>
            <div className="flex justify-between items-center font-mono text-[10px] font-black uppercase text-brutal-muted dark:text-brutal-muted-dark mb-1">
              <span>Catalog Quota</span>
              <span>{percentage}% ({docCount}/{quotaMax})</span>
            </div>
            
            {/* The bar: filled yellow block on a black track */}
            <div className="w-full h-3 bg-brutal-black border border-brutal-black p-0.5">
              <div
                className="h-full bg-brutal-yellow transition-all duration-300"
                style={{ width: `${Math.max(5, percentage)}%` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between font-mono text-[10px] text-brutal-muted dark:text-brutal-muted-dark">
            <span>Registered:</span>
            <span>{new Date(dept.created_at).toLocaleDateString()}</span>
          </div>
        </div>
      </BrutalCard>
    </motion.div>
  );
}
