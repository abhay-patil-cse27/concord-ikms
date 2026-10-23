import React from 'react';
import { BrutalModal, BrutalInput, BrutalButton } from '../brutal';

/**
 * DepartmentModal
 * Dialog for registering a new institutional academic department.
 */
export default function DepartmentModal({
  isOpen,
  onClose,
  onSubmit,
  code,
  setCode,
  name,
  setName,
  description,
  setDescription,
  loading = false,
}) {
  return (
    <BrutalModal
      isOpen={isOpen}
      onClose={onClose}
      title="Register Institutional Department"
      subtitle="Defines an isolated tenancy boundary for syllabus and circular governance."
      size="md"
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <BrutalInput
          label="Department Code (e.g. MECH, CIVIL)"
          required
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="MECH"
          disabled={loading}
        />

        <BrutalInput
          label="Full Department Name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Mechanical Engineering"
          disabled={loading}
        />

        <BrutalInput
          label="Governance Scope / Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Department syllabus, notices, and labs"
          disabled={loading}
        />

        <div className="flex items-center justify-end gap-3 pt-3 border-t-2 border-brutal-black/20 dark:border-brutal-yellow/20">
          <BrutalButton
            type="button"
            variant="secondary"
            size="md"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </BrutalButton>

          <BrutalButton
            type="submit"
            variant="primary"
            size="md"
            disabled={loading || !code.trim() || !name.trim()}
            loading={loading}
            className="shadow-brutal"
          >
            <span>{loading ? 'Registering...' : 'Save Department'}</span>
          </BrutalButton>
        </div>
      </form>
    </BrutalModal>
  );
}
