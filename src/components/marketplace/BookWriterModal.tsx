'use client';

import { useState } from 'react';
import { Modal, Input, Select, Button, Alert } from '@/components/ui';
import { createBooking } from '@/lib/marketplaceApi';
import { ProposalWriterBookingRequest, ServiceType } from '@/types/marketplace';

interface BookWriterModalProps {
  writerId: string;
  writerName: string;
  clientId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function BookWriterModal({
  writerId,
  writerName,
  clientId,
  onClose,
  onSuccess,
}: BookWriterModalProps) {
  const [formData, setFormData] = useState<ProposalWriterBookingRequest>({
    writer_id: writerId,
    client_id: clientId,
    service_type: 'proposal_writing',
    project_description: '',
    opportunity_id: null,
    budget: null,
    deadline: null,
    preferred_contact_method: 'email',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await createBooking(formData);
      onSuccess();
    } catch (err: unknown) {
      // @ts-expect-error Accessing response property on unknown error type
      setError(err.response?.data?.detail || 'Failed to create booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof ProposalWriterBookingRequest, value: string | number | null) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value === '' ? null : value,
    }));
  };

  return (
    <Modal isOpen onClose={onClose} title={`Book ${writerName}`} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert type="error" message={error} />}

        <Alert type="info" message="This is a booking request. The writer will review and respond to your request." />

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Service Type *
          </label>
          <Select
            value={formData.service_type}
            onChange={(e) => handleChange('service_type', e.target.value as ServiceType)}
            required
          >
            <option value="proposal_writing">Proposal Writing</option>
            <option value="consultation">Consultation</option>
            <option value="proposal_review">Proposal Review</option>
            <option value="strategy_session">Strategy Session</option>
            <option value="custom">Custom Service</option>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Project Description *
          </label>
          <textarea
            value={formData.project_description}
            onChange={(e) => handleChange('project_description', e.target.value)}
            placeholder="Describe your project, requirements, and expectations..."
            required
            rows={6}
            className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Budget ($)
            </label>
            <Input
              type="number"
              min="0"
              step="100"
              value={formData.budget || ''}
              onChange={(e) =>
                handleChange('budget', e.target.value ? Number(e.target.value) : null)
              }
              placeholder="Your budget for this project"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Deadline
            </label>
            <Input
              type="date"
              value={formData.deadline?.split('T')[0] || ''}
              onChange={(e) =>
                handleChange('deadline', e.target.value ? `${e.target.value}T23:59:59` : null)
              }
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Related Opportunity ID
          </label>
          <Input
            type="text"
            value={formData.opportunity_id || ''}
            onChange={(e) => handleChange('opportunity_id', e.target.value)}
            placeholder="If this relates to a specific opportunity"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Preferred Contact Method
          </label>
          <Select
            value={formData.preferred_contact_method || 'email'}
            onChange={(e) => handleChange('preferred_contact_method', e.target.value)}
          >
            <option value="email">Email</option>
            <option value="phone">Phone</option>
            <option value="video_call">Video Call</option>
          </Select>
        </div>

        <div className="flex gap-3 justify-end pt-4">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            Submit Booking Request
          </Button>
        </div>
      </form>
    </Modal>
  );
}
