import React from 'react';
import { Bot, PanelLeft, PanelLeftClose, Printer, Copy, FileDown } from 'lucide-react';
import { BrutalBadge, BrutalButton } from '../brutal';

/**
 * ChatHeader
 * Top bar for RAG Assistant coordinating sidebar drawer trigger, institutional tags, and copy/print exports.
 */
export default function ChatHeader({
  showSidebar,
  onToggleSidebar,
  onPrint,
  onCopyMarkdown,
  onExportDossier,
  isCopyDisabled = false,
  conversationTitle = 'Autonomous Grounded Q&A',
}) {
  return (
    <div className="h-14 px-4 bg-brutal-white dark:bg-brutal-dark border-b-3 border-brutal-black dark:border-brutal-yellow flex items-center justify-between gap-3 select-none flex-shrink-0">
      
      {/* Left: Sidebar toggle and conversation title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="p-1.5 border-2 border-brutal-black dark:border-brutal-yellow bg-brutal-paper dark:bg-brutal-dark-surface hover:bg-brutal-yellow hover:text-brutal-black shadow-brutal-sm transition-colors"
          title={showSidebar ? 'Hide Threads Sidebar' : 'Show Threads Sidebar'}
          aria-label="Toggle threads sidebar"
        >
          {showSidebar ? <PanelLeftClose size={16} /> : <PanelLeft size={16} />}
        </button>

        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 bg-brutal-yellow border border-brutal-black flex items-center justify-center flex-shrink-0">
            <Bot size={14} className="text-brutal-black" />
          </div>
          <span className="font-display font-black text-sm uppercase tracking-tight text-brutal-black dark:text-brutal-white truncate max-w-xs sm:max-w-md">
            {conversationTitle}
          </span>
        </div>
      </div>

      {/* Right: Security Badges & Copy/Export Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <BrutalBadge tone="yellow" size="sm" className="hidden sm:inline-flex">
          GROQ LLM
        </BrutalBadge>

        <BrutalBadge tone="black" size="sm" className="hidden md:inline-flex">
          ZERO HALLUCINATION GATE
        </BrutalBadge>

        {onCopyMarkdown && (
          <BrutalButton
            variant="secondary"
            size="sm"
            onClick={onCopyMarkdown}
            disabled={isCopyDisabled}
            icon={Copy}
            aria-label="Copy conversation as Markdown"
            title="Copy conversation as Markdown"
            className="no-print"
          >
            <span className="hidden lg:inline">Copy MD</span>
          </BrutalButton>
        )}

        {onExportDossier && (
          <button
            type="button"
            onClick={onExportDossier}
            disabled={isCopyDisabled}
            className="p-1.5 border-2 border-brutal-black dark:border-brutal-yellow bg-brutal-paper dark:bg-brutal-dark-surface hover:bg-brutal-yellow hover:text-brutal-black shadow-brutal-sm transition-colors no-print disabled:opacity-50 disabled:cursor-not-allowed"
            title="Download Formal Institutional Dossier (.html)"
            aria-label="Export Institutional Dossier"
          >
            <FileDown size={15} />
          </button>
        )}

        {onPrint && (
          <button
            type="button"
            onClick={onPrint}
            className="p-1.5 border-2 border-brutal-black dark:border-brutal-yellow bg-brutal-paper dark:bg-brutal-dark-surface hover:bg-brutal-yellow hover:text-brutal-black shadow-brutal-sm transition-colors no-print"
            title="Export / Print Audit Report"
            aria-label="Export Audit Report"
          >
            <Printer size={15} />
          </button>
        )}
      </div>

    </div>
  );
}

