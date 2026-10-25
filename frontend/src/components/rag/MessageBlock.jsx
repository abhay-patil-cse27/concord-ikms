import React from 'react';
import { motion } from 'framer-motion';
import { Bot, User, Quote, Layers, CheckCircle2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { BrutalBadge, BrutalButton } from '../brutal';
import { cn } from '../../lib/utils';
import { variants } from '../../motion/presets';
import AnswerFeedback from './AnswerFeedback';

/**
 * MessageBlock
 * User and Assistant message variants rendered as crisp architectural blocks with hard borders.
 * Parses citation chips like [1], [2] as clickable yellow tags.
 */
export default function MessageBlock({
  role = 'assistant',
  content = '',
  timestamp,
  citations = [],
  onOpenCitation,
  isStreaming = false,
}) {
  const isUser = role === 'user';

  // Transform citations [1], [2] in markdown into custom clickable elements
  const renderers = {
    p: ({ children }) => {
      // Process children to inject interactive citation badges
      const processChild = (child) => {
        if (typeof child !== 'string') return child;
        const parts = child.split(/(\[\d+\])/g);
        if (parts.length === 1) return child;

        return parts.map((part, i) => {
          const match = part.match(/^\[(\d+)\]$/);
          if (match) {
            const citIndex = parseInt(match[1], 10);
            return (
              <button
                key={i}
                type="button"
                onClick={() => onOpenCitation && onOpenCitation(citIndex)}
                className="inline-flex items-center px-1.5 py-0.2 mx-1 bg-brutal-yellow text-brutal-black border border-brutal-black font-mono text-[11px] font-black hover:bg-brutal-black hover:text-brutal-yellow transition-colors align-baseline"
                title={`View Evidence Citation [${citIndex}]`}
              >
                [{citIndex}]
              </button>
            );
          }
          return part;
        });
      };

      return (
        <p className="mb-2 leading-relaxed">
          {React.Children.map(children, processChild)}
        </p>
      );
    },
    h1: ({ children }) => <h1 className="font-display font-black text-lg uppercase mt-3 mb-1 text-brutal-black dark:text-brutal-white">{children}</h1>,
    h2: ({ children }) => <h2 className="font-display font-black text-base uppercase mt-3 mb-1 text-brutal-black dark:text-brutal-white">{children}</h2>,
    h3: ({ children }) => <h3 className="font-display font-bold text-sm uppercase mt-2 mb-1 text-brutal-black dark:text-brutal-white">{children}</h3>,
    ul: ({ children }) => <ul className="list-disc pl-5 my-2 space-y-1">{children}</ul>,
    ol: ({ children }) => <ol className="list-decimal pl-5 my-2 space-y-1">{children}</ol>,
    li: ({ children }) => <li className="leading-relaxed">{children}</li>,
    table: ({ children }) => (
      <div className="overflow-x-auto my-3 border-2 border-brutal-black dark:border-brutal-yellow">
        <table className="w-full border-collapse font-mono text-xs text-left">{children}</table>
      </div>
    ),
    thead: ({ children }) => <thead className="bg-brutal-black text-brutal-yellow uppercase border-b-2 border-brutal-black">{children}</thead>,
    th: ({ children }) => <th className="p-2 border-r border-brutal-black/30 dark:border-brutal-yellow/30 font-black">{children}</th>,
    td: ({ children }) => <td className="p-2 border-t border-r border-brutal-black/20 dark:border-brutal-yellow/20">{children}</td>,
    code: ({ children }) => (
      <code className="bg-brutal-black text-brutal-yellow px-1 py-0.5 font-mono text-xs border border-brutal-black">
        {children}
      </code>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-3 border-brutal-yellow bg-brutal-paper dark:bg-brutal-dark p-2 my-2 italic font-mono text-xs">
        {children}
      </blockquote>
    ),
  };

  return (
    <motion.div
      variants={variants.staggerItem}
      className={cn(
        'w-full flex flex-col',
        isUser ? 'items-end' : 'items-start'
      )}
    >
      <div
        className={cn(
          'max-w-[90%] sm:max-w-[80%] border-3 shadow-brutal p-4 transition-all',
          isUser
            ? 'bg-brutal-yellow text-brutal-black border-brutal-black'
            : 'bg-brutal-white dark:bg-brutal-dark-surface text-brutal-black dark:text-brutal-white border-brutal-black dark:border-brutal-yellow'
        )}
      >
        {/* Message Header */}
        <div className="flex items-center justify-between gap-3 pb-2 mb-2 border-b-2 border-brutal-black/20 dark:border-brutal-yellow/20">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'w-6 h-6 border border-brutal-black flex items-center justify-center font-bold text-xs',
                isUser ? 'bg-brutal-black text-brutal-yellow' : 'bg-brutal-yellow text-brutal-black'
              )}
            >
              {isUser ? <User size={13} /> : <Bot size={13} />}
            </div>
            <span className="font-mono text-[11px] font-black uppercase tracking-wider">
              {isUser ? 'You (Verified Persona)' : 'CONCORD Grounded Memory'}
            </span>
          </div>

          {timestamp && (
            <span className="font-mono text-[10px] text-brutal-muted dark:text-brutal-muted-dark">
              {(() => {
                if (typeof timestamp === 'string' && (timestamp.includes(':') && !timestamp.includes('T') && !timestamp.includes('-'))) {
                  return timestamp;
                }
                const parsed = new Date(timestamp);
                return isNaN(parsed.getTime()) ? timestamp : parsed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              })()}
            </span>
          )}
        </div>

        {/* Message Content */}
        <div className="font-sans text-xs sm:text-sm select-text">
          {isUser ? (
            <div className="whitespace-pre-wrap leading-relaxed font-medium">
              {content}
            </div>
          ) : (
            <div className="markdown-body">
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={renderers}>
                {content}
              </ReactMarkdown>
              {isStreaming && (
                <span className="inline-block w-2 h-4 ml-1 bg-brutal-yellow border border-brutal-black animate-pulse align-middle" />
              )}
            </div>
          )}
        </div>

        {/* Citations Footer for Assistant responses */}
        {!isUser && citations && citations.length > 0 && (
          <div className="mt-3 pt-2.5 border-t-2 border-brutal-black/10 dark:border-brutal-yellow/10 flex items-center gap-2 flex-wrap">
            <span className="font-mono text-[10px] font-black uppercase text-brutal-muted dark:text-brutal-muted-dark">
              Verified Evidence:
            </span>
            {citations.map((c, idx) => (
              <button
                key={c.id || idx}
                type="button"
                onClick={() => onOpenCitation && onOpenCitation(idx + 1)}
                className="px-2 py-0.5 border border-brutal-black dark:border-brutal-yellow bg-brutal-paper dark:bg-brutal-dark font-mono text-[10px] font-bold uppercase hover:bg-brutal-yellow hover:text-brutal-black transition-colors"
                title={c.document_title || c.title}
              >
                [{idx + 1}] {c.document_title || c.title || `Chunk #${c.chunk_index}`}
              </button>
            ))}
          </div>
        )}

        {/* Operational Feedback Loop (👍 / 👎 / Inaccuracy Flagging) */}
        {!isUser && !isStreaming && content && <AnswerFeedback content={content} />}
      </div>
    </motion.div>
  );
}
