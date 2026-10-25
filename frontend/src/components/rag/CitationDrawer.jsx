import React, { useEffect, useRef, useState } from 'react';
import { X, Layers, Award, FileText, Hash, ExternalLink, Eye, Download, Maximize2 } from 'lucide-react';
import { BrutalBadge, BrutalButton, BrutalModal } from '../brutal';

/**
 * CitationDrawer
 * Slide-in panel displaying selected evidence citation chunk,
 * provenance metadata, page number, and similarity score.
 */
export default function CitationDrawer({
  isOpen,
  onClose,
  citation,
  citationIndex = 1,
}) {
  const panelRef = useRef(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Focus trap and Esc key handler
  useEffect(() => {
    if (!isOpen) return;

    const panelEl = panelRef.current;
    if (!panelEl) return;

    const focusable = panelEl.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstEl = focusable[0];
    const lastEl = focusable[focusable.length - 1];

    if (firstEl) {
      firstEl.focus();
    }

    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstEl) {
            e.preventDefault();
            lastEl?.focus();
          }
        } else {
          if (document.activeElement === lastEl) {
            e.preventDefault();
            firstEl?.focus();
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !citation) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end select-none">
      {/* Flat dark backdrop */}
      <div
        className="fixed inset-0 bg-brutal-black/80 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-in panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="citation-drawer-title"
        className="relative w-full max-w-lg bg-brutal-white dark:bg-brutal-dark border-l-3 border-brutal-black dark:border-brutal-yellow shadow-brutal-lg flex flex-col h-full z-10 p-6 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b-3 border-brutal-black dark:border-brutal-yellow">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 bg-brutal-yellow text-brutal-black font-display font-black text-sm flex items-center justify-center border-2 border-brutal-black shadow-brutal-sm">
              [{citationIndex}]
            </span>
            <div>
              <h3 id="citation-drawer-title" className="font-display font-black text-base uppercase text-brutal-black dark:text-brutal-white">
                Evidence Provenance
              </h3>
              <span className="font-mono text-[10px] text-brutal-muted dark:text-brutal-muted-dark uppercase tracking-wider">
                Cryptographically Anchored
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 border-2 border-brutal-black dark:border-brutal-yellow bg-brutal-paper dark:bg-brutal-dark-surface hover:bg-brutal-yellow hover:text-brutal-black transition-colors"
            title="Close Citation Drawer"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Document Metadata Badges */}
        <div className="space-y-3 font-mono text-xs pb-4 mb-4 border-b-2 border-brutal-black/20 dark:border-brutal-yellow/20">
          <div>
            <div className="text-[10px] uppercase font-bold text-brutal-muted dark:text-brutal-muted-dark mb-0.5">
              Source Document Title
            </div>
            <div className="font-sans font-bold text-sm text-brutal-black dark:text-brutal-white">
              {citation.document_title || citation.title || 'Institutional Circular'}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap pt-1">
            {citation.score !== undefined && (
              <BrutalBadge tone="yellow" size="sm">
                RRF SCORE: {citation.score}
              </BrutalBadge>
            )}
            {citation.page_number && (
              <BrutalBadge tone="paper" size="sm">
                PAGE {citation.page_number}
              </BrutalBadge>
            )}
            <BrutalBadge tone="black" size="sm">
              CHUNK #{citation.chunk_index || 0}
            </BrutalBadge>
          </div>
        </div>

        {/* Raw Text Content */}
        <div className="flex-1 overflow-y-auto pr-1">
          <div className="text-[10px] font-mono uppercase font-bold text-brutal-muted dark:text-brutal-muted-dark mb-1">
            Exact Extracted Segment Content:
          </div>
          <div className="bg-brutal-paper dark:bg-brutal-dark-surface p-4 border-2 border-brutal-black dark:border-brutal-yellow font-mono text-xs text-brutal-black dark:text-brutal-white leading-relaxed select-text whitespace-pre-wrap">
            {citation.content}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t-2 border-brutal-black/20 dark:border-brutal-yellow/20 flex items-center justify-between flex-wrap gap-2">
          {citation.document_id ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowPreviewModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border-2 border-brutal-black dark:border-brutal-yellow bg-brutal-yellow text-brutal-black font-mono text-xs font-bold uppercase shadow-brutal-sm hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
                title="Preview document in an in-app window"
              >
                <Eye size={13} />
                <span>Quick Preview</span>
              </button>

              <a
                href={`/api/v1/documents/${citation.document_id}/download`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 border-2 border-brutal-black dark:border-brutal-yellow bg-brutal-paper dark:bg-brutal-dark-surface text-brutal-black dark:text-brutal-white font-mono text-xs font-bold uppercase hover:bg-brutal-yellow hover:text-brutal-black transition-all"
                title="Download original document file"
              >
                <Download size={13} />
                <span>Download</span>
              </a>
            </div>
          ) : (
            <div />
          )}

          <BrutalButton
            variant="secondary"
            size="sm"
            onClick={onClose}
          >
            Close Drawer
          </BrutalButton>
        </div>

      </div>

      {/* In-App Document Quick Preview Modal */}
      {showPreviewModal && (
        <BrutalModal
          isOpen={showPreviewModal}
          onClose={() => setShowPreviewModal(false)}
          title={citation.document_title || citation.title || 'Institutional Document'}
          subtitle={`Page ${citation.page_number || 1} • Chunk #${citation.chunk_index || 0}`}
          maxWidth="max-w-4xl"
          footer={
            <div className="flex justify-between items-center w-full">
              <a
                href={`/api/v1/documents/${citation.document_id}/download`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border-2 border-brutal-black dark:border-brutal-yellow bg-brutal-yellow text-brutal-black font-mono text-xs font-bold uppercase shadow-brutal-sm hover:translate-x-0.5 hover:translate-y-0.5"
              >
                <Download size={13} />
                <span>Download Original PDF</span>
              </a>
              <BrutalButton variant="secondary" size="sm" onClick={() => setShowPreviewModal(false)}>
                Close Preview
              </BrutalButton>
            </div>
          }
        >
          <div className="h-[65vh] w-full border-2 border-brutal-black dark:border-brutal-yellow bg-brutal-paper dark:bg-brutal-dark overflow-hidden flex flex-col">
            <div className="p-3 bg-brutal-yellow text-brutal-black border-b-2 border-brutal-black flex items-center justify-between font-mono text-xs font-bold">
              <span>ACTIVE EVIDENCE CHUNK AT PAGE {citation.page_number || 1}</span>
              <span className="text-[10px] uppercase">RRF Rank Anchor</span>
            </div>
            <div className="p-4 bg-brutal-white dark:bg-brutal-dark-surface border-b-2 border-brutal-black/20 font-mono text-xs text-brutal-black dark:text-brutal-white leading-relaxed select-text">
              <span className="font-bold uppercase text-brutal-accent mr-1">[Highlighted Grounding Evidence]:</span>
              {citation.content}
            </div>
            <div className="flex-1 w-full bg-brutal-paper dark:bg-brutal-black">
              <iframe
                src={`/api/v1/documents/${citation.document_id}/download#page=${citation.page_number || 1}`}
                title="Document Preview"
                className="w-full h-full border-none"
              />
            </div>
          </div>
        </BrutalModal>
      )}

    </div>
  );
}
