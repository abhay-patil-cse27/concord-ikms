import React, { useState } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Cpu, 
  Clock, 
  ExternalLink,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Quote,
  ShieldCheck
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useRAG } from '../hooks/useRAG';

export default function RAGAssistantView() {
  const { query, setQuery, loading, error, response, history, ask, clear } = useRAG();
  const [activeCitation, setActiveCitation] = useState(null);
  const [showCitationDrawer, setShowCitationDrawer] = useState(false);

  const sampleQuestions = [
    "What is the passing criteria for end-semester examinations?",
    "What are the attendance requirements to appear in finals?",
    "What is the institutional policy on internship credits?",
    "Who is eligible for re-evaluation and grievance redressal?",
  ];

  const handleAsk = (e) => {
    if (e) e.preventDefault();
    if (!query.trim() || loading) return;
    ask();
  };

  const handlePromptClick = (sample) => {
    setQuery(sample);
    ask(sample);
  };

  const handleCitationClick = (citation) => {
    setActiveCitation(citation);
    setShowCitationDrawer(true);
  };

  // Helper to parse text nodes and convert [1], [2], or 【1】 into interactive buttons
  const renderFormattedAnswer = (rawText, citations = []) => {
    if (!rawText) return null;

    // First normalize any remaining unicode brackets
    const normalized = rawText
      .replace(/【(\d+)】/g, '[$1]')
      .replace(/\[Evidence\s*(\d+)\]/gi, '[$1]');

    return (
      <div className="markdown-body">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            p: ({ node, children, ...props }) => {
              // Parse children to transform bracket citations
              return <p {...props}>{renderChildrenWithCitations(children, citations)}</p>;
            },
            li: ({ node, children, ...props }) => {
              return <li {...props}>{renderChildrenWithCitations(children, citations)}</li>;
            },
            td: ({ node, children, ...props }) => {
              return <td {...props}>{renderChildrenWithCitations(children, citations)}</td>;
            }
          }}
        >
          {normalized}
        </ReactMarkdown>
      </div>
    );
  };

  const renderChildrenWithCitations = (children, citations) => {
    if (!children) return null;
    return React.Children.map(children, (child) => {
      if (typeof child !== 'string') return child;

      const parts = child.split(/(\[\d+\])/g);
      if (parts.length === 1) return child;

      return parts.map((part, i) => {
        const match = part.match(/\[(\d+)\]/);
        if (match) {
          const index = parseInt(match[1], 10);
          const citation = citations.find((c) => c.citation_index === index);

          return (
            <button
              key={i}
              type="button"
              onClick={() => citation && handleCitationClick(citation)}
              title={citation ? `View Source: ${citation.document_title} (Page ${citation.page_number})` : 'Source Citation'}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(56, 189, 248, 0.15)',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                color: 'var(--primary)',
                borderRadius: '4px',
                padding: '0.05rem 0.4rem',
                fontSize: '0.74rem',
                fontWeight: 700,
                cursor: citation ? 'pointer' : 'default',
                margin: '0 0.2rem',
                verticalAlign: 'baseline',
                transition: 'all 0.15s ease',
              }}
            >
              {part}
            </button>
          );
        }
        return part;
      });
    });
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '1100px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
            <span className="badge badge-primary">Milestone 4</span>
            <span className="badge badge-neutral" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Cpu size={12} /> Powered by Groq Cloud
            </span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
            Verifiable Institutional Q&A
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Authoritative generative answers grounded strictly in verified institutional documents with interactive citations.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-card)', padding: '0.5rem 0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
          <ShieldCheck size={16} color="var(--success)" />
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Zero-Hallucination Grounding Enforced
          </span>
        </div>
      </div>

      {/* Input Form */}
      <form onSubmit={handleAsk} style={{ display: 'flex', gap: '0.75rem' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <input
            type="text"
            className="input-field"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask anything from institutional circulars, syllabi, or rules (e.g. attendance criteria)..."
            style={{
              paddingLeft: '1rem',
              paddingRight: '2.5rem',
              height: '52px',
              fontSize: '0.95rem',
            }}
          />
        </div>

        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="btn btn-primary"
          style={{
            height: '52px',
            padding: '0 1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            whiteSpace: 'nowrap',
          }}
        >
          {loading ? (
            <>
              <div style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'spin 0.8s linear infinite' }} />
              <span>Synthesizing...</span>
            </>
          ) : (
            <>
              <Sparkles size={18} />
              <span>Ask Groq</span>
            </>
          )}
        </button>
      </form>

      {/* Suggested Inquiries */}
      {!response && !loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Recommended Queries
          </div>
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            {sampleQuestions.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => handlePromptClick(q)}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-light)',
                  color: 'var(--text-muted)',
                  padding: '0.45rem 0.9rem',
                  borderRadius: '20px',
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  transition: 'all 0.2s ease',
                }}
              >
                <Quote size={12} color="var(--primary)" />
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="glass-panel" style={{ padding: '1rem', borderLeft: '4px solid var(--danger)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <AlertCircle size={20} color="var(--danger)" />
          <span style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>{error}</span>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="glass-panel animate-fade-in" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(56, 189, 248, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bot size={20} color="var(--primary)" />
            </div>
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>Retrieving & Reasoning...</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Executing hybrid RRF scan & grounding via Groq Cloud</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '0.5rem' }}>
            <div style={{ height: '14px', width: '85%', background: 'var(--border-light)', borderRadius: '4px', animation: 'pulse 1.5s infinite ease-in-out' }} />
            <div style={{ height: '14px', width: '92%', background: 'var(--border-light)', borderRadius: '4px', animation: 'pulse 1.5s infinite ease-in-out' }} />
            <div style={{ height: '14px', width: '70%', background: 'var(--border-light)', borderRadius: '4px', animation: 'pulse 1.5s infinite ease-in-out' }} />
          </div>
        </div>
      )}

      {/* Generated Grounded Answer */}
      {response && !loading && (
        <div className="glass-panel animate-fade-in" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
          {/* Metadata bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(56, 189, 248, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bot size={18} color="var(--primary)" />
              </div>
              <div>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>CONCORD Institutional Answer</span>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>Model: <strong>{response.model_used}</strong></span>
                  <span>•</span>
                  <span>Latency: <strong>{response.latency_ms} ms</strong></span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span className={`badge ${response.confidence === 'high' ? 'badge-success' : 'badge-warning'}`}>
                {response.confidence === 'high' ? 'High Grounding' : 'Extracted Evidence'}
              </span>
            </div>
          </div>

          {/* Answer text with clickable inline citations */}
          <div style={{ fontSize: '0.95rem', lineHeight: 1.7, color: 'var(--text-main)', whiteSpace: 'pre-wrap' }}>
            {renderFormattedAnswer(response.answer, response.citations)}
          </div>

          {/* Source Citations Section */}
          {response.citations && response.citations.length > 0 && (
            <div style={{ marginTop: '0.5rem', borderTop: '1px solid var(--border-light)', paddingTop: '1.25rem' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
                Verified Evidence Sources ({response.citations.length})
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.75rem' }}>
                {response.citations.map((c) => (
                  <div
                    key={c.citation_index}
                    onClick={() => handleCitationClick(c)}
                    style={{
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border-light)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.85rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.4rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', background: 'rgba(56, 189, 248, 0.1)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                        Source [{c.citation_index}]
                      </span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                        Page {c.page_number}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {c.document_title}
                    </div>

                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0, display: '-webkit-box', WebKitLineClamp: 2, WebKitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      "{c.snippet}"
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Citation Inspector Modal / Slide-over */}
      {showCitationDrawer && activeCitation && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="glass-panel animate-scale-up" style={{ width: '100%', maxWidth: '600px', maxHeight: '80vh', overflowY: 'auto', padding: '1.75rem', background: 'var(--bg-card)', border: '1px solid var(--border-light)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="badge badge-primary">Citation [{activeCitation.citation_index}]</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Chunk ID: {activeCitation.chunk_id?.slice(0, 8)}...</span>
              </div>
              <button
                type="button"
                onClick={() => setShowCitationDrawer(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.25rem', fontWeight: 700 }}
              >
                ✕
              </button>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 0.25rem 0' }}>
                {activeCitation.document_title}
              </h3>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                Filename: {activeCitation.document_filename} • Page: {activeCitation.page_number}
              </div>
            </div>

            <div style={{ background: 'var(--bg-primary)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', fontSize: '0.88rem', lineHeight: 1.6, color: 'var(--text-main)', fontStyle: 'italic' }}>
              "{activeCitation.snippet}"
            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowCitationDrawer(false)}
                style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
