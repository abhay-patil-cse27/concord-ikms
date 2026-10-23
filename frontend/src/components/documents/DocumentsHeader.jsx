import React from 'react';
import { UploadCloud, Shield, Filter } from 'lucide-react';
import { BrutalButton, BrutalBadge } from '../brutal';

/**
 * DocumentsHeader
 * Bold Yellow Brutalist header for the Document Ingestion & Governance view.
 */
export default function DocumentsHeader({ totalDocs, pendingCount, canWrite, onOpenUpload }) {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 mb-8 border-b-3 border-brutal-black dark:border-brutal-yellow">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <BrutalBadge tone="yellow" size="sm">
            KNOWLEDGE BASE
          </BrutalBadge>
          <BrutalBadge tone="black" size="sm">
            MULTI-MODAL INGESTION
          </BrutalBadge>
          {pendingCount > 0 && (
            <BrutalBadge tone="accent" size="sm">
              {pendingCount} PENDING APPROVAL
            </BrutalBadge>
          )}
        </div>
        <h1 className="font-display font-black text-3xl sm:text-4xl uppercase tracking-tight text-brutal-black dark:text-brutal-white">
          Document Ingestion & Governance
        </h1>
        <p className="font-mono text-xs text-brutal-black/70 dark:text-brutal-white/70 mt-1 max-w-2xl">
          Multi-modal OCR parsing, SHA-256 deduplication, semantic vector chunking, and isolated institutional lifecycle control.
        </p>
      </div>

      {canWrite && (
        <div className="flex-shrink-0">
          <BrutalButton
            variant="primary"
            size="md"
            onClick={onOpenUpload}
            className="flex items-center gap-2 px-5 py-3 shadow-brutal font-black text-xs uppercase tracking-wider"
          >
            <UploadCloud size={16} strokeWidth={2.5} />
            <span>Upload Document</span>
          </BrutalButton>
        </div>
      )}
    </div>
  );
}
