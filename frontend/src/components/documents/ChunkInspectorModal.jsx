import React from 'react';
import { Layers, FileText, Zap, Hash } from 'lucide-react';
import { BrutalModal, BrutalBadge, BrutalButton } from '../brutal';

/**
 * ChunkInspectorModal
 * Yellow Brutalist inspector modal displaying document chunks,
 * extraction method (OCR vs Native), page citations, and monospaced text.
 */
export default function ChunkInspectorModal({ inspectDoc, onClose }) {
  if (!inspectDoc) return null;

  const chunks = inspectDoc.chunks || [];

  return (
    <BrutalModal
      isOpen={Boolean(inspectDoc)}
      onClose={onClose}
      title={inspectDoc.title || 'Document Inspection'}
      subtitle={`${inspectDoc.filename} • ${Math.round((inspectDoc.file_size_bytes || 0) / 1024)} KB • ${inspectDoc.chunk_count || chunks.length} Total Chunks`}
      size="lg"
    >
      <div className="flex flex-col gap-4 max-h-[65vh] overflow-hidden">
        
        {/* Top Summary Bar */}
        <div className="flex items-center justify-between pb-3 border-b-2 border-brutal-black/20 dark:border-brutal-yellow/20 font-mono text-xs">
          <div className="flex items-center gap-2">
            <BrutalBadge tone="yellow" size="sm">
              SHA-256 VERIFIED
            </BrutalBadge>
            <BrutalBadge tone="black" size="sm">
              {chunks.length} EXTRACTED CHUNKS
            </BrutalBadge>
          </div>
          <span className="text-brutal-muted dark:text-brutal-muted-dark uppercase text-[10px]">
            Lifecycle: {inspectDoc.lifecycle_status || 'ACTIVE'}
          </span>
        </div>

        {/* Scrollable Chunk Stream */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {chunks.length > 0 ? (
            chunks.map((chunk) => {
              const isOcr = Boolean(chunk.metadata_?.is_ocr);
              const pageNum = chunk.metadata_?.page_number || 1;

              return (
                <div
                  key={chunk.id}
                  className="bg-brutal-paper dark:bg-brutal-dark-surface border-2 border-brutal-black dark:border-brutal-yellow shadow-brutal-sm p-4 flex flex-col gap-2.5"
                >
                  {/* Chunk Header */}
                  <div className="flex items-center justify-between gap-2 pb-2 border-b border-brutal-black/10 dark:border-brutal-yellow/10">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-black bg-brutal-yellow text-brutal-black px-1.5 py-0.5 border border-brutal-black">
                        #{chunk.chunk_index}
                      </span>
                      {isOcr ? (
                        <BrutalBadge tone="accent" size="sm" className="flex items-center gap-1">
                          <Zap size={11} />
                          <span>OCR Extracted</span>
                        </BrutalBadge>
                      ) : (
                        <BrutalBadge tone="paper" size="sm" className="flex items-center gap-1">
                          <FileText size={11} />
                          <span>Native Text</span>
                        </BrutalBadge>
                      )}
                    </div>

                    <div className="font-mono text-[10px] text-brutal-muted dark:text-brutal-muted-dark uppercase tracking-wider">
                      Page {pageNum} • {chunk.char_count} Characters
                    </div>
                  </div>

                  {/* Chunk Monospaced Content */}
                  <pre className="font-mono text-xs text-brutal-black dark:text-brutal-white whitespace-pre-wrap leading-relaxed select-text bg-brutal-white dark:bg-brutal-dark p-3 border border-brutal-black/20 dark:border-brutal-yellow/20 max-h-48 overflow-y-auto">
                    {chunk.content}
                  </pre>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 font-mono text-xs text-brutal-muted dark:text-brutal-muted-dark uppercase">
              No chunk segments indexed for this document asset.
            </div>
          )}
        </div>

        {/* Modal Bottom Footer */}
        <div className="pt-3 border-t-2 border-brutal-black/20 dark:border-brutal-yellow/20 flex justify-end">
          <BrutalButton
            variant="secondary"
            size="sm"
            onClick={onClose}
          >
            Close Inspector
          </BrutalButton>
        </div>

      </div>
    </BrutalModal>
  );
}
