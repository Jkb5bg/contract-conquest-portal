'use client';
import {
  Card,
  CardHeader,
  CardBody,
  StatCard
} from '@/components/ui';
import {
  ChartBarIcon,
  TrophyIcon,
  ClockIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';

export default function ProposalsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          label="Win Rate"
          value="67%"
          icon={<TrophyIcon className="h-6 w-6" />}
          color="green"
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          label="Avg. Response Time"
          value="4.2 days"
          icon={<ClockIcon className="h-6 w-6" />}
          color="blue"
        />
        <StatCard
          label="Total Contract Value"
          value="$2.4M"
          icon={<CurrencyDollarIcon className="h-6 w-6" />}
          color="purple"
          trend={{ value: 23, isPositive: true }}
        />
        <StatCard
          label="Active Bids"
          value="12"
          icon={<ChartBarIcon className="h-6 w-6" />}
          color="yellow"
        />
      </div>

      {/* Coming Soon */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-white">Analytics Dashboard</h2>
        </CardHeader>
        <CardBody>
          <div className="text-center py-12">
            <div className="inline-flex p-4 bg-purple-500/20 rounded-full mb-4">
              <ChartBarIcon className="h-12 w-12 text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Advanced Analytics Coming Soon
            </h3>
            <p className="text-gray-400 max-w-md mx-auto">
              We&#39;re building comprehensive analytics to help you track your performance,
              win rates, and optimize your bidding strategy.
            </p>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}