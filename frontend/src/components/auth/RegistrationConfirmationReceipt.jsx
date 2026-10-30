import React from 'react';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { BrutalCard, BrutalButton } from '../brutal';

/**
 * RegistrationConfirmationReceipt
 * Reusable Yellow Brutalist submission receipt for new institutional applicants.
 */
export default function RegistrationConfirmationReceipt({
  applicantName,
  email,
  roleLabel,
  departmentName,
  approvalStatus,
  onReturnToLogin,
}) {
  const isTier1 = approvalStatus === 'pending_tier1';

  return (
    <BrutalCard className="p-6 sm:p-8 border-3 border-brutal-black dark:border-brutal-yellow shadow-brutal bg-brutal-white dark:bg-brutal-dark">
      <div className="flex items-center gap-3 text-brutal-black dark:text-brutal-yellow mb-4">
        <CheckCircle2 size={32} className="text-brutal-accent stroke-[2.5]" />
        <div>
          <h2 className="font-display font-black text-xl uppercase tracking-tight">
            Registration Submitted!
          </h2>
          <div className="font-mono text-xs text-brutal-muted dark:text-brutal-muted-dark">
            Application routed to Institutional 2-Tier Approval Queue
          </div>
        </div>
      </div>

      <div className="p-4 bg-brutal-yellow/15 border-2 border-brutal-black dark:border-brutal-yellow space-y-2 mb-6 font-mono text-xs">
        <div className="flex justify-between">
          <span className="text-brutal-muted dark:text-brutal-muted-dark">Applicant:</span>
          <span className="font-bold">{applicantName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-brutal-muted dark:text-brutal-muted-dark">Institutional Email:</span>
          <span className="font-bold">{email}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-brutal-muted dark:text-brutal-muted-dark">Requested Role:</span>
          <span className="font-bold uppercase">{roleLabel}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-brutal-muted dark:text-brutal-muted-dark">Department:</span>
          <span className="font-bold">{departmentName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-brutal-muted dark:text-brutal-muted-dark">Queue Status:</span>
          <span className="font-bold text-brutal-accent uppercase">{approvalStatus}</span>
        </div>
      </div>

      <p className="font-mono text-xs text-brutal-black/80 dark:text-brutal-white/80 leading-relaxed mb-6">
        {isTier1
          ? 'Your registration has been forwarded to your Department Administrator (HOD) for verification. Once approved, you can sign in directly with your email and password.'
          : 'Your registration as Department Administrator has been routed to the Platform Administrator (Dean / Registrar) for Tier-2 approval.'}
      </p>

      <BrutalButton
        variant="primary"
        size="lg"
        onClick={onReturnToLogin}
        className="w-full justify-center text-xs font-black uppercase tracking-wider shadow-brutal"
      >
        <span>Return to Sign In</span>
        <ArrowRight size={16} />
      </BrutalButton>
    </BrutalCard>
  );
}

