'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Opportunity, OpportunityStatus } from '@/types/opportunity';
import { getOpportunityLocation } from '@/lib/locationUtils';
import {
  ClockIcon,
  BuildingOfficeIcon,
  CurrencyDollarIcon,
  RocketLaunchIcon,
  XMarkIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  TagIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';

interface OpportunityCardProps {
  opportunity: Opportunity;
  onStatusChange: (id: string, status: OpportunityStatus) => void;
  onViewDetails: (opportunity: Opportunity) => void;
}

export default function OpportunityCard({ opportunity, onStatusChange, onViewDetails }: OpportunityCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const router = useRouter();

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'from-green-400 to-emerald-500';
    if (score >= 0.6) return 'from-yellow-400 to-orange-500';
    return 'from-blue-400 to-indigo-500';
  };

  const getStatusIcon = (status: OpportunityStatus) => {
    switch (status) {
      case OpportunityStatus.SAVED:
        return <StarSolid className="h-5 w-5 text-yellow-400" />;
      case OpportunityStatus.PURSUING:
        return <RocketLaunchIcon className="h-5 w-5 text-green-400" />;
      case OpportunityStatus.PASSED:
        return <XMarkIcon className="h-5 w-5 text-gray-400" />;
      case OpportunityStatus.APPLIED:
        return <CheckCircleIcon className="h-5 w-5 text-blue-400" />;
      default:
        return null;
    }
  };

  const getDaysUntilDue = (dueDate: string | undefined) => {
    if (!dueDate) return null;
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleStatusChange = async (newStatus: OpportunityStatus) => {
    setIsUpdating(true);
    await onStatusChange(opportunity.id, newStatus);
    setIsUpdating(false);
  };

  const handleViewDetails = () => {
    router.push(`/dashboard/opportunities/${opportunity.id}`);
  };

  const daysUntilDue = getDaysUntilDue(opportunity.due_date);
  const isUrgent = daysUntilDue !== null && daysUntilDue <= 7;
  const locationDisplay = getOpportunityLocation(opportunity);

  return (
    <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 hover:bg-white/10 transition-all">
      {/* Card Header */}
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="flex items-start justify-between">
              {/* CHANGE: Made title clickable */}
              <h3
                onClick={handleViewDetails}
                className="text-lg font-semibold text-white hover:text-purple-400 cursor-pointer transition-colors"
              >
                {opportunity.opportunity_title}
              </h3>
              <div className="flex items-center gap-2">
                {getStatusIcon(opportunity.status)}
                <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${getScoreColor(opportunity.match_score)}`} />
              </div>
            </div>

            {/* Agency and ID */}
            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-400">
              <span className="flex items-center">
                <BuildingOfficeIcon className="h-4 w-4 mr-1" />
                {opportunity.agency}
              </span>
              <span className="text-xs">ID: {opportunity.opportunity_id}</span>
            </div>

            {/* Location */}
            {locationDisplay !== 'Location not specified' && (
              <div className="flex items-center mt-2 text-sm text-gray-400">
                <MapPinIcon className="h-4 w-4 mr-1" />
                {locationDisplay}
              </div>
            )}

            {/* Key Details */}
            <div className="flex flex-wrap gap-3 mt-4">
              {opportunity.due_date && (
                <span className={`flex items-center text-sm ${isUrgent ? 'text-red-400' : 'text-gray-400'}`}>
                  <ClockIcon className="h-4 w-4 mr-1" />
                  {daysUntilDue} days left
                </span>
              )}
              {opportunity.estimated_value && (
                <span className="flex items-center text-sm text-gray-400">
                  <CurrencyDollarIcon className="h-4 w-4 mr-1" />
                  {opportunity.estimated_value}
                </span>
              )}
              {opportunity.naics_code && (
                <span className="flex items-center text-sm text-gray-400">
                  <TagIcon className="h-4 w-4 mr-1" />
                  NAICS: {opportunity.naics_code}
                </span>
              )}
              {opportunity.set_aside && (
                <span className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full">
                  {opportunity.set_aside}
                </span>
              )}
            </div>
          </div>

          {/* Match Score Badge */}
          <div className="ml-4">
            <div className={`px-4 py-2 rounded-full bg-gradient-to-r ${getScoreColor(opportunity.match_score)} text-white font-bold text-sm`}>
              {(opportunity.match_score * 100).toFixed(0)}%
            </div>
          </div>
        </div>

        {/* AI Reasoning Preview */}
        <div className="mt-4">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center text-sm text-purple-400 hover:text-purple-300 transition-colors"
          >
            <ChevronDownIcon className={`h-4 w-4 mr-1 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            Why is this a {opportunity.match_score >= 0.8 ? 'great' : opportunity.match_score >= 0.6 ? 'good' : 'potential'} match?
          </button>
          {isExpanded && (
            <div className="mt-3 p-4 bg-black/20 rounded-lg border border-white/10">
              <p className="text-sm text-gray-300 leading-relaxed">
                {opportunity.reasoning}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-6 py-4 bg-black/20 border-t border-white/10 rounded-b-xl">
        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            {opportunity.status !== OpportunityStatus.SAVED && (
              <button
                onClick={() => handleStatusChange(OpportunityStatus.SAVED)}
                disabled={isUpdating}
                className="px-3 py-1.5 bg-yellow-500/20 text-yellow-400 rounded-lg text-sm hover:bg-yellow-500/30 transition-colors disabled:opacity-50"
              >
                Save
              </button>
            )}
            {opportunity.status !== OpportunityStatus.PURSUING && (
              <button
                onClick={() => handleStatusChange(OpportunityStatus.PURSUING)}
                disabled={isUpdating}
                className="px-3 py-1.5 bg-green-500/20 text-green-400 rounded-lg text-sm hover:bg-green-500/30 transition-colors disabled:opacity-50"
              >
                Pursue
              </button>
            )}
            {opportunity.status !== OpportunityStatus.PASSED && (
              <button
                onClick={() => handleStatusChange(OpportunityStatus.PASSED)}
                disabled={isUpdating}
                className="px-3 py-1.5 bg-gray-500/20 text-gray-400 rounded-lg text-sm hover:bg-gray-500/30 transition-colors disabled:opacity-50"
              >
                Pass
              </button>
            )}
          </div>

          {/* CHANGE: Added View Details button that navigates */}
          <button
            onClick={handleViewDetails}
            className="px-3 py-1.5 text-purple-400 hover:text-purple-300 text-sm transition-colors"
          >
            View Details →
          </button>
        </div>
      </div>
    </div>
  );
}