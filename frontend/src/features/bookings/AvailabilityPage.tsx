import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Calendar, RefreshCw } from 'lucide-react';
import { Layout } from '../../components/Layout';
import { RoomCard } from './RoomCard';
import { getRoomAvailability } from '../../api/rooms';
import { useBookingStream } from '../../hooks/useBookingStream';
import { getTodayString, formatDisplayDate } from '../../utils/date';

export const AvailabilityPage = () => {
  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const queryClient = useQueryClient();
  const { isConnected, lastEvent } = useBookingStream();

  // Fetch availability
  const { data: rooms, isLoading, isError, refetch } = useQuery({
    queryKey: ['availability', selectedDate],
    queryFn: () => getRoomAvailability(selectedDate),
    staleTime: 30 * 1000, // 30 seconds
  });

  // Invalidate query when SSE event received
  useEffect(() => {
    if (lastEvent && lastEvent.type !== 'connected') {
      console.log('SSE event received, refreshing availability...', lastEvent.type);
      queryClient.invalidateQueries({ queryKey: ['availability'] });
    }
  }, [lastEvent, queryClient]);

  return (
    <Layout isConnected={isConnected}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Room Availability</h1>
          <p className="text-gray-500">Select a date to view available time slots</p>
        </div>

        {/* Date Picker */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Selected Date</p>
                <p className="font-semibold text-gray-900">{formatDisplayDate(selectedDate)}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={getTodayString()}
                className="px-4 py-2.5 border border-gray-300 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
              />
              <button
                onClick={() => refetch()}
                className="p-2.5 border border-gray-300 rounded-xl text-gray-600 hover:bg-gray-50 hover:text-primary transition-colors cursor-pointer"
                title="Refresh"
              >
                <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-2xl shadow-md p-5 animate-pulse">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="h-5 bg-gray-200 rounded w-32 mb-2" />
                    <div className="h-4 bg-gray-200 rounded w-24" />
                  </div>
                  <div className="h-6 bg-gray-200 rounded-full w-16" />
                </div>
                <div className="border-t border-gray-100 pt-4">
                  <div className="h-4 bg-gray-200 rounded w-28 mb-3" />
                  <div className="flex gap-2">
                    <div className="h-10 bg-gray-200 rounded-xl w-28" />
                    <div className="h-10 bg-gray-200 rounded-xl w-28" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
            <p className="text-red-600 font-medium mb-2">Failed to load availability</p>
            <button
              onClick={() => refetch()}
              className="text-red-700 underline hover:no-underline cursor-pointer"
            >
              Try again
            </button>
          </div>
        )}

        {/* Room Grid */}
        {!isLoading && !isError && rooms && (
          <>
            {rooms.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No rooms available</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {rooms.map((room) => (
                  <RoomCard
                    key={room.roomId}
                    room={room}
                    selectedDate={selectedDate}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* Real-time indicator */}
        {isConnected && lastEvent && lastEvent.type !== 'connected' && (
          <div className="fixed bottom-6 right-6 bg-secondary text-white px-4 py-2 rounded-xl shadow-lg animate-pulse">
            <p className="text-sm font-medium">
              {lastEvent.type === 'booking-created' && '🆕 New booking created'}
              {lastEvent.type === 'booking-cancelled' && '❌ Booking cancelled'}
              {lastEvent.type === 'booking-rescheduled' && '📅 Booking rescheduled'}
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
};

