import React, { useState, useEffect } from 'react';
import { ArrowRight, ArrowLeft, AlertCircle } from 'lucide-react';
import { BrutalButton, BrutalCard, BrutalBadge, BrutalInput } from '../components/brutal';
import ThemeToggle from '../components/layout/ThemeToggle';
import RoleSelector from '../components/auth/RoleSelector';
import RegistrationConfirmationReceipt from '../components/auth/RegistrationConfirmationReceipt';
import { api } from '../api/client';

/**
 * RegisterView
 * Modular Yellow Brutalist self-registration gateway for institutional members.
 */
export default function RegisterView({ onBack, onGoToLogin }) {
  const [departments, setDepartments] = useState([]);
  const [loadingDepts, setLoadingDepts] = useState(true);

  // Form Fields
  const [roleCode, setRoleCode] = useState('student');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Status
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successData, setSuccessData] = useState(null);

  useEffect(() => {
    async function loadDepts() {
      try {
        const data = await api.getPublicDepartments();
        const academicDepts = data.filter((d) => d.code !== 'ADMIN');
        setDepartments(academicDepts);
        if (academicDepts.length > 0) {
          setDepartmentId(academicDepts[0].id);
        }
      } catch (err) {
        console.error('Failed to load departments:', err);
        setError('Failed to fetch institutional department list. Please try again.');
      } finally {
        setLoadingDepts(false);
      }
    }
    loadDepts();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (!departmentId) {
      setError('Please select your academic department.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.registerUser({
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
        department_id: departmentId,
        role_code: roleCode,
        registration_number: registrationNumber.trim(),
      });
      setSuccessData(res);
    } catch (err) {
      setError(err?.message || 'Registration failed. Please check your inputs.');
    } finally {
      setSubmitting(false);
    }
  };

  const roleLabel =
    roleCode === 'student' ? 'Student' : roleCode === 'faculty' ? 'Faculty Member' : 'Department Admin (HOD)';
  const idLabel =
    roleCode === 'student' ? 'Permanent Registration Number (PRN)' : 'Faculty / Staff Employee ID';
  const idPlaceholder = roleCode === 'student' ? 'e.g., 2024BTECS089' : 'e.g., EMP-CSE-042';

  const selectedDeptName =
    departments.find((d) => d.id === departmentId)?.name || successData?.department || 'Department';

  return (
    <div className="min-h-screen bg-brutal-paper dark:bg-brutal-black text-brutal-black dark:text-brutal-white flex flex-col justify-between selection:bg-brutal-yellow selection:text-brutal-black">
      {/* Top Navbar */}
      <header className="border-b-3 border-brutal-black dark:border-brutal-yellow bg-brutal-white dark:bg-brutal-dark px-4 sm:px-8 py-3.5 flex items-center justify-between sticky top-0 z-50 shadow-brutal-sm">
        <div className="flex items-center gap-3">
          <BrutalButton
            variant="ghost"
            size="sm"
            onClick={onBack || onGoToLogin}
            className="font-mono text-xs uppercase font-bold"
          >
            <ArrowLeft size={14} />
            <span>Back</span>
          </BrutalButton>
          <div className="h-5 w-[2px] bg-brutal-black/20 dark:bg-brutal-yellow/20 mx-1 hidden sm:block" />
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-brutal-yellow border-2 border-brutal-black flex items-center justify-center font-black text-xs text-brutal-black shadow-[1px_1px_0px_#0A0A0A]">
              KIT
            </div>
            <span className="font-display font-black tracking-tight text-sm uppercase hidden sm:inline">
              CONCORD IKMS
            </span>
            <BrutalBadge tone="yellow" className="text-[10px]">
              Institutional Onboarding
            </BrutalBadge>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
        </div>
      </header>

      {/* Main Registration Stage */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8 sm:py-12">
        {successData ? (
          <RegistrationConfirmationReceipt
            applicantName={fullName}
            email={email}
            roleLabel={roleLabel}
            departmentName={selectedDeptName}
            approvalStatus={successData.approval_status}
            onReturnToLogin={onGoToLogin}
          />
        ) : (
          <BrutalCard className="p-6 sm:p-8 border-3 border-brutal-black dark:border-brutal-yellow shadow-brutal bg-brutal-white dark:bg-brutal-dark">
            <div className="mb-6 pb-4 border-b-2 border-brutal-black/10 dark:border-brutal-yellow/10">
              <h1 className="font-display font-black text-2xl uppercase tracking-tight text-brutal-black dark:text-brutal-white">
                Register Institutional Account
              </h1>
              <p className="font-mono text-xs text-brutal-muted dark:text-brutal-muted-dark mt-1">
                Kolhapur Institute of Technology • Autonomous Regulation Onboarding
              </p>
            </div>

            {error && (
              <div className="mb-6 p-3.5 bg-brutal-accent/15 border-2 border-brutal-accent flex items-start gap-2.5 font-mono text-xs text-brutal-accent font-bold">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
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
                placeholder="e.g. Rohan Deshmukh"
                disabled={submitting}
              />

              <BrutalInput
                label="Institutional Email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. rohan.deshmukh@kitcoek.in"
                disabled={submitting}
              />

              <BrutalInput
                label={idLabel}
                type="text"
                required
                value={registrationNumber}
                onChange={(e) => setRegistrationNumber(e.target.value)}
                placeholder={idPlaceholder}
                disabled={submitting}
              />

              <div>
                <label className="block font-mono text-[11px] font-black uppercase tracking-wider mb-1 text-brutal-black dark:text-brutal-white">
                  Academic Department:
                </label>
                <select
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  disabled={submitting || loadingDepts}
                  className="w-full px-3 py-2 bg-brutal-paper dark:bg-brutal-dark-surface border-2 border-brutal-black dark:border-brutal-yellow font-mono text-xs text-brutal-black dark:text-brutal-white focus:outline-none focus:ring-2 focus:ring-brutal-yellow"
                >
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name} ({dept.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <BrutalInput
                  label="Password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  disabled={submitting}
                />
                <BrutalInput
                  label="Confirm Password"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  disabled={submitting}
                />
              </div>

              <div className="pt-3">
                <BrutalButton
                  type="submit"
                  variant="primary"
                  size="lg"
                  disabled={submitting}
                  loading={submitting}
                  className="w-full justify-center text-xs font-black tracking-widest uppercase shadow-brutal"
                >
                  <span>Submit for Verification</span>
                  <ArrowRight size={16} />
                </BrutalButton>
              </div>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={onGoToLogin}
                  className="font-mono text-xs text-brutal-black dark:text-brutal-yellow hover:underline"
                >
                  Already registered? Sign in here
                </button>
              </div>
            </form>
          </BrutalCard>
        )}
      </main>

      <footer className="border-t-2 border-brutal-black/20 dark:border-brutal-yellow/20 py-4 px-4 text-center font-mono text-[10px] text-brutal-muted dark:text-brutal-muted-dark uppercase select-none">
        CONCORD IKMS • Kolhapur Institute of Technology • Milestone 12 Onboarding
      </footer>
    </div>
  );
}
