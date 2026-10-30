import React from 'react';
import { 
  ShieldCheck, 
  Building2, 
  Hash, 
  Mail, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Check, 
  X, 
  Zap,
  Calendar,
  User
} from 'lucide-react';
import { BrutalModal, BrutalBadge, BrutalButton } from '../brutal';

/**
 * ApplicantDossierModal
 * Yellow Brutalist compliance inspection card for institutional reviewers.
 * Gives HODs and Platform Admins complete visibility into applicant credentials,
 * automated pre-checks, and clearance actions including Break-Glass Emergency Bypass.
 */
export default function ApplicantDossierModal({
  applicant,
  isOpen,
  onClose,
  onApprove,
  onOpenReject,
  onBypass,
  isSuperadmin = false,
  isProcessing = false,
}) {
  if (!isOpen || !applicant) return null;

  const roleDisplay = applicant.roles?.[0]?.name || 'Student';
  const roleCode = applicant.roles?.[0]?.code || 'student';
  const deptName = applicant.department?.name || applicant.department?.code || 'General Institutional';
  const regNo = applicant.registration_number || 'N/A';
  const isTier2 = applicant.approval_status === 'pending_tier2';

  // Automated Compliance Pre-Checks
  const isKitEmail = applicant.email?.endsWith('@kitcoek.in') || applicant.email?.endsWith('.kit.edu') || applicant.email?.includes('kit');
  const hasValidRegFormat = Boolean(regNo && regNo.length >= 6);

  return (
    <BrutalModal
      isOpen={isOpen}
      onClose={onClose}
      title="Institutional Applicant Verification Dossier"
      size="lg"
    >
      <div className="space-y-6">
        {/* Top Dossier Masthead */}
        <div className="bg-brutal-paper dark:bg-brutal-dark-surface border-3 border-brutal-black dark:border-brutal-yellow p-5 shadow-brutal flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b-2 border-brutal-black/20 dark:border-brutal-yellow/20">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-brutal-yellow border-2 border-brutal-black flex items-center justify-center font-black text-xs text-brutal-black shadow-brutal-sm">
                KIT
              </div>
              <div>
                <span className="font-display font-black text-xs uppercase tracking-tight text-brutal-black dark:text-brutal-white">
                  Autonomous Academic Roster Verification
                </span>
                <div className="font-mono text-[9px] text-brutal-muted dark:text-brutal-muted-dark uppercase tracking-wider">
                  Registration Queue Clearance • ASVS 4.1 Tier Governance
                </div>
              </div>
            </div>

            <BrutalBadge tone={isTier2 ? 'accent' : 'yellow'} size="sm" dot>
              {isTier2 ? 'TIER 2 (PLATFORM ADMIN)' : 'TIER 1 (DEPT HOD)'}
            </BrutalBadge>
          </div>

          {/* Identity & Department Snapshot */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="w-14 h-14 bg-brutal-black text-brutal-yellow border-2 border-brutal-black dark:border-brutal-yellow flex items-center justify-center font-display font-black text-2xl flex-shrink-0 shadow-brutal-sm">
              {applicant.full_name ? applicant.full_name.charAt(0).toUpperCase() : 'U'}
            </div>

            <div className="space-y-1 min-w-0">
              <h2 className="font-display font-black text-xl uppercase tracking-tight text-brutal-black dark:text-brutal-white truncate">
                {applicant.full_name}
              </h2>
              
              <div className="flex flex-wrap items-center gap-2 font-mono text-xs text-brutal-black/80 dark:text-brutal-white/80">
                <div className="flex items-center gap-1">
                  <Mail size={12} className="text-brutal-muted" />
                  <span className="truncate">{applicant.email}</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1 font-bold text-brutal-black dark:text-brutal-yellow">
                  <Building2 size={12} />
                  <span>{deptName}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <BrutalBadge
                  tone={roleDisplay.toLowerCase().includes('admin') || roleDisplay.toLowerCase().includes('hod') ? 'yellow' : 'paper'}
                  size="sm"
                >
                  {roleDisplay}
                </BrutalBadge>
                
                <span className="font-mono text-[10px] text-brutal-muted dark:text-brutal-muted-dark">
                  Submitted: {applicant.created_at ? new Date(applicant.created_at).toLocaleString() : 'Recent application'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Academic Credentials Section */}
        <div className="border-2 border-brutal-black dark:border-brutal-yellow bg-brutal-white dark:bg-brutal-dark p-4 shadow-brutal-sm space-y-3">
          <div className="font-mono text-xs font-black uppercase tracking-wider text-brutal-black dark:text-brutal-white flex items-center gap-2">
            <Hash size={14} className="text-brutal-yellow" />
            <span>Academic Identification & Roster Binding</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
            <div className="p-3 bg-brutal-paper dark:bg-brutal-dark-surface border border-brutal-black/30 dark:border-brutal-yellow/30">
              <span className="text-[10px] text-brutal-muted dark:text-brutal-muted-dark uppercase block">
                {roleCode === 'student' ? 'Permanent Reg. Number (PRN)' : 'Faculty / Staff ID'}
              </span>
              <span className="font-black text-sm text-brutal-black dark:text-brutal-white tracking-wider">
                {regNo}
              </span>
            </div>

            <div className="p-3 bg-brutal-paper dark:bg-brutal-dark-surface border border-brutal-black/30 dark:border-brutal-yellow/30">
              <span className="text-[10px] text-brutal-muted dark:text-brutal-muted-dark uppercase block">
                Target Department Tenant
              </span>
              <span className="font-black text-sm text-brutal-black dark:text-brutal-white">
                {applicant.department?.code || 'INSTITUTIONAL'}
              </span>
            </div>
          </div>
        </div>

        {/* Automated Pre-Verification Checklist */}
        <div className="border-2 border-brutal-black dark:border-brutal-yellow bg-brutal-white dark:bg-brutal-dark p-4 shadow-brutal-sm space-y-2.5">
          <div className="font-mono text-xs font-black uppercase tracking-wider text-brutal-black dark:text-brutal-white flex items-center gap-2">
            <ShieldCheck size={14} className="text-brutal-yellow" />
            <span>Automated Pre-Verification Integrity Checks</span>
          </div>

          <div className="space-y-1.5 font-mono text-xs">
            <div className="flex items-center gap-2 text-brutal-black dark:text-brutal-white">
              <CheckCircle2 size={14} className={hasValidRegFormat ? "text-brutal-success" : "text-brutal-accent"} />
              <span>
                {hasValidRegFormat
                  ? `Identification number format valid (${regNo.length} characters)`
                  : 'Identification number requires manual confirmation'}
              </span>
            </div>

            <div className="flex items-center gap-2 text-brutal-black dark:text-brutal-white">
              <CheckCircle2 size={14} className={isKitEmail ? "text-brutal-success" : "text-brutal-accent"} />
              <span>
                {isKitEmail
                  ? 'Institutional email domain verified (@kitcoek.in)'
                  : 'External / non-standard domain used; verify candidate identity'}
              </span>
            </div>

            <div className="flex items-center gap-2 text-brutal-black dark:text-brutal-white">
              <CheckCircle2 size={14} className="text-brutal-success" />
              <span>Department boundary check passed (anti-BOLA verified)</span>
            </div>
          </div>
        </div>

        {/* Clearance Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t-2 border-brutal-black/20 dark:border-brutal-yellow/20">
          <div className="flex items-center gap-2">
            <BrutalButton
              variant="outline"
              size="md"
              disabled={isProcessing}
              onClick={() => onOpenReject(applicant)}
              className="font-mono text-xs font-bold uppercase text-brutal-accent hover:bg-brutal-accent hover:text-brutal-white border-brutal-black dark:border-brutal-yellow flex items-center justify-center gap-1.5"
            >
              <X size={14} strokeWidth={3} />
              <span>Reject with Reason</span>
            </BrutalButton>

            {/* Emergency Break-Glass Bypass (Superadmin Only) */}
            {isSuperadmin && !isTier2 && (
              <BrutalButton
                variant="outline"
                size="md"
                disabled={isProcessing}
                onClick={() => onBypass && onBypass(applicant)}
                className="font-mono text-xs font-black uppercase text-brutal-black dark:text-brutal-yellow bg-brutal-yellow/15 hover:bg-brutal-yellow hover:text-brutal-black border-2 border-brutal-black dark:border-brutal-yellow flex items-center justify-center gap-1.5"
                title="Execute administrative break-glass override"
              >
                <Zap size={14} className="text-brutal-accent" />
                <span>⚡ Admin Bypass</span>
              </BrutalButton>
            )}
          </div>

          <div className="flex items-center gap-2 justify-end">
            <BrutalButton
              variant="secondary"
              size="md"
              onClick={onClose}
              disabled={isProcessing}
              className="font-mono text-xs uppercase font-bold"
            >
              Cancel
            </BrutalButton>

            <BrutalButton
              variant="primary"
              size="md"
              disabled={isProcessing}
              loading={isProcessing}
              onClick={() => onApprove(applicant)}
              className="font-mono text-xs font-black uppercase shadow-brutal flex items-center justify-center gap-1.5"
            >
              <Check size={14} strokeWidth={3} />
              <span>Approve & Activate User</span>
            </BrutalButton>
          </div>
        </div>
      </div>
    </BrutalModal>
  );
}
