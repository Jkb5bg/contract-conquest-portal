import { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { AxiosError } from 'axios';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { Badge, Card, CardBody, Modal, Button } from "@/components/ui";

// Define the shape of our API response
interface SubStatus {
  has_subscription: boolean;
  tier: string;
  status: string;
  cancel_at_period_end: boolean;
  renewal_period_end: string;
}

// Define the shape of potential error messages from your backend
interface ApiErrorResponse {
  message?: string;
  error?: string;
}

// Cancel response type
interface CancelResponse {
  success: boolean;
  message: string;
  cancel_at_period_end: boolean;
  renewal_period_end: string;
}

export default function SubscriptionManagement() {
  const router = useRouter();
  const [subData, setSubData] = useState<SubStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const fetchSubStatus = useCallback(async () => {
    try {
      // apiClient handles the token and 401 redirect automatically via interceptors
      const res = await apiClient.get<SubStatus>('/subscription/status');
      setSubData(res.data);
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;

      // 401 = Not authenticated, redirect to login
      if (axiosError.response?.status === 401) {
        router.push('/login');
        return;
      }

      // 404 means no active subscription found, which is a valid state
      if (axiosError.response?.status === 404) {
        // No subscription - component will render nothing
        setSubData(null);
        return;
      }

      // 500 or other errors
      if (axiosError.response?.status === 500) {
        toast.error('Unable to load subscription status. Please try again later.');
      } else {
        console.error("Failed to fetch subscription status", axiosError);
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchSubStatus();
  }, [fetchSubStatus]);

  const handleCancelClick = () => {
    setShowCancelModal(true);
  };

  const handleCancelConfirm = async () => {
    setCancelling(true);

    try {
      const res = await apiClient.post<CancelResponse>('/subscription/cancel');

      if (res.data.success) {
        toast.success(res.data.message || "Subscription cancellation scheduled successfully");
        // Update local state immediately so UI reflects the change
        setSubData(prev => prev ? {
          ...prev,
          cancel_at_period_end: true,
          renewal_period_end: res.data.renewal_period_end
        } : null);
        setShowCancelModal(false);
      }
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;

      // 401 = Not authenticated, redirect to login
      if (axiosError.response?.status === 401) {
        router.push('/login');
        return;
      }

      // 404 = No active membership found
      if (axiosError.response?.status === 404) {
        toast.error("No active membership found.");
        setShowCancelModal(false);
        // Refresh subscription status
        fetchSubStatus();
        return;
      }

      // 500 or other server errors
      if (axiosError.response?.status === 500) {
        toast.error("Server error. Please try again later.");
      } else {
        const errorMessage = axiosError.response?.data?.message || "Failed to cancel subscription. Please try again later.";
        toast.error(errorMessage);
      }
    } finally {
      setCancelling(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Show a themed skeleton loader while checking status
  if (loading) {
    return (
      <div className="mt-6 h-48 animate-pulse bg-gray-800/40 rounded-xl border border-gray-700/50 flex items-center justify-center">
        <span className="text-xs text-gray-500">Loading subscription details...</span>
      </div>
    );
  }

  // Hide component entirely if no active membership is found
  if (!subData || !subData.has_subscription) {
    return null;
  }

  return (
    <>
      <Card className="mt-6 opacity-80 hover:opacity-100 transition-opacity duration-300">
        <CardBody>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-300">Subscription Plan</h4>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={subData.tier === 'pro' ? 'primary' : 'info'}>
                    {subData.tier === 'pro' ? 'Pro Plan' : 'Starter Plan'}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {subData.tier === 'pro'
                      ? '5 NAICS codes, unlimited opportunities'
                      : '3 NAICS codes, 50 opportunities/month'}
                  </span>
                </div>
              </div>
            </div>

            {/* Show cancellation scheduled message if already cancelled */}
            {subData.cancel_at_period_end ? (
              <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-amber-300">Cancellation Scheduled</p>
                    <p className="text-xs text-amber-200/70 mt-1">
                      Your subscription remains active until <span className="font-medium text-amber-200">{formatDate(subData.renewal_period_end)}</span>
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      You will continue to have full access to all features until this date.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Warning about cancellation consequences */}
                <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <p className="text-xs font-medium text-yellow-300 mb-1">
                    What happens if you cancel
                  </p>
                  <ul className="text-[11px] text-yellow-200/80 space-y-0.5 ml-4 list-disc">
                    <li>Stop receiving personalized opportunity matches</li>
                    <li>AI-powered match scoring will be disabled</li>
                    <li>Saved opportunities and preferences will be archived</li>
                  </ul>
                </div>

                <div className="pt-3 border-t border-gray-700/50">
                  <details className="group">
                    <summary className="text-xs text-gray-500 hover:text-gray-400 cursor-pointer list-none flex items-center gap-1">
                      <span>Account options</span>
                      <svg className="w-3 h-3 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </summary>

                    <div className="mt-3 p-3 bg-gray-800/50 rounded-lg border border-gray-700/30">
                      <p className="text-xs text-gray-400 mb-3">
                        Need to end your subscription? Your access will continue until the end of your current billing period.
                      </p>
                      <button
                        onClick={handleCancelClick}
                        className="text-xs text-red-400/60 hover:text-red-400 underline transition-colors decoration-red-400/30"
                      >
                        Cancel subscription
                      </button>

                      <p className="text-[10px] text-gray-600 mt-4 italic">
                        Note: For billing history or payment method updates, please contact our support team.
                      </p>
                    </div>
                  </details>
                </div>
              </>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Cancellation Confirmation Modal */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => !cancelling && setShowCancelModal(false)}
        title="Cancel Subscription"
        size="sm"
      >
        <div className="space-y-4">
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-red-300">Are you sure you want to cancel?</p>
                <p className="text-xs text-red-200/70 mt-1">
                  You will lose access to Pro features at the end of your billing cycle.
                </p>
              </div>
            </div>
          </div>

          <div className="text-sm text-gray-400">
            <p className="mb-2">After cancellation:</p>
            <ul className="space-y-1 ml-4 list-disc text-gray-500">
              <li>Your subscription will remain active until the end of your current billing period</li>
              <li>You will not be charged for the next billing cycle</li>
              <li>All your data and preferences will be saved</li>
            </ul>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-700">
            <Button
              variant="ghost"
              onClick={() => setShowCancelModal(false)}
              disabled={cancelling}
              className="flex-1"
            >
              Keep Subscription
            </Button>
            <Button
              variant="danger"
              onClick={handleCancelConfirm}
              isLoading={cancelling}
              className="flex-1"
            >
              {cancelling ? 'Cancelling...' : 'Yes, Cancel'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
