import React from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, Building2, GraduationCap, BookOpen, ArrowRight } from 'lucide-react';
import { BrutalCard, BrutalBadge } from '../brutal';
import { useScrollReveal } from '../../hooks/useScrollReveal';
import { variants } from '../../motion/presets';

const ROLES = [
  {
    code: 'platform_admin',
    title: 'Platform Admin',
    scope: 'Global Oversight',
    icon: ShieldAlert,
    badgeTone: 'yellow',
    capabilities: [
      'College-wide document catalog',
      'Cryptographic audit ledger inspection',
      'User management & role assignment',
      'System benchmarks & pipeline telemetry',
    ],
  },
  {
    code: 'dept_admin_cse',
    title: 'Department HOD',
    scope: 'Departmental Scope (CSE)',
    icon: Building2,
    badgeTone: 'black',
    capabilities: [
      'Departmental circular & syllabus ingestion',
      'Faculty access governance',
      'Isolated department query context',
      'Departmental audit verification',
    ],
  },
  {
    code: 'faculty_cse',
    title: 'Faculty Member',
    scope: 'Staff & Course Scope',
    icon: BookOpen,
    badgeTone: 'paper',
    capabilities: [
      'Course syllabus & curriculum upload',
      'Exam circular & rubric ingestion',
      'Institutional grounded Q&A query',
      'Evidence citation inspection',
    ],
  },
  {
    code: 'student_cse',
    title: 'Enrolled Student',
    scope: 'Read-Only Tenant Scope',
    icon: GraduationCap,
    badgeTone: 'paper',
    capabilities: [
      'Search approved circulars & notices',
      'Academic syllabus reference lookup',
      'Zero cross-department leakage',
      'Read-only grounded AI assistant',
    ],
  },
];

/**
 * RoleCards
 * Persona overview displaying clear security boundaries and authorized actions.
 */
export default function RoleCards({ onSelectRole }) {
  const [ref, isRevealed] = useScrollReveal({ threshold: 0.1 });

  return (
    <section ref={ref} className="py-20 px-4 md:px-8 max-w-7xl mx-auto w-full">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12 pb-6 border-b-3 border-brutal-black dark:border-brutal-yellow">
        <div>
          <span className="font-mono text-xs font-black uppercase tracking-widest text-brutal-muted dark:text-brutal-muted-dark">
            Security Context // 03
          </span>
          <h2 className="font-display font-black text-3xl sm:text-5xl uppercase tracking-tight text-brutal-black dark:text-brutal-white mt-1">
            Governed Institutional Personas
          </h2>
        </div>
        <p className="font-mono text-xs max-w-md text-brutal-black/70 dark:text-brutal-white/70">
          OWASP ASVS 4.1 enforced tenancy. Every persona operates in a cryptographically isolated scope.
        </p>
      </div>

      <motion.div
        variants={variants.staggerContainer}
        initial="initial"
        animate={isRevealed ? 'animate' : 'initial'}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {ROLES.map((r) => {
          const Icon = r.icon;
          return (
            <motion.div key={r.code} variants={variants.staggerItem}>
              <BrutalCard
                hoverable
                tone="default"
                className="h-full flex flex-col justify-between p-6 border-3"
              >
                <div>
                  <div className="flex items-center justify-between pb-3 mb-4 border-b-2 border-brutal-black/20 dark:border-brutal-yellow/20">
                    <div className="w-10 h-10 bg-brutal-yellow border-2 border-brutal-black flex items-center justify-center shadow-brutal-sm">
                      <Icon size={20} className="text-brutal-black" strokeWidth={2.5} />
                    </div>
                    <BrutalBadge tone={r.badgeTone} size="sm">
                      {r.scope}
                    </BrutalBadge>
                  </div>

                  <h3 className="font-display font-black text-lg uppercase tracking-tight text-brutal-black dark:text-brutal-white mb-3">
                    {r.title}
                  </h3>

                  <ul className="space-y-2 mb-6">
                    {r.capabilities.map((cap, i) => (
                      <li key={i} className="flex items-start gap-2 font-mono text-xs text-brutal-black/80 dark:text-brutal-white/80">
                        <span className="text-brutal-yellow font-black bg-brutal-black px-1 text-[10px] leading-tight">
                          /
                        </span>
                        <span>{cap}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {onSelectRole && (
                  <button
                    type="button"
                    onClick={() => onSelectRole(r.code)}
                    className="w-full mt-4 py-2 px-3 border-2 border-brutal-black dark:border-brutal-yellow bg-brutal-paper dark:bg-brutal-dark-surface font-mono text-xs font-black uppercase text-brutal-black dark:text-brutal-white hover:bg-brutal-yellow hover:text-brutal-black shadow-brutal-sm flex items-center justify-between transition-colors"
                  >
                    <span>Authenticate Persona</span>
                    <ArrowRight size={14} />
                  </button>
                )}
              </BrutalCard>
            </motion.div>
          );
        })}
      </motion.div>
    </section>
  );
}
