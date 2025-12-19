'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { Opportunity } from '@/types/opportunity';
import {
  Card,
  CardHeader,
  CardBody,
  Badge,
  Button,
  LoadingSpinner,
  EmptyState,
} from '@/components/ui';
import {
  PencilIcon,
  DocumentTextIcon,
  ClockIcon,
  SparklesIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { computeProfileCompleteness } from '@/lib/profileCompleteness';


export default function EnhancedDashboard() {
  const [recentOpportunities, setRecentOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileCompleteness, setProfileCompleteness] = useState(0);
  const [userTier, setUserTier] = useState<'starter' | 'pro'>('starter');
  const router = useRouter();

  useEffect(() => {
    fetchDashboardData();
    fetchProfileCompleteness();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch user tier first to determine appropriate score threshold
      const profileRes = await apiClient.get('/profile/me');
      const tier = profileRes.data.subscription_tier || 'starter';
      setUserTier(tier);

      // Use tier-appropriate score threshold (starter: 0.75, pro: 0.7 for high-quality)
      const scoreMin = tier === 'pro' ? 0.7 : 0.75;
      const oppsRes = await apiClient.get(`/opportunities/mine?limit=5&score_min=${scoreMin}`);
      setRecentOpportunities(oppsRes.data.opportunities || []);
    } catch (error) {
      console.error('Failed to fetch the dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfileCompleteness = async () => {
    try {
      const { data } = await apiClient.get('/profile/me');

      // Normalize the backend data to match what the profile page expects
      // This ensures consistent completeness calculations between dashboard and profile page
      const normalizedData = {
        ...data,
        // If has_capabilities is undefined, treat as true (user hasn't explicitly said they have none)
        has_capabilities: data.has_capabilities !== false,
        // If has_agencies is undefined, treat as true (user hasn't explicitly said they have none)
        has_agencies: data.has_agencies !== false,
        // If either identifier exists, or has_identifiers is true, consider it provided
        has_identifiers: !!(data.cage_code || data.uei) || data.has_identifiers === true,
      };

      setProfileCompleteness(computeProfileCompleteness(normalizedData));
      setUserTier(data.subscription_tier || 'starter');
    } catch (e) {
      console.error('Failed to fetch profile completeness:', e);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'from-green-400 to-emerald-500';
    if (score >= 0.6) return 'from-yellow-400 to-orange-500';
    return 'from-blue-400 to-indigo-500';
  };

  const handleOpportunityClick = (opportunityId: string) => {
    router.push(`/dashboard/opportunities/${opportunityId}`);
  };

  if (loading) {
    return <LoadingSpinner size="lg" />;
  }

  return (
    <div className="space-y-6">
      {/* Tier Info Banner */}
      <Card className="bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-indigo-500/10 border-purple-500/20">
        <CardBody>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Badge variant={userTier === 'pro' ? 'primary' : 'info'} className="text-sm">
                {userTier === 'pro' ? '💎 Pro Plan' : '🚀 Starter Plan'}
              </Badge>
              <div className="text-sm text-gray-300">
                <span className="font-medium text-white">{userTier === 'pro' ? '5' : '3'}</span> NAICS codes •
                <span className="font-medium text-white ml-1">{userTier === 'pro' ? '50%+' : '75%+'}</span> match scores •
                <span className="font-medium text-white ml-1">Unlimited</span> writer contacts
              </div>
            </div>
            {userTier === 'starter' && (
              <Link href="/dashboard/profile">
                <Button variant="primary" size="sm">
                  Upgrade to Pro
                </Button>
              </Link>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Top Opportunities */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white flex items-center">
              <SparklesIcon className="h-5 w-5 mr-2" />
              High-Score Opportunities
            </h3>
            <Link href="/dashboard/opportunities">
              <Button variant="ghost" size="sm">
                View All <ArrowRightIcon className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardBody>
          {recentOpportunities.length > 0 ? (
            <div className="space-y-4">
              {recentOpportunities.map((opp) => (
                <div
                  key={opp.id}
                  onClick={() => handleOpportunityClick(opp.id)}
                  className="p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 hover:border-purple-500/30 transition-all cursor-pointer group"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h4 className="text-white font-medium mb-1 group-hover:text-purple-400 transition-colors">
                        {opp.opportunity_title}
                      </h4>
                      <p className="text-sm text-gray-400">{opp.agency}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={opp.match_score >= 0.8 ? 'success' : opp.match_score >= 0.6 ? 'warning' : 'info'}>
                        {(opp.match_score * 100).toFixed(0)}%
                      </Badge>
                      <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${getScoreColor(opp.match_score)}`} />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                    {opp.due_date && (
                      <span className="flex items-center">
                        <ClockIcon className="h-3 w-3 mr-1" />
                        {new Date(opp.due_date).toLocaleDateString()}
                      </span>
                    )}
                    {opp.estimated_value && (
                      <span>{opp.estimated_value}</span>
                    )}
                    {opp.set_aside && (
                      <Badge variant="info">{opp.set_aside}</Badge>
                    )}
                  </div>

                  <div className="mt-3 pt-3 border-t border-white/10">
                    <p className="text-sm text-gray-400 line-clamp-2">
                      {opp.reasoning}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<DocumentTextIcon className="h-12 w-12" />}
              title="No opportunities yet"
              description="New opportunities will appear here as they match your profile"
              action={
                profileCompleteness < 100 ? (
                  <Link href="/dashboard/profile">
                    <Button variant="primary">
                      Complete Your Profile
                    </Button>
                  </Link>
                ) : undefined
              }
            />
          )}
        </CardBody>
      </Card>

      {/* Quick Actions - Only show profile card if not 100% complete */}
      <div className={`grid gap-4 ${profileCompleteness === 100 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-3'}`}>
        <Link href="/dashboard/opportunities">
          <Card hoverable className="cursor-pointer">
            <CardBody className="text-center">
              <div className="inline-flex p-4 bg-purple-500/20 rounded-full mb-3">
                <DocumentTextIcon className="h-8 w-8 text-purple-400" />
              </div>
              <h3 className="text-white font-semibold mb-1">Browse Opportunities</h3>
              <p className="text-sm text-gray-400">Explore all matched opportunities</p>
            </CardBody>
          </Card>
        </Link>

        {profileCompleteness < 100 && (
          <Link href="/dashboard/profile">
            <Card hoverable className="cursor-pointer border-blue-500/30 bg-blue-500/5">
              <CardBody className="text-center">
                <div className="inline-flex p-4 bg-blue-500/20 rounded-full mb-3">
                  <SparklesIcon className="h-8 w-8 text-blue-400" />
                </div>
                <h3 className="text-white font-semibold mb-1">Complete Your Profile</h3>
                <p className="text-sm text-gray-400">{profileCompleteness}% complete</p>
                <div className="mt-3 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all"
                    style={{ width: `${profileCompleteness}%` }}
                  />
                </div>
              </CardBody>
            </Card>
          </Link>
        )}

        {/* Temporarily hidden - Proposals/Writers section coming soon */}
        {/* <Link href="/dashboard/proposals">
          <Card hoverable className="cursor-pointer">
            <CardBody className="text-center">
              <div className="inline-flex p-4 bg-green-500/20 rounded-full mb-3">
                <PencilIcon className="h-8 w-8 text-green-400" />
              </div>
              <h3 className="text-white font-semibold mb-1">View Writers</h3>
              <p className="text-sm text-gray-400">Find a proposal writer</p>
            </CardBody>
          </Card>
        </Link> */}
      </div>
    </div>
  );
}