import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { AxiosError } from 'axios';
import { apiClient } from '@/lib/api';
import { Badge, Card, CardBody } from "@/components/ui";

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

export default function SubscriptionManagement() {
  const [subData, setSubData] = useState<SubStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubStatus();
  }, []);

  const fetchSubStatus = async () => {
    try {
      // apiClient handles the token and 401 redirect automatically via interceptors
      const res = await apiClient.get<SubStatus>('/subscription/status');
      setSubData(res.data);
    } catch (err) {
      const axiosError = err as AxiosError;
      // 404 means no active subscription found, which is a valid state
      if (axiosError.response?.status !== 404) {
        console.error("Failed to fetch sub status", axiosError);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm("Are you sure? You will lose access to Pro features at the end of your billing cycle.")) {
      return;
    }

    try {
      const res = await apiClient.post<{
        success: boolean;
        renewal_period_end: string;
      }>('/subscription/cancel');

      if (res.data.success) {
        toast.success("Cancellation scheduled successfully");
        // Update local state immediately so UI reflects the change
        setSubData(prev => prev ? {
          ...prev,
          cancel_at_period_end: true,
          renewal_period_end: res.data.renewal_period_end
        } : null);
      }
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      const errorMessage = axiosError.response?.data?.message || "Failed to cancel. Please try again later.";
      toast.error(errorMessage);
    }
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
    <Card className="mt-6 opacity-80 hover:opacity-100 transition-opacity duration-300">
      <CardBody>
        <div className="space-y-3">
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

          {/* Discouragement Block: Warning of loss of features */}
          {!subData.cancel_at_period_end && (
            <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <p className="text-xs font-medium text-yellow-300 mb-1">
                ⚠️ What happens if you cancel
              </p>
              <ul className="text-[11px] text-yellow-200/80 space-y-0.5 ml-4 list-disc">
                <li>Stop receiving personalized opportunity matches</li>
                <li>AI-powered match scoring will be disabled</li>
                <li>Saved opportunities and preferences will be archived</li>
              </ul>
            </div>
          )}

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
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-green-400">✅ Cancellation Scheduled</p>
                    <p className="text-xs text-gray-400">
                      Your access remains active until: <span className="text-gray-200">{new Date(subData.renewal_period_end).toLocaleDateString()}</span>
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="text-xs text-gray-400 mb-3">
                      Need to end your subscription? Your access will continue until the end of your current billing period.
                    </p>
                    <button
                      onClick={handleCancel}
                      className="text-xs text-red-400/60 hover:text-red-400 underline transition-colors decoration-red-400/30"
                    >
                      Cancel subscription
                    </button>
                  </>
                )}

                <p className="text-[10px] text-gray-600 mt-4 italic">
                  Note: For billing history or payment method updates, please contact our support team.
                </p>
              </div>
            </details>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}