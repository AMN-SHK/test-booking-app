import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  ChevronDown, 
  ChevronRight, 
  Calendar, 
  Clock, 
  Plus,
  Building2,
  User,
  RefreshCw
} from 'lucide-react';
import { Layout } from '../../components/Layout';
import { CreateRoomModal } from './CreateRoomModal';
import { useBookingStream } from '../../hooks/useBookingStream';
import { getAdminBookings, type RoomBookings } from '../../api/bookings';
import { formatDisplayDate, formatTime } from '../../utils/date';
import type { Booking } from '../../types/booking';

export const AdminDashboard = () => {
  const queryClient = useQueryClient();
  const { isConnected, lastEvent } = useBookingStream();
  const [expandedRooms, setExpandedRooms] = useState<Set<string>>(new Set());
  const [showCreateRoom, setShowCreateRoom] = useState(false);

  // Fetch all bookings grouped by room
  const { data: roomBookings, isLoading, isError, refetch } = useQuery({
    queryKey: ['adminBookings'],
    queryFn: getAdminBookings,
  });

  // Listen to SSE updates
  useEffect(() => {
    if (lastEvent && lastEvent.type !== 'connected') {
      queryClient.invalidateQueries({ queryKey: ['adminBookings'] });
    }
  }, [lastEvent, queryClient]);

  const toggleRoom = (roomId: string) => {
    setExpandedRooms((prev) => {
      const next = new Set(prev);
      if (next.has(roomId)) {
        next.delete(roomId);
      } else {
        next.add(roomId);
      }
      return next;
    });
  };

  const expandAll = () => {
    if (roomBookings) {
      setExpandedRooms(new Set(roomBookings.map((r) => r.roomId)));
    }
  };

  const collapseAll = () => {
    setExpandedRooms(new Set());
  };

  // Calculate stats
  const stats = {
    totalRooms: roomBookings?.length || 0,
    totalBookings: roomBookings?.reduce((acc, r) => acc + r.bookings.length, 0) || 0,
    activeBookings: roomBookings?.reduce(
      (acc, r) => acc + r.bookings.filter((b) => b.status === 'active').length,
      0
    ) || 0,
  };

  return (
    <Layout isConnected={isConnected}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
            <p className="text-gray-500">Manage rooms and view all bookings</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => refetch()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={() => setShowCreateRoom(true)}
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-semibold py-2 px-4 rounded-xl transition-colors cursor-pointer"
            >
              <Plus className="w-5 h-5" />
              Create New Room
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Rooms</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalRooms}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-secondary" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Bookings</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalBookings}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Active Bookings</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeBookings}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Bookings by Room</h2>
          <div className="flex gap-2">
            <button
              onClick={expandAll}
              className="text-sm text-primary hover:text-primary/80 font-medium cursor-pointer"
            >
              Expand All
            </button>
            <span className="text-gray-300">|</span>
            <button
              onClick={collapseAll}
              className="text-sm text-primary hover:text-primary/80 font-medium cursor-pointer"
            >
              Collapse All
            </button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl shadow-sm p-6 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-200 rounded-lg" />
                  <div className="flex-1">
                    <div className="h-5 bg-gray-200 rounded w-40 mb-2" />
                    <div className="h-4 bg-gray-200 rounded w-24" />
                  </div>
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
        {!isLoading && !isError && roomBookings?.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No rooms yet</h3>
            <p className="text-gray-500 mb-6">Create your first room to get started</p>
            <button
              onClick={() => setShowCreateRoom(true)}
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-semibold py-3 px-6 rounded-xl transition-colors cursor-pointer"
            >
              <Plus className="w-5 h-5" />
              Create New Room
            </button>
          </div>
        )}

        {/* Room Sections */}
        {!isLoading && !isError && roomBookings && roomBookings.length > 0 && (
          <div className="space-y-4">
            {roomBookings.map((room) => (
              <RoomSection
                key={room.roomId}
                room={room}
                isExpanded={expandedRooms.has(room.roomId)}
                onToggle={() => toggleRoom(room.roomId)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Room Modal */}
      <CreateRoomModal
        isOpen={showCreateRoom}
        onClose={() => setShowCreateRoom(false)}
      />
    </Layout>
  );
};

// Room Section Component
interface RoomSectionProps {
  room: RoomBookings;
  isExpanded: boolean;
  onToggle: () => void;
}

const RoomSection = ({ room, isExpanded, onToggle }: RoomSectionProps) => {
  const activeCount = room.bookings.filter((b) => b.status === 'active').length;

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <Building2 className="w-5 h-5 text-primary" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-gray-900">{room.roomName}</h3>
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {room.bookings.length} booking{room.bookings.length !== 1 ? 's' : ''}
              </span>
              {activeCount > 0 && (
                <span className="text-green-600">
                  {activeCount} active
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronRight className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </button>

      {/* Bookings List */}
      {isExpanded && (
        <div className="border-t border-gray-100">
          {room.bookings.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No bookings for this room yet
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {room.bookings.map((booking) => (
                <BookingRow key={booking.id} booking={booking} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Booking Row Component
interface BookingRowProps {
  booking: Booking;
}

const BookingRow = ({ booking }: BookingRowProps) => {
  const isActive = booking.status === 'active';

  return (
    <div className={`p-4 flex flex-col sm:flex-row sm:items-center gap-4 ${!isActive ? 'opacity-60' : ''}`}>
      {/* User */}
      <div className="flex items-center gap-3 sm:w-48">
        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
          <User className="w-4 h-4 text-gray-500" />
        </div>
        <span className="text-sm font-medium text-gray-900 truncate">
          {booking.userName || booking.user?.name || 'Unknown User'}
        </span>
      </div>

      {/* Date */}
      <div className="flex items-center gap-2 sm:w-48">
        <Calendar className="w-4 h-4 text-gray-400" />
        <span className="text-sm text-gray-600">{formatDisplayDate(booking.startTime)}</span>
      </div>

      {/* Time */}
      <div className="flex items-center gap-2 sm:w-40">
        <Clock className="w-4 h-4 text-gray-400" />
        <span className="text-sm text-gray-600">
          {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
        </span>
      </div>

      {/* Status */}
      <div className="sm:ml-auto">
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
          isActive
            ? 'bg-green-100 text-green-700'
            : 'bg-gray-100 text-gray-500'
        }`}>
          {isActive ? 'Active' : 'Cancelled'}
        </span>
      </div>
    </div>
  );
};

