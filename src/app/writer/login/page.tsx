'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardBody, Input, Button, Alert } from '@/components/ui';
import { useWriterAuth } from '@/contexts/WriterAuthContext';
import { LockClosedIcon } from '@heroicons/react/24/outline';

export default function WriterLoginPage() {
  const { login } = useWriterAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await login({ email, password });

      // Redirect based on password status
      if (response.is_password_temporary) {
        window.location.href = '/writer/change-password';
      } else {
        window.location.href = '/writer/dashboard';
      }
    } catch (err: unknown) {
      // @ts-expect-error Accessing response property on unknown error type
      setError(err.response?.data?.detail || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full mb-4">
            <LockClosedIcon className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Writer Login</h1>
          <p className="text-gray-400">Access your writer dashboard</p>
        </div>

        <Card>
          <CardBody>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && <Alert type="error" message={error} />}

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

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Password
                </label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-gray-400">
                  <input
                    type="checkbox"
                    className="rounded border-gray-600 bg-gray-700 text-primary-500"
                  />
                  Remember me
                </label>

                <Link
                  href="/writer/forgot-password"
                  className="text-primary-400 hover:text-primary-300"
                >
                  Forgot password?
                </Link>
              </div>

              <Button
                type="submit"
                variant="primary"
                fullWidth
                size="lg"
                isLoading={isLoading}
              >
                Sign In
              </Button>

              <div className="text-center text-sm text-gray-400 pt-4 border-t border-gray-700">
                Not a writer yet?{' '}
                <Link
                  href="/writer/register"
                  className="text-primary-400 hover:text-primary-300"
                >
                  Register here
                </Link>
              </div>

              <div className="text-center text-sm text-gray-400">
                Are you a client?{' '}
                <Link href="/login" className="text-secondary-400 hover:text-secondary-300">
                  Client login
                </Link>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
