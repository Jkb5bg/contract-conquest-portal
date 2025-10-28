'use client';

import { useState } from 'react';
import { Modal, Input, Select, Button, Alert } from '@/components/ui';
import { contactWriter } from '@/lib/marketplaceApi';
import { ProposalWriterContactRequest, ContactType } from '@/types/marketplace';

interface ContactWriterModalProps {
  writerId: string;
  writerName: string;
  clientId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ContactWriterModal({
  writerId,
  writerName,
  clientId,
  onClose,
  onSuccess,
}: ContactWriterModalProps) {
  const [formData, setFormData] = useState<ProposalWriterContactRequest>({
    writer_id: writerId,
    client_id: clientId,
    subject: '',
    message: '',
    contact_type: 'inquiry',
    opportunity_id: null,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await contactWriter(formData);
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof ProposalWriterContactRequest, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <Modal isOpen onClose={onClose} title={`Contact ${writerName}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert type="error">{error}</Alert>}

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Contact Type *
          </label>
          <Select
            value={formData.contact_type || 'inquiry'}
            onChange={(e) => handleChange('contact_type', e.target.value as ContactType)}
            required
          >
            <option value="inquiry">General Inquiry</option>
            <option value="quote_request">Quote Request</option>
            <option value="follow_up">Follow Up</option>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Subject
          </label>
          <Input
            type="text"
            value={formData.subject || ''}
            onChange={(e) => handleChange('subject', e.target.value)}
            placeholder="Brief subject line"
            maxLength={100}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Message *
          </label>
          <textarea
            value={formData.message}
            onChange={(e) => handleChange('message', e.target.value)}
            placeholder="Your message to the writer..."
            required
            rows={6}
            className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Related Opportunity ID (optional)
          </label>
          <Input
            type="text"
            value={formData.opportunity_id || ''}
            onChange={(e) => handleChange('opportunity_id', e.target.value || null)}
            placeholder="If this relates to a specific opportunity"
          />
        </div>

        <div className="flex gap-3 justify-end pt-4">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            Send Message
          </Button>
        </div>
      </form>
    </Modal>
  );
}
