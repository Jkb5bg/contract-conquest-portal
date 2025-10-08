'use client';
import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { DashboardStats, Opportunity } from '@/types/opportunity';
import { 
  DocumentTextIcon, 
  StarIcon, 
  RocketLaunchIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOpportunities, setRecentOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch stats
      const statsResponse = await apiClient.get('/dashboard/stats');
      setStats(statsResponse.data);

      // Fetch recent high-scoring opportunities
      const oppsResponse = await apiClient.get('/opportunities/mine?limit=5&score_min=70');
      setRecentOpportunities(oppsResponse.data.opportunities || []);
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

  const getScoreLabel = (score: number) => {
    if (score >= 0.8) return 'Excellent';
    if (score >= 0.6) return 'Good';
    return 'Fair';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">New Today</p>
              <p className="text-3xl font-bold text-white mt-1">
                {stats?.newToday || 0}
              </p>
            </div>
            <DocumentTextIcon className="h-8 w-8 text-purple-400" />
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Saved</p>
              <p className="text-3xl font-bold text-white mt-1">
                {stats?.saved || 0}
              </p>
            </div>
            <StarIcon className="h-8 w-8 text-yellow-400" />
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Pursuing</p>
              <p className="text-3xl font-bold text-white mt-1">
                {stats?.pursuing || 0}
              </p>
            </div>
            <RocketLaunchIcon className="h-8 w-8 text-green-400" />
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Due This Week</p>
              <p className="text-3xl font-bold text-white mt-1">
                {stats?.dueThisWeek || 0}
              </p>
            </div>
            <ClockIcon className="h-8 w-8 text-red-400" />
          </div>
        </div>
      </div>

      {/* Average Score */}
      <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Average Match Score</h3>
          <ArrowTrendingUpIcon className="h-6 w-6 text-gray-400" />
        </div>
        <div className="flex items-end space-x-4">
          <div className="text-4xl font-bold text-white">
            {((stats?.averageScore || 0) * 100).toFixed(0)}%
          </div>
          <div className="text-sm text-gray-400 pb-1">
            across {stats?.totalOpportunities || 0} opportunities
          </div>
        </div>
        <div className="mt-4 h-2 bg-gray-700 rounded-full overflow-hidden">
          <div 
            className={`h-full bg-gradient-to-r ${getScoreColor(stats?.averageScore || 0)} transition-all duration-500`}
            style={{ width: `${(stats?.averageScore || 0) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Recent Opportunities */}
      <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">Recent High-Score Opportunities</h3>
          <Link 
            href="/opportunities"
            className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
          >
            View all →
          </Link>
        </div>

        <div className="space-y-4">
          {recentOpportunities.length > 0 ? (
            recentOpportunities.map((opp) => (
              <div 
                key={opp.id}
                className="p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-all cursor-pointer"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="text-white font-medium mb-1">{opp.opportunity_title}</h4>
                    <p className="text-sm text-gray-400">{opp.agency}</p>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                      {opp.due_date && (
                        <span className="flex items-center">
                          <ClockIcon className="h-3 w-3 mr-1" />
                          Due {new Date(opp.due_date).toLocaleDateString()}
                        </span>
                      )}
                      {opp.estimated_value && (
                        <span>{opp.estimated_value}</span>
                      )}
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className={`px-3 py-1 rounded-full bg-gradient-to-r ${getScoreColor(opp.match_score)} text-white text-xs font-semibold`}>
                      {(opp.match_score * 100).toFixed(0)}%
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{getScoreLabel(opp.match_score)}</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-400 text-center py-8">No opportunities yet. Check back soon!</p>
          )}
        </div>
      </div>
    </div>
  );
}
