'use client';
import { OpportunityStatus, OpportunityFilters } from '@/types/opportunity';
import { AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';

interface FilterProps {
  filters: OpportunityFilters;
  onFilterChange: (filters: OpportunityFilters) => void;
  agencies: string[];
}

export default function OpportunityFilterPanel({ filters, onFilterChange, agencies }: FilterProps) {
  const statusOptions = [
    { value: OpportunityStatus.NEW, label: 'New', color: 'bg-blue-500' },
    { value: OpportunityStatus.SAVED, label: 'Saved', color: 'bg-yellow-500' },
    { value: OpportunityStatus.PURSUING, label: 'Pursuing', color: 'bg-green-500' },
    { value: OpportunityStatus.APPLIED, label: 'Applied', color: 'bg-indigo-500' },
    { value: OpportunityStatus.PASSED, label: 'Passed', color: 'bg-gray-500' },
  ];

  const handleScoreChange = (min: number, max: number) => {
    onFilterChange({ ...filters, scoreMin: min, scoreMax: max });
  };

  const handleStatusChange = (status: OpportunityStatus | undefined) => {
    onFilterChange({ ...filters, status });
  };

  const handleAgencyChange = (agency: string | undefined) => {
    onFilterChange({ ...filters, agency });
  };

  const clearFilters = () => {
    onFilterChange({});
  };

  return (
    <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white flex items-center">
          <AdjustmentsHorizontalIcon className="h-5 w-5 mr-2" />
          Filters
        </h3>
        <button
          onClick={clearFilters}
          className="text-xs text-gray-400 hover:text-white transition-colors"
        >
          Clear all
        </button>
      </div>

      {/* Status Filter */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-3">Status</label>
        <div className="space-y-2">
          <button
            onClick={() => handleStatusChange(undefined)}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
              !filters.status 
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' 
                : 'text-gray-400 hover:bg-white/5'
            }`}
          >
            All Status
          </button>
          {statusOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleStatusChange(option.value)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center ${
                filters.status === option.value
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  : 'text-gray-400 hover:bg-white/5'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${option.color} mr-2`}></span>
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Score Filter */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-3">
          Match Score: {((filters.scoreMin || 0) * 100).toFixed(0)}% - {((filters.scoreMax || 1) * 100).toFixed(0)}%
        </label>
        <div className="space-y-3">
          <input
            type="range"
            min="0"
            max="100"
            value={(filters.scoreMin || 0) * 100}
            onChange={(e) => handleScoreChange(parseInt(e.target.value) / 100, filters.scoreMax || 1)}
            className="w-full accent-purple-500"
          />
          <input
            type="range"
            min="0"
            max="100"
            value={(filters.scoreMax || 1) * 100}
            onChange={(e) => handleScoreChange(filters.scoreMin || 0, parseInt(e.target.value) / 100)}
            className="w-full accent-purple-500"
          />
        </div>
      </div>

      {/* Agency Filter */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-3">Agency</label>
        <select
          value={filters.agency || ''}
          onChange={(e) => handleAgencyChange(e.target.value || undefined)}
          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
        >
          <option value="">All Agencies</option>
          {agencies.map((agency) => (
            <option key={agency} value={agency}>
              {agency}
            </option>
          ))}
        </select>
      </div>

      {/* Quick Filters */}
      <div className="border-t border-white/10 pt-4">
        <p className="text-xs text-gray-400 mb-3">Quick Filters</p>
        <div className="space-y-2">
          <button
            onClick={() => onFilterChange({ scoreMin: 0.8 })}
            className="w-full px-3 py-2 bg-green-500/20 text-green-400 rounded-lg text-sm hover:bg-green-500/30 transition-colors"
          >
            High Matches (80%+)
          </button>
          <button
            onClick={() => onFilterChange({ status: OpportunityStatus.SAVED })}
            className="w-full px-3 py-2 bg-yellow-500/20 text-yellow-400 rounded-lg text-sm hover:bg-yellow-500/30 transition-colors"
          >
            Saved Opportunities
          </button>
          <button
            onClick={() => onFilterChange({ dateFrom: new Date().toISOString().split('T')[0] })}
            className="w-full px-3 py-2 bg-blue-500/20 text-blue-400 rounded-lg text-sm hover:bg-blue-500/30 transition-colors"
          >
            Due This Week
          </button>
        </div>
      </div>
    </div>
  );
}
