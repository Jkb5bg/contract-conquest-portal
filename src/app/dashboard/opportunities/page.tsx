'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { Opportunity, OpportunityStatus } from '@/types/opportunity';
import { getOpportunityLocation } from '@/lib/locationUtils';
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
  Modal,
  Alert,
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
  MapPinIcon,
  TrashIcon,
  UsersIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';

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
  // Applied filters (used in API calls)
  const [filterScoreMin, setFilterScoreMin] = useState<number>(0.0);
  const [filterScoreMax, setFilterScoreMax] = useState<number>(1.0);
  // Pending filters (adjusted by user but not applied yet)
  const [pendingScoreMin, setPendingScoreMin] = useState<number>(0.0);
  const [pendingScoreMax, setPendingScoreMax] = useState<number>(1.0);
  const [filterLocation, setFilterLocation] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('score');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [forceReloadKey, setForceReloadKey] = useState<number>(0);

  // Mass delete state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Writer booking state
  const [showWriterModal, setShowWriterModal] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    limit: 10,
    offset: 0,
  });

  useEffect(() => {
    // Debounce search to avoid too many API calls
    const timeoutId = setTimeout(() => {
      fetchOpportunities();
    }, searchQuery ? 500 : 0); // 500ms debounce for search, immediate for other filters

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize, sortBy, searchQuery, filterLocation, filterStatus, filterScoreMin, filterScoreMax, forceReloadKey]);

  // Reset to page 1 when filters change (but not on initial mount)
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, filterLocation, filterStatus, filterScoreMin, filterScoreMax]);

  const fetchOpportunities = async () => {
    try {
      setLoading(true);
      const offset = (currentPage - 1) * pageSize;

      const params: Record<string, string | number> = {
        limit: pageSize,
        offset: offset,
        score_min: filterScoreMin,
        score_max: filterScoreMax,
      };

      // Add search parameter (server-side search across ALL opportunities)
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      // Add location filter (server-side filter across ALL opportunities)
      if (filterLocation !== 'all') {
        params.state = filterLocation;
      }

      // Status filter temporarily disabled - uncomment when backend adds status column
      // if (filterStatus !== 'all') {
      //   params.status = filterStatus;
      // }

      // Add sort parameter
      if (sortBy === 'score') {
        params.sort_by = 'match_score';
        params.sort_order = 'desc';
      } else if (sortBy === 'date') {
        params.sort_by = 'matched_at';
        params.sort_order = 'desc';
      }

      console.log('Fetching opportunities with params:', params);

      const response = await apiClient.get('/opportunities/mine', { params });

      const fetchedOpportunities = response.data.opportunities || [];
      const totalCount = response.data.total || 0;

      console.log(`Fetched ${fetchedOpportunities.length} opportunities, total: ${totalCount}`);

      setOpportunities(fetchedOpportunities);
      setPagination({
        total: totalCount,
        limit: response.data.limit || pageSize,
        offset: response.data.offset || offset,
      });
      // Clear selections when page changes
      setSelectedIds(new Set());
    } catch (error) {
      console.error('Failed to fetch opportunities:', error);
      // Show user-friendly error message
      if (error instanceof Error) {
        alert(`Failed to load opportunities: ${error.message}\n\nPlease check BACKEND_MIGRATION_NEEDED.md for required database migration.`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = () => {
    // Apply pending score filters and force reload
    setFilterScoreMin(pendingScoreMin);
    setFilterScoreMax(pendingScoreMax);
    // Reset to page 1 when applying filters
    setCurrentPage(1);
    // Force reload to get fresh data
    setForceReloadKey(prev => prev + 1);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    // setFilterStatus('all'); // Disabled until backend adds status column
    setPendingScoreMin(0.0);
    setPendingScoreMax(1.0);
    setFilterScoreMin(0.0);
    setFilterScoreMax(1.0);
    setFilterLocation('all');
    setCurrentPage(1);
  };

  const toExternal = (url?: string): string => {
    if (!url) return '';
    return url.startsWith('http') ? url : `https://${url}`;
  };

  const handleStatusChange = async (id: string, newStatus: OpportunityStatus, opportunity?: Opportunity) => {
    try {
      // Optimistically update UI immediately
      setOpportunities(prev =>
        prev.map(o => o.id === id ? { ...o, status: newStatus } : o)
      );

      // For "passed" status, also remove from list
      if (newStatus === OpportunityStatus.PASSED) {
        setTimeout(() => {
          setOpportunities(prev => prev.filter(o => o.id !== id));
          setPagination(prev => ({ ...prev, total: Math.max(0, prev.total - 1) }));
        }, 300);
      }

      // Make API call
      await apiClient.put(`/opportunities/${id}/status`, { status: newStatus });

      // If pursuing and we have opportunity data, show writer modal immediately
      if (newStatus === OpportunityStatus.PURSUING && opportunity) {
        setSelectedOpportunity(opportunity);
        setShowWriterModal(true);
      }

      console.log(`Opportunity ${id} status changed to ${newStatus}`);
    } catch (error) {
      console.error('Failed to update status:', error);
      fetchOpportunities();
    }
  };

  const toggleSelectOpportunity = (id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredOpportunities.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredOpportunities.map(o => o.id)));
    }
  };

  const handleMassDelete = async () => {
    if (selectedIds.size === 0) return;

    setIsDeleting(true);
    try {
      // Delete all selected opportunities
      await Promise.all(
        Array.from(selectedIds).map(id =>
          apiClient.delete(`/opportunities/${id}`)
        )
      );

      // Refresh the list
      await fetchOpportunities();
      setShowDeleteModal(false);
      setSelectedIds(new Set());
    } catch (error) {
      console.error('Failed to delete opportunities:', error);
      alert('Failed to delete some opportunities. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePursueWithWriter = (opportunity: Opportunity) => {
    setSelectedOpportunity(opportunity);
    setShowWriterModal(true);
  };

  // Extract unique states from opportunities for location filter dropdown
  // Note: This only shows states from the first page of results
  // Once backend implements location filtering, all unique states will be available
  const uniqueStates = Array.from(
    new Set(
      opportunities
        .map(o => o.place_of_performance?.state)
        .filter((state): state is string => !!state)
    )
  ).sort();

  // All filtering is now done server-side
  // The opportunities array already contains the filtered results
  const filteredOpportunities = opportunities;

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
                {pagination.total > 0 ? (
                  <>Showing {startItem}-{endItem} of <strong className="text-white">{pagination.total}</strong> total opportunities</>
                ) : (
                  <>No opportunities found matching your filters</>
                )}
              </p>
              {selectedIds.size > 0 && (
                <p className="text-purple-400 mt-1">
                  {selectedIds.size} selected
                </p>
              )}
              {(searchQuery || filterStatus !== 'all' || filterLocation !== 'all' || filterScoreMin > 0 || filterScoreMax < 1) && (
                <p className="text-xs text-gray-500 mt-1">
                  Active filters:
                  {searchQuery && ` Search: "${searchQuery}"`}
                  {filterStatus !== 'all' && ` | Status: ${filterStatus}`}
                  {filterLocation !== 'all' && ` | Location: ${filterLocation}`}
                  {(filterScoreMin > 0 || filterScoreMax < 1) && ` | Score: ${(filterScoreMin * 100).toFixed(0)}%-${(filterScoreMax * 100).toFixed(0)}%`}
                </p>
              )}
            </div>
            {selectedIds.size > 0 && (
              <Button
                variant="danger"
                size="sm"
                onClick={() => setShowDeleteModal(true)}
                icon={<TrashIcon className="h-4 w-4" />}
              >
                Delete ({selectedIds.size})
              </Button>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Filters */}
      <Card>
        <CardBody>
          <div className="space-y-4">
            {/* Top Row: Search, Status, Location, Sort */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Input
                placeholder="Search all opportunities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={<MagnifyingGlassIcon className="h-5 w-5" />}
              />

              <Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                options={[
                  { value: 'all', label: 'All Status' },
                  { value: OpportunityStatus.NEW, label: '🆕 New' },
                  { value: OpportunityStatus.SAVED, label: '⭐ Saved' },
                  { value: OpportunityStatus.PURSUING, label: '🚀 Pursuing' },
                  { value: OpportunityStatus.APPLIED, label: '✓ Applied' },
                  { value: OpportunityStatus.PASSED, label: '✗ Passed' },
                ]}
              />

              <Select
                value={filterLocation}
                onChange={(e) => setFilterLocation(e.target.value)}
                options={[
                  { value: 'all', label: 'All Locations' },
                  ...uniqueStates.map(state => ({ value: state, label: state }))
                ]}
              />

              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                options={[
                  { value: 'score', label: 'Sort by Score' },
                  { value: 'date', label: 'Sort by Date' },
                ]}
              />
            </div>

            {/* Score Range Filter with Apply Button */}
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <div className="flex items-end gap-4">
                <div className="flex-1 space-y-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Match Score Range: {(pendingScoreMin * 100).toFixed(0)}% - {(pendingScoreMax * 100).toFixed(0)}%
                  </label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-400 w-10">Min:</span>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={pendingScoreMin * 100}
                        onChange={(e) => {
                          const newMin = parseInt(e.target.value) / 100;
                          if (newMin <= pendingScoreMax) {
                            setPendingScoreMin(newMin);
                          }
                        }}
                        className="flex-1 accent-purple-500"
                      />
                      <span className="text-xs text-white w-12 text-right font-medium">{(pendingScoreMin * 100).toFixed(0)}%</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-400 w-10">Max:</span>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={pendingScoreMax * 100}
                        onChange={(e) => {
                          const newMax = parseInt(e.target.value) / 100;
                          if (newMax >= pendingScoreMin) {
                            setPendingScoreMax(newMax);
                          }
                        }}
                        className="flex-1 accent-purple-500"
                      />
                      <span className="text-xs text-white w-12 text-right font-medium">{(pendingScoreMax * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="primary"
                    onClick={handleApplyFilters}
                    icon={<ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />}
                    disabled={loading}
                  >
                    Apply Filters
                  </Button>
                  {(searchQuery || filterStatus !== 'all' || filterLocation !== 'all' || pendingScoreMin > 0 || pendingScoreMax < 1) && (
                    <Button
                      variant="secondary"
                      onClick={handleClearFilters}
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Select All Checkbox */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={filteredOpportunities.length > 0 && selectedIds.size === filteredOpportunities.length}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-purple-500 focus:ring-2 focus:ring-purple-400"
                />
                Select All ({filteredOpportunities.length})
              </label>
            </div>
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
      <div className="space-y-4 stagger-fade-in" key={forceReloadKey}>
        {filteredOpportunities.length > 0 ? (
          filteredOpportunities.map((opp) => (
            <Card key={opp.id} hoverable>
              <CardBody>
                <div className="flex gap-3 sm:gap-4 items-start mb-4">
                  {/* Checkbox */}
                  <div className="mt-1 flex-shrink-0">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(opp.id)}
                      onChange={() => toggleSelectOpportunity(opp.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-4 h-4 sm:w-5 sm:h-5 rounded border-gray-600 bg-gray-700 text-purple-500 focus:ring-2 focus:ring-purple-400 cursor-pointer"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-4 mb-3">
                      <h3
                        className="text-base sm:text-lg font-semibold text-white hover:text-purple-400 cursor-pointer transition-colors break-words"
                        onClick={() => router.push(`/dashboard/opportunities/${opp.id}`)}
                      >
                        {opp.opportunity_title}
                      </h3>
                      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                        {/* Status indicator */}
                        {opp.status === OpportunityStatus.SAVED && (
                          <Badge variant="warning" className="flex items-center gap-1 text-xs">
                            <StarSolid className="h-3 w-3" />
                            Saved
                          </Badge>
                        )}
                        {opp.status === OpportunityStatus.PURSUING && (
                          <Badge variant="success" className="flex items-center gap-1 text-xs">
                            <RocketLaunchIcon className="h-3 w-3" />
                            Pursuing
                          </Badge>
                        )}
                        <div className="text-right">
                          <div className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-gradient-to-r ${
                            opp.match_score >= 0.8 ? 'from-green-400 to-emerald-500' :
                            opp.match_score >= 0.6 ? 'from-yellow-400 to-orange-500' :
                            'from-blue-400 to-indigo-500'
                          } text-white font-bold text-base sm:text-lg`}>
                            {(opp.match_score * 100).toFixed(0)}%
                          </div>
                          <p className="text-xs text-gray-400 mt-1 hidden sm:block">{getScoreBadge(opp.match_score)} Match</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-400">
                      <span className="flex items-center">
                        <BuildingOfficeIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
                        <span className="truncate">{opp.agency}</span>
                      </span>
                      {getOpportunityLocation(opp) !== 'Location not specified' && (
                        <span className="flex items-center">
                          <MapPinIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
                          {getOpportunityLocation(opp)}
                        </span>
                      )}
                      {opp.due_date && (
                        <span className="flex items-center">
                          <ClockIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
                          {new Date(opp.due_date).toLocaleDateString()}
                        </span>
                      )}
                      {opp.estimated_value && (
                        <span className="flex items-center">
                          <CurrencyDollarIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
                          {opp.estimated_value}
                        </span>
                      )}
                    </div>
                  </div>
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
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 w-full">
                  <div className="flex flex-wrap gap-2">
                    {opp.status !== OpportunityStatus.SAVED && (
                      <Button
                        size="sm"
                        variant="warning"
                        icon={<StarIcon className="h-4 w-4" />}
                        onClick={() => handleStatusChange(opp.id, OpportunityStatus.SAVED, opp)}
                        className="flex-1 sm:flex-none"
                      >
                        Save
                      </Button>
                    )}
                    {opp.status !== OpportunityStatus.PURSUING && (
                      <Button
                        size="sm"
                        variant="success"
                        icon={<RocketLaunchIcon className="h-4 w-4" />}
                        onClick={() => handleStatusChange(opp.id, OpportunityStatus.PURSUING, opp)}
                        className="flex-1 sm:flex-none"
                      >
                        Pursue
                      </Button>
                    )}
                    {opp.status === OpportunityStatus.PURSUING && (
                      <Button
                        size="sm"
                        variant="primary"
                        icon={<UsersIcon className="h-4 w-4" />}
                        onClick={() => handlePursueWithWriter(opp)}
                        className="flex-1 sm:flex-none"
                      >
                        Find Writer
                      </Button>
                    )}
                    {opp.status !== OpportunityStatus.PASSED && (
                      <Button
                        size="sm"
                        variant="ghost"
                        icon={<XMarkIcon className="h-4 w-4" />}
                        onClick={() => handleStatusChange(opp.id, OpportunityStatus.PASSED, opp)}
                        className="flex-1 sm:flex-none"
                      >
                        Pass
                      </Button>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                    {opp.opportunity_url ? (
                      <a
                        href={toExternal(opp.opportunity_url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center px-3 sm:px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors text-sm"
                      >
                        <ArrowTopRightOnSquareIcon className="h-4 w-4 mr-2" />
                        See Opportunity
                      </a>
                    ) : (
                      <span className="text-xs text-gray-500 text-center sm:text-left">Link unavailable</span>
                    )}

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => router.push(`/dashboard/opportunities/${opp.id}`)}
                      className="w-full sm:w-auto"
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
                  <Button variant="primary" onClick={handleClearFilters}>
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
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
              {/* Left: Info Text */}
              <div className="text-xs sm:text-sm text-gray-400 text-center lg:text-left">
                Page <span className="text-white font-semibold">{currentPage}</span> of{' '}
                <span className="text-white font-semibold">{totalPages}</span>
                {' '}({pagination.total} total)
              </div>

              {/* Center: Page Numbers */}
              <div className="flex items-center justify-center gap-2 overflow-x-auto pb-2 lg:pb-0">
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

              {/* Right: Go to Page Input - Hidden on mobile */}
              <div className="hidden lg:flex items-center gap-2 flex-shrink-0">
                <label className="text-sm text-gray-400 whitespace-nowrap">Go to:</label>
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
                  className="w-16 px-2 py-1 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <Modal
          isOpen
          onClose={() => setShowDeleteModal(false)}
          title="Delete Opportunities"
        >
          <div className="space-y-4">
            <p className="text-gray-300">
              Are you sure you want to delete {selectedIds.size} selected {selectedIds.size === 1 ? 'opportunity' : 'opportunities'}? This action cannot be undone.
            </p>

            <div className="flex gap-3 justify-end pt-4">
              <Button
                variant="secondary"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleMassDelete}
                isLoading={isDeleting}
                icon={<TrashIcon className="h-4 w-4" />}
              >
                Delete {selectedIds.size} {selectedIds.size === 1 ? 'Opportunity' : 'Opportunities'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Writer Booking Modal - Redirect to marketplace with opportunity context */}
      {showWriterModal && selectedOpportunity && (
        <Modal
          isOpen
          onClose={() => {
            setShowWriterModal(false);
            setSelectedOpportunity(null);
          }}
          title="🚀 Find a Proposal Writer"
        >
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-lg p-4">
              <p className="text-white font-medium mb-2">
                Great! You&apos;re pursuing this opportunity:
              </p>
              <p className="text-lg text-white font-semibold">
                {selectedOpportunity.opportunity_title}
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                <DocumentTextIcon className="h-5 w-5 text-purple-400" />
                Opportunity Details (Will be shared with writers)
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Agency:</span>
                  <span className="text-white font-medium">{selectedOpportunity.agency}</span>
                </div>
                {selectedOpportunity.estimated_value && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Value:</span>
                    <span className="text-white font-medium">{selectedOpportunity.estimated_value}</span>
                  </div>
                )}
                {selectedOpportunity.due_date && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Due Date:</span>
                    <span className="text-white font-medium">{new Date(selectedOpportunity.due_date).toLocaleDateString()}</span>
                  </div>
                )}
                {selectedOpportunity.naics_code && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">NAICS Code:</span>
                    <span className="text-white font-medium">{selectedOpportunity.naics_code}</span>
                  </div>
                )}
                {getOpportunityLocation(selectedOpportunity) !== 'Location not specified' && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Location:</span>
                    <span className="text-white font-medium">{getOpportunityLocation(selectedOpportunity)}</span>
                  </div>
                )}
              </div>
            </div>

            <Alert
              type="info"
              message="💡 When you contact a writer, all opportunity details (including description, requirements, and links) will be automatically shared with them so they can provide an accurate quote."
            />

            <div className="flex gap-3 justify-end pt-4">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowWriterModal(false);
                  setSelectedOpportunity(null);
                }}
              >
                Not Now
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  setShowWriterModal(false);
                  setSelectedOpportunity(null);
                  // Store comprehensive opportunity context for marketplace
                  sessionStorage.setItem('opportunityContext', JSON.stringify({
                    id: selectedOpportunity.id,
                    opportunity_id: selectedOpportunity.opportunity_id,
                    title: selectedOpportunity.opportunity_title,
                    description: selectedOpportunity.description || selectedOpportunity.reasoning,
                    agency: selectedOpportunity.agency,
                    estimated_value: selectedOpportunity.estimated_value,
                    due_date: selectedOpportunity.due_date,
                    naics_code: selectedOpportunity.naics_code,
                    set_aside: selectedOpportunity.set_aside,
                    opportunity_url: selectedOpportunity.opportunity_url,
                    location: getOpportunityLocation(selectedOpportunity),
                  }));
                  router.push('/dashboard/marketplace');
                }}
                icon={<UsersIcon className="h-4 w-4" />}
              >
                Find Writers
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}