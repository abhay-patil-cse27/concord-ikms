import React from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Layers, 
  Eye, 
  Download, 
  Trash2,
  Check,
  X
} from 'lucide-react';
import { BrutalTable, BrutalBadge, BrutalButton } from '../brutal';
import { variants } from '../../motion/presets';

/**
 * DocumentTable
 * Yellow Brutalist table displaying ingested institutional documents,
 * lifecycle metadata, OCR badges, chunk counts, and approval review actions.
 */
export default function DocumentTable({
  documents,
  departments,
  isApprover,
  canDelete,
  onInspect,
  onReview,
  onDelete,
}) {
  const getDeptCode = (deptId) => {
    const dept = departments.find((d) => d.id === deptId);
    return dept ? dept.code : 'GLOBAL';
  };

  const headers = [
    'Document Details',
    'Scope',
    'Status',
    'Lifecycle',
    'Chunks',
    'Size',
    'Ingested',
    { label: 'Actions', className: 'text-right' }
  ];

  return (
    <div className="w-full">
      <BrutalTable headers={headers} stickyHeader>
        {documents.map((doc, idx) => {
          const deptCode = getDeptCode(doc.department_id);

          return (
            <motion.tr
              key={doc.id}
              variants={variants.staggerItem}
              className="border-b-2 border-brutal-black/20 dark:border-brutal-yellow/20 hover:bg-brutal-yellow/10 transition-colors font-mono text-xs"
            >
              {/* Document Title & Filename */}
              <td className="p-3.5">
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 bg-brutal-yellow border-2 border-brutal-black flex items-center justify-center flex-shrink-0 mt-0.5 shadow-brutal-sm">
                    <FileText size={16} className="text-brutal-black" strokeWidth={2.5} />
                  </div>
                  <div className="min-w-0">
                    <div className="font-sans font-bold text-sm text-brutal-black dark:text-brutal-white truncate max-w-xs md:max-w-sm" title={doc.title}>
                      {doc.title}
                    </div>
                    <div className="font-mono text-[10px] text-brutal-muted dark:text-brutal-muted-dark truncate max-w-xs">
                      {doc.filename}
                    </div>
                  </div>
                </div>
              </td>

              {/* Department Scope Badge */}
              <td className="p-3.5">
                <BrutalBadge tone="yellow" size="sm">
                  {deptCode}
                </BrutalBadge>
              </td>

              {/* Ingestion Pipeline Status */}
              <td className="p-3.5 whitespace-nowrap">
                {doc.status === 'processed' ? (
                  <BrutalBadge tone="success" size="sm" dot>
                    PROCESSED
                  </BrutalBadge>
                ) : doc.status === 'failed' ? (
                  <BrutalBadge tone="accent" size="sm" dot>
                    FAILED
                  </BrutalBadge>
                ) : (
                  <BrutalBadge tone="yellow" size="sm" dot>
                    PARSING
                  </BrutalBadge>
                )}
              </td>

              {/* Lifecycle & Version State */}
              <td className="p-3.5 whitespace-nowrap">
                <div className="flex flex-col gap-1 items-start">
                  <span className="font-bold text-xs">{doc.version || 'v1.0'}</span>
                  {doc.lifecycle_status === 'superseded' ? (
                    <BrutalBadge tone="accent" size="sm">
                      SUPERSEDED
                    </BrutalBadge>
                  ) : doc.lifecycle_status === 'archived' ? (
                    <BrutalBadge tone="black" size="sm">
                      ARCHIVED
                    </BrutalBadge>
                  ) : (
                    <BrutalBadge tone="success" size="sm">
                      ACTIVE
                    </BrutalBadge>
                  )}
                </div>
              </td>

              {/* Chunks Count */}
              <td className="p-3.5 whitespace-nowrap">
                <div className="inline-flex items-center gap-1.5 font-bold">
                  <Layers size={14} className="text-brutal-muted dark:text-brutal-muted-dark" />
                  <span>{doc.chunk_count || 0}</span>
                </div>
              </td>

              {/* File Size */}
              <td className="p-3.5 whitespace-nowrap text-brutal-muted dark:text-brutal-muted-dark text-[11px]">
                {Math.round(doc.file_size_bytes / 1024)} KB
              </td>

              {/* Creation Date */}
              <td className="p-3.5 whitespace-nowrap text-brutal-muted dark:text-brutal-muted-dark text-[11px]">
                {new Date(doc.created_at).toLocaleDateString()}
              </td>

              {/* Actions Column */}
              <td className="p-3.5 text-right whitespace-nowrap">
                <div className="flex items-center justify-end gap-1.5">
                  {/* Approver Controls */}
                  {isApprover && doc.approval_status === 'pending_approval' && (
                    <>
                      <button
                        type="button"
                        onClick={() => onReview(doc.id, 'approved')}
                        className="py-1 px-2 border-2 border-brutal-black bg-brutal-success text-brutal-white font-mono text-[10px] font-black uppercase hover:opacity-90 flex items-center gap-1 shadow-brutal-sm"
                        title="Approve Document (Sync to Vector Index)"
                      >
                        <Check size={12} strokeWidth={3} />
                        <span>Approve</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onReview(doc.id, 'rejected')}
                        className="py-1 px-2 border-2 border-brutal-black bg-brutal-accent text-brutal-white font-mono text-[10px] font-black uppercase hover:opacity-90 flex items-center gap-1 shadow-brutal-sm"
                        title="Reject Document"
                      >
                        <X size={12} strokeWidth={3} />
                        <span>Reject</span>
                      </button>
                    </>
                  )}

                  {/* Chunk Inspector */}
                  <button
                    type="button"
                    onClick={() => onInspect(doc.id)}
                    className="p-1.5 border-2 border-brutal-black dark:border-brutal-yellow bg-brutal-paper dark:bg-brutal-dark-surface hover:bg-brutal-yellow hover:text-brutal-black transition-colors"
                    title="Inspect Extracted Chunks"
                    aria-label="Inspect Chunks"
                  >
                    <Eye size={14} />
                  </button>

                  {/* Raw File Download */}
                  <a
                    href={`/api/v1/documents/${doc.id}/download`}
                    className="p-1.5 border-2 border-brutal-black dark:border-brutal-yellow bg-brutal-paper dark:bg-brutal-dark-surface hover:bg-brutal-yellow hover:text-brutal-black transition-colors"
                    title="Download Raw Asset"
                    aria-label="Download Document"
                  >
                    <Download size={14} />
                  </a>

                  {/* Delete Option */}
                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => onDelete(doc.id, doc.title)}
                      className="p-1.5 border-2 border-brutal-black dark:border-brutal-yellow bg-brutal-paper dark:bg-brutal-dark-surface text-brutal-accent hover:bg-brutal-accent hover:text-brutal-white transition-colors"
                      title="Delete Document"
                      aria-label="Delete Document"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </td>
            </motion.tr>
          );
        })}
      </BrutalTable>
    </div>
  );
}
