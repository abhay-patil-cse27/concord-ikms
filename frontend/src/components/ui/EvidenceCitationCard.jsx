import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Award, Layers, Hash } from 'lucide-react';
import { BrutalCard, BrutalBadge } from '../brutal';
import { cn } from '../../lib/utils';
import { variants } from '../../motion/presets';

/**
 * EvidenceCitationCard
 * Architectural card displaying verified ground-truth chunk citations,
 * RRF fusion score, rank pills, and monospaced content.
 */
export default function EvidenceCitationCard({ item, onClick, className = '' }) {
  const {
    rank,
    document_title,
    document_filename,
    chunk_index,
    content,
    page_number,
    score,
    lexical_rank,
    vector_rank,
  } = item;

  return (
    <motion.div variants={variants.staggerItem}>
      <BrutalCard
        hoverable={Boolean(onClick)}
        onClick={onClick}
        className={cn('p-5 border-3 transition-all', className)}
      >
        {/* Header Metadata */}
        <div className="flex items-center justify-between gap-3 flex-wrap pb-3 mb-3 border-b-2 border-brutal-black/20 dark:border-brutal-yellow/20">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-7 h-7 bg-brutal-yellow text-brutal-black font-display font-black text-xs flex items-center justify-center border-2 border-brutal-black flex-shrink-0 shadow-brutal-sm">
              #{rank}
            </span>
            <div className="min-w-0">
              <h4 className="font-display font-black text-sm uppercase text-brutal-black dark:text-brutal-white truncate max-w-xs sm:max-w-md">
                {document_title || 'Institutional Document'}
              </h4>
              <div className="font-mono text-[10px] text-brutal-muted dark:text-brutal-muted-dark truncate">
                {document_filename}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {score !== undefined && (
              <BrutalBadge tone="yellow" size="sm">
                RRF SCORE: {score}
              </BrutalBadge>
            )}
            {page_number && (
              <BrutalBadge tone="paper" size="sm">
                PAGE {page_number}
              </BrutalBadge>
            )}
            <BrutalBadge tone="black" size="sm">
              CHUNK #{chunk_index}
            </BrutalBadge>
          </div>
        </div>

        {/* Content Box */}
        <div className="bg-brutal-paper dark:bg-brutal-dark p-4 border-2 border-brutal-black/30 dark:border-brutal-yellow/30 font-mono text-xs text-brutal-black dark:text-brutal-white leading-relaxed select-text">
          {content}
        </div>

        {/* Rank Diagnostics Footer */}
        {(lexical_rank || vector_rank) && (
          <div className="flex items-center gap-4 mt-3 pt-2 border-t border-brutal-black/10 dark:border-brutal-yellow/10 font-mono text-[10px] font-bold text-brutal-muted dark:text-brutal-muted-dark uppercase tracking-wider">
            {lexical_rank && <span>BM25 Lexical Rank: #{lexical_rank}</span>}
            {vector_rank && <span>Dense Vector Rank: #{vector_rank}</span>}
          </div>
        )}
      </BrutalCard>
    </motion.div>
  );
}
