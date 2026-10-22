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
        background: 'var(--bg-card)',
        borderRight: '1px solid var(--border-light)',
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
          borderBottom: '1px solid var(--border-light)',
          background: 'var(--bg-subtle)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-main)' }}>
          <div style={{ width: 24, height: 24, borderRadius: '6px', background: 'rgba(2, 132, 199, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles size={14} color="var(--primary)" />
          </div>
          <span style={{ letterSpacing: '-0.01em' }}>Inquiry Threads</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
          <button
            type="button"
            onClick={() => setShowSearch(!showSearch)}
            className="btn btn-ghost"
            style={{ padding: '6px', borderRadius: '6px', color: 'var(--text-muted)' }}
            title="Search threads"
          >
            <Search size={15} />
          </button>

          {onCloseSidebar && (
            <button
              type="button"
              onClick={onCloseSidebar}
              className="btn btn-ghost"
              style={{ padding: '6px', borderRadius: '6px', color: 'var(--text-muted)' }}
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
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-light)',
            borderRadius: '10px',
            color: 'var(--text-main)',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          className="chatgpt-new-btn"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
            <SquarePen size={15} color="var(--primary)" />
            <span>New inquiry</span>
          </div>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>⌘N</span>
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
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-light)',
                borderRadius: '8px',
                color: 'var(--text-main)',
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
                        color: isActive ? 'var(--primary)' : 'var(--text-main)',
                        background: isActive ? 'rgba(2, 132, 199, 0.08)' : 'transparent',
                        border: isActive ? '1px solid rgba(2, 132, 199, 0.25)' : '1px solid transparent',
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
                          color: 'var(--text-dim)',
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

      {/* Footer Profile Section */}
      <div
        style={{
          padding: '0.75rem 0.95rem',
          borderTop: '1px solid var(--border-light)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          background: 'var(--bg-subtle)'
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: 'var(--primary)',
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
          <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {userName}
          </span>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>
            {userRole}
          </span>
        </div>
      </div>
    </aside>
  );
}
