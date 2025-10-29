'use client';

import { useState, useEffect } from 'react';
import { Card, CardBody, Button, Badge, LoadingSpinner, Alert, Modal, Select, Input } from '@/components/ui';
import { getWriterBookings, updateBookingStatus, getBookingMessages, sendBookingMessage } from '@/lib/writerApi';
import { Booking, BookingStatus, BookingStatusUpdate, BookingMessage, BookingMessageCreate } from '@/types/marketplace';
import { CalendarIcon, FunnelIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';

export default function WriterBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Status update modal
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [newStatus, setNewStatus] = useState<BookingStatus>('requested');
  const [statusNotes, setStatusNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Messaging
  const [expandedBookingId, setExpandedBookingId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, BookingMessage[]>>({});
  const [newMessage, setNewMessage] = useState<Record<string, string>>({});
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  useEffect(() => {
    loadBookings();
  }, []);

  useEffect(() => {
    if (filterStatus === 'all') {
      setFilteredBookings(bookings);
    } else {
      setFilteredBookings(bookings.filter((b) => b.status === filterStatus));
    }
  }, [filterStatus, bookings]);

  const loadBookings = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getWriterBookings(100);
      // Ensure data is an array
      const bookingsArray = Array.isArray(data) ? data : [];
      setBookings(bookingsArray);
      setFilteredBookings(bookingsArray);
    } catch (err: unknown) {
      // @ts-expect-error Accessing response property on unknown error type
      setError(err.response?.data?.detail || 'Failed to load bookings');
    } finally {
      setIsLoading(false);
    }
  };

  const openStatusModal = (booking: Booking) => {
    setSelectedBooking(booking);
    // Default to 'requested' if status is undefined
    setNewStatus(booking.status || 'requested');
    setStatusNotes('');
    setShowStatusModal(true);
  };

  const handleUpdateStatus = async () => {
    if (!selectedBooking) return;

    setIsUpdating(true);
    setError(null);

    try {
      const update: BookingStatusUpdate = {
        booking_id: selectedBooking.booking_id,
        booking_status: newStatus,
        notes: statusNotes || null,
      };

      await updateBookingStatus(selectedBooking.booking_id, update);

      // Reload bookings
      await loadBookings();

      setShowStatusModal(false);
      setSelectedBooking(null);
    } catch (err: unknown) {
      // @ts-expect-error Accessing response property on unknown error type
      setError(err.response?.data?.detail || 'Failed to update booking status');
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusBadge = (status: string): 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' => {
    const variants: Record<string, 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info'> = {
      requested: 'warning',
      accepted: 'info',
      in_progress: 'primary',
      completed: 'success',
      cancelled: 'danger',
    };
    return variants[status] || 'info';
  };

  const getAvailableStatuses = (currentStatus: BookingStatus): BookingStatus[] => {
    const statusFlow: Record<BookingStatus, BookingStatus[]> = {
      requested: ['accepted', 'cancelled'],
      accepted: ['in_progress', 'cancelled'],
      in_progress: ['completed', 'cancelled'],
      completed: [],
      cancelled: [],
    };
    return statusFlow[currentStatus] || [];
  };

  const toggleMessages = async (bookingId: string) => {
    if (expandedBookingId === bookingId) {
      setExpandedBookingId(null);
    } else {
      setExpandedBookingId(bookingId);
      if (!messages[bookingId]) {
        try {
          const bookingMessages = await getBookingMessages(bookingId);
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

      const sentMessage = await sendBookingMessage(messageData);
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
          <p className="mt-2 text-gray-400">Manage your client bookings</p>
        </div>
        <Button variant="secondary" onClick={loadBookings} leftIcon={<CalendarIcon className="w-5 h-5" />}>
          Refresh
        </Button>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

      {/* Filters */}
      <Card>
        <CardBody>
          <div className="flex items-center gap-4">
            <FunnelIcon className="w-5 h-5 text-gray-400" />
            <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="max-w-xs">
              <option value="all">All Bookings</option>
              <option value="requested">Pending Requests</option>
              <option value="accepted">Accepted</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </Select>
            <span className="text-sm text-gray-400">
              Showing {filteredBookings.length} of {bookings.length} bookings
            </span>
          </div>
        </CardBody>
      </Card>

      {/* Bookings List */}
      {filteredBookings.length === 0 ? (
        <Card>
          <CardBody className="text-center py-12">
            <CalendarIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">No bookings found</p>
            <p className="text-sm text-gray-500 mt-2">
              {filterStatus === 'all'
                ? 'You have no bookings yet. Complete your profile to start receiving bookings!'
                : `No ${filterStatus?.replace('_', ' ') || filterStatus} bookings`}
            </p>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((booking) => (
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
                          Created: {new Date(booking.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <h3 className="text-xl font-semibold text-white capitalize">
                        {booking.service_type?.replace('_', ' ') || 'N/A'}
                      </h3>
                      {booking.client_name && (
                        <p className="text-gray-400 mt-1">Client: {booking.client_name}</p>
                      )}
                    </div>

                    {booking.status !== 'completed' && booking.status !== 'cancelled' && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => openStatusModal(booking)}
                      >
                        Update Status
                      </Button>
                    )}
                  </div>

                  {/* Description */}
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-300 mb-2">Project Description</h4>
                    <p className="text-gray-400 whitespace-pre-line">{booking.project_description}</p>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    {booking.budget && (
                      <div>
                        <span className="text-gray-400">Budget:</span>
                        <span className="text-white ml-2 font-medium">${booking.budget.toLocaleString()}</span>
                      </div>
                    )}
                    {booking.deadline && (
                      <div>
                        <span className="text-gray-400">Deadline:</span>
                        <span className="text-white ml-2">{new Date(booking.deadline).toLocaleDateString()}</span>
                      </div>
                    )}
                    {booking.opportunity_id && (
                      <div>
                        <span className="text-gray-400">Opportunity ID:</span>
                        <span className="text-white ml-2 font-mono text-xs">{booking.opportunity_id}</span>
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
                      <h4 className="text-sm font-medium text-gray-300 mb-2">Client Review</h4>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-yellow-400">{'⭐'.repeat(booking.review.rating)}</span>
                        <span className="text-gray-400">({booking.review.rating}/5)</span>
                      </div>
                      {booking.review.review_text && (
                        <p className="text-gray-400 text-sm">{booking.review.review_text}</p>
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
                                  msg.sender_type === 'writer'
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

      {/* Status Update Modal */}
      {showStatusModal && selectedBooking && (
        <Modal
          isOpen
          onClose={() => setShowStatusModal(false)}
          title="Update Booking Status"
        >
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-400 mb-2">Current Status</p>
              <Badge variant={getStatusBadge(selectedBooking.status)}>
                {selectedBooking.status?.replace('_', ' ') || 'Unknown'}
              </Badge>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                New Status *
              </label>
              <Select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as BookingStatus)}
              >
                <option value={selectedBooking.status || 'requested'}>
                  {selectedBooking.status?.replace('_', ' ') || 'Requested (Current)'}
                </option>
                {getAvailableStatuses(selectedBooking.status || 'requested').map((status) => (
                  <option key={status} value={status}>
                    {status.replace('_', ' ')}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Notes (optional)
              </label>
              <textarea
                value={statusNotes}
                onChange={(e) => setStatusNotes(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white"
                placeholder="Add any notes about this status change..."
              />
            </div>

            {error && <Alert type="error" message={error} />}

            <div className="flex gap-3 justify-end pt-4">
              <Button
                variant="secondary"
                onClick={() => setShowStatusModal(false)}
                disabled={isUpdating}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleUpdateStatus}
                isLoading={isUpdating}
              >
                Update Status
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
