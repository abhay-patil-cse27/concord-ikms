import React from 'react';
import { FileText, Award, Layers } from 'lucide-react';

export default function EvidenceCitationCard({ item }) {
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
    <div
      className="glass-panel animate-fade-in"
      style={{
        padding: '1.25rem',
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        background: 'rgba(15, 23, 42, 0.5)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        position: 'relative',
        transition: 'all 0.2s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span
            style={{
              width: 24,
              height: 24,
              borderRadius: '50%',
              background: 'rgba(56, 189, 248, 0.15)',
              color: 'var(--primary)',
              fontSize: '0.75rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(56, 189, 248, 0.3)',
            }}
          >
            #{rank}
          </span>
          <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-main)' }}>
            {document_title}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
            ({document_filename})
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem' }}>
          <span className="badge badge-info" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <Award size={12} /> Score: {score}
          </span>
          {page_number && (
            <span className="badge badge-neutral" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <FileText size={12} /> Page {page_number}
            </span>
          )}
          <span className="badge badge-neutral" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <Layers size={12} /> Chunk #{chunk_index}
          </span>
        </div>
      </div>

      <div
        style={{
          background: 'rgba(0, 0, 0, 0.25)',
          padding: '0.85rem 1rem',
          borderRadius: '8px',
          fontSize: '0.875rem',
          color: 'var(--text-main)',
          lineHeight: 1.6,
          fontFamily: 'inherit',
          borderLeft: '3px solid var(--primary)',
        }}
      >
        {content}
      </div>

      {(lexical_rank || vector_rank) && (
        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
          {lexical_rank && <span>Lexical Rank: #{lexical_rank}</span>}
          {vector_rank && <span>Vector Rank: #{vector_rank}</span>}
        </div>
      )}
    </div>
  );
}
