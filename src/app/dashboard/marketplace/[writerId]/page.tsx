'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Badge,
  LoadingSpinner,
  Alert,
} from '@/components/ui';
import { getWriterProfile } from '@/lib/marketplaceApi';
import { ProposalWriterPublicProfile } from '@/types/marketplace';
import { useAuth } from '@/contexts/AuthContext';
import { getErrorMessage } from '@/lib/errorUtils';
import ContactWriterModal from '@/components/marketplace/ContactWriterModal';
import BookWriterModal from '@/components/marketplace/BookWriterModal';
import {
  ArrowLeftIcon,
  CheckBadgeIcon,
  StarIcon as StarOutline,
  MapPinIcon,
  ClockIcon,
  BriefcaseIcon,
  AcademicCapIcon,
  DocumentTextIcon,
  ChatBubbleLeftIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';

export default function WriterProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const writerId = params.writerId as string;

  const [writer, setWriter] = useState<ProposalWriterPublicProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showBookModal, setShowBookModal] = useState(false);

  const loadWriter = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getWriterProfile(writerId);
      setWriter(data);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to load writer profile'));
    } finally {
      setIsLoading(false);
    }
  }, [writerId]);

  useEffect(() => {
    loadWriter();
  }, [loadWriter]);

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star}>
            {star <= Math.round(rating) ? (
              <StarSolid className="w-5 h-5 text-yellow-400" />
            ) : (
              <StarOutline className="w-5 h-5 text-gray-400" />
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

  if (error || !writer) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          leftIcon={<ArrowLeftIcon className="w-5 h-5" />}
          onClick={() => router.push('/dashboard/marketplace')}
        >
          Back to Marketplace
        </Button>
        <Alert type="error" message={error || 'Writer not found'} />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Back Button */}
      <Button
        variant="ghost"
        leftIcon={<ArrowLeftIcon className="w-5 h-5" />}
        onClick={() => router.push('/dashboard/marketplace')}
      >
        Back to Marketplace
      </Button>

      {/* Profile Header */}
      <Card>
        <CardBody>
          <div className="flex flex-col md:flex-row gap-6">
            {/* Photo */}
            <div className="flex-shrink-0">
              {writer.profile_photo_url ? (
                <Image
                  src={writer.profile_photo_url}
                  alt={writer.full_name}
                  width={128}
                  height={128}
                  className="w-32 h-32 rounded-full object-cover"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white text-4xl font-bold">
                  {writer.full_name.charAt(0)}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 space-y-4">
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-3xl font-bold text-white">{writer.full_name}</h1>
                  {writer.is_verified && (
                    <CheckBadgeIcon className="w-6 h-6 text-blue-400" title="Verified" />
                  )}
                  {writer.is_featured && (
                    <Badge variant="warning">Featured</Badge>
                  )}
                </div>

                {writer.company_name && (
                  <p className="text-lg text-gray-400 mt-1">{writer.company_name}</p>
                )}

                {writer.headline && (
                  <p className="text-gray-300 mt-2">{writer.headline}</p>
                )}
              </div>

              {/* Rating & Stats */}
              <div className="flex flex-wrap items-center gap-6">
                {writer.average_rating && (
                  <div className="flex items-center gap-2">
                    {renderStars(writer.average_rating)}
                    <span className="text-gray-400">
                      {writer.average_rating.toFixed(1)} ({writer.total_reviews} reviews)
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-gray-400">
                  <BriefcaseIcon className="w-5 h-5" />
                  {writer.total_bookings} bookings completed
                </div>
                {writer.years_experience && (
                  <div className="flex items-center gap-2 text-gray-400">
                    <ClockIcon className="w-5 h-5" />
                    {writer.years_experience} years experience
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  variant="primary"
                  leftIcon={<CalendarIcon className="w-5 h-5" />}
                  onClick={() => setShowBookModal(true)}
                >
                  Book Now
                </Button>
                <Button
                  variant="secondary"
                  leftIcon={<ChatBubbleLeftIcon className="w-5 h-5" />}
                  onClick={() => setShowContactModal(true)}
                >
                  Contact
                </Button>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Key Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardBody>
            <div className="flex items-center gap-2 mb-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  writer.availability_status === 'available'
                    ? 'bg-green-400'
                    : writer.availability_status === 'limited'
                    ? 'bg-yellow-400'
                    : 'bg-red-400'
                }`}
              />
              <span className="font-semibold text-white capitalize">
                {writer.availability_status}
              </span>
            </div>
            <p className="text-sm text-gray-400">Availability</p>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center gap-2 mb-2">
              <ClockIcon className="w-5 h-5 text-primary-400" />
              <span className="font-semibold text-white">
                {writer.response_time_hours}h
              </span>
            </div>
            <p className="text-sm text-gray-400">Response Time</p>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-semibold text-white">
                {writer.price_range_display || writer.pricing_model}
              </span>
            </div>
            <p className="text-sm text-gray-400">Pricing</p>
          </CardBody>
        </Card>
      </div>

      {/* About */}
      {writer.bio && (
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-white">About</h2>
          </CardHeader>
          <CardBody>
            <p className="text-gray-300 whitespace-pre-line">{writer.bio}</p>
          </CardBody>
        </Card>
      )}

      {/* Specializations */}
      {writer.specializations.length > 0 && (
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-white">Specializations</h2>
          </CardHeader>
          <CardBody>
            <div className="flex flex-wrap gap-2">
              {writer.specializations.map((spec) => (
                <Badge key={spec} variant="primary">
                  {spec}
                </Badge>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Qualifications */}
      {writer.qualifications.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AcademicCapIcon className="w-6 h-6 text-primary-400" />
              <h2 className="text-xl font-semibold text-white">Qualifications</h2>
            </div>
          </CardHeader>
          <CardBody>
            <ul className="space-y-2">
              {writer.qualifications.map((qual, index) => (
                <li key={index} className="flex items-start gap-2 text-gray-300">
                  <span className="text-primary-400 mt-1">•</span>
                  <span>{qual}</span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      )}

      {/* Portfolio */}
      {writer.portfolio_items.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <DocumentTextIcon className="w-6 h-6 text-primary-400" />
              <h2 className="text-xl font-semibold text-white">Portfolio</h2>
            </div>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              {writer.portfolio_items.map((item, index) => (
                <div
                  key={index}
                  className="p-4 rounded-lg bg-gray-800/50 border border-gray-700"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-white">{item.title}</h3>
                      <p className="text-sm text-gray-400 mt-1">{item.description}</p>

                      <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-400">
                        {item.year && <span>Year: {item.year}</span>}
                        {item.client_type && <span>Client: {item.client_type}</span>}
                        {item.contract_value && <span>Value: {item.contract_value}</span>}
                        {item.won !== null && (
                          <Badge variant={item.won ? 'success' : 'secondary'} size="sm">
                            {item.won ? 'Won' : 'Lost'}
                          </Badge>
                        )}
                      </div>

                      {item.link_url && (
                        <a
                          href={item.link_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-400 hover:text-primary-300 text-sm mt-2 inline-block"
                        >
                          View Project →
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Testimonials */}
      {writer.testimonials.length > 0 && (
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-white">Client Testimonials</h2>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              {writer.testimonials.map((testimonial, index) => (
                <div
                  key={index}
                  className="p-4 rounded-lg bg-gray-800/50 border border-gray-700"
                >
                  <div className="flex items-center gap-2 mb-2">
                    {renderStars(testimonial.rating)}
                  </div>
                  <p className="text-gray-300 mb-3">&ldquo;{testimonial.review_text}&rdquo;</p>
                  <div className="flex items-center justify-between text-sm text-gray-400">
                    <div>
                      <span className="font-medium text-white">
                        {testimonial.client_name}
                      </span>
                      {testimonial.client_company && (
                        <span> • {testimonial.client_company}</span>
                      )}
                    </div>
                    {testimonial.date && <span>{testimonial.date}</span>}
                  </div>
                  {testimonial.project_type && (
                    <Badge variant="secondary" size="sm" className="mt-2">
                      {testimonial.project_type}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* NAICS Expertise & Service Locations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {writer.naics_expertise.length > 0 && (
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold text-white">NAICS Expertise</h2>
            </CardHeader>
            <CardBody>
              <div className="flex flex-wrap gap-2">
                {writer.naics_expertise.map((code) => (
                  <Badge key={code} variant="secondary">
                    {code}
                  </Badge>
                ))}
              </div>
            </CardBody>
          </Card>
        )}

        {writer.service_locations.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <MapPinIcon className="w-6 h-6 text-primary-400" />
                <h2 className="text-xl font-semibold text-white">Service Locations</h2>
              </div>
            </CardHeader>
            <CardBody>
              <div className="flex flex-wrap gap-2">
                {writer.service_locations.map((location) => (
                  <Badge key={location} variant="secondary">
                    {location}
                  </Badge>
                ))}
              </div>
            </CardBody>
          </Card>
        )}
      </div>

      {/* Rush Projects Badge */}
      {writer.accepts_rush_projects && (
        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <Badge variant="warning">⚡ Rush Projects Available</Badge>
              <span className="text-gray-400 text-sm">
                This writer accepts urgent project requests
              </span>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Contact & Booking Modals */}
      {showContactModal && (
        <ContactWriterModal
          writerId={writer.writer_id}
          writerName={writer.full_name}
          clientId={user?.client_id || ''}
          onClose={() => setShowContactModal(false)}
          onSuccess={() => {
            setShowContactModal(false);
            alert('Message sent successfully!');
          }}
        />
      )}

      {showBookModal && (
        <BookWriterModal
          writerId={writer.writer_id}
          writerName={writer.full_name}
          clientId={user?.client_id || ''}
          onClose={() => setShowBookModal(false)}
          onSuccess={() => {
            setShowBookModal(false);
            alert('Booking request sent successfully!');
          }}
        />
      )}
    </div>
  );
}
