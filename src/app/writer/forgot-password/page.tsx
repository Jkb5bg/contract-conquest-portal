'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardBody, Input, Button, Alert } from '@/components/ui';
import { writerRequestPasswordReset } from '@/lib/writerApi';
import { getErrorMessage } from '@/lib/errorUtils';
import { EnvelopeIcon } from '@heroicons/react/24/outline';

export default function WriterForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await writerRequestPasswordReset({ email });
      setSuccess(true);
    } catch (err: unknown) {
      setError(err.response?.data?.detail || 'Failed to send reset email');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900">
        <div className="w-full max-w-md">
          <Card>
            <CardBody className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                <EnvelopeIcon className="w-8 h-8 text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-white">Check Your Email</h2>
              <p className="text-gray-300">
                If an account exists with <strong>{email}</strong>, you will receive a
                password reset link shortly.
              </p>
              <p className="text-sm text-gray-400">
                Check your spam folder if you don't see it in your inbox.
              </p>
              <Link href="/writer/login">
                <Button variant="primary" fullWidth>
                  Back to Login
                </Button>
              </Link>
            </CardBody>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full mb-4">
            <EnvelopeIcon className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Forgot Password?</h1>
          <p className="text-gray-400">We&apos;ll send you a reset link</p>
        </div>

        <Card>
          <CardBody>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && <Alert type="error">{error}</Alert>}

              <Alert type="info">
                Enter your email address and we'll send you a link to reset your password.
              </Alert>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  autoComplete="email"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                fullWidth
                size="lg"
                isLoading={isLoading}
              >
                Send Reset Link
              </Button>

              <div className="text-center text-sm text-gray-400 pt-4 border-t border-gray-700">
                Remember your password?{' '}
                <Link href="/writer/login" className="text-primary-400 hover:text-primary-300">
                  Back to login
                </Link>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
