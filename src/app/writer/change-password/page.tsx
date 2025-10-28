'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardBody, Input, Button, Alert } from '@/components/ui';
import { useWriterAuth } from '@/contexts/WriterAuthContext';
import { validatePassword } from '@/lib/passwordValidation';
import { getErrorMessage } from '@/lib/errorUtils';
import { LockClosedIcon } from '@heroicons/react/24/outline';

export default function WriterChangePasswordPage() {
  const router = useRouter();
  const { user, isPasswordTemporary, changePassword, isLoading: authLoading } = useWriterAuth();

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  useEffect(() => {
    // Redirect if not logged in or password is not temporary
    if (!authLoading && (!user || !isPasswordTemporary)) {
      router.push('/writer/dashboard');
    }
  }, [user, isPasswordTemporary, authLoading, router]);

  const handleNewPasswordChange = (value: string) => {
    setNewPassword(value);
    const validation = validatePassword(value);
    setValidationErrors(validation.errors);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate password strength
    const validation = validatePassword(newPassword);
    if (!validation.isValid) {
      setError('Please fix the password requirements below');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await changePassword({
        old_password: oldPassword,
        new_password: newPassword,
      });

      // Success - redirect to dashboard
      window.location.href = '/writer/dashboard';
    } catch (err: unknown) {
      setError(
        err.response?.data?.detail ||
          'Failed to change password. Please check your current password.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full mb-4">
            <LockClosedIcon className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Change Password</h1>
          <p className="text-gray-400">Please create a new secure password</p>
        </div>

        <Card>
          <CardBody>
            <Alert type="warning" className="mb-6">
              You are using a temporary password. Please change it to continue.
            </Alert>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && <Alert type="error">{error}</Alert>}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Current Password
                </label>
                <Input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Your temporary password"
                  required
                  autoComplete="current-password"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  New Password
                </label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => handleNewPasswordChange(e.target.value)}
                  placeholder="Enter new password"
                  required
                  autoComplete="new-password"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Confirm New Password
                </label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  required
                  autoComplete="new-password"
                />
              </div>

              {/* Password Requirements */}
              <div className="bg-gray-800/50 rounded-lg p-4 space-y-2">
                <p className="text-sm font-medium text-gray-300">Password Requirements:</p>
                {validationErrors.length > 0 ? (
                  <ul className="text-sm text-red-400 space-y-1">
                    {validationErrors.map((err, index) => (
                      <li key={index}>• {err}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-green-400">✓ Password meets all requirements</p>
                )}
              </div>

              <Button
                type="submit"
                variant="primary"
                fullWidth
                size="lg"
                isLoading={isLoading}
                disabled={validationErrors.length > 0 || !oldPassword || !newPassword}
              >
                Change Password
              </Button>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
