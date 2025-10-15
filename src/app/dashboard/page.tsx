'use client';
import { useState, useEffect } from 'react';
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
  DocumentTextIcon,
  ClockIcon,
  ChartBarIcon,
  SparklesIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function EnhancedDashboard() {
  const [recentOpportunities, setRecentOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileCompleteness, setProfileCompleteness] = useState(0);


  useEffect(() => {
    fetchDashboardData();
    fetchProfileCompleteness();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const oppsRes = await apiClient.get('/opportunities/mine?limit=5&score_min=0.7');
      setRecentOpportunities(oppsRes.data.opportunities || []);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfileCompleteness = async () => {
    try {
      const profileRes = await apiClient.get('/profile/me');
      const profileData = profileRes.data;

      // Calculate completeness
      let score = 0;
      if (profileData.company_name && profileData.email) score += 15;
      if (profileData.cage_code || profileData.uei) score += 15;
      if (profileData.primary_naics && profileData.primary_naics.length >= 3) score += 20;
      if (profileData.capabilities && profileData.capabilities.length >= 3) score += 20;
      if (profileData.past_performance_agencies && profileData.past_performance_agencies.length > 0) score += 15;
      if (profileData.geographic_preferences && profileData.geographic_preferences.length > 0) score += 10;
      if (profileData.set_aside_eligibilities && profileData.set_aside_eligibilities.length > 0) score += 5;

      setProfileCompleteness(score);
    } catch (error) {
      console.error('Failed to fetch profile completeness:', error);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'from-green-400 to-emerald-500';
    if (score >= 0.6) return 'from-yellow-400 to-orange-500';
    return 'from-blue-400 to-indigo-500';
  };

  if (loading) {
    return <LoadingSpinner size="lg" />;
  }

  return (
    <div className="space-y-6">
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
                <Link href="/dashboard/profile">
                  <Button variant="primary">
                    Complete Your Profile
                  </Button>
                </Link>
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

        <Link href="/dashboard/analytics">
          <Card hoverable className="cursor-pointer">
            <CardBody className="text-center">
              <div className="inline-flex p-4 bg-green-500/20 rounded-full mb-3">
                <ChartBarIcon className="h-8 w-8 text-green-400" />
              </div>
              <h3 className="text-white font-semibold mb-1">View Analytics</h3>
              <p className="text-sm text-gray-400">Track your performance</p>
            </CardBody>
          </Card>
        </Link>
      </div>
    </div>
  );
}