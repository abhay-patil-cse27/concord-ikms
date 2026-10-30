import React, { useState, useEffect } from 'react';
import { UserCheck, AlertCircle } from 'lucide-react';
import { BrutalButton, BrutalBadge, BrutalSkeleton, BrutalEmptyState } from '../brutal';
import UserApprovalTable from './UserApprovalTable';
import RejectionModal from './RejectionModal';
import ApplicantDossierModal from './ApplicantDossierModal';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

/**
 * UserApprovalQueue
 * Yellow Brutalist 2-Tier Institutional Approval interface.
 * Coordinates data fetching, HOD Tier 1 approvals, and Platform Admin Tier 2 escalations.
 */
export default function UserApprovalQueue({ onActionSuccess }) {
  const { user } = useAuth();
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionInProgress, setActionInProgress] = useState(null); // userId being processed

  // Rejection & Dossier Inspection Modal States
  const [rejectingUser, setRejectingUser] = useState(null);
  const [inspectingApplicant, setInspectingApplicant] = useState(null);

  const fetchPending = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getPendingUsers();
      setPendingUsers(data || []);
    } catch (err) {
      console.error('Failed to fetch pending user queue:', err);
      setError(err?.message || 'Failed to load institutional approval queue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleApprove = async (applicant) => {
    if (actionInProgress) return;
    setActionInProgress(applicant.id);
    setError(null);
    try {
      await api.reviewUser(applicant.id, 'approve');
      setPendingUsers((prev) => prev.filter((u) => u.id !== applicant.id));
      setInspectingApplicant(null);
      if (onActionSuccess) {
        onActionSuccess({
          message: `Applicant "${applicant.full_name}" successfully approved.`,
          type: 'success',
        });
      }
    } catch (err) {
      console.error('Failed to approve user:', err);
      setError(err?.message || `Failed to approve applicant ${applicant.full_name}.`);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleBypass = async (applicant) => {
    const reason = window.prompt(
      `Execute Institutional Break-Glass Override for "${applicant.full_name}"?\n\nEnter mandatory administrative justification:`
    );
    if (!reason || reason.trim().length < 5) {
      setError('A valid administrative reason (minimum 5 characters) is required for emergency bypass.');
      return;
    }

    setActionInProgress(applicant.id);
    setError(null);
    try {
      await api.bypassUser(applicant.id, reason.trim());
      setPendingUsers((prev) => prev.filter((u) => u.id !== applicant.id));
      setInspectingApplicant(null);
      if (onActionSuccess) {
        onActionSuccess({
          message: `Emergency Administrative Bypass executed for "${applicant.full_name}". Reason logged to audit ledger.`,
          type: 'success',
        });
      }
    } catch (err) {
      console.error('Failed to bypass applicant:', err);
      setError(err?.message || `Failed to execute bypass on ${applicant.full_name}.`);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleOpenRejectModal = (applicant) => {
    setInspectingApplicant(null);
    setRejectingUser(applicant);
  };

  const handleConfirmReject = async (applicant, reason) => {
    setActionInProgress(applicant.id);
    try {
      await api.reviewUser(applicant.id, 'reject', reason);
      const rejectedName = applicant.full_name;
      setPendingUsers((prev) => prev.filter((u) => u.id !== applicant.id));
      setRejectingUser(null);
      if (onActionSuccess) {
        onActionSuccess({
          message: `Applicant "${rejectedName}" registration rejected with reason logged.`,
          type: 'info',
        });
      }
    } catch (err) {
      console.error('Failed to reject applicant:', err);
      setError(err?.message || 'Failed to submit rejection action.');
    } finally {
      setActionInProgress(null);
    }
  };

  const isPlatformAdmin = user?.roles?.some((r) => r.code === 'platform_admin');
  const userDeptCode = user?.department?.code || 'CSE';

  return (
    <div className="w-full space-y-6">
      {/* Top Banner Alert / Context Strip */}
      <div className="bg-brutal-white dark:bg-brutal-dark-surface border-3 border-brutal-black dark:border-brutal-yellow p-4 shadow-brutal flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 bg-brutal-yellow border-2 border-brutal-black shadow-brutal-sm flex items-center justify-center flex-shrink-0 mt-0.5">
            <UserCheck size={20} className="text-brutal-black" strokeWidth={2.5} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-black text-lg uppercase tracking-tight text-brutal-black dark:text-brutal-white">
                2-Tier Institutional Approval Queue
              </span>
              <BrutalBadge tone="yellow" size="sm">
                {pendingUsers.length} PENDING
              </BrutalBadge>
            </div>
            <p className="font-mono text-xs text-brutal-black/70 dark:text-brutal-white/70 mt-0.5">
              {isPlatformAdmin
                ? 'College-Wide Platform Admin Scope: Reviewing Tier 2 HOD applications and institutional delegations.'
                : `Department Scope [${userDeptCode}]: Verifying student PRNs and faculty employee credentials.`}
            </p>
          </div>
        </div>

        <BrutalButton
          variant="secondary"
          size="sm"
          onClick={fetchPending}
          disabled={loading}
          className="self-start md:self-auto font-mono text-xs uppercase font-bold"
        >
          {loading ? 'Refreshing...' : 'Refresh Queue'}
        </BrutalButton>
      </div>

      {/* Error Callout */}
      {error && (
        <div className="p-4 bg-brutal-accent/15 border-3 border-brutal-accent text-brutal-black dark:text-brutal-white font-mono text-xs font-bold flex items-center gap-3">
          <AlertCircle size={18} className="text-brutal-accent flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Content Canvas */}
      {loading ? (
        <div className="space-y-3">
          <BrutalSkeleton count={4} height="h-16" />
        </div>
      ) : pendingUsers.length === 0 ? (
        <BrutalEmptyState
          title="Approval Queue Clean"
          description={
            isPlatformAdmin
              ? 'No institutional applicants or HOD designations currently awaiting platform approval.'
              : `All pending student and faculty registrations for ${userDeptCode} have been processed.`
          }
        />
      ) : (
        <UserApprovalTable
          pendingUsers={pendingUsers}
          actionInProgress={actionInProgress}
          onApprove={handleApprove}
          onOpenRejectModal={handleOpenRejectModal}
          onInspectDossier={setInspectingApplicant}
        />
      )}

      {/* Applicant Verification Dossier Modal */}
      <ApplicantDossierModal
        applicant={inspectingApplicant}
        isOpen={Boolean(inspectingApplicant)}
        onClose={() => setInspectingApplicant(null)}
        onApprove={handleApprove}
        onOpenReject={handleOpenRejectModal}
        onBypass={handleBypass}
        isSuperadmin={isPlatformAdmin}
        isProcessing={Boolean(actionInProgress)}
      />

      {/* Reusable Reject Modal */}
      <RejectionModal
        applicant={rejectingUser}
        isOpen={Boolean(rejectingUser)}
        onClose={() => setRejectingUser(null)}
        onConfirmReject={handleConfirmReject}
        isProcessing={Boolean(actionInProgress)}
      />
    </div>
  );
}
