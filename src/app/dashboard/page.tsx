'use client';
import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { DashboardStats, Opportunity } from '@/types/opportunity';
import {
  Card,
  CardHeader,
  CardBody,
  StatCard,
  Badge,
  Button,
  LoadingSpinner,
  EmptyState,
  ProgressBar,
} from '@/components/ui';
import {
  DocumentTextIcon,
  StarIcon,
  RocketLaunchIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  ChartBarIcon,
  SparklesIcon,
  BellIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function EnhancedDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOpportunities, setRecentOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('today');

  useEffect(() => {
    fetchDashboardData();
  }, [timeRange]);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, oppsRes] = await Promise.all([
        apiClient.get('/dashboard/stats'),
        apiClient.get('/opportunities/mine?limit=5&score_min=0.7'),
      ]);

      setStats(statsRes.data);
      setRecentOpportunities(oppsRes.data.opportunities || []);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
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
      {/* Welcome Banner */}
      <Card className="bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-indigo-500/20">
        <CardBody>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Welcome Back! 👋
              </h1>
              <p className="text-gray-300">
                You have {stats?.newToday || 0} new opportunities waiting for review
              </p>
            </div>
            <Button variant="primary" icon={<BellIcon className="h-5 w-5" />}>
              View Notifications
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Time Range Selector */}
      <div className="flex justify-end gap-2">
        {['today', 'week', 'month'].map((range) => (
          <button
            key={range}
            onClick={() => setTimeRange(range as never)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              timeRange === range
                ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            {range.charAt(0).toUpperCase() + range.slice(1)}
          </button>
        ))}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          label="New Today"
          value={stats?.newToday || 0}
          icon={<DocumentTextIcon className="h-6 w-6" />}
          color="purple"
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          label="Saved"
          value={stats?.saved || 0}
          icon={<StarIcon className="h-6 w-6" />}
          color="yellow"
        />
        <StatCard
          label="Pursuing"
          value={stats?.pursuing || 0}
          icon={<RocketLaunchIcon className="h-6 w-6" />}
          color="green"
          trend={{ value: 8, isPositive: true }}
        />
        <StatCard
          label="Due This Week"
          value={stats?.dueThisWeek || 0}
          icon={<ClockIcon className="h-6 w-6" />}
          color="red"
        />
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Match Score */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <ChartBarIcon className="h-5 w-5 mr-2" />
                Average Match Score
              </h3>
              <Badge variant="success">Excellent</Badge>
            </div>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-5xl font-bold text-white mb-2">
                  {((stats?.averageScore || 0) * 100).toFixed(0)}%
                </div>
                <p className="text-gray-400">
                  across {stats?.totalOpportunities || 0} opportunities
                </p>
              </div>
              <ProgressBar value={stats?.averageScore || 0} max={1} color="purple" />
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/10">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-400">
                    {Math.round((stats?.totalOpportunities || 0) * 0.4)}
                  </p>
                  <p className="text-xs text-gray-500">High Match</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-yellow-400">
                    {Math.round((stats?.totalOpportunities || 0) * 0.35)}
                  </p>
                  <p className="text-xs text-gray-500">Good Match</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-400">
                    {Math.round((stats?.totalOpportunities || 0) * 0.25)}
                  </p>
                  <p className="text-xs text-gray-500">Fair Match</p>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Activity Feed */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-white flex items-center">
              <SparklesIcon className="h-5 w-5 mr-2" />
              Recent Activity
            </h3>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              {[
                { action: 'New match found', time: '5 min ago', type: 'success' },
                { action: 'Opportunity saved', time: '1 hour ago', type: 'info' },
                { action: 'Status updated to "Pursuing"', time: '2 hours ago', type: 'warning' },
                { action: '3 new opportunities', time: 'Today', type: 'success' },
                { action: 'Profile updated', time: 'Yesterday', type: 'info' },
              ].map((activity, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.type === 'success' ? 'bg-green-400' :
                    activity.type === 'warning' ? 'bg-yellow-400' :
                    'bg-blue-400'
                  }`} />
                  <div className="flex-1">
                    <p className="text-white text-sm">{activity.action}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Top Opportunities */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white flex items-center">
              <ArrowTrendingUpIcon className="h-5 w-5 mr-2" />
              High-Score Opportunities
            </h3>
            <Link href="/opportunities">
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
                <Link href="/profile">
                  <Button variant="primary">
                    Complete Your Profile
                  </Button>
                </Link>
              }
            />
          )}
        </CardBody>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/opportunities">
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

        <Link href="/profile">
          <Card hoverable className="cursor-pointer">
            <CardBody className="text-center">
              <div className="inline-flex p-4 bg-blue-500/20 rounded-full mb-3">
                <SparklesIcon className="h-8 w-8 text-blue-400" />
              </div>
              <h3 className="text-white font-semibold mb-1">Update Profile</h3>
              <p className="text-sm text-gray-400">Improve your matching accuracy</p>
            </CardBody>
          </Card>
        </Link>

        <Link href="/analytics">
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