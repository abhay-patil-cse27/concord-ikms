import React from 'react';
import { Search, Bot, FileText, CreditCard } from 'lucide-react';
import { BrutalCard } from '../brutal';

/**
 * AcademicHubCard
 * Reusable Yellow Brutalist dashboard hub card for Students and Faculty.
 * Avoids redundant markup and dynamically adapts actions and credentials to the user's role.
 */
export default function AcademicHubCard({ user, roleType = 'student', onViewIdCard }) {
  const isStudent = roleType === 'student';

  const title = isStudent ? 'Student Academic Knowledge Hub' : 'Faculty Ingestion & Academic Hub';
  const badge = isStudent ? 'Autonomous Regulations' : 'Staff Scope';
  const idLabel = isStudent ? 'Permanent Reg. No (PRN):' : 'Faculty / Employee ID:';
  const idValue = user?.registration_number || (isStudent ? '2024BTECS089' : 'EMP-CSE-042');
  const clearanceText = isStudent ? 'VERIFIED ENROLLED STUDENT' : 'AUTHORIZED ACADEMIC CONTRIBUTOR';
  const buttonText = isStudent ? 'View Official Institutional ID Card' : 'View Official Faculty Credential';

  const deptName = user?.department?.name || user?.department?.code || 'Computer Science & Engineering';

  return (
    <BrutalCard
      title={title}
      badge={badge}
      headerVariant="yellow"
      className="p-0"
      bodyClassName="p-5 flex flex-col justify-between gap-4"
    >
      <div className="space-y-3">
        {/* Credential Strip */}
        <div className="p-3 bg-brutal-paper dark:bg-brutal-dark-surface border-2 border-brutal-black dark:border-brutal-yellow font-mono text-xs flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-brutal-muted">Department:</span>
            <span className="font-bold text-brutal-black dark:text-brutal-white truncate max-w-[200px]" title={deptName}>
              {deptName}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-brutal-muted">{idLabel}</span>
            <span className="font-bold text-brutal-black dark:text-brutal-yellow">
              {idValue}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-brutal-muted">Clearance Status:</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">
              {clearanceText}
            </span>
          </div>
        </div>

        {/* Quick Action Tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {isStudent ? (
            <a
              href="#/search"
              className="p-3 bg-brutal-white dark:bg-brutal-dark border-2 border-brutal-black dark:border-brutal-yellow shadow-brutal-sm hover:bg-brutal-yellow hover:text-brutal-black transition-all flex items-center gap-3 font-mono text-xs font-bold"
            >
              <div className="p-2 bg-brutal-yellow text-brutal-black border border-brutal-black">
                <Search size={16} />
              </div>
              <div>
                <div>Search Regulations</div>
                <div className="text-[10px] text-brutal-muted font-normal">Syllabus & circulars</div>
              </div>
            </a>
          ) : (
            <a
              href="#/documents"
              className="p-3 bg-brutal-white dark:bg-brutal-dark border-2 border-brutal-black dark:border-brutal-yellow shadow-brutal-sm hover:bg-brutal-yellow hover:text-brutal-black transition-all flex items-center gap-3 font-mono text-xs font-bold"
            >
              <div className="p-2 bg-brutal-yellow text-brutal-black border border-brutal-black">
                <FileText size={16} />
              </div>
              <div>
                <div>Ingest Document</div>
                <div className="text-[10px] text-brutal-muted font-normal">Upload syllabus & notes</div>
              </div>
            </a>
          )}

          <a
            href="#/rag"
            className="p-3 bg-brutal-white dark:bg-brutal-dark border-2 border-brutal-black dark:border-brutal-yellow shadow-brutal-sm hover:bg-brutal-yellow hover:text-brutal-black transition-all flex items-center gap-3 font-mono text-xs font-bold"
          >
            <div className="p-2 bg-brutal-black text-brutal-yellow border border-brutal-black">
              <Bot size={16} />
            </div>
            <div>
              <div>Ask Policy Assistant</div>
              <div className="text-[10px] text-brutal-muted font-normal">Grounded cited answers</div>
            </div>
          </a>
        </div>
      </div>

      {/* ID Card Action */}
      <div className="pt-2 border-t-2 border-brutal-black/20 dark:border-brutal-yellow/20">
        <button
          type="button"
          onClick={onViewIdCard}
          className="w-full py-2 px-3 bg-brutal-black text-brutal-yellow dark:bg-brutal-yellow dark:text-brutal-black font-display font-black text-xs uppercase tracking-wider border-2 border-brutal-black shadow-brutal-sm hover:translate-x-0.5 hover:translate-y-0.5 transition-all flex items-center justify-center gap-2"
        >
          <CreditCard size={14} strokeWidth={2.5} />
          <span>{buttonText}</span>
        </button>
      </div>
    </BrutalCard>
  );
}
