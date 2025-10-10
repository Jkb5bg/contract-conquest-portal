'use client';
import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { Opportunity, OpportunityStatus } from '@/types/opportunity';
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Button,
  Badge,
  Input,
  Select,
  LoadingSpinner,
  EmptyState,
} from '@/components/ui';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  BuildingOfficeIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ChevronDownIcon,
  StarIcon,
  RocketLaunchIcon,
  XMarkIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';

export default function ConsistentOpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterScore, setFilterScore] = useState<number>(0.5);
  const [sortBy, setSortBy] = useState<string>('score');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchOpportunities();
  }, []);

  const fetchOpportunities = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/opportunities/mine?limit=100&score_min=0.5');
      setOpportunities(response.data.opportunities || []);
    } catch (error) {
      console.error('Failed to fetch opportunities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, status: OpportunityStatus) => {
    try {
      setOpportunities(prev =>
        prev.map(o => o.id === id ? { ...o, status } : o)
      );
      await apiClient.put(`/opportunities/${id}/status`, { status });
    } catch (error) {
      console.error('Failed to update status:', error);
      fetchOpportunities(); // Revert on error
    }
  };

  const filteredOpportunities = opportunities
    .filter(o => {
      const matchesSearch = o.opportunity_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           o.agency.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === 'all' || o.status === filterStatus;
      const matchesScore = o.match_score >= filterScore;
      return matchesSearch && matchesStatus && matchesScore;
    })
    .sort((a, b) => {
      if (sortBy === 'score') return b.match_score - a.match_score;
      if (sortBy === 'date') return new Date(b.matched_at).getTime() - new Date(a.matched_at).getTime();
      return 0;
    });

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'success';
    if (score >= 0.6) return 'warning';
    return 'info';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 0.8) return 'Excellent';
    if (score >= 0.6) return 'Good';
    return 'Fair';
  };

  if (loading) {
    return <LoadingSpinner size="lg" />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <Card>
        <CardBody>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">Your Opportunities</h1>
              <p className="text-gray-400">
                Found {filteredOpportunities.length} opportunities matching your profile
              </p>
            </div>
            <Button variant="primary" onClick={fetchOpportunities}>
              Refresh
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Filters */}
      <Card>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="Search opportunities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<MagnifyingGlassIcon className="h-5 w-5" />}
            />

            <Select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              options={[
                { value: 'all', label: 'All Status' },
                { value: OpportunityStatus.NEW, label: 'New' },
                { value: OpportunityStatus.SAVED, label: 'Saved' },
                { value: OpportunityStatus.PURSUING, label: 'Pursuing' },
                { value: OpportunityStatus.PASSED, label: 'Passed' },
              ]}
            />

            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Min Score: {(filterScore * 100).toFixed(0)}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={filterScore * 100}
                onChange={(e) => setFilterScore(parseInt(e.target.value) / 100)}
                className="w-full accent-purple-500"
              />
            </div>

            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              options={[
                { value: 'score', label: 'Sort by Score' },
                { value: 'date', label: 'Sort by Date' },
              ]}
            />
          </div>
        </CardBody>
      </Card>

      {/* Opportunities List */}
      <div className="space-y-4 stagger-fade-in">
        {filteredOpportunities.length > 0 ? (
          filteredOpportunities.map((opp) => (
            <Card key={opp.id} hoverable>
              <CardBody>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-2 hover:text-purple-400 cursor-pointer transition-colors">
                      {opp.opportunity_title}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <span className="flex items-center">
                        <BuildingOfficeIcon className="h-4 w-4 mr-1" />
                        {opp.agency}
                      </span>
                      {opp.due_date && (
                        <span className="flex items-center">
                          <ClockIcon className="h-4 w-4 mr-1" />
                          {new Date(opp.due_date).toLocaleDateString()}
                        </span>
                      )}
                      {opp.estimated_value && (
                        <span className="flex items-center">
                          <CurrencyDollarIcon className="h-4 w-4 mr-1" />
                          {opp.estimated_value}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className={`px-4 py-2 rounded-full bg-gradient-to-r ${
                        opp.match_score >= 0.8 ? 'from-green-400 to-emerald-500' :
                        opp.match_score >= 0.6 ? 'from-yellow-400 to-orange-500' :
                        'from-blue-400 to-indigo-500'
                      } text-white font-bold text-lg`}>
                        {(opp.match_score * 100).toFixed(0)}%
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{getScoreBadge(opp.match_score)} Match</p>
                    </div>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="mb-4">
                  <Badge variant={
                    opp.status === OpportunityStatus.PURSUING ? 'success' :
                    opp.status === OpportunityStatus.SAVED ? 'warning' :
                    opp.status === OpportunityStatus.PASSED ? 'danger' :
                    'info'
                  }>
                    {opp.status}
                  </Badge>
                </div>

                {/* AI Reasoning */}
                <button
                  onClick={() => setExpandedId(expandedId === opp.id ? null : opp.id)}
                  className="flex items-center text-sm text-purple-400 hover:text-purple-300 transition-colors mb-3"
                >
                  <ChevronDownIcon className={`h-4 w-4 mr-1 transform transition-transform ${
                    expandedId === opp.id ? 'rotate-180' : ''
                  }`} />
                  Why is this a match?
                </button>

                {expandedId === opp.id && (
                  <div className="mb-4 p-4 bg-black/20 rounded-lg border border-purple-500/30 animate-slide-up">
                    <p className="text-sm text-gray-300 leading-relaxed">
                      {opp.reasoning}
                    </p>
                  </div>
                )}
              </CardBody>

              <CardFooter>
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    {opp.status !== OpportunityStatus.SAVED && (
                      <Button
                        size="sm"
                        variant="warning"
                        icon={<StarIcon className="h-4 w-4" />}
                        onClick={() => handleStatusChange(opp.id, OpportunityStatus.SAVED)}
                      >
                        Save
                      </Button>
                    )}
                    {opp.status !== OpportunityStatus.PURSUING && (
                      <Button
                        size="sm"
                        variant="success"
                        icon={<RocketLaunchIcon className="h-4 w-4" />}
                        onClick={() => handleStatusChange(opp.id, OpportunityStatus.PURSUING)}
                      >
                        Pursue
                      </Button>
                    )}
                    {opp.status !== OpportunityStatus.PASSED && (
                      <Button
                        size="sm"
                        variant="ghost"
                        icon={<XMarkIcon className="h-4 w-4" />}
                        onClick={() => handleStatusChange(opp.id, OpportunityStatus.PASSED)}
                      >
                        Pass
                      </Button>
                    )}
                  </div>
                  <Button size="sm" variant="ghost">
                    View Details →
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))
        ) : (
          <Card>
            <CardBody>
              <EmptyState
                icon={<DocumentTextIcon className="h-12 w-12" />}
                title="No opportunities found"
                description="Try adjusting your filters or check back later for new matches"
                action={
                  <Button variant="primary" onClick={() => {
                    setSearchQuery('');
                    setFilterStatus('all');
                    setFilterScore(0.5);
                  }}>
                    Clear Filters
                  </Button>
                }
              />
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}