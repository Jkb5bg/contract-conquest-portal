'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardBody, Button, Badge, LoadingSpinner, Alert, StatCard } from '@/components/ui';
import { useWriterAuth } from '@/contexts/WriterAuthContext';
import { getWriterProfile, getWriterBookings } from '@/lib/writerApi';
import { Booking } from '@/types/marketplace';
import {
  UserCircleIcon,
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  ChartBarIcon,
  StarIcon,
} from '@heroicons/react/24/outline';

export default function WriterDashboardPage() {
  const { user } = useWriterAuth();
  const [profile, setProfile] = useState<any>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [profileData, bookingsData] = await Promise.all([
        getWriterProfile(),
        getWriterBookings(10),
      ]);

      setProfile(profileData);
      setBookings(bookingsData);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const getBookingStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      requested: 'warning',
      accepted: 'info',
      in_progress: 'primary',
      completed: 'success',
      cancelled: 'danger',
    };
    return variants[status] || 'secondary';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const pendingBookings = bookings.filter((b) => b.status === 'requested').length;
  const activeBookings = bookings.filter(
    (b) => b.status === 'accepted' || b.status === 'in_progress'
  ).length;
  const completedBookings = bookings.filter((b) => b.status === 'completed').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Welcome back, {user?.full_name || 'Writer'}!</h1>
        <p className="mt-2 text-gray-400">Manage your profile and bookings</p>
      </div>

      {error && (
        <Alert type="error" dismissible onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Profile Completion Alert */}
      {profile && !profile.bio && (
        <Alert type="warning">
          <div className="flex items-center justify-between">
            <span>Your profile is incomplete. Complete it to appear in the marketplace!</span>
            <Link href="/writer/dashboard/profile">
              <Button variant="primary" size="sm">
                Complete Profile
              </Button>
            </Link>
          </div>
        </Alert>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Pending Requests"
          value={pendingBookings}
          icon={<ClockIcon className="w-6 h-6" />}
          trend={pendingBookings > 0 ? 'up' : undefined}
          variant="warning"
        />
        <StatCard
          title="Active Bookings"
          value={activeBookings}
          icon={<CalendarIcon className="w-6 h-6" />}
          variant="primary"
        />
        <StatCard
          title="Completed"
          value={completedBookings}
          icon={<CheckCircleIcon className="w-6 h-6" />}
          variant="success"
        />
        <StatCard
          title="Average Rating"
          value={profile?.average_rating?.toFixed(1) || 'N/A'}
          icon={<StarIcon className="w-6 h-6" />}
          variant="info"
        />
      </div>

      {/* Profile Overview */}
      {profile && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCircleIcon className="w-6 h-6 text-primary-400" />
                <h2 className="text-xl font-semibold text-white">Profile Overview</h2>
              </div>
              <Link href="/writer/dashboard/profile">
                <Button variant="secondary" size="sm">
                  Edit Profile
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-400">Full Name</p>
                    <p className="text-white font-medium">{profile.full_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Company</p>
                    <p className="text-white">{profile.company_name || 'Not set'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Years of Experience</p>
                    <p className="text-white">{profile.years_experience || 'Not set'}</p>
                  </div>
                </div>
              </div>
              <div>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-400">Availability Status</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          profile.availability_status === 'available'
                            ? 'bg-green-400'
                            : profile.availability_status === 'limited'
                            ? 'bg-yellow-400'
                            : 'bg-red-400'
                        }`}
                      />
                      <span className="text-white capitalize">
                        {profile.availability_status || 'Not set'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Pricing Model</p>
                    <p className="text-white">{profile.pricing_model || 'Not set'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Total Bookings</p>
                    <p className="text-white">{profile.total_bookings || 0}</p>
                  </div>
                </div>
              </div>
            </div>

            {profile.specializations && profile.specializations.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-700">
                <p className="text-sm text-gray-400 mb-2">Specializations</p>
                <div className="flex flex-wrap gap-2">
                  {profile.specializations.map((spec: string) => (
                    <Badge key={spec} variant="primary">
                      {spec}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* Recent Bookings */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-6 h-6 text-primary-400" />
              <h2 className="text-xl font-semibold text-white">Recent Bookings</h2>
            </div>
            <Link href="/writer/dashboard/bookings">
              <Button variant="secondary" size="sm">
                View All
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardBody>
          {bookings.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <CalendarIcon className="w-12 h-12 mx-auto mb-3 text-gray-600" />
              <p>No bookings yet</p>
              <p className="text-sm mt-1">Complete your profile to start receiving bookings</p>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.slice(0, 5).map((booking) => (
                <div
                  key={booking.booking_id}
                  className="p-4 rounded-lg bg-gray-800/50 border border-gray-700 hover:border-gray-600 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={getBookingStatusBadge(booking.status)}>
                          {booking.status.replace('_', ' ')}
                        </Badge>
                        <span className="text-sm text-gray-400">
                          {new Date(booking.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <h3 className="text-white font-medium mb-1">
                        {booking.service_type.replace('_', ' ')}
                      </h3>
                      <p className="text-sm text-gray-400 line-clamp-2">
                        {booking.project_description}
                      </p>
                      {booking.client_name && (
                        <p className="text-sm text-gray-500 mt-2">
                          Client: {booking.client_name}
                        </p>
                      )}
                    </div>
                    <Link href="/writer/dashboard/bookings">
                      <Button variant="ghost" size="sm">
                        View →
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card hover>
          <CardBody>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary-500/20 rounded-lg flex items-center justify-center">
                <UserCircleIcon className="w-6 h-6 text-primary-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-semibold">Update Profile</h3>
                <p className="text-sm text-gray-400">Keep your profile up to date</p>
              </div>
              <Link href="/writer/dashboard/profile">
                <Button variant="ghost">Edit →</Button>
              </Link>
            </div>
          </CardBody>
        </Card>

        <Card hover>
          <CardBody>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-secondary-500/20 rounded-lg flex items-center justify-center">
                <CalendarIcon className="w-6 h-6 text-secondary-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-semibold">Manage Bookings</h3>
                <p className="text-sm text-gray-400">View and respond to bookings</p>
              </div>
              <Link href="/writer/dashboard/bookings">
                <Button variant="ghost">View →</Button>
              </Link>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
