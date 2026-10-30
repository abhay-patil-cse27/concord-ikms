import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UserCheck, 
  Check, 
  X, 
  AlertCircle, 
  Clock, 
  ShieldCheck, 
  Building2, 
  Hash, 
  Mail,
  User,
  CheckCircle2
} from 'lucide-react';
import { 
  BrutalButton, 
  BrutalBadge, 
  BrutalModal, 
  BrutalSkeleton, 
  BrutalEmptyState,
  BrutalTable 
} from '../brutal';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { variants } from '../../motion/presets';

/**
 * UserApprovalQueue
 * Yellow Brutalist 2-Tier Institutional Approval interface.
 * Allows Department HODs to verify Tier 1 applicants (Students & Faculty in their department)
 * and Platform Admins to verify Tier 2 applicants (HODs) or oversee all applicants.
 */
export default function UserApprovalQueue({ onActionSuccess }) {
  const { user } = useAuth();
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionInProgress, setActionInProgress] = useState(null); // userId being processed

  // Rejection Modal State
  const [rejectingUser, setRejectingUser] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionError, setRejectionError] = useState(null);

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

  const handleOpenRejectModal = (applicant) => {
    setRejectingUser(applicant);
    setRejectionReason('');
    setRejectionError(null);
  };

  const handleConfirmReject = async () => {
    if (!rejectionReason.trim()) {
      setRejectionError('Please specify a rejection reason for institutional audit records.');
      return;
    }
    if (rejectionReason.trim().length < 5) {
      setRejectionError('Rejection reason must be at least 5 characters long.');
      return;
    }

    setActionInProgress(rejectingUser.id);
    setRejectionError(null);
    try {
      await api.reviewUser(rejectingUser.id, 'reject', rejectionReason.trim());
      const rejectedName = rejectingUser.full_name;
      setPendingUsers((prev) => prev.filter((u) => u.id !== rejectingUser.id));
      setRejectingUser(null);
      setRejectionReason('');
      if (onActionSuccess) {
        onActionSuccess({
          message: `Applicant "${rejectedName}" registration rejected with reason logged.`,
          type: 'info',
        });
      }
    } catch (err) {
      console.error('Failed to reject applicant:', err);
      setRejectionError(err?.message || 'Failed to submit rejection action.');
    } finally {
      setActionInProgress(null);
    }
  };

  const isPlatformAdmin = user?.roles?.some((r) => r.code === 'platform_admin');
  const userDeptCode = user?.department?.code || 'CSE';

  const tableHeaders = [
    'Applicant Identity',
    'Institutional Email',
    'Applied Role',
    'Department',
    'Workflow Status',
    { label: 'Actions', className: 'text-right' },
  ];

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
        <div className="w-full">
          <BrutalTable headers={tableHeaders} stickyHeader>
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
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 bg-brutal-black text-brutal-yellow border border-brutal-black flex items-center justify-center font-bold text-xs flex-shrink-0">
                        {applicant.full_name ? applicant.full_name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div>
                        <div className="font-sans font-black text-sm text-brutal-black dark:text-brutal-white">
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
                    </div>
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
                      tone={roleDisplay.toLowerCase().includes('admin') || roleDisplay.toLowerCase().includes('hod') ? 'yellow' : 'paper'}
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
                    <BrutalBadge
                      tone={isTier2 ? 'accent' : 'yellow'}
                      size="sm"
                      dot
                    >
                      {isTier2 ? 'TIER 2 (ADMIN)' : 'TIER 1 (HOD)'}
                    </BrutalBadge>
                  </td>

                  {/* Action Triggers */}
                  <td className="p-3.5 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      <BrutalButton
                        variant="primary"
                        size="sm"
                        disabled={isProcessing}
                        loading={isProcessing}
                        onClick={() => handleApprove(applicant)}
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
                        onClick={() => handleOpenRejectModal(applicant)}
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
      )}

      {/* Reject Modal */}
      {rejectingUser && (
        <BrutalModal
          isOpen={Boolean(rejectingUser)}
          onClose={() => setRejectingUser(null)}
          title="Reject Institutional Registration"
          size="md"
        >
          <div className="space-y-4">
            <div className="p-3 bg-brutal-paper dark:bg-brutal-dark border-2 border-brutal-black dark:border-brutal-yellow font-mono text-xs space-y-1">
              <div>
                <span className="font-bold">Applicant:</span> {rejectingUser.full_name}
              </div>
              <div>
                <span className="font-bold">Email:</span> {rejectingUser.email}
              </div>
              <div>
                <span className="font-bold">ID / PRN:</span> {rejectingUser.registration_number || 'N/A'}
              </div>
            </div>

            {rejectionError && (
              <div className="p-3 bg-brutal-accent/15 border-2 border-brutal-accent font-mono text-xs text-brutal-black dark:text-brutal-white font-bold flex items-center gap-2">
                <AlertCircle size={15} className="text-brutal-accent flex-shrink-0" />
                <span>{rejectionError}</span>
              </div>
            )}

            <div>
              <label className="block font-mono text-xs font-black uppercase tracking-wider mb-1.5 text-brutal-black dark:text-brutal-white">
                Reason for Rejection (Audit Logged):
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. PRN not present in autonomous 2024 academic registry; please consult CSE academic office."
                rows={4}
                className="w-full p-2.5 bg-brutal-white dark:bg-brutal-dark-surface border-2 border-brutal-black dark:border-brutal-yellow font-mono text-xs text-brutal-black dark:text-brutal-white focus:outline-none focus:ring-2 focus:ring-brutal-yellow resize-none"
              />
              <span className="block font-mono text-[10px] text-brutal-muted dark:text-brutal-muted-dark mt-1">
                This notice will be displayed to the applicant upon next login attempt.
              </span>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t-2 border-brutal-black/20 dark:border-brutal-yellow/20">
              <BrutalButton
                variant="outline"
                size="md"
                onClick={() => setRejectingUser(null)}
                disabled={Boolean(actionInProgress)}
                className="font-mono text-xs font-bold uppercase"
              >
                Cancel
              </BrutalButton>
              <BrutalButton
                variant="accent"
                size="md"
                onClick={handleConfirmReject}
                disabled={Boolean(actionInProgress)}
                loading={Boolean(actionInProgress)}
                className="font-mono text-xs font-black uppercase"
              >
                Confirm Rejection
              </BrutalButton>
            </div>
          </div>
        </BrutalModal>
      )}
    </div>
  );
}

