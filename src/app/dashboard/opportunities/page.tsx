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
  const [filterScoreMin, setFilterScoreMin] = useState<number>(0.0);
  const [filterScoreMax, setFilterScoreMax] = useState<number>(1.0);
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
    fetchOpportunities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize, sortBy, filterStatus, filterScoreMin, filterScoreMax, forceReloadKey]);

  // Reset to page 1 when filters change
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus, filterScoreMin, filterScoreMax]);

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

      // Add status filter if not "all"
      if (filterStatus !== 'all') {
        params.status = filterStatus;
      }

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
    } finally {
      setLoading(false);
    }
  };

  const handleForceReload = () => {
    setForceReloadKey(prev => prev + 1);
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

      // If pursuing and we have opportunity data, prompt to contact writer
      if (newStatus === OpportunityStatus.PURSUING && opportunity) {
        setSelectedOpportunity(opportunity);
        // Show toast/notification suggesting to book a writer
        setTimeout(() => {
          if (window.confirm('Would you like to contact a proposal writer for this opportunity?')) {
            router.push(`/dashboard/marketplace?opportunity_id=${opportunity.id}`);
          }
        }, 500);
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

  // Extract unique states from opportunities for location filter
  const uniqueStates = Array.from(
    new Set(
      opportunities
        .map(o => o.place_of_performance?.state)
        .filter((state): state is string => !!state)
    )
  ).sort();

  // Apply only client-side filters (search and location)
  // Status, score, and sort are handled server-side
  const filteredOpportunities = opportunities.filter(o => {
    const matchesSearch = searchQuery === '' ||
                         o.opportunity_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         o.agency.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLocation = filterLocation === 'all' ||
                           o.place_of_performance?.state === filterLocation;
    return matchesSearch && matchesLocation;
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
              {(filterStatus !== 'all' || filterScoreMin > 0 || filterScoreMax < 1) && (
                <p className="text-xs text-gray-500 mt-1">
                  Filters active: {filterStatus !== 'all' ? `Status: ${filterStatus}` : ''}
                  {(filterScoreMin > 0 || filterScoreMax < 1) ? ` Score: ${(filterScoreMin * 100).toFixed(0)}%-${(filterScoreMax * 100).toFixed(0)}%` : ''}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleForceReload}
                icon={<ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />}
                disabled={loading}
              >
                {loading ? 'Refreshing...' : 'Refresh'}
              </Button>
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
          </div>
        </CardBody>
      </Card>

      {/* Filters */}
      <Card>
        <CardBody>
          <div className="flex items-center gap-4 mb-4">
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
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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

            {/* NEW: Location Filter */}
            <Select
              value={filterLocation}
              onChange={(e) => setFilterLocation(e.target.value)}
              options={[
                { value: 'all', label: 'All Locations' },
                ...uniqueStates.map(state => ({ value: state, label: state }))
              ]}
            />

            <div className="space-y-2">
              <label className="block text-sm text-gray-400">
                Score Range: {(filterScoreMin * 100).toFixed(0)}% - {(filterScoreMax * 100).toFixed(0)}%
              </label>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 w-8">Min:</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={filterScoreMin * 100}
                    onChange={(e) => {
                      const newMin = parseInt(e.target.value) / 100;
                      if (newMin <= filterScoreMax) {
                        setFilterScoreMin(newMin);
                      }
                    }}
                    className="flex-1 accent-purple-500"
                  />
                  <span className="text-xs text-white w-10 text-right">{(filterScoreMin * 100).toFixed(0)}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 w-8">Max:</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={filterScoreMax * 100}
                    onChange={(e) => {
                      const newMax = parseInt(e.target.value) / 100;
                      if (newMax >= filterScoreMin) {
                        setFilterScoreMax(newMax);
                      }
                    }}
                    className="flex-1 accent-purple-500"
                  />
                  <span className="text-xs text-white w-10 text-right">{(filterScoreMax * 100).toFixed(0)}%</span>
                </div>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleForceReload}
                className="w-full mt-2"
              >
                Apply Filters
              </Button>
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
      <div className="space-y-4 stagger-fade-in" key={forceReloadKey}>
        {filteredOpportunities.length > 0 ? (
          filteredOpportunities.map((opp) => (
            <Card key={opp.id} hoverable>
              <CardBody>
                <div className="flex gap-4 items-start mb-4">
                  {/* Checkbox */}
                  <div className="mt-1">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(opp.id)}
                      onChange={() => toggleSelectOpportunity(opp.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-purple-500 focus:ring-2 focus:ring-purple-400 cursor-pointer"
                    />
                  </div>

                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h3
                        className="text-lg font-semibold text-white mb-2 hover:text-purple-400 cursor-pointer transition-colors"
                        onClick={() => router.push(`/dashboard/opportunities/${opp.id}`)}
                      >
                        {opp.opportunity_title}
                      </h3>
                      <div className="flex items-center gap-3">
                        {/* Status indicator */}
                        {opp.status === OpportunityStatus.SAVED && (
                          <Badge variant="warning" className="flex items-center gap-1">
                            <StarSolid className="h-3 w-3" />
                            Saved
                          </Badge>
                        )}
                        {opp.status === OpportunityStatus.PURSUING && (
                          <Badge variant="success" className="flex items-center gap-1">
                            <RocketLaunchIcon className="h-3 w-3" />
                            Pursuing
                          </Badge>
                        )}
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
                    <div className="flex items-center gap-4 text-sm text-gray-400 flex-wrap">
                      <span className="flex items-center">
                        <BuildingOfficeIcon className="h-4 w-4 mr-1" />
                        {opp.agency}
                      </span>
                      {getOpportunityLocation(opp) !== 'Location not specified' && (
                        <span className="flex items-center">
                          <MapPinIcon className="h-4 w-4 mr-1" />
                          {getOpportunityLocation(opp)}
                        </span>
                      )}
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
                        onClick={() => handleStatusChange(opp.id, OpportunityStatus.SAVED, opp)}
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
                    setFilterScoreMin(0.0);
                    setFilterScoreMax(1.0);
                    setFilterLocation('all');
                    handleForceReload();
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
          title="Find a Proposal Writer"
        >
          <div className="space-y-4">
            <p className="text-gray-300">
              You&apos;re pursuing: <strong>{selectedOpportunity.opportunity_title}</strong>
            </p>
            <p className="text-gray-400 text-sm">
              Browse our marketplace to find qualified proposal writers who can help you with this opportunity.
            </p>

            <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
              <h4 className="text-white font-semibold mb-2">Opportunity Details</h4>
              <ul className="text-sm text-gray-300 space-y-1">
                <li><strong>Agency:</strong> {selectedOpportunity.agency}</li>
                {selectedOpportunity.estimated_value && (
                  <li><strong>Value:</strong> {selectedOpportunity.estimated_value}</li>
                )}
                {selectedOpportunity.due_date && (
                  <li><strong>Due:</strong> {new Date(selectedOpportunity.due_date).toLocaleDateString()}</li>
                )}
              </ul>
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowWriterModal(false);
                  setSelectedOpportunity(null);
                }}
              >
                Cancel
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
              >
                Browse Writers
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}