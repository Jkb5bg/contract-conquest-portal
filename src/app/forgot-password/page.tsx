'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api';

export const dynamic = 'force-dynamic';

function ForgotPasswordClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  // Determine which flow to show
  const isResetFlow = !!token;

  // Request reset flow state
  const [email, setEmail] = useState('');
  const [requestSuccess, setRequestSuccess] = useState(false);

  // Reset password flow state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState(true);

  // Common state
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [passwordStrength, setPasswordStrength] = useState({
    hasMinLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false,
  });

  useEffect(() => {
    if (!isResetFlow || !token) return;

    let cancelled = false;
    (async () => {
      try {
        await apiClient.post('/auth/validate-reset-token', { token }); // adjust to your API
        if (!cancelled) setTokenValid(true);
      } catch {
        if (!cancelled) setTokenValid(false);
      }
    })();

    return () => { cancelled = true; };
  }, [isResetFlow, token]);

  useEffect(() => {
    if (isResetFlow) {
      setPasswordStrength({
        hasMinLength: newPassword.length >= 8,
        hasUpperCase: /[A-Z]/.test(newPassword),
        hasLowerCase: /[a-z]/.test(newPassword),
        hasNumber: /[0-9]/.test(newPassword),
        hasSpecialChar: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(newPassword),
      });
    }
  }, [newPassword, isResetFlow]);

  // Request password reset (send email)
  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return; // guard
    setError('');
    setIsSubmitting(true);

    try {
      const cleanEmail = email.trim().toLowerCase();
      await apiClient.post('/auth/forgot-password', { email: cleanEmail });
      setRequestSuccess(true);
      setIsSubmitting(false); // ✅ reset here
    } catch (err: unknown) {
      // @ts-expect-error Error handling
      setError(err?.response?.data?.detail || 'Failed to send reset email. Please try again.');
      setIsSubmitting(false);
    }
  };

  // Reset password with token
  const validatePassword = (password: string): string | null => {
    if (password.length < 8) return 'Password must be at least 8 characters long';
    if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter';
    if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter';
    if (!/[0-9]/.test(password)) return 'Password must contain at least one number';
    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password))
      return 'Password must contain at least one special character';
    return null;
  };

const handleResetPassword = async (e: React.FormEvent) => {
  e.preventDefault();
  setError('');

  const passwordError = validatePassword(newPassword);
  if (passwordError) return setError(passwordError);

  if (newPassword !== confirmPassword) return setError('Passwords do not match');

  setIsSubmitting(true);

  try {
    const payload = {
      token: token,              // include token in body
      new_password: newPassword, // include new password in body
    };

    await apiClient.post('/auth/reset-password', payload);

    setResetSuccess(true);
    setTimeout(() => router.push('/login'), 3000);
  } catch (err: unknown) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    const msg = err?.response?.data?.detail || 'Failed to reset password. The link may have expired.';
    setError(msg);

    // If backend returns 422/400 for bad/expired token, mark invalid
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    if (err?.response?.status === 400 || err?.response?.status === 422) {
      setTokenValid(false);
    }

    setIsSubmitting(false);
  }
};


  // Invalid token state
  if (isResetFlow && !tokenValid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="relative z-10 w-full max-w-md">
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10 text-center">
            <div className="inline-flex p-4 bg-red-500/20 rounded-full mb-4">
              <svg className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Invalid Reset Link</h2>
            <p className="text-gray-400 mb-6">This password reset link is invalid or has expired.</p>
            <Link
              href="/forgot-password"
              className="inline-block bg-gradient-to-r from-purple-500 to-blue-500 text-white py-3 px-6 rounded-lg font-semibold hover:from-purple-600 hover:to-blue-600 transition-all"
            >
              Request New Link
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Request success state
  if (requestSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="relative z-10 w-full max-w-md">
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10 text-center">
            <div className="inline-flex p-4 bg-green-500/20 rounded-full mb-4">
              <svg className="h-8 w-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Check Your Email</h2>
            <p className="text-gray-300 mb-4">
              We&#39;ve sent a password reset link to:
            </p>
            <p className="text-purple-400 font-semibold mb-6">{email}</p>
            <p className="text-sm text-gray-400 mb-6">
              Click the link in the email to reset your password. The link will expire in 1 hour.
            </p>
            <div className="space-y-3">
              <Link
                href="/login"
                className="block w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white py-3 px-6 rounded-lg font-semibold hover:from-purple-600 hover:to-blue-600 transition-all"
              >
                Back to Login
              </Link>
              <button
                onClick={() => {
                  setRequestSuccess(false);
                  setEmail('');
                  setError('');
                  setIsSubmitting(false); // ✅ make the form active again
                }}
                className="block w-full text-gray-400 hover:text-purple-400 transition-colors text-sm"
              >
                Didn&#39;t receive the email? Try again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Reset success state
  if (resetSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="relative z-10 w-full max-w-md">
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10 text-center">
            <div className="inline-flex p-4 bg-green-500/20 rounded-full mb-4">
              <svg className="h-8 w-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Password Reset Successful!</h2>
            <p className="text-gray-400 mb-6">Your password has been updated. Redirecting you to login...</p>
            <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  const allRequirementsMet = isResetFlow ? Object.values(passwordStrength).every(Boolean) : true;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex p-4 bg-purple-500/20 rounded-full mb-4">
            {isResetFlow ? (
              <svg className="h-8 w-8 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            ) : (
              <svg className="h-8 w-8 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            )}
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            {isResetFlow ? 'Create New Password' : 'Forgot Password?'}
          </h1>
          <p className="text-gray-400">
            {isResetFlow
              ? 'Enter a strong password for your account'
              : 'No worries! Enter your email and we\'ll send you reset instructions'}
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10 shadow-2xl">
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300 text-sm backdrop-blur">
              {error}
            </div>
          )}

          {!isResetFlow ? (
            // Request Reset Form
            <form onSubmit={handleRequestReset} className="space-y-6">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all backdrop-blur"
                  placeholder="your@company.com"
                />
                <p className="mt-2 text-xs text-gray-400">
                  Enter the email address associated with your account
                </p>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white py-3 px-6 rounded-lg font-semibold hover:from-purple-600 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02]"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Sending Reset Link...
                  </div>
                ) : (
                  'Send Reset Link'
                )}
              </button>
            </form>
          ) : (
            // Reset Password Form
            <form onSubmit={handleResetPassword} className="space-y-6">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all backdrop-blur"
                  placeholder="Enter your new password"
                />

                {/* Password Strength Indicators */}
                {newPassword && (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs text-gray-400 mb-2">Password must contain:</p>
                    <div className="space-y-1 text-xs">
                      <div className={`flex items-center ${passwordStrength.hasMinLength ? 'text-green-400' : 'text-gray-500'}`}>
                        {passwordStrength.hasMinLength ? '✓' : '○'} At least 8 characters
                      </div>
                      <div className={`flex items-center ${passwordStrength.hasUpperCase ? 'text-green-400' : 'text-gray-500'}`}>
                        {passwordStrength.hasUpperCase ? '✓' : '○'} One uppercase letter (A-Z)
                      </div>
                      <div className={`flex items-center ${passwordStrength.hasLowerCase ? 'text-green-400' : 'text-gray-500'}`}>
                        {passwordStrength.hasLowerCase ? '✓' : '○'} One lowercase letter (a-z)
                      </div>
                      <div className={`flex items-center ${passwordStrength.hasNumber ? 'text-green-400' : 'text-gray-500'}`}>
                        {passwordStrength.hasNumber ? '✓' : '○'} One number (0-9)
                      </div>
                      <div className={`flex items-center ${passwordStrength.hasSpecialChar ? 'text-green-400' : 'text-gray-500'}`}>
                        {passwordStrength.hasSpecialChar ? '✓' : '○'} One special character (!@#$%^&*)
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all backdrop-blur"
                  placeholder="Confirm your new password"
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
                className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white py-3 px-6 rounded-lg font-semibold hover:from-purple-600 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02]"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Resetting Password...
                  </div>
                ) : (
                  'Reset Password'
                )}
              </button>
            </form>
          )}

          <div className="mt-6 text-center text-sm">
            <Link href="/login" className="text-gray-400 hover:text-purple-400 transition-colors">
              ← Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-white">Loading…</div>}>
      <ForgotPasswordClient />
    </Suspense>
  );
}