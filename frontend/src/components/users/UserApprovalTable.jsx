import React from 'react';
import { motion } from 'framer-motion';
import { Check, X, Building2, Hash, Mail, FileText } from 'lucide-react';
import { BrutalButton, BrutalBadge, BrutalTable } from '../brutal';
import { variants } from '../../motion/presets';

const TABLE_HEADERS = [
  'Applicant Identity',
  'Institutional Email',
  'Applied Role',
  'Department',
  'Workflow Status',
  { label: 'Clearance Controls', className: 'text-right' },
];

/**
 * UserApprovalTable
 * Reusable Yellow Brutalist table presenting pending institutional applicant rows.
 */
export default function UserApprovalTable({
  pendingUsers,
  actionInProgress,
  onApprove,
  onOpenRejectModal,
  onInspectDossier,
}) {
  return (
    <div className="w-full">
      <BrutalTable headers={TABLE_HEADERS} stickyHeader>
        {pendingUsers.map((applicant) => {
          const isProcessing = actionInProgress === applicant.id;
          const roleDisplay = applicant.roles?.[0]?.name || 'Student';
          const isTier2 = applicant.approval_status === 'pending_tier2';

          return (
            <motion.tr
              key={applicant.id}
              variants={variants.staggerItem}
              className="border-b-2 border-brutal-black/20 dark:border-brutal-yellow/20 font-mono text-xs hover:bg-brutal-yellow/10 transition-colors"
            >
              {/* Identity & Reg Number */}
              <td className="p-3.5 whitespace-nowrap">
                <button
                  type="button"
                  onClick={() => onInspectDossier && onInspectDossier(applicant)}
                  className="flex items-center gap-2.5 text-left group cursor-pointer"
                  title="Click to inspect applicant verification dossier"
                >
                  <div className="w-8 h-8 bg-brutal-black text-brutal-yellow border border-brutal-black flex items-center justify-center font-bold text-xs flex-shrink-0 group-hover:scale-105 transition-transform">
                    {applicant.full_name ? applicant.full_name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div>
                    <div className="font-sans font-black text-sm text-brutal-black dark:text-brutal-white group-hover:text-brutal-accent dark:group-hover:text-brutal-yellow transition-colors underline decoration-dotted">
                      {applicant.full_name}
                    </div>
                    {applicant.registration_number ? (
                      <div className="flex items-center gap-1 text-[11px] text-brutal-muted dark:text-brutal-muted-dark font-mono">
                        <Hash size={11} />
                        <span>ID: {applicant.registration_number}</span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-brutal-muted font-mono italic">No ID logged</span>
                    )}
                  </div>
                </button>
              </td>

              {/* Email */}
              <td className="p-3.5 whitespace-nowrap text-brutal-black/80 dark:text-brutal-white/80">
                <div className="flex items-center gap-1.5 font-mono">
                  <Mail size={13} className="text-brutal-muted" />
                  <span>{applicant.email}</span>
                </div>
              </td>

              {/* Applied Role */}
              <td className="p-3.5 whitespace-nowrap">
                <BrutalBadge
                  tone={
                    roleDisplay.toLowerCase().includes('admin') || roleDisplay.toLowerCase().includes('hod')
                      ? 'yellow'
                      : 'paper'
                  }
                  size="sm"
                >
                  {roleDisplay}
                </BrutalBadge>
              </td>

              {/* Department */}
              <td className="p-3.5 whitespace-nowrap">
                <div className="flex items-center gap-1.5 font-mono font-bold text-brutal-black dark:text-brutal-white">
                  <Building2 size={13} className="text-brutal-yellow" />
                  <span>{applicant.department?.name || applicant.department?.code || 'General'}</span>
                </div>
              </td>

              {/* Workflow Tier Status */}
              <td className="p-3.5 whitespace-nowrap">
                <BrutalBadge tone={isTier2 ? 'accent' : 'yellow'} size="sm" dot>
                  {isTier2 ? 'TIER 2 (ADMIN)' : 'TIER 1 (HOD)'}
                </BrutalBadge>
              </td>

              {/* Action Triggers */}
              <td className="p-3.5 text-right whitespace-nowrap">
                <div className="flex items-center justify-end gap-2">
                  <BrutalButton
                    variant="outline"
                    size="sm"
                    disabled={isProcessing}
                    onClick={() => onInspectDossier && onInspectDossier(applicant)}
                    className="py-1 px-2.5 text-xs font-bold uppercase flex items-center gap-1 border-brutal-black dark:border-brutal-yellow"
                    title="Inspect candidate credentials dossier"
                  >
                    <FileText size={12} />
                    <span>Dossier</span>
                  </BrutalButton>

                  <BrutalButton
                    variant="primary"
                    size="sm"
                    disabled={isProcessing}
                    loading={isProcessing}
                    onClick={() => onApprove(applicant)}
                    className="py-1 px-3 text-xs font-black uppercase flex items-center gap-1 shadow-brutal-sm"
                    title="Approve applicant registration"
                  >
                    <Check size={13} strokeWidth={3} />
                    <span>Approve</span>
                  </BrutalButton>

                  <BrutalButton
                    variant="outline"
                    size="sm"
                    disabled={isProcessing}
                    onClick={() => onOpenRejectModal(applicant)}
                    className="py-1 px-3 text-xs font-bold uppercase text-brutal-accent hover:bg-brutal-accent hover:text-brutal-white border-brutal-black dark:border-brutal-yellow flex items-center gap-1"
                    title="Reject applicant registration"
                  >
                    <X size={13} strokeWidth={3} />
                    <span>Reject</span>
                  </BrutalButton>
                </div>
              </td>
            </motion.tr>
          );
        })}
      </BrutalTable>
    </div>
  );
}

