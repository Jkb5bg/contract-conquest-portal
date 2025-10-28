'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Input,
  Select,
  Badge,
  LoadingSpinner,
  EmptyState,
  Alert,
} from '@/components/ui';
import { getMarketplaceWriters, getAvailableSpecializations } from '@/lib/marketplaceApi';
import { ProposalWriterPublicProfile, MarketplaceFilters } from '@/types/marketplace';
import {
  MagnifyingGlassIcon,
  StarIcon,
  CheckBadgeIcon,
  MapPinIcon,
  ClockIcon,
  BriefcaseIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';

export default function MarketplacePage() {
  const [writers, setWriters] = useState<ProposalWriterPublicProfile[]>([]);
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Filter states
  const [filters, setFilters] = useState<MarketplaceFilters>({
    limit: 50,
    offset: 0,
    specialization: null,
    min_rating: null,
    max_price: null,
    availability: null,
    naics_code: null,
    featured_only: false,
  });

  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [writersData, specializationsData] = await Promise.all([
        getMarketplaceWriters(filters),
        getAvailableSpecializations(),
      ]);

      // Ensure data is always an array
      setWriters(Array.isArray(writersData) ? writersData : []);
      setSpecializations(Array.isArray(specializationsData) ? specializationsData : []);
    } catch (err: unknown) {
      // @ts-expect-error Accessing response property on unknown error type
      setError(err.response?.data?.detail || 'Failed to load marketplace data');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredWriters = writers.filter((writer) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      writer.full_name.toLowerCase().includes(query) ||
      writer.company_name?.toLowerCase().includes(query) ||
      writer.bio?.toLowerCase().includes(query) ||
      (Array.isArray(writer.specializations) && writer.specializations.some((s) => s.toLowerCase().includes(query)))
    );
  });

  const handleFilterChange = (key: keyof MarketplaceFilters, value: string | number | boolean | null) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value === '' || value === 'all' ? null : value,
    }));
  };

  const clearFilters = () => {
    setFilters({
      limit: 50,
      offset: 0,
      specialization: null,
      min_rating: null,
      max_price: null,
      availability: null,
      naics_code: null,
      featured_only: false,
    });
    setSearchQuery('');
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star}>
            {star <= Math.round(rating) ? (
              <StarSolidIcon className="w-4 h-4 text-yellow-400" />
            ) : (
              <StarIcon className="w-4 h-4 text-gray-400" />
            )}
          </span>
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Proposal Writer Marketplace</h1>
          <p className="mt-2 text-gray-400">
            Find experienced proposal writers to help you win contracts
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={() => setShowFilters(!showFilters)}
          leftIcon={<FunnelIcon className="w-5 h-5" />}
        >
          {showFilters ? 'Hide' : 'Show'} Filters
        </Button>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

      {/* Search Bar */}
      <Card>
        <CardBody>
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by name, company, or expertise..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardBody>
      </Card>

      {/* Filters Panel */}
      {showFilters && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-white">Filters</h3>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Specialization
                </label>
                <Select
                  value={filters.specialization || 'all'}
                  onChange={(e) => handleFilterChange('specialization', e.target.value)}
                >
                  <option value="all">All Specializations</option>
                  {specializations.map((spec) => (
                    <option key={spec} value={spec}>
                      {spec}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Minimum Rating
                </label>
                <Select
                  value={filters.min_rating || 'all'}
                  onChange={(e) =>
                    handleFilterChange(
                      'min_rating',
                      e.target.value === 'all' ? null : Number(e.target.value)
                    )
                  }
                >
                  <option value="all">Any Rating</option>
                  <option value="4">4+ Stars</option>
                  <option value="3">3+ Stars</option>
                  <option value="2">2+ Stars</option>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Availability
                </label>
                <Select
                  value={filters.availability || 'all'}
                  onChange={(e) => handleFilterChange('availability', e.target.value)}
                >
                  <option value="all">All</option>
                  <option value="available">Available Now</option>
                  <option value="limited">Limited Availability</option>
                </Select>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={filters.featured_only || false}
                  onChange={(e) => handleFilterChange('featured_only', e.target.checked)}
                  className="rounded border-gray-600 bg-gray-700 text-primary-500"
                />
                Featured Writers Only
              </label>

              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Results Count */}
      <div className="text-sm text-gray-400">
        Showing {filteredWriters.length} writer{filteredWriters.length !== 1 ? 's' : ''}
      </div>

      {/* Writers Grid */}
      {filteredWriters.length === 0 ? (
        <EmptyState
          icon={<BriefcaseIcon className="w-12 h-12" />}
          title="No writers found"
          description="Try adjusting your search or filters"
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredWriters.map((writer) => (
            <Card key={writer.writer_id} hover className="h-full">
              <CardBody className="space-y-4">
                {/* Writer Header */}
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    {writer.profile_photo_url ? (
                      <Image
                        src={writer.profile_photo_url}
                        alt={writer.full_name}
                        width={64}
                        height={64}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white text-2xl font-bold">
                        {writer.full_name.charAt(0)}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-white truncate">
                        {writer.full_name}
                      </h3>
                      {writer.is_verified && (
                        <CheckBadgeIcon className="w-5 h-5 text-blue-400" title="Verified" />
                      )}
                      {writer.is_featured && (
                        <Badge variant="warning" size="sm">
                          Featured
                        </Badge>
                      )}
                    </div>

                    {writer.company_name && (
                      <p className="text-sm text-gray-400">{writer.company_name}</p>
                    )}

                    {writer.headline && (
                      <p className="text-sm text-gray-300 mt-1">{writer.headline}</p>
                    )}
                  </div>
                </div>

                {/* Rating & Stats */}
                <div className="flex items-center gap-4 text-sm">
                  {writer.average_rating && (
                    <div className="flex items-center gap-1">
                      {renderStars(writer.average_rating)}
                      <span className="ml-1 text-gray-400">
                        ({writer.total_reviews})
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-1 text-gray-400">
                    <BriefcaseIcon className="w-4 h-4" />
                    {writer.total_bookings} bookings
                  </div>
                </div>

                {/* Bio */}
                {writer.bio && (
                  <p className="text-sm text-gray-300 line-clamp-3">{writer.bio}</p>
                )}

                {/* Specializations */}
                {Array.isArray(writer.specializations) && writer.specializations.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {writer.specializations.slice(0, 3).map((spec) => (
                      <Badge key={spec} variant="primary" size="sm">
                        {spec}
                      </Badge>
                    ))}
                    {writer.specializations.length > 3 && (
                      <Badge variant="secondary" size="sm">
                        +{writer.specializations.length - 3} more
                      </Badge>
                    )}
                  </div>
                )}

                {/* Details */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2 text-gray-400">
                    <ClockIcon className="w-4 h-4" />
                    <span>Responds in {writer.response_time_hours}h</span>
                  </div>

                  <div className="flex items-center gap-2 text-gray-400">
                    <MapPinIcon className="w-4 h-4" />
                    <span className="truncate">
                      {Array.isArray(writer.service_locations) && writer.service_locations.length > 0
                        ? writer.service_locations[0]
                        : 'Remote'}
                    </span>
                  </div>
                </div>

                {/* Pricing */}
                {writer.price_range_display && (
                  <div className="text-sm">
                    <span className="text-gray-400">Pricing: </span>
                    <span className="text-white font-medium">{writer.price_range_display}</span>
                  </div>
                )}

                {/* Availability */}
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      writer.availability_status === 'available'
                        ? 'bg-green-400'
                        : writer.availability_status === 'limited'
                        ? 'bg-yellow-400'
                        : 'bg-red-400'
                    }`}
                  />
                  <span className="text-sm text-gray-400 capitalize">
                    {writer.availability_status}
                  </span>
                  {writer.accepts_rush_projects && (
                    <Badge variant="info" size="sm">
                      Rush Available
                    </Badge>
                  )}
                </div>

                {/* View Profile Button */}
                <Link href={`/dashboard/marketplace/${writer.writer_id}`}>
                  <Button variant="primary" fullWidth>
                    View Full Profile
                  </Button>
                </Link>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
