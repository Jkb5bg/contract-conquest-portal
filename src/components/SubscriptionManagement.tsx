'use client';
import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import { Badge, Card, CardBody, Modal, Button, Alert } from '@/components/ui';

interface SubscriptionStatus {
  has_subscription: boolean;
  tier: string;
  status: string;
  cancel_at_period_end: boolean;
  renewal_period_end: string;
}

export default function SubscriptionManagement() {
  const [subData, setSubData] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchSubscriptionStatus();
  }, []);

  const fetchSubscriptionStatus = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<SubscriptionStatus>('/subscription/status');
      setSubData(res.data);
    } catch (err: any) {
      // 404 means no active subscription - this is okay, just hide the component
      if (err.response?.status !== 404) {
        console.error('Failed to fetch subscription status:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    setIsCancelling(true);
    setError(null);

    try {
      const res = await apiClient.post<{
        success: boolean;
        message: string;
        renewal_period_end: string;
      }>('/subscription/cancel');

      if (res.data.success) {
        setSuccess(res.data.message);
        setShowCancelModal(false);

        // Update local state to reflect cancellation
        setSubData(prev => prev ? {
          ...prev,
          cancel_at_period_end: true,
          renewal_period_end: res.data.renewal_period_end
        } : null);

        // Clear success message after 5 seconds
        setTimeout(() => setSuccess(null), 5000);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message ||
                          err.response?.data?.detail ||
                          'Failed to cancel subscription. Please try again.';
      setError(errorMessage);
    } finally {
      setIsCancelling(false);
    }
  };

  // Show skeleton loader while checking status
  if (loading) {
    return (
      <div className="mt-6 h-48 animate-pulse bg-gray-800/40 rounded-xl border border-gray-700/50 flex items-center justify-center">
        <span className="text-xs text-gray-500">Loading subscription details...</span>
      </div>
    );
  }

  // Hide component if no active subscription
  if (!subData || !subData.has_subscription) {
    return null;
  }

  return (
    <>
      <Card className="mt-6 opacity-75 hover:opacity-100 transition-opacity">
        <CardBody>
          <div className="space-y-3">
            {/* Success Message */}
            {success && (
              <Alert type="success" message={success} onClose={() => setSuccess(null)} />
            )}

            {/* Plan Info */}
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-300">Subscription Plan</h4>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={subData.tier === 'pro' ? 'primary' : 'info'}>
                    {subData.tier === 'pro' ? '💎 Pro Plan' : '🚀 Starter Plan'}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {subData.tier === 'pro'
                      ? '5 NAICS • Unlimited opportunities'
                      : '3 NAICS • 50 opportunities/month'}
                  </span>
                </div>
              </div>
            </div>

            {/* Warning Box - Only show if NOT already cancelling */}
            {!subData.cancel_at_period_end && (
              <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <p className="text-xs font-medium text-yellow-300 mb-2">
                  ⚠️ Important: What happens if you cancel
                </p>
                <ul className="text-xs text-yellow-200 space-y-1 ml-4 list-disc">
                  <li>You'll stop receiving personalized opportunity matches</li>
                  <li>Your AI-powered match scoring will be disabled</li>
                  <li>You'll lose access to the writer marketplace</li>
                  <li>Your saved opportunities and preferences will be archived</li>
                </ul>
              </div>
            )}

            {/* Obscured Account Options */}
            <div className="pt-3 border-t border-gray-700/50">
              <details className="group">
                <summary className="text-xs text-gray-500 hover:text-gray-400 cursor-pointer list-none flex items-center gap-1">
                  <span>Account options</span>
                  <svg className="w-3 h-3 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>

                <div className="mt-3 p-3 bg-gray-800/50 rounded-lg border border-gray-700/30">
                  {subData.cancel_at_period_end ? (
                    /* Already Cancelled - Show Status */
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-green-400">
                        ✅ Cancellation Scheduled
                      </p>
                      <p className="text-xs text-gray-400">
                        Your access remains active until:{' '}
                        <span className="text-gray-200 font-medium">
                          {new Date(subData.renewal_period_end).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                      </p>
                    </div>
                  ) : (
                    /* Not Cancelled - Show Cancel Option */
                    <>
                      <p className="text-xs text-gray-400 mb-3">
                        Need to end your subscription? Your access will continue until the end of your current billing period.
                      </p>
                      <button
                        onClick={() => setShowCancelModal(true)}
                        className="text-xs text-red-400/60 hover:text-red-400 underline transition-colors decoration-red-400/30"
                      >
                        Cancel subscription
                      </button>
                    </>
                  )}

                  <p className="text-[10px] text-gray-600 mt-4 italic border-t border-gray-700/30 pt-3">
                    Note: Your access will continue until the end of your current billing period.
                  </p>
                </div>
              </details>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Cancellation Confirmation Modal */}
      {showCancelModal && (
        <Modal
          isOpen
          onClose={() => !isCancelling && setShowCancelModal(false)}
          title="Cancel Subscription?"
        >
          <div className="space-y-4">
            <Alert
              type="warning"
              message="Are you sure you want to cancel your subscription?"
            />

            {error && <Alert type="error" message={error} />}

            <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700/30">
              <p className="text-sm text-gray-300 mb-3">
                If you cancel now:
              </p>
              <ul className="text-sm text-gray-400 space-y-2 ml-4 list-disc">
                <li>You'll keep access until the end of your billing period</li>
                <li>You won't be charged again</li>
                <li>Your opportunities will stop being updated</li>
                <li>You can resubscribe anytime</li>
              </ul>
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <Button
                variant="secondary"
                onClick={() => setShowCancelModal(false)}
                disabled={isCancelling}
              >
                Keep Subscription
              </Button>
              <Button
                variant="danger"
                onClick={handleCancelSubscription}
                isLoading={isCancelling}
              >
                Yes, Cancel
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
