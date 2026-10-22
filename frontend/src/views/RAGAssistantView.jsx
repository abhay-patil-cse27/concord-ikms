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
  ShieldCheck,
  MessageSquare,
  Plus,
  Trash2,
  PanelLeftClose,
  PanelLeft,
  Eye
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useRAG } from '../hooks/useRAG';

export default function RAGAssistantView() {
  const { 
    query, 
    setQuery, 
    loading, 
    error, 
    response, 
    history, 
    conversations, 
    activeConversationId, 
    selectConversation, 
    createNewSession, 
    deleteSession, 
    ask, 
    clear 
  } = useRAG();

  const [activeCitation, setActiveCitation] = useState(null);
  const [showCitationDrawer, setShowCitationDrawer] = useState(false);
  const [showSessionsSidebar, setShowSessionsSidebar] = useState(true);
  const [previewDocument, setPreviewDocument] = useState(null);

  const sampleQuestions = [
    "What is the passing criteria for Autonomous Exam under 2024 regulations?",
    "Compare Autonomous Academic Regulations 2020 vs 2024 passing threshold",
    "What are the attendance requirements to appear in finals?",
    "What subjects and credits are offered in Semester 5 B.Tech CSE?",
    "What is the policy regarding NVIDIA GPU cluster and AI ethics?",
    "What are the laboratory safety protocols for ENTC VLSI Lab?",
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

  const handleOpenDocPreview = (citation) => {
    setPreviewDocument({
      title: citation.document_title,
      filename: citation.document_filename,
      page: citation.page_number,
      snippet: citation.snippet,
      version: citation.version || 'v1.0',
      status: citation.lifecycle_status || 'active'
    });
  };

  // Helper to parse text nodes and convert [1], [2], or 【1】 into interactive buttons
  const renderFormattedAnswer = (rawText, citations = []) => {
    if (!rawText) return null;

    let cleaned = rawText
      .replace(/【(\d+)】/g, '[$1]')
      .replace(/\[Evidence\s*(\d+)\]/gi, '[$1]')
      .replace(/\n\s*\n\s*\n+/g, '\n\n');

    return (
      <div className="markdown-body">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            p: ({ node, children, ...props }) => (
              <p {...props} style={{ marginBottom: '1rem', lineHeight: 1.65 }}>
                {renderChildrenWithCitations(children, citations)}
              </p>
            ),
            li: ({ node, children, ...props }) => (
              <li {...props} style={{ marginBottom: '0.4rem', lineHeight: 1.6 }}>
                {renderChildrenWithCitations(children, citations)}
              </li>
            ),
            td: ({ node, children, ...props }) => (
              <td {...props}>{renderChildrenWithCitations(children, citations)}</td>
            )
          }}
        >
          {cleaned}
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
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 2px',
                padding: '1px 6px',
                borderRadius: '4px',
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#38bdf8',
                background: 'rgba(56, 189, 248, 0.12)',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                cursor: citation ? 'pointer' : 'default',
                transform: 'translateY(-1px)',
                transition: 'all 0.15s ease',
              }}
              title={citation ? `${citation.document_title} (Page ${citation.page_number})` : 'Citation'}
            >
              {match[1]}
            </button>
          );
        }
        return part;
      });
    });
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', gap: '1.5rem', minHeight: 'calc(100vh - 120px)' }}>
      {/* Collapsible Session Threads Sidebar */}
      {showSessionsSidebar && (
        <aside 
          className="glass-panel animate-scale-up"
          style={{
            width: '270px',
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            padding: '1.25rem',
            gap: '1rem',
            height: 'fit-content',
            maxHeight: 'calc(100vh - 140px)',
            position: 'sticky',
            top: '1rem'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>
              <MessageSquare size={16} color="var(--primary)" />
              <span>Chat Threads</span>
            </div>
            <button
              type="button"
              onClick={() => setShowSessionsSidebar(false)}
              className="btn btn-ghost"
              style={{ padding: '4px', borderRadius: '4px' }}
              title="Hide threads"
            >
              <PanelLeftClose size={16} />
            </button>
          </div>

          <button
            type="button"
            onClick={createNewSession}
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.6rem 0.85rem', fontSize: '0.82rem', gap: '0.4rem', justifyContent: 'center' }}
          >
            <Plus size={15} />
            New Inquiry
          </button>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', overflowY: 'auto', flex: 1, paddingRight: '0.2rem' }}>
            {conversations.length === 0 ? (
              <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', textAlign: 'center', padding: '1.5rem 0.5rem' }}>
                No saved chat threads yet. Your inquiries will automatically persist here.
              </div>
            ) : (
              conversations.map((c) => (
                <div
                  key={c.id}
                  onClick={() => selectConversation(c.id)}
                  className={`chat-session-item ${activeConversationId === c.id ? 'active' : ''}`}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden' }}>
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {c.title}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                      {new Date(c.updated_at).toLocaleDateString([], { month: 'short', day: 'numeric' })} • {c.messages_count || 1} turns
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteSession(c.id);
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-dim)',
                      cursor: 'pointer',
                      padding: '4px',
                      opacity: 0.6
                    }}
                    title="Delete thread"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))
            )}
          </div>
        </aside>
      )}

      {/* Main Conversation & Question Answering Area */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem', minWidth: 0 }}>
        {/* Header Banner */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.3rem' }}>
              {!showSessionsSidebar && (
                <button
                  type="button"
                  onClick={() => setShowSessionsSidebar(true)}
                  className="btn btn-secondary"
                  style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', gap: '4px' }}
                >
                  <PanelLeft size={14} /> Show Threads
                </button>
              )}
              <span className="badge badge-info" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Bot size={12} /> Milestone 4 & 5
              </span>
              <span className="badge badge-neutral" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                <Cpu size={12} /> Powered by Groq Cloud
              </span>
              {activeConversationId && (
                <span className="badge" style={{ background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.25)' }}>
                  Active Thread Session
                </span>
              )}
            </div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, letterSpacing: '-0.02em' }}>
              Verifiable Institutional Q&A
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
              Context-aware generative answers grounded strictly in verified institutional documents with multi-turn continuity.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-card)', padding: '0.5rem 0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
            <ShieldCheck size={16} color="var(--success)" />
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Zero-Hallucination Grounding Enforced
            </span>
          </div>
        </div>

        {/* Input Form with Send Action */}
        <form onSubmit={handleAsk} style={{ display: 'flex', gap: '0.75rem' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <input
              type="text"
              className="input-field"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask anything (e.g. passing criteria) or follow-up ('What are the attendance rules for it?')..."
              style={{
                paddingLeft: '1.25rem',
                paddingRight: '2.5rem',
                height: '54px',
                fontSize: '0.95rem',
                borderRadius: '12px'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="btn btn-primary"
            style={{
              height: '54px',
              padding: '0 1.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              whiteSpace: 'nowrap',
              borderRadius: '12px',
              fontWeight: 600
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
        {history.length === 0 && !response && !loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Recommended Institutional Queries
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
                    padding: '0.5rem 0.95rem',
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
          <div className="glass-panel" style={{ padding: '1rem', borderLeft: '4px solid #ef4444', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <AlertCircle size={20} color="#ef4444" />
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
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>Retrieving & Reasoning with Context...</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Rewriting query antecedents, executing hybrid RRF scan & grounding via Groq Cloud</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '0.5rem' }}>
              <div style={{ height: '14px', width: '85%', background: 'var(--border-light)', borderRadius: '4px', animation: 'pulse 1.5s infinite ease-in-out' }} />
              <div style={{ height: '14px', width: '92%', background: 'var(--border-light)', borderRadius: '4px', animation: 'pulse 1.5s infinite ease-in-out' }} />
              <div style={{ height: '14px', width: '70%', background: 'var(--border-light)', borderRadius: '4px', animation: 'pulse 1.5s infinite ease-in-out' }} />
            </div>
          </div>
        )}

        {/* Multi-Turn Conversation Thread Feed */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {history.map((turn, idx) => (
            <div key={turn.id || idx} className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* User Question Speech Bubble */}
              <div className="chat-bubble-user">
                {turn.query}
                {turn.effective_query && turn.effective_query !== turn.query && (
                  <div style={{ fontSize: '0.72rem', opacity: 0.85, marginTop: '4px', fontStyle: 'italic' }}>
                    Contextualized: {turn.effective_query}
                  </div>
                )}
              </div>

              {/* Assistant Answer Box with Citations */}
              <div className="chat-bubble-assistant">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.85rem', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(56, 189, 248, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Bot size={17} color="var(--primary)" />
                    </div>
                    <div>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>CONCORD Grounded Intelligence</span>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span>Model: <strong>{turn.model_used || 'Groq Llama 3.3'}</strong></span>
                        <span>•</span>
                        <span>Latency: <strong>{turn.latency_ms || 320} ms</strong></span>
                      </div>
                    </div>
                  </div>

                  <span className={`badge ${turn.confidence === 'high' ? 'badge-success' : 'badge-warning'}`}>
                    {turn.confidence === 'high' ? 'Verified Evidence' : 'Extracted Records'}
                  </span>
                </div>

                {/* Formatted Markdown */}
                <div style={{ fontSize: '0.94rem', color: 'var(--text-main)' }}>
                  {renderFormattedAnswer(turn.answer, turn.citations)}
                </div>

                {/* Turn Citations Grid */}
                {turn.citations && turn.citations.length > 0 && (
                  <div style={{ marginTop: '1.25rem', borderTop: '1px solid var(--border-light)', paddingTop: '1rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.65rem' }}>
                      Verified Evidence Sources ({turn.citations.length})
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.65rem' }}>
                      {turn.citations.map((c) => (
                        <div
                          key={c.citation_index}
                          onClick={() => handleCitationClick(c)}
                          style={{
                            background: 'var(--bg-primary)',
                            border: '1px solid var(--border-light)',
                            borderRadius: '8px',
                            padding: '0.75rem',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.35rem',
                            transition: 'all 0.2s ease',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--primary)', background: 'rgba(56, 189, 248, 0.1)', padding: '0.1rem 0.35rem', borderRadius: '4px' }}>
                              Source [{c.citation_index}]
                            </span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                              Page {c.page_number}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {c.document_title}
                          </div>
                          <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', margin: 0, display: '-webkit-box', WebKitLineClamp: 2, WebKitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            "{c.snippet}"
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Citation Inspector Modal / Slide-over */}
      {showCitationDrawer && activeCitation && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="glass-panel animate-scale-up" style={{ width: '100%', maxWidth: '620px', maxHeight: '80vh', overflowY: 'auto', padding: '1.75rem', background: 'var(--bg-card)', border: '1px solid var(--border-light)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span className="badge badge-primary">Citation [{activeCitation.citation_index}]</span>
                {activeCitation.lifecycle_status === 'superseded' ? (
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                    🔴 SUPERSEDED ({activeCitation.version || 'Older Version'})
                  </span>
                ) : (
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '4px', background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
                    🟢 CURRENT ({activeCitation.version || 'v1.0'})
                  </span>
                )}
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

            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => handleOpenDocPreview(activeCitation)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem' }}
              >
                <Eye size={15} /> Preview in Document Viewer
              </button>

              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setShowCitationDrawer(false)}
                style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-Browser Document Viewer Modal */}
      {previewDocument && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(5px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
          <div className="glass-panel animate-scale-up" style={{ width: '100%', maxWidth: '820px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', padding: '1.75rem', background: 'var(--bg-card)', border: '1px solid var(--border-light)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <FileText size={20} color="var(--primary)" />
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                    {previewDocument.title}
                  </h3>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                    {previewDocument.filename} • Page {previewDocument.page} • Version {previewDocument.version}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setPreviewDocument(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.25rem', fontWeight: 700 }}
              >
                ✕
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', background: 'var(--bg-primary)', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span className="badge badge-info">Page {previewDocument.page} Context</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Direct Citation Highlight</span>
              </div>
              <div style={{ padding: '1rem', background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '6px', fontSize: '0.9rem', lineHeight: 1.65, color: 'var(--text-main)', fontStyle: 'italic' }}>
                "{previewDocument.snippet}"
              </div>
            </div>

            <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setPreviewDocument(null)}
              >
                Close Document Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
