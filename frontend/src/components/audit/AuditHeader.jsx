import React from 'react';
import { ShieldAlert, RefreshCw, CheckCircle2, ShieldCheck } from 'lucide-react';
import { BrutalBadge, BrutalButton, BrutalInput } from '../brutal';

/**
 * AuditHeader
 * Masthead for Security Audit Trail with integrity verification button.
 */
export default function AuditHeader({
  totalCount,
  onRefresh,
  onVerifyIntegrity,
  verifying = false,
  integrityStatus = null,
  loading = false,
}) {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b-3 border-brutal-black dark:border-brutal-yellow">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <BrutalBadge tone="yellow" size="sm">
            CRYPTOGRAPHIC LEDGER
          </BrutalBadge>
          <BrutalBadge tone="black" size="sm">
            SHA-256 HASH CHAIN
          </BrutalBadge>
          {integrityStatus === 'verified' && (
            <BrutalBadge tone="success" size="sm">
              CHAIN VERIFIED: TAMPER-FREE
            </BrutalBadge>
          )}
        </div>

        <h1 className="font-display font-black text-3xl sm:text-4xl uppercase tracking-tight text-brutal-black dark:text-brutal-white">
          Security Audit Trail & Compliance
        </h1>
        <p className="font-mono text-xs text-brutal-black/70 dark:text-brutal-white/70 mt-1 max-w-2xl">
          Tamper-evident cryptographically chained audit events recording access decisions, ingestion transactions, and administrative governance.
        </p>
      </div>

      <div className="flex items-center gap-2.5 flex-shrink-0">
        <BrutalButton
          variant="secondary"
          size="md"
          onClick={onRefresh}
          disabled={loading || verifying}
          loading={loading}
          className="shadow-brutal-sm text-xs font-black uppercase"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </BrutalButton>

        <BrutalButton
          variant={integrityStatus === 'verified' ? 'secondary' : 'primary'}
          size="md"
          onClick={onVerifyIntegrity}
          disabled={verifying}
          loading={verifying}
          className="shadow-brutal text-xs font-black uppercase flex items-center gap-2"
        >
          <ShieldCheck size={16} strokeWidth={2.5} />
          <span>{verifying ? 'Verifying Hashes...' : 'Verify Ledger Integrity'}</span>
        </BrutalButton>
      </div>
    </div>
  );
}
