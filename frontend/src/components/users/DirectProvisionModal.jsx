import React, { useState } from 'react';
import { UserPlus, ArrowRight, AlertCircle, Building2 } from 'lucide-react';
import { BrutalModal, BrutalButton, BrutalInput } from '../brutal';
import RoleSelector from '../auth/RoleSelector';
import { api } from '../../api/client';

/**
 * DirectProvisionModal
 * Yellow Brutalist modal allowing Admins to directly provision pre-cleared accounts,
 * bypassing the self-registration approval queue for emergency access or guest evaluators.
 */
export default function DirectProvisionModal({
  isOpen,
  onClose,
  onSuccess,
  departments = [],
}) {
  const [roleCode, setRoleCode] = useState('student');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [departmentId, setDepartmentId] = useState(departments[0]?.id || '');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [password, setPassword] = useState('');
  const [provisionReason, setProvisionReason] = useState('Direct Administrative Provisioning');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.provisionDirectUser({
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
        department_id: departmentId || departments[0]?.id,
        role_code: roleCode,
        registration_number: registrationNumber.trim() || undefined,
        provision_reason: provisionReason.trim() || 'Direct Administrative Provisioning',
      });

      if (onSuccess) {
        onSuccess({
          message: `Account for "${res.full_name}" directly provisioned and activated.`,
          user: res,
        });
      }
      onClose();
    } catch (err) {
      console.error('Failed to directly provision user:', err);
      setError(err?.message || 'Failed to provision user.');
    } finally {
      setSubmitting(false);
    }
  };

  const idLabel = roleCode === 'student' ? 'Permanent Reg. No. (PRN)' : 'Faculty / Staff ID';

  return (
    <BrutalModal
      isOpen={isOpen}
      onClose={onClose}
      title="Directly Provision Institutional User"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="font-mono text-xs text-brutal-muted dark:text-brutal-muted-dark">
          Instantly provisions a pre-cleared, active account bypassing the self-registration queue. Audit logged under break-glass non-repudiation.
        </p>

        {error && (
          <div className="p-3 bg-brutal-accent/15 border-2 border-brutal-accent font-mono text-xs text-brutal-accent font-bold flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <RoleSelector
          selectedRole={roleCode}
          onSelectRole={setRoleCode}
          disabled={submitting}
        />

        <BrutalInput
          label="Full Name"
          type="text"
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="e.g. Dr. K. M. Joshi"
          disabled={submitting}
        />

        <BrutalInput
          label="Institutional Email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="e.g. km.joshi@kitcoek.in"
          disabled={submitting}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <BrutalInput
            label={idLabel}
            type="text"
            value={registrationNumber}
            onChange={(e) => setRegistrationNumber(e.target.value)}
            placeholder="e.g. EMP-EXT-01"
            disabled={submitting}
          />

          <div>
            <label className="font-mono text-xs font-bold uppercase tracking-wider text-brutal-black dark:text-brutal-white flex items-center justify-between mb-1.5">
              <span>Department</span>
              <span className="text-brutal-accent font-black">*</span>
            </label>
            <select
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              disabled={submitting}
              className="w-full bg-brutal-white dark:bg-brutal-dark text-brutal-black dark:text-brutal-white font-mono text-xs px-3 py-2.5 border-2 border-brutal-black dark:border-brutal-yellow outline-none transition-all duration-100 focus:bg-brutal-paper dark:focus:bg-brutal-dark-surface focus:shadow-brutal focus:-translate-y-0.5 disabled:opacity-50 cursor-pointer"
            >
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name} ({dept.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        <BrutalInput
          label="Initial Password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Min. 8 characters"
          disabled={submitting}
        />

        <BrutalInput
          label="Provisioning Reason (Audit Logged)"
          type="text"
          value={provisionReason}
          onChange={(e) => setProvisionReason(e.target.value)}
          placeholder="e.g. External Viva Evaluator / Visiting Professor"
          disabled={submitting}
        />

        <div className="flex items-center justify-end gap-3 pt-3 border-t-2 border-brutal-black/20 dark:border-brutal-yellow/20">
          <BrutalButton
            variant="outline"
            size="md"
            onClick={onClose}
            disabled={submitting}
            className="font-mono text-xs uppercase font-bold"
          >
            Cancel
          </BrutalButton>
          <BrutalButton
            type="submit"
            variant="primary"
            size="md"
            disabled={submitting}
            loading={submitting}
            className="font-mono text-xs font-black uppercase shadow-brutal"
          >
            <span>Activate & Provision</span>
            <ArrowRight size={14} />
          </BrutalButton>
        </div>
      </form>
    </BrutalModal>
  );
}

