'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { getOpportunityLocation } from '@/lib/locationUtils';
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Button,
  Badge,
  LoadingSpinner,
} from '@/components/ui';
import {
  ArrowLeftIcon,
  ArrowTopRightOnSquareIcon,
  BuildingOfficeIcon,
  ClockIcon,
  StarIcon,
  RocketLaunchIcon,
  XMarkIcon,
  CheckCircleIcon,
  DocumentTextIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';

interface Opportunity {
  id: string;
  opportunity_id: string;
  opportunity_title: string;
  agency: string;
  description?: string;
  match_score: number;
  reasoning: string;
  status: string;
  due_date?: string;
  estimated_value?: string;
  matched_at: string;
  opportunity_url?: string;
  set_aside?: string;
  place_of_performance?: {
    country?: string | null;
    state?: string | null;
    city?: string | null;
    zip?: string | null;
  };
  location?: string;
}

export default function OpportunityDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const opportunityId = params.id as string;

  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOpportunityDetails();
  }, [opportunityId]);

  const fetchOpportunityDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      // Try to fetch from opportunities/mine with smaller limit first
      try {
        const response = await apiClient.get('/opportunities/mine', {
          params: {
            limit: 100,
            offset: 0,
            score_min: 0
          }
        });

        const opportunities = response.data.opportunities || [];
        const found = opportunities.find((opp: Opportunity) => opp.id === opportunityId);

        if (found) {
          setOpportunity(found);
          return;
        }
      } catch (err) {
        console.error('Error fetching opportunities:', err);
        setError('Failed to load opportunity');
      }

      // If not found, show error
      if (!opportunity) {
        setError('Opportunity not found');
      }
    } catch (error) {
      console.error('Failed to fetch opportunity details:', error);
      setError('Failed to load opportunity details');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!opportunity) return;

    try {
      setStatusUpdating(true);
      await apiClient.put(`/opportunities/${opportunity.id}/status`, { status: newStatus });

      // Update local state
      setOpportunity(prev => prev ? { ...prev, status: newStatus } : null);
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setStatusUpdating(false);
    }
  };

  const toExternal = (url?: string): string => {
    if (!url) return '';
    return url.startsWith('http') ? url : `https://${url}`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'from-green-400 to-emerald-500';
    if (score >= 0.6) return 'from-yellow-400 to-orange-500';
    return 'from-blue-400 to-indigo-500';
  };

  if (loading) {
    return <LoadingSpinner size="lg" />;
  }

  if (error || !opportunity) {
    return (
      <div className="space-y-6">
        <Card>
          <CardBody>
            <div className="text-center py-12">
              <DocumentTextIcon className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-white mb-2">Opportunity Not Found</h2>
              <p className="text-gray-400 mb-6">{error || 'The opportunity you\'re looking for could not be found.'}</p>
              <Button onClick={() => router.push('/dashboard/opportunities')}>
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back to Opportunities
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  const locationDisplay = getOpportunityLocation(opportunity);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back Button */}
      <div>
        <button
          onClick={() => router.push('/dashboard/opportunities')}
          className="flex items-center text-purple-400 hover:text-purple-300 transition-colors mb-4"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back to Opportunities
        </button>
      </div>

      {/* Header */}
      <Card className="bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-indigo-500/20">
        <CardBody>
          <div className="flex justify-between items-start gap-6">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white mb-3">
                {opportunity.opportunity_title}
              </h1>
              <div className="flex items-center gap-4 mb-4">
                <Badge variant="info">
                  {opportunity.status.charAt(0).toUpperCase() + opportunity.status.slice(1)}
                </Badge>
                {opportunity.set_aside && (
                  <Badge variant="success">{opportunity.set_aside}</Badge>
                )}
              </div>
              <div className="flex flex-wrap gap-6 text-gray-300">
                <div className="flex items-center">
                  <BuildingOfficeIcon className="h-5 w-5 mr-2 text-purple-400" />
                  <span>{opportunity.agency}</span>
                </div>
                {locationDisplay !== 'Location not specified' && (
                  <div className="flex items-center">
                    <MapPinIcon className="h-5 w-5 mr-2 text-purple-400" />
                    <span>{locationDisplay}</span>
                  </div>
                )}
                {opportunity.due_date && (
                  <div className="flex items-center">
                    <ClockIcon className="h-5 w-5 mr-2 text-purple-400" />
                    <span>Due: {new Date(opportunity.due_date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Match Score */}
            <div className="text-center">
              <div className={`w-24 h-24 rounded-full bg-gradient-to-r ${getScoreColor(opportunity.match_score)} flex items-center justify-center shadow-lg`}>
                <div className="text-center">
                  <div className="text-4xl font-bold text-white">
                    {Math.round(opportunity.match_score * 100)}%
                  </div>
                </div>
              </div>
              <p className="text-gray-400 text-sm mt-3">Match Score</p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Main Content Grid */}
      <div className="grid grid-cols-3 gap-6">
        {/* Left Column - Details (2/3 width) */}
        <div className="col-span-2 space-y-6">
          {/* AI Reasoning */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold text-white flex items-center">
                <CheckCircleIcon className="h-6 w-6 mr-2 text-green-400" />
                Why This is a Match
              </h2>
            </CardHeader>
            <CardBody>
              <p className="text-gray-300 leading-relaxed text-lg">
                {opportunity.reasoning || 'No reasoning available for this match.'}
              </p>
            </CardBody>
          </Card>

          {/* Opportunity Description */}
          {opportunity.description && (
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold text-white">Description</h2>
              </CardHeader>
              <CardBody>
                <div className="text-gray-300 leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto">
                  {opportunity.description}
                </div>
              </CardBody>
            </Card>
          )}

          {/* Key Details */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold text-white">Key Details</h2>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-6">
                  {opportunity.estimated_value && (
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Estimated Value Range</p>
                      <p className="text-lg text-white font-semibold">
                        {opportunity.estimated_value}
                      </p>
                    </div>
                  )}

                  {opportunity.due_date && (
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Due Date</p>
                      <p className="text-lg text-white font-semibold">
                        {new Date(opportunity.due_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {Math.ceil((new Date(opportunity.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days remaining
                      </p>
                    </div>
                  )}
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  {opportunity.matched_at && (
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Matched On</p>
                      <p className="text-lg text-white font-semibold">
                        {new Date(opportunity.matched_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(opportunity.matched_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  )}

                  {opportunity.set_aside && (
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Set-Aside Type</p>
                      <Badge variant="success">{opportunity.set_aside}</Badge>
                    </div>
                  )}
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Location Details - NEW */}
          {opportunity.place_of_performance && (
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold text-white flex items-center">
                  <MapPinIcon className="h-5 w-5 mr-2" />
                  Place of Performance
                </h2>
              </CardHeader>
              <CardBody>
                <div className="grid grid-cols-2 gap-4">
                  {opportunity.place_of_performance.city && (
                    <div>
                      <p className="text-sm text-gray-400 mb-1">City</p>
                      <p className="text-white font-semibold">{opportunity.place_of_performance.city}</p>
                    </div>
                  )}
                  {opportunity.place_of_performance.state && (
                    <div>
                      <p className="text-sm text-gray-400 mb-1">State</p>
                      <p className="text-white font-semibold">{opportunity.place_of_performance.state}</p>
                    </div>
                  )}
                  {opportunity.place_of_performance.zip && (
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Zip Code</p>
                      <p className="text-white font-semibold">{opportunity.place_of_performance.zip}</p>
                    </div>
                  )}
                  {opportunity.place_of_performance.country && (
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Country</p>
                      <p className="text-white font-semibold">{opportunity.place_of_performance.country}</p>
                    </div>
                  )}
                </div>
                {!opportunity.place_of_performance.city && !opportunity.place_of_performance.state && !opportunity.place_of_performance.zip && (
                  <p className="text-gray-400 italic">Location information not available</p>
                )}
              </CardBody>
            </Card>
          )}

          {/* Opportunity Identifiers */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold text-white">Opportunity Identifiers</h2>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                {opportunity.opportunity_id && (
                  <div className="p-3 bg-white/5 rounded-lg">
                    <p className="text-xs text-gray-400 mb-1">Opportunity ID</p>
                    <p className="text-white font-mono text-sm break-all">{opportunity.opportunity_id}</p>
                  </div>
                )}

                {opportunity.id && (
                  <div className="p-3 bg-white/5 rounded-lg">
                    <p className="text-xs text-gray-400 mb-1">Internal Match ID</p>
                    <p className="text-white font-mono text-sm">{opportunity.id}</p>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Right Column - Actions (1/3 width) */}
        <div className="space-y-6">
          {/* Status Actions */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-white">Your Interest</h2>
            </CardHeader>
            <CardBody className="space-y-3">
              {opportunity.status !== 'saved' && (
                <Button
                  onClick={() => handleStatusChange('saved')}
                  isLoading={statusUpdating}
                >
                  <StarIcon className="h-4 w-4 mr-2" />
                  Save
                </Button>
              )}

              {opportunity.status !== 'pursuing' && (
                <Button
                  onClick={() => handleStatusChange('pursuing')}
                  isLoading={statusUpdating}
                >
                  <RocketLaunchIcon className="h-4 w-4 mr-2" />
                  Pursue
                </Button>
              )}

              {opportunity.status !== 'passed' && (
                <Button
                  onClick={() => handleStatusChange('passed')}
                  isLoading={statusUpdating}
                >
                  <XMarkIcon className="h-4 w-4 mr-2" />
                  Pass
                </Button>
              )}
            </CardBody>
          </Card>

          {/* Opportunity Link */}
          {opportunity.opportunity_url && (
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-white">View Official Posting</h2>
              </CardHeader>
              <CardBody>
                <a
                  href={toExternal(opportunity.opportunity_url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center px-4 py-3 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors font-medium"
                >
                  <ArrowTopRightOnSquareIcon className="h-5 w-5 mr-2" />
                  Open on External
                </a>
              </CardBody>
            </Card>
          )}

          {/* Match Info Card */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-white">Match Information</h2>
            </CardHeader>
            <CardBody className="space-y-3">
              <div>
                <p className="text-xs text-gray-400 mb-1">Match Score</p>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-purple-400 to-blue-400 h-2 rounded-full"
                    style={{ width: `${opportunity.match_score * 100}%` }}
                  />
                </div>
                <p className="text-sm text-white font-semibold mt-2">
                  {Math.round(opportunity.match_score * 100)}% Match
                </p>
              </div>

              <div className="pt-3 border-t border-white/10">
                <p className="text-xs text-gray-400">This opportunity matched your profile because:</p>
                <ul className="mt-2 space-y-1 text-xs text-gray-300">
                  <li>✓ Your NAICS codes align with this opportunity</li>
                  <li>✓ Your capabilities match the requirements</li>
                  <li>✓ Contract value is within your range</li>
                </ul>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Agency Info */}
      {opportunity.agency && (
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-white">Contracting Agency</h2>
          </CardHeader>
          <CardBody>
            <div>
              <p className="text-sm text-gray-400 mb-2 flex items-center">
                <BuildingOfficeIcon className="h-4 w-4 mr-2" />
                Agency Name
              </p>
              <p className="text-lg text-white font-semibold">{opportunity.agency}</p>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Footer Actions */}
      <Card>
        <CardFooter>
          <div className="flex gap-3 w-full">
            <Button
              onClick={() => router.push('/dashboard/opportunities')}
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to List
            </Button>
            {opportunity.opportunity_url && (
              <Button
                onClick={() => window.open(toExternal(opportunity.opportunity_url), '_blank')}
              >
                <ArrowTopRightOnSquareIcon className="h-4 w-4 mr-2" />
                View on SAM.gov
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}