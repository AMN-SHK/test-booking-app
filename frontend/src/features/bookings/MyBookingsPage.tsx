import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Calendar, Clock, MapPin, Edit3, XCircle, Search, Filter } from 'lucide-react';
import { Layout } from '../../components/Layout';
import { RescheduleModal } from './RescheduleModal';
import { CancelConfirmation } from './CancelConfirmation';
import { useBookingStream } from '../../hooks/useBookingStream';
import { useAuth } from '../auth/useAuth';
import { getMyBookings } from '../../api/bookings';
import { formatDisplayDate, formatTime } from '../../utils/date';
import type { Booking } from '../../types/booking';

type FilterType = 'all' | 'upcoming' | 'past' | 'cancelled';

export const MyBookingsPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { isConnected, lastEvent } = useBookingStream();
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showReschedule, setShowReschedule] = useState(false);
  const [showCancel, setShowCancel] = useState(false);

  // Fetch bookings
  const { data: bookings, isLoading, isError, refetch } = useQuery({
    queryKey: ['myBookings'],
    queryFn: getMyBookings,
  });

  // Listen to SSE updates
  useEffect(() => {
    if (lastEvent && lastEvent.type !== 'connected') {
      // Check if event affects user's bookings
      const eventUserId = lastEvent.data.userId;
      if (eventUserId === user?.id || lastEvent.type === 'booking-cancelled' || lastEvent.type === 'booking-rescheduled') {
        queryClient.invalidateQueries({ queryKey: ['myBookings'] });
      }
    }
  }, [lastEvent, queryClient, user?.id]);

  // Sort and filter bookings
  const filteredBookings = useMemo(() => {
    if (!bookings) return [];

    const now = new Date();

    // Sort: upcoming first, then past
    const sorted = [...bookings].sort((a, b) => {
      const aDate = new Date(a.startTime);
      const bDate = new Date(b.startTime);
      const aIsUpcoming = aDate > now;
      const bIsUpcoming = bDate > now;

      if (aIsUpcoming && !bIsUpcoming) return -1;
      if (!aIsUpcoming && bIsUpcoming) return 1;
      
      // Both upcoming: sort by soonest first
      if (aIsUpcoming && bIsUpcoming) return aDate.getTime() - bDate.getTime();
      
      // Both past: sort by most recent first
      return bDate.getTime() - aDate.getTime();
    });

    // Apply filter
    return sorted.filter((booking) => {
      const bookingDate = new Date(booking.startTime);
      const isUpcoming = bookingDate > now;
      const isCancelled = booking.status === 'cancelled';

      switch (filter) {
        case 'upcoming':
          return isUpcoming && !isCancelled;
        case 'past':
          return !isUpcoming && !isCancelled;
        case 'cancelled':
          return isCancelled;
        default:
          return true;
      }
    });
  }, [bookings, filter]);

  const handleReschedule = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowReschedule(true);
  };

  const handleCancel = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowCancel(true);
  };

  const filterButtons: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'past', label: 'Past' },
    { key: 'cancelled', label: 'Cancelled' },
  ];

  return (
    <Layout isConnected={isConnected}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">My Bookings</h1>
            <p className="text-gray-500">View and manage your room reservations</p>
          </div>
          <Link
            to="/bookings/new"
            className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-semibold py-3 px-6 rounded-xl transition-colors cursor-pointer"
          >
            <Calendar className="w-5 h-5" />
            New Booking
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm p-4 mb-6">
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-5 h-5 text-gray-400" />
            {filterButtons.map((btn) => (
              <button
                key={btn.key}
                onClick={() => setFilter(btn.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  filter === btn.key
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl shadow-sm p-6 animate-pulse">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gray-200 rounded-lg" />
                  <div className="flex-1">
                    <div className="h-5 bg-gray-200 rounded w-32 mb-2" />
                    <div className="h-4 bg-gray-200 rounded w-24" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-full" />
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
            <p className="text-red-600 font-medium mb-2">Failed to load bookings</p>
            <button
              onClick={() => refetch()}
              className="text-red-700 underline hover:no-underline cursor-pointer"
            >
              Try again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !isError && filteredBookings.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              {filter === 'all' ? (
                <Calendar className="w-8 h-8 text-gray-400" />
              ) : (
                <Search className="w-8 h-8 text-gray-400" />
              )}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {filter === 'all' ? 'No bookings yet' : `No ${filter} bookings`}
            </h3>
            <p className="text-gray-500 mb-6">
              {filter === 'all'
                ? "You haven't made any room reservations yet."
                : `You don't have any ${filter} bookings.`}
            </p>
            {filter === 'all' && (
              <Link
                to="/availability"
                className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
              >
                Browse Available Rooms
              </Link>
            )}
          </div>
        )}

        {/* Bookings Grid */}
        {!isLoading && !isError && filteredBookings.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBookings.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                onReschedule={handleReschedule}
                onCancel={handleCancel}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {selectedBooking && (
        <>
          <RescheduleModal
            booking={selectedBooking}
            isOpen={showReschedule}
            onClose={() => {
              setShowReschedule(false);
              setSelectedBooking(null);
            }}
          />
          <CancelConfirmation
            booking={selectedBooking}
            isOpen={showCancel}
            onClose={() => {
              setShowCancel(false);
              setSelectedBooking(null);
            }}
          />
        </>
      )}
    </Layout>
  );
};

// Booking Card Component
interface BookingCardProps {
  booking: Booking;
  onReschedule: (booking: Booking) => void;
  onCancel: (booking: Booking) => void;
}

const BookingCard = ({ booking, onReschedule, onCancel }: BookingCardProps) => {
  const now = new Date();
  const bookingDate = new Date(booking.startTime);
  const isUpcoming = bookingDate > now;
  const isActive = booking.status === 'active';
  const canModify = isActive && isUpcoming;

  return (
    <div className={`bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border ${
      !isActive ? 'border-gray-200 opacity-75' : 'border-transparent'
    }`}>
      {/* Status Banner */}
      {!isActive && (
        <div className="bg-gray-100 px-4 py-2 text-center">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Cancelled</span>
        </div>
      )}

      <div className="p-6">
        {/* Room Info */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              isActive ? 'bg-primary/10' : 'bg-gray-100'
            }`}>
              <MapPin className={`w-5 h-5 ${isActive ? 'text-primary' : 'text-gray-400'}`} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{booking.roomName || 'Room'}</h3>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                isActive
                  ? isUpcoming
                    ? 'bg-green-100 text-green-700'
                    : 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-500'
              }`}>
                {isActive ? (isUpcoming ? 'Upcoming' : 'Past') : 'Cancelled'}
              </span>
            </div>
          </div>
        </div>

        {/* Date & Time */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar className="w-4 h-4" />
            <span className="text-sm">{formatDisplayDate(booking.startTime)}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Clock className="w-4 h-4" />
            <span className="text-sm">{formatTime(booking.startTime)} - {formatTime(booking.endTime)}</span>
          </div>
        </div>

        {/* Actions */}
        {canModify && (
          <div className="flex gap-2 pt-4 border-t border-gray-100">
            <button
              onClick={() => onReschedule(booking)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors cursor-pointer"
            >
              <Edit3 className="w-4 h-4" />
              Reschedule
            </button>
            <button
              onClick={() => onCancel(booking)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-medium rounded-lg transition-colors cursor-pointer"
            >
              <XCircle className="w-4 h-4" />
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
