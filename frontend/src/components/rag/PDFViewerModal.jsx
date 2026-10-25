import React, { useState } from 'react';
import { ExternalLink, Download, FileText, Bookmark, Search, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { BrutalModal, BrutalButton, BrutalBadge } from '../brutal';
import { cn } from '../../lib/utils';

/**
 * PDFViewerModal
 * Yellow Brutalist high-performance PDF & Citation Inspector.
 * Features dual-mode view:
 *   - Left pane: Target page & exact grounding sentence/paragraph highlight
 *   - Right pane: In-app embedded PDF document stream with direct page coordinate jumping
 */
export default function PDFViewerModal({
  isOpen,
  onClose,
  documentId,
  documentTitle,
  filename,
  pageNumber = 1,
  chunkIndex = 0,
  highlightText = '',
  score = null,
}) {
  const [currentPage, setCurrentPage] = useState(pageNumber);
  const [zoomLevel, setZoomLevel] = useState(100);

  if (!isOpen || !documentId) return null;

  const downloadUrl = `/api/v1/documents/${documentId}/download`;
  const pdfViewerUrl = `${downloadUrl}#page=${currentPage}&zoom=${zoomLevel}`;

  // Helper to highlight search keywords or sentence fragments in chunk text
  const renderHighlightedContent = (text) => {
    if (!text) return null;
    return (
      <div className="font-mono text-xs text-brutal-black dark:text-brutal-white leading-relaxed select-text whitespace-pre-wrap">
        <span className="bg-brutal-yellow/60 text-brutal-black px-1 py-0.5 border-b-2 border-brutal-black dark:border-brutal-yellow font-bold">
          {text}
        </span>
      </div>
    );
  };

  return (
    <BrutalModal
      isOpen={isOpen}
      onClose={onClose}
      title={documentTitle || filename || 'Institutional Document Inspector'}
      subtitle={`${filename || 'document.pdf'} • Target Page: ${currentPage} • Chunk #${chunkIndex}`}
      badge={score ? `RRF: ${score}` : 'EVIDENCE'}
      maxWidth="max-w-6xl"
      footer={
        <div className="flex items-center justify-between w-full flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <a
              href={downloadUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border-2 border-brutal-black dark:border-brutal-yellow bg-brutal-yellow text-brutal-black font-mono text-xs font-bold uppercase shadow-brutal-sm hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
            >
              <Download size={13} />
              <span>Download PDF</span>
            </a>
            <a
              href={downloadUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 border-2 border-brutal-black dark:border-brutal-yellow bg-brutal-paper dark:bg-brutal-dark-surface text-brutal-black dark:text-brutal-white font-mono text-xs font-bold uppercase hover:bg-brutal-yellow hover:text-brutal-black transition-all"
            >
              <ExternalLink size={13} />
              <span>Open in New Tab</span>
            </a>
          </div>

          <BrutalButton variant="secondary" size="sm" onClick={onClose}>
            Close Inspector
          </BrutalButton>
        </div>
      }
    >
      <div className="flex flex-col lg:flex-row gap-4 h-[70vh] overflow-hidden">
        
        {/* Left Pane: Evidence Citation & Highlight Telemetry */}
        <div className="w-full lg:w-2/5 flex flex-col gap-3 h-full overflow-hidden border-2 border-brutal-black dark:border-brutal-yellow bg-brutal-paper dark:bg-brutal-dark-surface p-4">
          
          <div className="flex items-center justify-between pb-2 border-b-2 border-brutal-black/20 dark:border-brutal-yellow/20">
            <div className="flex items-center gap-2">
              <Bookmark size={16} className="text-brutal-black dark:text-brutal-yellow" />
              <span className="font-display font-black text-xs uppercase tracking-wider text-brutal-black dark:text-brutal-white">
                Grounded Excerpt
              </span>
            </div>
            <BrutalBadge tone="yellow" size="sm">
              PAGE {currentPage}
            </BrutalBadge>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            <div className="p-2.5 bg-brutal-yellow/20 border border-brutal-black dark:border-brutal-yellow text-[11px] font-mono font-bold text-brutal-black dark:text-brutal-white">
              The LLM synthesized its answer directly from the sentence below on Page {currentPage}:
            </div>

            <div className="p-3 bg-brutal-white dark:bg-brutal-dark border-2 border-brutal-black dark:border-brutal-yellow shadow-brutal-sm">
              {renderHighlightedContent(highlightText)}
            </div>

            {/* Document Details Metadata */}
            <div className="p-3 bg-brutal-white/60 dark:bg-brutal-dark/60 border border-brutal-black/20 dark:border-brutal-yellow/20 font-mono text-[11px] space-y-1.5">
              <div className="flex justify-between">
                <span className="text-brutal-muted dark:text-brutal-muted-dark">Document ID:</span>
                <span className="font-bold truncate max-w-[150px]">{documentId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-brutal-muted dark:text-brutal-muted-dark">Chunk Coordinate:</span>
                <span className="font-bold">Segment #{chunkIndex}</span>
              </div>
              {score && (
                <div className="flex justify-between">
                  <span className="text-brutal-muted dark:text-brutal-muted-dark">RRF Fusion Score:</span>
                  <span className="font-bold text-brutal-accent">{score}</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Page Jump Controls */}
          <div className="pt-2 border-t border-brutal-black/20 dark:border-brutal-yellow/20 flex items-center justify-between text-xs font-mono">
            <span className="text-brutal-muted dark:text-brutal-muted-dark font-bold">PAGE NAV:</span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-2 py-0.5 border border-brutal-black bg-brutal-white text-brutal-black font-bold hover:bg-brutal-yellow transition-colors"
                title="Previous Page"
              >
                ◀
              </button>
              <span className="font-bold px-2 py-0.5 bg-brutal-paper dark:bg-brutal-dark border border-brutal-black">
                {currentPage}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => p + 1)}
                className="px-2 py-0.5 border border-brutal-black bg-brutal-white text-brutal-black font-bold hover:bg-brutal-yellow transition-colors"
                title="Next Page"
              >
                ▶
              </button>
            </div>
          </div>

        </div>

        {/* Right Pane: Embedded PDF Document Stream */}
        <div className="w-full lg:w-3/5 flex flex-col h-full border-2 border-brutal-black dark:border-brutal-yellow overflow-hidden bg-brutal-white dark:bg-brutal-dark">
          
          {/* Top PDF Controls Header */}
          <div className="p-2.5 bg-brutal-yellow border-b-2 border-brutal-black flex items-center justify-between font-mono text-xs font-bold text-brutal-black">
            <div className="flex items-center gap-2">
              <FileText size={15} />
              <span className="uppercase tracking-wider truncate max-w-[240px]">
                {filename || 'DOCUMENT VIEWER'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.max(50, z - 15))}
                className="p-1 border border-brutal-black bg-brutal-white hover:bg-brutal-paper transition-colors"
                title="Zoom Out"
              >
                <ZoomOut size={13} />
              </button>
              <span className="text-[11px] font-mono font-bold w-10 text-center">{zoomLevel}%</span>
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.min(200, z + 15))}
                className="p-1 border border-brutal-black bg-brutal-white hover:bg-brutal-paper transition-colors"
                title="Zoom In"
              >
                <ZoomIn size={13} />
              </button>
            </div>
          </div>

          {/* IFrame PDF Viewer Engine */}
          <div className="flex-1 w-full h-full bg-brutal-paper dark:bg-brutal-black relative">
            <iframe
              key={`${documentId}-${currentPage}-${zoomLevel}`}
              src={pdfViewerUrl}
              title={`PDF Preview - ${filename}`}
              className="w-full h-full border-none"
            />
          </div>

        </div>

      </div>
    </BrutalModal>
  );
}
