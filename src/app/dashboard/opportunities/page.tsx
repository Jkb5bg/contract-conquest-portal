'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { Opportunity, OpportunityStatus } from '@/types/opportunity';
import {
  Card,
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
  ArrowTopRightOnSquareIcon,
  BuildingOfficeIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ChevronDownIcon,
  StarIcon,
  RocketLaunchIcon,
  XMarkIcon,
  DocumentTextIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

interface PaginationInfo {
  total: number;
  limit: number;
  offset: number;
}

export default function ConsistentOpportunitiesPage() {
  const router = useRouter();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterScore, setFilterScore] = useState<number>(0.5);
  const [sortBy, setSortBy] = useState<string>('score');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    limit: 10,
    offset: 0,
  });

  useEffect(() => {
    fetchOpportunities();
  }, [currentPage, pageSize, sortBy]);

  const fetchOpportunities = async () => {
    try {
      setLoading(true);
      const offset = (currentPage - 1) * pageSize;

      const response = await apiClient.get('/opportunities/mine', {
        params: {
          limit: pageSize,
          offset: offset,
          score_min: 0.5,
        },
      });

      setOpportunities(response.data.opportunities || []);
      setPagination({
        total: response.data.total || 0,
        limit: response.data.limit || pageSize,
        offset: response.data.offset || offset,
      });
    } catch (error) {
      console.error('Failed to fetch opportunities:', error);
    } finally {
      setLoading(false);
    }
  };

  const toExternal = (url?: string): string => {
    if (!url) return '';
    return url.startsWith('http') ? url : `https://${url}`;
  };

  const handleStatusChange = async (id: string, newStatus: OpportunityStatus) => {
    try {
      // Store original state in case we need to revert
      const originalOpportunities = [...opportunities];

      // Optimistically update UI immediately
      setOpportunities(prev =>
        prev.map(o => o.id === id ? { ...o, status: newStatus } : o)
      );

      // For "passed" status, also remove from list
      if (newStatus === OpportunityStatus.PASSED) {
        // Give it a moment to show the UI update, then remove
        setTimeout(() => {
          setOpportunities(prev => prev.filter(o => o.id !== id));
          setPagination(prev => ({ ...prev, total: Math.max(0, prev.total - 1) }));
        }, 300);
      }

      // Make API call
      await apiClient.put(`/opportunities/${id}/status`, { status: newStatus });

      console.log(`Opportunity ${id} status changed to ${newStatus}`);
    } catch (error) {
      console.error('Failed to update status:', error);
      // Revert on error
      fetchOpportunities();
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

  const getScoreBadge = (score: number) => {
    if (score >= 0.8) return 'Excellent';
    if (score >= 0.6) return 'Good';
    return 'Fair';
  };

  // Calculate pagination info
  const totalPages = Math.ceil(pagination.total / pageSize);
  const startItem = pagination.offset + 1;
  const endItem = Math.min(pagination.offset + pageSize, pagination.total);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goToNextPage = () => {
    goToPage(currentPage + 1);
  };

  const goToPreviousPage = () => {
    goToPage(currentPage - 1);
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
                Showing {startItem}-{endItem} of {pagination.total} total opportunities
              </p>
            </div>
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

      {/* Page Size Selector */}
      <Card>
        <CardBody>
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-400">
              Items per page:
            </div>
            <div className="flex gap-2">
              {[5, 10, 20, 50].map((size) => (
                <button
                  key={size}
                  onClick={() => {
                    setPageSize(size);
                    setCurrentPage(1); // Reset to first page
                  }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    pageSize === size
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
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
                    'info'
                  }>
                    {opp.status.charAt(0).toUpperCase() + opp.status.slice(1)}
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
                <div className="flex items-center justify-between w-full">
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

                  <div className="flex items-center gap-3">
                    {opp.opportunity_url ? (
                      <a
                        href={toExternal(opp.opportunity_url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                      >
                        <ArrowTopRightOnSquareIcon className="h-4 w-4 mr-2" />
                        See Opportunity
                      </a>
                    ) : (
                      <span className="text-xs text-gray-500">Link unavailable</span>
                    )}

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => router.push(`/dashboard/opportunities/${opp.id}`)}
                    >
                      View Details →
                    </Button>
                  </div>
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

      {/* Pagination Controls */}
      {pagination.total > 0 && (
        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              {/* Left: Info Text */}
              <div className="text-sm text-gray-400">
                Page <span className="text-white font-semibold">{currentPage}</span> of{' '}
                <span className="text-white font-semibold">{totalPages}</span>
                {' '}({pagination.total} total)
              </div>

              {/* Center: Page Numbers */}
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  icon={<ChevronLeftIcon className="h-4 w-4" />}
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>

                {/* Page Number Buttons */}
                <div className="flex gap-1">
                  {(() => {
                    const pages = [];
                    const maxButtons = 5;
                    let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
                    const endPage = Math.min(totalPages, startPage + maxButtons - 1);

                    if (endPage - startPage + 1 < maxButtons) {
                      startPage = Math.max(1, endPage - maxButtons + 1);
                    }

                    // Always show first page
                    if (startPage > 1) {
                      pages.push(
                        <button
                          key={1}
                          onClick={() => goToPage(1)}
                          className="px-2 py-1 rounded-lg text-sm text-gray-400 hover:bg-white/10 transition-colors"
                        >
                          1
                        </button>
                      );
                      if (startPage > 2) {
                        pages.push(
                          <span key="ellipsis-start" className="text-gray-400">
                            ...
                          </span>
                        );
                      }
                    }

                    // Show page range
                    for (let i = startPage; i <= endPage; i++) {
                      pages.push(
                        <button
                          key={i}
                          onClick={() => goToPage(i)}
                          className={`px-2 py-1 rounded-lg text-sm font-medium transition-all ${
                            currentPage === i
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                              : 'text-gray-400 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          {i}
                        </button>
                      );
                    }

                    // Always show last page
                    if (endPage < totalPages) {
                      if (endPage < totalPages - 1) {
                        pages.push(
                          <span key="ellipsis-end" className="text-gray-400">
                            ...
                          </span>
                        );
                      }
                      pages.push(
                        <button
                          key={totalPages}
                          onClick={() => goToPage(totalPages)}
                          className="px-2 py-1 rounded-lg text-sm text-gray-400 hover:bg-white/10 transition-colors"
                        >
                          {totalPages}
                        </button>
                      );
                    }

                    return pages;
                  })()}
                </div>

                <Button
                  size="sm"
                  variant="secondary"
                  icon={<ChevronRightIcon className="h-4 w-4" />}
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>

              {/* Right: Go to Page Input */}
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-400">Go to:</label>
                <input
                  type="number"
                  min="1"
                  max={totalPages}
                  defaultValue={currentPage}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      const page = parseInt((e.target as HTMLInputElement).value);
                      goToPage(page);
                    }
                  }}
                  className="w-12 px-2 py-1 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}