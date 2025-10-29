'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Card,
  CardBody,
  Badge,
  LoadingSpinner,
  Alert,
  Modal,
  Button,
  Input,
} from '@/components/ui';
import { getMyBookings, submitBookingReview, getClientBookingMessages, sendClientBookingMessage } from '@/lib/marketplaceApi';
import { Booking, BookingReview, BookingMessage, BookingMessageCreate } from '@/types/marketplace';
import { CalendarIcon, StarIcon, ChatBubbleLeftRightIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';

export default function ClientBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [error, setError] = useState<string | null>(null);

  // Review modal
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Messaging
  const [expandedBookingId, setExpandedBookingId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, BookingMessage[]>>({});
  const [newMessage, setNewMessage] = useState<Record<string, string>>({});
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  useEffect(() => {
    loadBookings();

    // Set up auto-refresh every 30 seconds for booking status updates
    const refreshInterval = setInterval(() => {
      loadBookings(false);
    }, 30000);

    return () => clearInterval(refreshInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadBookings = async (showLoading = true) => {
    if (showLoading) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }
    setError(null);

    try {
      const data = await getMyBookings(100);
      // Ensure data is always an array
      const newBookings = Array.isArray(data) ? data : [];

      // Check if any booking status has changed
      if (bookings.length > 0) {
        newBookings.forEach(newBooking => {
          const oldBooking = bookings.find(b => b.booking_id === newBooking.booking_id);
          if (oldBooking && oldBooking.status !== newBooking.status) {
            // Show notification for status change
            console.log(`Booking ${newBooking.booking_id} status changed from ${oldBooking.status} to ${newBooking.status}`);
          }
        });
      }

      setBookings(newBookings);
      setLastUpdated(new Date());
    } catch (err: unknown) {
      // @ts-expect-error Accessing response property on unknown error type
      setError(err.response?.data?.detail || 'Failed to load bookings');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleManualRefresh = () => {
    loadBookings(false);
  };

  const openReviewModal = (booking: Booking) => {
    setSelectedBooking(booking);
    setRating(5);
    setReviewText('');
    setShowReviewModal(true);
  };

  const handleSubmitReview = async () => {
    if (!selectedBooking) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const review: BookingReview = {
        booking_id: selectedBooking.booking_id,
        rating,
        review_text: reviewText || null,
      };

      await submitBookingReview(selectedBooking.booking_id, review);

      // Reload bookings to show the new review
      await loadBookings();

      setShowReviewModal(false);
      setSelectedBooking(null);
    } catch (err: unknown) {
      // @ts-expect-error Accessing response property on unknown error type
      setError(err.response?.data?.detail || 'Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string): 'primary' | 'success' | 'warning' | 'danger' | 'info' => {
    const variants: Record<string, 'primary' | 'success' | 'warning' | 'danger' | 'info'> = {
      requested: 'warning',
      accepted: 'info',
      in_progress: 'primary',
      completed: 'success',
      cancelled: 'danger',
    };
    return variants[status] || 'info';
  };

  const toggleMessages = async (bookingId: string) => {
    if (expandedBookingId === bookingId) {
      setExpandedBookingId(null);
    } else {
      setExpandedBookingId(bookingId);
      if (!messages[bookingId]) {
        try {
          const bookingMessages = await getClientBookingMessages(bookingId);
          setMessages((prev) => ({ ...prev, [bookingId]: bookingMessages }));
        } catch (err) {
          console.error('Failed to load messages:', err);
        }
      }
    }
  };

  const handleSendMessage = async (bookingId: string) => {
    const messageText = newMessage[bookingId]?.trim();
    if (!messageText) return;

    setIsSendingMessage(true);
    try {
      const messageData: BookingMessageCreate = {
        booking_id: bookingId,
        message_text: messageText,
      };

      const sentMessage = await sendClientBookingMessage(messageData);
      setMessages((prev) => ({
        ...prev,
        [bookingId]: [...(prev[bookingId] || []), sentMessage],
      }));
      setNewMessage((prev) => ({ ...prev, [bookingId]: '' }));
    } catch (err: unknown) {
      // @ts-expect-error Accessing response property on unknown error type
      setError(err.response?.data?.detail || 'Failed to send message');
    } finally {
      setIsSendingMessage(false);
    }
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">My Bookings</h1>
          <p className="mt-2 text-gray-400">View and manage your writer bookings</p>
          <p className="text-xs text-gray-500 mt-1">
            Last updated: {lastUpdated.toLocaleTimeString()} • Auto-refreshes every 30s
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            leftIcon={<ArrowPathIcon className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />}
          >
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Link href="/dashboard/marketplace">
            <Button variant="primary">Book a Writer</Button>
          </Link>
        </div>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

      {bookings.length === 0 ? (
        <Card>
          <CardBody className="text-center py-12">
            <CalendarIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg mb-2">No bookings yet</p>
            <p className="text-sm text-gray-500 mb-6">
              Browse the marketplace and book a proposal writer to get started
            </p>
            <Link href="/dashboard/marketplace">
              <Button variant="primary">Browse Writers</Button>
            </Link>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <Card key={booking.booking_id}>
              <CardBody>
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge variant={getStatusBadge(booking.status)}>
                          {booking.status?.replace('_', ' ') || 'Unknown'}
                        </Badge>
                        <span className="text-sm text-gray-400">
                          {new Date(booking.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <h3 className="text-xl font-semibold text-white capitalize">
                        {booking.service_type?.replace('_', ' ') || 'N/A'}
                      </h3>
                      {booking.writer_name && (
                        <p className="text-gray-400 mt-1">
                          Writer: {booking.writer_name}
                          {' • '}
                          <Link
                            href={`/dashboard/marketplace/${booking.writer_id}`}
                            className="text-primary-400 hover:text-primary-300"
                          >
                            View Profile
                          </Link>
                        </p>
                      )}
                    </div>

                    {booking.status === 'completed' && !booking.review && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => openReviewModal(booking)}
                        leftIcon={<StarIcon className="w-4 h-4" />}
                      >
                        Leave Review
                      </Button>
                    )}
                  </div>

                  {/* Description */}
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-300 mb-2">
                      Project Description
                    </h4>
                    <p className="text-gray-400 whitespace-pre-line">
                      {booking.project_description}
                    </p>
                  </div>

                  {/* Details */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    {booking.budget && (
                      <div>
                        <span className="text-gray-400">Budget:</span>
                        <span className="text-white ml-2 font-medium">
                          ${booking.budget.toLocaleString()}
                        </span>
                      </div>
                    )}
                    {booking.deadline && (
                      <div>
                        <span className="text-gray-400">Deadline:</span>
                        <span className="text-white ml-2">
                          {new Date(booking.deadline).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {booking.opportunity_id && (
                      <div>
                        <span className="text-gray-400">Opportunity:</span>
                        <span className="text-white ml-2 font-mono text-xs">
                          {booking.opportunity_id}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Notes */}
                  {booking.notes && (
                    <div className="border-t border-gray-700 pt-4">
                      <h4 className="text-sm font-medium text-gray-300 mb-2">Notes</h4>
                      <p className="text-gray-400 text-sm">{booking.notes}</p>
                    </div>
                  )}

                  {/* Review */}
                  {booking.review && (
                    <div className="border-t border-gray-700 pt-4">
                      <h4 className="text-sm font-medium text-gray-300 mb-2">Your Review</h4>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span key={star}>
                              {star <= booking.review!.rating ? (
                                <StarSolid className="w-5 h-5 text-yellow-400" />
                              ) : (
                                <StarIcon className="w-5 h-5 text-gray-400" />
                              )}
                            </span>
                          ))}
                        </div>
                        <span className="text-gray-400">
                          ({booking.review.rating}/5)
                        </span>
                      </div>
                      {booking.review.review_text && (
                        <p className="text-gray-400 text-sm">
                          {booking.review.review_text}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Messaging Section */}
                  <div className="border-t border-gray-700 pt-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleMessages(booking.booking_id)}
                      leftIcon={<ChatBubbleLeftRightIcon className="w-4 h-4" />}
                      className="w-full"
                    >
                      {expandedBookingId === booking.booking_id ? 'Hide Messages' : 'Show Messages'}
                    </Button>

                    {expandedBookingId === booking.booking_id && (
                      <div className="mt-4 space-y-4">
                        {/* Messages List */}
                        <div className="max-h-96 overflow-y-auto space-y-3 bg-gray-900/50 rounded-lg p-4">
                          {messages[booking.booking_id]?.length === 0 ? (
                            <p className="text-gray-500 text-sm text-center py-4">
                              No messages yet. Start the conversation!
                            </p>
                          ) : (
                            messages[booking.booking_id]?.map((msg) => (
                              <div
                                key={msg.message_id}
                                className={`p-3 rounded-lg ${
                                  msg.sender_type === 'client'
                                    ? 'bg-primary-900/30 ml-8'
                                    : 'bg-gray-800 mr-8'
                                }`}
                              >
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-sm font-medium text-white">
                                    {msg.sender_name}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {new Date(msg.created_at).toLocaleString()}
                                  </span>
                                </div>
                                <p className="text-gray-300 text-sm">{msg.message_text}</p>
                              </div>
                            ))
                          )}
                        </div>

                        {/* Message Input */}
                        <div className="flex gap-2">
                          <Input
                            value={newMessage[booking.booking_id] || ''}
                            onChange={(e) =>
                              setNewMessage((prev) => ({
                                ...prev,
                                [booking.booking_id]: e.target.value,
                              }))
                            }
                            placeholder="Type your message..."
                            onKeyPress={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage(booking.booking_id);
                              }
                            }}
                          />
                          <Button
                            onClick={() => handleSendMessage(booking.booking_id)}
                            isLoading={isSendingMessage}
                            disabled={!newMessage[booking.booking_id]?.trim()}
                          >
                            Send
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && selectedBooking && (
        <Modal
          isOpen
          onClose={() => setShowReviewModal(false)}
          title="Leave a Review"
        >
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-400 mb-2">
                How was your experience with {selectedBooking.writer_name}?
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Rating *
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="transition-transform hover:scale-110"
                  >
                    {star <= rating ? (
                      <StarSolid className="w-8 h-8 text-yellow-400" />
                    ) : (
                      <StarIcon className="w-8 h-8 text-gray-400" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Review (optional)
              </label>
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white"
                placeholder="Share your experience working with this writer..."
              />
            </div>

            {error && <Alert type="error" message={error} />}

            <div className="flex gap-3 justify-end pt-4">
              <Button
                variant="secondary"
                onClick={() => setShowReviewModal(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSubmitReview}
                isLoading={isSubmitting}
              >
                Submit Review
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
