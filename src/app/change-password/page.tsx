'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { LockClosedIcon } from '@heroicons/react/24/outline';
import { validatePassword, getPasswordRequirements, type PasswordRequirements } from '@/lib/passwordValidation';

export default function ChangePasswordPage() {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordRequirements, setPasswordRequirements] = useState<PasswordRequirements>({
    hasMinLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false,
  });

  const { changePassword, isPasswordTemporary } = useAuth();
  const router = useRouter();

  useEffect(() => {
    setPasswordRequirements(getPasswordRequirements(newPassword));
  }, [newPassword]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    // Validate password strength
    const validation = validatePassword(newPassword);
    if (!validation.isValid) {
      setError(validation.errors[0]);
      return;
    }

    setIsSubmitting(true);
    try {
      await changePassword(oldPassword, newPassword);
    } catch (err: unknown) {
      // @ts-expect-error Lint is tripping off this error again
        setError(err.message);
      setIsSubmitting(false);
    }
  };

  const allRequirementsMet = Object.values(passwordRequirements).every(Boolean);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex p-4 bg-purple-500/20 rounded-full mb-4">
            <LockClosedIcon className="h-8 w-8 text-purple-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            {isPasswordTemporary ? 'Set Your New Password' : 'Change Password'}
          </h1>
          <p className="text-gray-400">
            {isPasswordTemporary
              ? 'Please create a strong password for your account'
              : 'Update your account password'}
          </p>
        </div>

        <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10">
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {isPasswordTemporary ? 'Temporary Password' : 'Current Password'}
              </label>
              <input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
                placeholder="Create a strong password"
              />

              {/* Password Requirements */}
              {newPassword && (
                <div className="mt-3 space-y-2">
                  <p className="text-xs text-gray-400 mb-2">Password must contain:</p>
                  <div className="space-y-1 text-xs">
                    <div className={`flex items-center ${passwordRequirements.hasMinLength ? 'text-green-400' : 'text-gray-500'}`}>
                      {passwordRequirements.hasMinLength ? '✓' : '○'} At least 8 characters
                    </div>
                    <div className={`flex items-center ${passwordRequirements.hasUpperCase ? 'text-green-400' : 'text-gray-500'}`}>
                      {passwordRequirements.hasUpperCase ? '✓' : '○'} One uppercase letter (A-Z)
                    </div>
                    <div className={`flex items-center ${passwordRequirements.hasLowerCase ? 'text-green-400' : 'text-gray-500'}`}>
                      {passwordRequirements.hasLowerCase ? '✓' : '○'} One lowercase letter (a-z)
                    </div>
                    <div className={`flex items-center ${passwordRequirements.hasNumber ? 'text-green-400' : 'text-gray-500'}`}>
                      {passwordRequirements.hasNumber ? '✓' : '○'} One number (0-9)
                    </div>
                    <div className={`flex items-center ${passwordRequirements.hasSpecialChar ? 'text-green-400' : 'text-gray-500'}`}>
                      {passwordRequirements.hasSpecialChar ? '✓' : '○'} One special character (!@#$%^&*)
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="mt-2 text-xs text-red-400">Passwords do not match</p>
              )}
              {confirmPassword && newPassword === confirmPassword && (
                <p className="mt-2 text-xs text-green-400">✓ Passwords match</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !allRequirementsMet || newPassword !== confirmPassword}
              className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white py-3 px-6 rounded-lg font-semibold hover:from-purple-600 hover:to-blue-600 disabled:opacity-50 transition-all"
            >
              {isSubmitting ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}