'use client';
import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { Opportunity, OpportunityFilters, OpportunityStatus } from '@/types/opportunity';
import OpportunityCard from '@/components/opportunities/OpportunityCard';
import OpportunityFilterPanel from '@/components/opportunities/OpportunityFilters';
import OpportunityDetailModal from '@/components/opportunities/OpportunityDetailModal';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

export default function OpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [filteredOpportunities, setFilteredOpportunities] = useState<Opportunity[]>([]);
  const [filters, setFilters] = useState<OpportunityFilters>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [agencies, setAgencies] = useState<string[]>([]);

  useEffect(() => {
    fetchOpportunities();
  }, []);

  useEffect(() => {
    applyFiltersAndSearch();
  }, [opportunities, filters, searchQuery]);

  const fetchOpportunities = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/opportunities/mine?limit=100&score_min=0.5');
      const opps = response.data.opportunities || [];
      setOpportunities(opps);

      // Extract unique agencies
      const uniqueAgencies = [...new Set(opps.map((o: Opportunity) => o.agency))];
      // @ts-expect-error Lint is tripping off of the fact that unique agencies is unknown or whatever
      setAgencies(uniqueAgencies.sort());
    } catch (error) {
      console.error('Failed to fetch opportunities:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersAndSearch = () => {
    let filtered = [...opportunities];

    // Apply status filter
    if (filters.status) {
      filtered = filtered.filter(o => o.status === filters.status);
    }

    // Apply score filter
    if (filters.scoreMin !== undefined) {
      // @ts-expect-error Lint is tripping off the filters.scoreMax for some reason
      filtered = filtered.filter(o => o.match_score >= filters.scoreMin);
    }
    if (filters.scoreMax !== undefined) {
      // @ts-expect-error Lint is tripping off the filters.scoreMax for some reason
      filtered = filtered.filter(o => o.match_score <= filters.scoreMax);
    }

    // Apply agency filter
    if (filters.agency) {
      filtered = filtered.filter(o => o.agency === filters.agency);
    }

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(o => 
        o.opportunity_title.toLowerCase().includes(query) ||
        o.agency.toLowerCase().includes(query) ||
        o.reasoning.toLowerCase().includes(query)
      );
    }

    setFilteredOpportunities(filtered);
  };

  const handleStatusChange = async (id: string, status: OpportunityStatus) => {
    try {
      // Update locally first for better UX
      setOpportunities(prev => 
        prev.map(o => o.id === id ? { ...o, status } : o)
      );

      // Call API to persist
      await apiClient.put(`/opportunities/${id}/status`, { status });
    } catch (error) {
      console.error('Failed to update status:', error);
      // Revert on error
      fetchOpportunities();
    }
  };

  const handleViewDetails = (opportunity: Opportunity) => {
    setSelectedOpportunity(opportunity);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex gap-6">
      {/* Filters Sidebar */}
      <div className="w-80 flex-shrink-0">
        <OpportunityFilterPanel
          filters={filters}
          onFilterChange={setFilters}
          agencies={agencies}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search opportunities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 backdrop-blur"
            />
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-4 flex justify-between items-center">
          <p className="text-gray-400">
            Found <span className="text-white font-semibold">{filteredOpportunities.length}</span> opportunities
          </p>
          <select className="px-3 py-1.5 bg-white/10 border border-white/20 rounded-lg text-sm text-white focus:outline-none">
            <option>Sort by Score (High to Low)</option>
            <option>Sort by Due Date</option>
            <option>Sort by Value</option>
            <option>Sort by Date Added</option>
          </select>
        </div>

        {/* Opportunities List */}
        <div className="space-y-4">
          {filteredOpportunities.length > 0 ? (
            filteredOpportunities.map((opportunity) => (
              <OpportunityCard
                key={opportunity.id}
                opportunity={opportunity}
                onStatusChange={handleStatusChange}
                onViewDetails={handleViewDetails}
              />
            ))
          ) : (
            <div className="bg-white/5 backdrop-blur-lg rounded-xl p-12 border border-white/10 text-center">
              <p className="text-gray-400">No opportunities match your filters.</p>
              <button
                onClick={() => setFilters({})}
                className="mt-4 text-purple-400 hover:text-purple-300 transition-colors"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedOpportunity && (
        <OpportunityDetailModal
          opportunity={selectedOpportunity}
          onClose={() => setSelectedOpportunity(null)}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
}
