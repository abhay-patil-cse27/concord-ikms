import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  SquarePen, 
  Search, 
  Trash2, 
  PanelLeftClose, 
  MessageSquare,
  Sparkles
} from 'lucide-react';
import { BrutalButton, BrutalBadge } from '../brutal';
import { cn } from '../../lib/utils';

/**
 * ThreadSidebar
 * Yellow Brutalist inquiry thread list with recency groupings,
 * search filter, new chat shortcut, and active selection state.
 * Smoothly animates width and opacity on expand/collapse.
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
    : 'US';

  return (
    <motion.aside
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: 288, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
      className="w-72 flex-shrink-0 bg-brutal-white dark:bg-brutal-dark border-r-3 border-brutal-black dark:border-brutal-yellow flex flex-col h-full select-none overflow-hidden"
    >
      <div className="w-72 flex flex-col h-full">
      
      {/* Header */}
      <div className="p-3 border-b-2 border-brutal-black/20 dark:border-brutal-yellow/20 flex items-center justify-between gap-2 bg-brutal-paper dark:bg-brutal-dark-surface">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-brutal-yellow border border-brutal-black flex items-center justify-center">
            <MessageSquare size={13} className="text-brutal-black" />
          </div>
          <span className="font-mono text-xs font-black uppercase tracking-wider text-brutal-black dark:text-brutal-white">
            Inquiry Threads
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setShowSearch(!showSearch)}
            className="p-1.5 border border-brutal-black/30 dark:border-brutal-yellow/30 hover:bg-brutal-yellow hover:text-brutal-black transition-colors"
            title="Search threads"
          >
            <Search size={14} />
          </button>

          {onCloseSidebar && (
            <button
              type="button"
              onClick={onCloseSidebar}
              className="p-1.5 border border-brutal-black/30 dark:border-brutal-yellow/30 hover:bg-brutal-yellow hover:text-brutal-black transition-colors md:hidden"
              title="Close sidebar"
            >
              <PanelLeftClose size={14} />
            </button>
          )}
        </div>
      </div>

      {/* New Inquiry Button & Search Bar */}
      <div className="p-3 border-b-2 border-brutal-black/10 dark:border-brutal-yellow/10 flex flex-col gap-2">
        <button
          type="button"
          onClick={onCreateNewSession}
          className="w-full py-2.5 px-3 border-2 border-brutal-black dark:border-brutal-yellow bg-brutal-yellow text-brutal-black font-mono text-xs font-black uppercase tracking-wider shadow-brutal-sm hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <SquarePen size={14} strokeWidth={2.5} />
            <span>New Inquiry</span>
          </div>
          <span className="text-[10px] bg-brutal-black text-brutal-yellow px-1 py-0.2">
            +
          </span>
        </button>

        {showSearch && (
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Filter threads..."
            className="w-full p-1.5 font-mono text-xs bg-brutal-paper dark:bg-brutal-dark-surface border-2 border-brutal-black dark:border-brutal-yellow text-brutal-black dark:text-brutal-white outline-none"
            autoFocus
          />
        )}
      </div>

      {/* Thread list grouped by Recents */}
      <div className="flex-1 overflow-y-auto p-2 space-y-4">
        {conversations.length === 0 ? (
          <div className="p-6 text-center font-mono text-xs text-brutal-muted dark:text-brutal-muted-dark uppercase leading-relaxed">
            No active inquiry sessions. Ask a question to anchor thread history.
          </div>
        ) : (
          Object.entries(groupedThreads).map(([heading, items]) => {
            if (items.length === 0) return null;

            return (
              <div key={heading} className="space-y-1">
                <div className="px-2 py-1 font-mono text-[10px] font-black uppercase text-brutal-muted dark:text-brutal-muted-dark tracking-widest">
                  {heading === 'Today' ? 'Recents' : heading}
                </div>

                {items.map((c) => {
                  const isActive = activeConversationId === c.id;

                  return (
                    <div
                      key={c.id}
                      onClick={() => onSelectConversation(c.id)}
                      className={cn(
                        'flex items-center justify-between p-2 border-2 cursor-pointer font-mono text-xs transition-all group',
                        isActive
                          ? 'bg-brutal-yellow text-brutal-black border-brutal-black shadow-brutal-sm font-black'
                          : 'bg-transparent text-brutal-black dark:text-brutal-white border-transparent hover:border-brutal-black dark:hover:border-brutal-yellow hover:bg-brutal-paper dark:hover:bg-brutal-dark-surface'
                      )}
                    >
                      <span className="truncate pr-2" title={c.title}>
                        {c.title || 'Untitled Session'}
                      </span>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm('Delete this conversation thread?')) {
                            onDeleteSession(c.id);
                          }
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-brutal-accent hover:bg-brutal-accent hover:text-brutal-white transition-all flex-shrink-0"
                        title="Delete session"
                        aria-label={`Delete conversation session ${c.title || 'Untitled'}`}
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

      {/* Footer Profile Strip */}
      <div className="p-3 border-t-2 border-brutal-black/20 dark:border-brutal-yellow/20 bg-brutal-paper dark:bg-brutal-dark-surface flex items-center gap-2.5">
        <div className="w-7 h-7 bg-brutal-black text-brutal-yellow font-display font-black text-xs flex items-center justify-center border border-brutal-black flex-shrink-0">
          {initials}
        </div>
        <div className="min-w-0">
          <div className="font-mono text-xs font-bold text-brutal-black dark:text-brutal-white truncate">
            {userName}
          </div>
          <div className="font-mono text-[9px] text-brutal-muted dark:text-brutal-muted-dark uppercase tracking-wide truncate">
            {userRole}
          </div>
        </div>
      </div>

      </div>
    </motion.aside>
  );
}
