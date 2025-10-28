'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardBody, Input, Button, Alert } from '@/components/ui';
import { registerWriter } from '@/lib/marketplaceApi';
import { getErrorMessage } from '@/lib/errorUtils';
import { ProposalWriterRegistration } from '@/types/marketplace';
import { UserPlusIcon } from '@heroicons/react/24/outline';

export default function WriterRegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<ProposalWriterRegistration>({
    email: '',
    full_name: '',
    company_name: null,
    phone: null,
    years_experience: null,
    brief_bio: null,
    linkedin_url: null,
    website_url: null,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await registerWriter(formData);
      setSuccess(true);

      // Show success message for a moment then redirect
      setTimeout(() => {
        router.push('/writer/login');
      }, 3000);
    } catch (err: unknown) {
      setError(
        err.response?.data?.detail ||
          'Failed to register. Please check your information and try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof ProposalWriterRegistration, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value === '' ? null : value,
    }));
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardBody className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
              <svg
                className="w-8 h-8 text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white">Registration Successful!</h2>
            <p className="text-gray-300">
              Your account has been created. Check your email for your temporary login
              credentials.
            </p>
            <p className="text-sm text-gray-400">Redirecting to login page...</p>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full mb-4">
            <UserPlusIcon className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Join the Writer Marketplace
          </h1>
          <p className="text-gray-400">
            Register to offer your proposal writing services
          </p>
        </div>

        <Card>
          <CardBody>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && <Alert type="error">{error}</Alert>}

              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Basic Information</h3>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Full Name *
                  </label>
                  <Input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => handleChange('full_name', e.target.value)}
                    placeholder="John Doe"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email Address *
                  </label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="john@example.com"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    You'll receive temporary login credentials at this email
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Company Name
                    </label>
                    <Input
                      type="text"
                      value={formData.company_name || ''}
                      onChange={(e) => handleChange('company_name', e.target.value)}
                      placeholder="Your Company LLC"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Phone Number
                    </label>
                    <Input
                      type="tel"
                      value={formData.phone || ''}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>
              </div>

              {/* Professional Information */}
              <div className="space-y-4 pt-4 border-t border-gray-700">
                <h3 className="text-lg font-semibold text-white">
                  Professional Information
                </h3>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Years of Experience
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max="50"
                    value={formData.years_experience || ''}
                    onChange={(e) =>
                      handleChange(
                        'years_experience',
                        e.target.value ? Number(e.target.value) : null
                      )
                    }
                    placeholder="5"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Brief Bio
                  </label>
                  <textarea
                    value={formData.brief_bio || ''}
                    onChange={(e) => handleChange('brief_bio', e.target.value)}
                    placeholder="Tell us about your background, expertise, and what makes you a great proposal writer..."
                    rows={4}
                    maxLength={500}
                    className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.brief_bio?.length || 0} / 500 characters
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      LinkedIn URL
                    </label>
                    <Input
                      type="url"
                      value={formData.linkedin_url || ''}
                      onChange={(e) => handleChange('linkedin_url', e.target.value)}
                      placeholder="https://linkedin.com/in/yourprofile"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Website URL
                    </label>
                    <Input
                      type="url"
                      value={formData.website_url || ''}
                      onChange={(e) => handleChange('website_url', e.target.value)}
                      placeholder="https://yourwebsite.com"
                    />
                  </div>
                </div>
              </div>

              {/* Terms */}
              <div className="pt-4 border-t border-gray-700">
                <label className="flex items-start gap-2 text-sm text-gray-300">
                  <input
                    type="checkbox"
                    required
                    className="mt-1 rounded border-gray-600 bg-gray-700 text-primary-500"
                  />
                  <span>
                    I agree to the terms of service and privacy policy, and confirm that all
                    information provided is accurate.
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                variant="primary"
                fullWidth
                size="lg"
                isLoading={isSubmitting}
              >
                Register as Writer
              </Button>

              {/* Login Link */}
              <div className="text-center text-sm text-gray-400">
                Already have an account?{' '}
                <Link href="/writer/login" className="text-primary-400 hover:text-primary-300">
                  Login here
                </Link>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
