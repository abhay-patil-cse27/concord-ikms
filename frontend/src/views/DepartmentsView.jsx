import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { uiCache } from '../utils/uiCache';
import DepartmentsHeader from '../components/departments/DepartmentsHeader';
import DepartmentCard from '../components/departments/DepartmentCard';
import DepartmentModal from '../components/departments/DepartmentModal';
import { BrutalSkeleton, BrutalEmptyState, BrutalToast } from '../components/brutal';

/**
 * DepartmentsView
 * Yellow Brutalist institutional tenancy registry.
 */
export default function DepartmentsView() {
  const cached = uiCache.get(uiCache.KEYS.DEPARTMENTS, {});
  const { hasPermission } = useAuth();
  const [departments, setDepartments] = useState(() => cached.departments || []);
  const [loading, setLoading] = useState(() => !cached.departments?.length);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  // Form modal state
  const [showCreate, setShowCreate] = useState(false);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

  useEffect(() => {
    if (departments.length > 0) {
      uiCache.set(uiCache.KEYS.DEPARTMENTS, { departments });
    }
  }, [departments]);

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const data = await api.getDepartments();
      setDepartments(data || []);
      setError(null);
    } catch (err) {
      setError(err?.message || 'Failed to fetch departments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!cached.departments?.length) {
      fetchDepartments();
    }
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) return;

    setCreateLoading(true);
    try {
      await api.createDepartment({ code: code.toUpperCase(), name, description });
      setCode('');
      setName('');
      setDescription('');
      setShowCreate(false);
      setToast({ message: `Department "${name}" registered successfully!`, type: 'success' });
      await fetchDepartments();
    } catch (err) {
      setToast({ message: `Creation failed: ${err?.message}`, type: 'error' });
    } finally {
      setCreateLoading(false);
    }
  };

  const canWrite = hasPermission('departments:write');

  return (
    <div className="w-full space-y-8">
      {/* Toast Feedback */}
      {toast && (
        <BrutalToast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header */}
      <DepartmentsHeader
        totalCount={departments.length}
        canWrite={canWrite}
        onOpenCreate={() => setShowCreate(true)}
      />

      {/* Error Banner */}
      {error && (
        <div className="p-4 bg-brutal-accent/15 border-3 border-brutal-accent text-brutal-black dark:text-brutal-white font-mono text-xs font-bold">
          {error}
        </div>
      )}

      {/* Department Cards Grid or Skeleton/Empty State */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <BrutalSkeleton count={6} height="h-44" />
        </div>
      ) : departments.length === 0 ? (
        <BrutalEmptyState
          title="No Departments Registered"
          description="Register academic branches to begin enforcing departmental tenancy and isolating circular catalogs."
          actionLabel={canWrite ? "Register First Department" : undefined}
          onAction={canWrite ? () => setShowCreate(true) : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {departments.map((dept) => (
            <DepartmentCard
              key={dept.id}
              dept={dept}
              docCount={dept.code === 'CSE' ? 14 : 4}
              quotaMax={50}
            />
          ))}
        </div>
      )}

      {/* Create Modal */}
      <DepartmentModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onSubmit={handleCreate}
        code={code}
        setCode={setCode}
        name={name}
        setName={setName}
        description={description}
        setDescription={setDescription}
        loading={createLoading}
      />
    </div>
  );
}
