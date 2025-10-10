'use client';
import { Opportunity, OpportunityStatus } from '@/types/opportunity';
import { XMarkIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';

interface DetailModalProps {
  opportunity: Opportunity;
  onClose: () => void;
  onStatusChange: (id: string, status: OpportunityStatus) => void;
}

export default function OpportunityDetailModal({
  opportunity,
  onClose,
  onStatusChange,
}: DetailModalProps) {
  const getScoreColor = (score?: number) => {
    const s = score ?? 0;
    if (s >= 0.8) return 'from-green-400 to-emerald-500';
    if (s >= 0.6) return 'from-yellow-400 to-orange-500';
    return 'from-blue-400 to-indigo-500';
  };

  const matchPct = Math.round((opportunity.match_score ?? 0) * 100);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800/90 backdrop-blur-lg rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-white/10">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex justify-between items-start">
          <div className="flex-1 pr-4">
            <h2 className="text-xl font-semibold text-white mb-1">
              {opportunity.opportunity_title ?? 'Untitled Opportunity'}
            </h2>
            <p className="text-sm text-gray-400">{opportunity.agency ?? '—'}</p>
          </div>
          <div className="flex items-center space-x-3">
            <div className={`px-4 py-2 rounded-full bg-gradient-to-r ${getScoreColor(opportunity.match_score)} text-white font-bold`}>
              {matchPct}% Match
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Close"
            >
              <XMarkIcon className="h-5 w-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Key Details */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white/5 rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-1">Due Date</p>
              <p className="text-sm text-white font-medium">
                {opportunity.due_date ? new Date(opportunity.due_date).toLocaleDateString() : 'Not specified'}
              </p>
            </div>
            <div className="bg-white/5 rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-1">Value</p>
              <p className="text-sm text-white font-medium">
                {opportunity.estimated_value ?? 'Not specified'}
              </p>
            </div>
            <div className="bg-white/5 rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-1">NAICS</p>
              <p className="text-sm text-white font-medium">
                {opportunity.naics_code ?? 'Not specified'}
              </p>
            </div>
            <div className="bg-white/5 rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-1">Set-Aside</p>
              <p className="text-sm text-white font-medium">
                {opportunity.set_aside ?? 'Full & Open'}
              </p>
            </div>
          </div>

          {/* AI Reasoning */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-3">Why This Is a Match</h3>
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
              <p className="text-gray-300 leading-relaxed">
                {opportunity.reasoning ?? 'No reasoning provided.'}
              </p>
            </div>
          </div>

          {/* Description */}
          {opportunity.description && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-3">Description</h3>
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {opportunity.description}
                </p>
              </div>
            </div>
          )}

          {/* External Links */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-3">Resources</h3>
            <div className="space-y-2">
              <a
                href={`https://sam.gov/workspace/contract/opp/${opportunity.opportunity_id ?? ''}/view`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-purple-400 hover:text-purple-300 transition-colors"
              >
                <ArrowTopRightOnSquareIcon className="h-4 w-4 mr-2" />
                View on SAM.gov
              </a>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-white/10 bg-black/20">
          <div className="flex justify-between items-center">
            <div className="flex space-x-3">
              <button
                onClick={() => onStatusChange(opportunity.id, OpportunityStatus.SAVED)}
                className="px-4 py-2 bg-yellow-500/20 text-yellow-400 rounded-lg hover:bg-yellow-500/30 transition-colors"
              >
                Save for Later
              </button>
              <button
                onClick={() => onStatusChange(opportunity.id, OpportunityStatus.PURSUING)}
                className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors"
              >
                Start Pursuing
              </button>
              <button
                onClick={() => onStatusChange(opportunity.id, OpportunityStatus.PASSED)}
                className="px-4 py-2 bg-gray-500/20 text-gray-400 rounded-lg hover:bg-gray-500/30 transition-colors"
              >
                Pass
              </button>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
