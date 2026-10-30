import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { BrutalModal, BrutalButton } from '../brutal';

/**
 * RejectionModal
 * Reusable Yellow Brutalist modal capturing mandatory audit-logged rejection reason.
 */
export default function RejectionModal({
  applicant,
  isOpen,
  onClose,
  onConfirmReject,
  isProcessing = false,
}) {
  const [reason, setReason] = useState('');
  const [localError, setLocalError] = useState(null);

  if (!isOpen || !applicant) return null;

  const handleSubmit = async () => {
    if (!reason.trim()) {
      setLocalError('Please specify a rejection reason for institutional audit records.');
      return;
    }
    if (reason.trim().length < 5) {
      setLocalError('Rejection reason must be at least 5 characters long.');
      return;
    }
    setLocalError(null);
    await onConfirmReject(applicant, reason.trim());
  };

  return (
    <BrutalModal
      isOpen={isOpen}
      onClose={onClose}
      title="Reject Institutional Registration"
      size="md"
    >
      <div className="space-y-4">
        <div className="p-3 bg-brutal-paper dark:bg-brutal-dark border-2 border-brutal-black dark:border-brutal-yellow font-mono text-xs space-y-1">
          <div>
            <span className="font-bold">Applicant:</span> {applicant.full_name}
          </div>
          <div>
            <span className="font-bold">Email:</span> {applicant.email}
          </div>
          <div>
            <span className="font-bold">ID / PRN:</span> {applicant.registration_number || 'N/A'}
          </div>
        </div>

        {localError && (
          <div className="p-3 bg-brutal-accent/15 border-2 border-brutal-accent font-mono text-xs text-brutal-black dark:text-brutal-white font-bold flex items-center gap-2">
            <AlertCircle size={15} className="text-brutal-accent flex-shrink-0" />
            <span>{localError}</span>
          </div>
        )}

        <div>
          <label className="block font-mono text-xs font-black uppercase tracking-wider mb-1.5 text-brutal-black dark:text-brutal-white">
            Reason for Rejection (Audit Logged):
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. PRN not present in autonomous 2024 academic registry; please consult CSE academic office."
            rows={4}
            disabled={isProcessing}
            className="w-full p-2.5 bg-brutal-white dark:bg-brutal-dark-surface border-2 border-brutal-black dark:border-brutal-yellow font-mono text-xs text-brutal-black dark:text-brutal-white focus:outline-none focus:ring-2 focus:ring-brutal-yellow resize-none disabled:opacity-50"
          />
          <span className="block font-mono text-[10px] text-brutal-muted dark:text-brutal-muted-dark mt-1">
            This notice will be displayed to the applicant upon next login attempt.
          </span>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t-2 border-brutal-black/20 dark:border-brutal-yellow/20">
          <BrutalButton
            variant="outline"
            size="md"
            onClick={onClose}
            disabled={isProcessing}
            className="font-mono text-xs font-bold uppercase"
          >
            Cancel
          </BrutalButton>
          <BrutalButton
            variant="accent"
            size="md"
            onClick={handleSubmit}
            disabled={isProcessing}
            loading={isProcessing}
            className="font-mono text-xs font-black uppercase"
          >
            Confirm Rejection
          </BrutalButton>
        </div>
      </div>
    </BrutalModal>
  );
}

