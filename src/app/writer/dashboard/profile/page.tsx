'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardBody, Input, Select, Button, Alert, Badge } from '@/components/ui';
import { getWriterProfile, updateWriterProfile } from '@/lib/writerApi';
import { ProposalWriterUpdateProfile, ProposalWriterPublicProfile } from '@/types/marketplace';
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function WriterProfilePage() {
  const [, setProfile] = useState<ProposalWriterPublicProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form fields
  const [formData, setFormData] = useState<ProposalWriterUpdateProfile>({});
  const [newSpecialization, setNewSpecialization] = useState('');
  const [newQualification, setNewQualification] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      const data = await getWriterProfile();
      setProfile(data);

      // Pre-fill form with existing data
      setFormData({
        full_name: data.full_name || null,
        company_name: data.company_name || null,
        bio: data.bio || null,
        headline: data.headline || null,
        years_experience: data.years_experience || null,
        specializations: data.specializations || [],
        qualifications: data.qualifications || [],
        hourly_rate: data.hourly_rate || null,
        project_rate_min: data.project_rate_min || null,
        project_rate_max: data.project_rate_max || null,
        pricing_model: data.pricing_model || null,
        availability_status: data.availability_status || null,
        response_time_hours: data.response_time_hours || null,
        accepts_rush_projects: data.accepts_rush_projects || null,
        service_locations: data.service_locations || [],
        naics_expertise: data.naics_expertise || [],
      });
    } catch (err: unknown) {
      // @ts-expect-error Accessing response property on unknown error type
      setError(err.response?.data?.detail || 'Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccess(false);

    try {
      await updateWriterProfile(formData);
      setSuccess(true);
      await loadProfile(); // Reload to get updated data

      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      // @ts-expect-error Accessing response property on unknown error type
      setError(err.response?.data?.detail || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (field: keyof ProposalWriterUpdateProfile, value: string | number | boolean | string[] | null) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value === '' ? null : value,
    }));
  };

  const addSpecialization = () => {
    if (newSpecialization.trim()) {
      setFormData((prev) => ({
        ...prev,
        specializations: [...(prev.specializations || []), newSpecialization.trim()],
      }));
      setNewSpecialization('');
    }
  };

  const removeSpecialization = (spec: string) => {
    setFormData((prev) => ({
      ...prev,
      specializations: (prev.specializations || []).filter((s) => s !== spec),
    }));
  };

  const addQualification = () => {
    if (newQualification.trim()) {
      setFormData((prev) => ({
        ...prev,
        qualifications: [...(prev.qualifications || []), newQualification.trim()],
      }));
      setNewQualification('');
    }
  };

  const removeQualification = (qual: string) => {
    setFormData((prev) => ({
      ...prev,
      qualifications: (prev.qualifications || []).filter((q) => q !== qual),
    }));
  };

  if (isLoading) {
    return <div className="text-white">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">My Profile</h1>
        <p className="mt-2 text-gray-400">Update your marketplace profile</p>
      </div>

      {error && <Alert type="error" dismissible onDismiss={() => setError(null)}>{error}</Alert>}
      {success && <Alert type="success">Profile updated successfully!</Alert>}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-white">Basic Information</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
                <Input
                  value={formData.full_name || ''}
                  onChange={(e) => handleChange('full_name', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Company Name</label>
                <Input
                  value={formData.company_name || ''}
                  onChange={(e) => handleChange('company_name', e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Headline</label>
              <Input
                value={formData.headline || ''}
                onChange={(e) => handleChange('headline', e.target.value)}
                placeholder="e.g., Government Proposal Writer | 10+ Years Experience"
                maxLength={100}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Bio</label>
              <textarea
                value={formData.bio || ''}
                onChange={(e) => handleChange('bio', e.target.value)}
                rows={6}
                className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white"
                placeholder="Tell clients about your experience and expertise..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Years of Experience</label>
              <Input
                type="number"
                min="0"
                max="50"
                value={formData.years_experience || ''}
                onChange={(e) => handleChange('years_experience', e.target.value ? Number(e.target.value) : null)}
              />
            </div>
          </CardBody>
        </Card>

        {/* Specializations */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-white">Specializations</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={newSpecialization}
                onChange={(e) => setNewSpecialization(e.target.value)}
                placeholder="Add a specialization..."
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSpecialization())}
              />
              <Button type="button" variant="secondary" onClick={addSpecialization} leftIcon={<PlusIcon className="w-4 h-4" />}>
                Add
              </Button>
            </div>

            {formData.specializations && formData.specializations.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.specializations.map((spec) => (
                  <Badge key={spec} variant="primary">
                    {spec}
                    <button
                      type="button"
                      onClick={() => removeSpecialization(spec)}
                      className="ml-2 hover:text-red-400"
                    >
                      <XMarkIcon className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        {/* Qualifications */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-white">Qualifications</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={newQualification}
                onChange={(e) => setNewQualification(e.target.value)}
                placeholder="Add a qualification or certification..."
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addQualification())}
              />
              <Button type="button" variant="secondary" onClick={addQualification} leftIcon={<PlusIcon className="w-4 h-4" />}>
                Add
              </Button>
            </div>

            {formData.qualifications && formData.qualifications.length > 0 && (
              <ul className="space-y-2">
                {formData.qualifications.map((qual, idx) => (
                  <li key={idx} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                    <span className="text-gray-300">{qual}</span>
                    <button
                      type="button"
                      onClick={() => removeQualification(qual)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        {/* Pricing & Availability */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-white">Pricing & Availability</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Pricing Model</label>
              <Select
                value={formData.pricing_model || ''}
                onChange={(e) => handleChange('pricing_model', e.target.value)}
              >
                <option value="">Select pricing model</option>
                <option value="hourly">Hourly Rate</option>
                <option value="project">Per Project</option>
                <option value="both">Both Hourly & Project</option>
                <option value="custom">Custom Pricing</option>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Hourly Rate ($)</label>
                <Input
                  type="number"
                  min="0"
                  step="5"
                  value={formData.hourly_rate || ''}
                  onChange={(e) => handleChange('hourly_rate', e.target.value ? Number(e.target.value) : null)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Project Min ($)</label>
                <Input
                  type="number"
                  min="0"
                  step="100"
                  value={formData.project_rate_min || ''}
                  onChange={(e) => handleChange('project_rate_min', e.target.value ? Number(e.target.value) : null)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Project Max ($)</label>
                <Input
                  type="number"
                  min="0"
                  step="100"
                  value={formData.project_rate_max || ''}
                  onChange={(e) => handleChange('project_rate_max', e.target.value ? Number(e.target.value) : null)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Availability Status</label>
                <Select
                  value={formData.availability_status || ''}
                  onChange={(e) => handleChange('availability_status', e.target.value)}
                >
                  <option value="">Select status</option>
                  <option value="available">Available</option>
                  <option value="limited">Limited Availability</option>
                  <option value="unavailable">Currently Unavailable</option>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Response Time (hours)</label>
                <Input
                  type="number"
                  min="1"
                  max="168"
                  value={formData.response_time_hours || ''}
                  onChange={(e) => handleChange('response_time_hours', e.target.value ? Number(e.target.value) : null)}
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-gray-300">
              <input
                type="checkbox"
                checked={formData.accepts_rush_projects || false}
                onChange={(e) => handleChange('accepts_rush_projects', e.target.checked)}
                className="rounded border-gray-600 bg-gray-700 text-primary-500"
              />
              I accept rush projects
            </label>
          </CardBody>
        </Card>

        {/* Submit */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="secondary" onClick={loadProfile}>
            Reset Changes
          </Button>
          <Button type="submit" variant="primary" isLoading={isSaving}>
            Save Profile
          </Button>
        </div>
      </form>
    </div>
  );
}
