import React, { useState, useMemo } from 'react';
import { 
  SquarePen, 
  Search, 
  Trash2, 
  PanelLeftClose, 
  Sparkles
} from 'lucide-react';

/**
 * Reusable ChatGPT-style ThreadSidebar component
 * Groups chat threads into "Recents", "Yesterday", "Previous 7 Days", and "Older",
 * with search filter, new chat shortcut, and active state indicators.
 */
export default function ThreadSidebar({
  conversations = [],
  activeConversationId,
  onSelectConversation,
  onCreateNewSession,
  onDeleteSession,
  onCloseSidebar,
  userName = "Faculty Auditor",
  userRole = "CONCORD Evaluator"
}) {
  const [filterQuery, setFilterQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  // Group threads by recency (Today, Yesterday, Previous 7 Days, Older)
  const groupedThreads = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const startOfYesterday = startOfToday - oneDayMs;
    const startOfLast7Days = startOfToday - 7 * oneDayMs;

    const filtered = conversations.filter((c) => {
      if (!filterQuery.trim()) return true;
      return (c.title || '').toLowerCase().includes(filterQuery.toLowerCase());
    });

    const groups = {
      Today: [],
      Yesterday: [],
      'Previous 7 Days': [],
      Older: []
    };

    filtered.forEach((c) => {
      const updatedAt = new Date(c.updated_at || c.created_at || Date.now()).getTime();
      if (updatedAt >= startOfToday) {
        groups.Today.push(c);
      } else if (updatedAt >= startOfYesterday) {
        groups.Yesterday.push(c);
      } else if (updatedAt >= startOfLast7Days) {
        groups['Previous 7 Days'].push(c);
      } else {
        groups.Older.push(c);
      }
    });

    return groups;
  }, [conversations, filterQuery]);

  const initials = userName
    ? userName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : 'FA';

  return (
    <aside
      className="chatgpt-sidebar animate-fade-in no-print"
      style={{
        width: '260px',
        flexShrink: 0,
        background: '#0d1117',
        borderRight: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        position: 'relative',
        borderRadius: '16px 0 0 16px',
        overflow: 'hidden'
      }}
    >
      {/* Sidebar Header: Brand / Toggle */}
      <div
        style={{
          padding: '0.85rem 0.95rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', fontWeight: 700, fontSize: '0.92rem', color: '#f1f5f9' }}>
          <div style={{ width: 22, height: 22, borderRadius: '6px', background: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles size={13} color="#0f172a" />
          </div>
          <span style={{ letterSpacing: '-0.01em' }}>CONCORD RAG</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
          <button
            type="button"
            onClick={() => setShowSearch(!showSearch)}
            className="btn btn-ghost"
            style={{ padding: '6px', borderRadius: '6px', color: '#94a3b8' }}
            title="Search threads"
          >
            <Search size={15} />
          </button>

          {onCloseSidebar && (
            <button
              type="button"
              onClick={onCloseSidebar}
              className="btn btn-ghost"
              style={{ padding: '6px', borderRadius: '6px', color: '#94a3b8' }}
              title="Close sidebar"
            >
              <PanelLeftClose size={15} />
            </button>
          )}
        </div>
      </div>

      {/* New Chat Button */}
      <div style={{ padding: '0.75rem 0.85rem 0.4rem 0.85rem' }}>
        <button
          type="button"
          onClick={onCreateNewSession}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.65rem 0.85rem',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '10px',
            color: '#f8fafc',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          className="chatgpt-new-btn"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
            <SquarePen size={15} color="#38bdf8" />
            <span>New chat</span>
          </div>
          <span style={{ fontSize: '0.7rem', color: '#64748b' }}>⌘N</span>
        </button>

        {/* Filter input */}
        {showSearch && (
          <div style={{ marginTop: '0.5rem', position: 'relative' }}>
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Search chat history..."
              style={{
                width: '100%',
                padding: '0.45rem 0.75rem',
                fontSize: '0.8rem',
                background: '#161b22',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '8px',
                color: '#e2e8f0',
                outline: 'none'
              }}
              autoFocus
            />
          </div>
        )}
      </div>

      {/* Thread list grouped by Recents */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '0.4rem 0.65rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem'
        }}
        className="chatgpt-scrollable-threads"
      >
        {conversations.length === 0 ? (
          <div style={{ padding: '2rem 0.75rem', textAlign: 'center', color: '#64748b', fontSize: '0.78rem' }}>
            No recent chats. Start asking questions to preserve history.
          </div>
        ) : (
          Object.entries(groupedThreads).map(([heading, items]) => {
            if (items.length === 0) return null;
            return (
              <div key={heading} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <div
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    color: '#64748b',
                    padding: '0.35rem 0.55rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em'
                  }}
                >
                  {heading === 'Today' ? 'Recents' : heading}
                </div>

                {items.map((c) => {
                  const isActive = activeConversationId === c.id;
                  return (
                    <div
                      key={c.id}
                      onClick={() => onSelectConversation(c.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.55rem 0.65rem',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '0.84rem',
                        fontWeight: isActive ? 600 : 400,
                        color: isActive ? '#f8fafc' : '#94a3b8',
                        background: isActive ? 'rgba(56, 189, 248, 0.12)' : 'transparent',
                        border: isActive ? '1px solid rgba(56, 189, 248, 0.25)' : '1px solid transparent',
                        transition: 'all 0.15s ease'
                      }}
                      className="chatgpt-thread-row"
                    >
                      <div
                        style={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          flex: 1,
                          paddingRight: '0.4rem'
                        }}
                        title={c.title}
                      >
                        {c.title || 'Untitled Session'}
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteSession(c.id);
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#64748b',
                          cursor: 'pointer',
                          padding: '2px 4px',
                          display: 'flex',
                          alignItems: 'center',
                          borderRadius: '4px',
                          opacity: 0.6
                        }}
                        title="Delete chat thread"
                        className="chatgpt-thread-delete"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  );
                })}
              </div>
            );
          })
        )}
      </div>

      {/* Footer Profile Section (like ChatGPT avatar + name) */}
      <div
        style={{
          padding: '0.75rem 0.95rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          background: 'rgba(0, 0, 0, 0.2)'
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: '#e07a5f',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '0.8rem',
            flexShrink: 0
          }}
        >
          {initials}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#f1f5f9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {userName}
          </span>
          <span style={{ fontSize: '0.68rem', color: '#64748b' }}>
            {userRole}
          </span>
        </div>
      </div>
    </aside>
  );
}
