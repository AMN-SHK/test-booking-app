import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, MapPin, Calendar, Clock, Users, Loader2, CheckCircle } from 'lucide-react';
import { Layout } from '../../components/Layout';
import { ConflictModal } from './ConflictModal';
import { useToast } from '../../hooks/useToast';
import { useBookingStream } from '../../hooks/useBookingStream';
import { useAuth } from '../auth/useAuth';
import { getRooms } from '../../api/rooms';
import { createBooking, BookingConflictError } from '../../api/bookings';
import { getTodayString, formatDisplayDate } from '../../utils/date';
import type { Booking, CreateBookingDTO } from '../../types/booking';
import type { Room } from '../../types/room';

// Generate time slots from 8:00 AM to 5:30 PM (30min increments)
const generateTimeSlots = () => {
  const slots: { value: string; label: string }[] = [];
  for (let hour = 8; hour <= 17; hour++) {
    for (let min = 0; min < 60; min += 30) {
      if (hour === 17 && min > 30) break;
      const h = hour.toString().padStart(2, '0');
      const m = min.toString().padStart(2, '0');
      const value = `${h}:${m}`;
      const period = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
      const label = `${displayHour}:${m} ${period}`;
      slots.push({ value, label });
    }
  }
  return slots;
};

const TIME_SLOTS = generateTimeSlots();

// Helper to parse ISO time to HH:mm format
const parseISOToTime = (isoString: string | null): string => {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    const h = d.getUTCHours().toString().padStart(2, '0');
    const m = d.getUTCMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  } catch {
    return '';
  }
};

interface FormErrors {
  roomId?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  general?: string;
}

export const CreateBookingPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const toast = useToast();
  const { user } = useAuth();
  const { isConnected } = useBookingStream();

  // Pre-fill from URL params - computed once
  const prefilledRoomId = searchParams.get('roomId') || '';
  const prefilledDate = searchParams.get('date') || getTodayString();
  const prefilledStartTime = parseISOToTime(searchParams.get('startTime'));
  const prefilledEndTime = parseISOToTime(searchParams.get('endTime'));

  // Form state with initial values from URL
  const [roomId, setRoomId] = useState(prefilledRoomId);
  const [date, setDate] = useState(prefilledDate);
  const [startTime, setStartTime] = useState(prefilledStartTime);
  const [endTime, setEndTime] = useState(prefilledEndTime);
  const [errors, setErrors] = useState<FormErrors>({});

  // Conflict modal state
  const [showConflict, setShowConflict] = useState(false);
  const [conflictingBookings, setConflictingBookings] = useState<Booking[]>([]);

  // Fetch rooms
  const { data: rooms, isLoading: roomsLoading } = useQuery({
    queryKey: ['rooms'],
    queryFn: getRooms,
  });

  // Filter end times to be after start time
  const filteredEndSlots = useMemo(() => {
    if (!startTime) return TIME_SLOTS;
    return TIME_SLOTS.filter((slot) => slot.value > startTime);
  }, [startTime]);

  // Get selected room details
  const selectedRoom = useMemo(() => {
    return rooms?.find((r: Room) => r.id === roomId);
  }, [rooms, roomId]);

  // Handle start time change - reset end time if needed
  const handleStartTimeChange = (newStartTime: string) => {
    setStartTime(newStartTime);
    setErrors((prev) => ({ ...prev, startTime: undefined }));
    // Reset end time if it's now invalid
    if (endTime && endTime <= newStartTime) {
      setEndTime('');
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!roomId) {
      newErrors.roomId = 'Please select a room';
    }
    if (!date) {
      newErrors.date = 'Please select a date';
    } else {
      const selectedDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today) {
        newErrors.date = 'Cannot book for a past date';
      }
    }
    if (!startTime) {
      newErrors.startTime = 'Please select a start time';
    }
    if (!endTime) {
      newErrors.endTime = 'Please select an end time';
    }
    if (startTime && endTime && startTime >= endTime) {
      newErrors.endTime = 'End time must be after start time';
    }

    // Check if start time is in the past for today
    if (date === getTodayString() && startTime) {
      const now = new Date();
      const [hours, minutes] = startTime.split(':').map(Number);
      const selectedTime = new Date();
      selectedTime.setHours(hours, minutes, 0, 0);
      if (selectedTime < now) {
        newErrors.startTime = 'Cannot book for a past time';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Create booking mutation with optimistic updates
  const createMutation = useMutation({
    mutationFn: createBooking,
    onMutate: async (newBooking: CreateBookingDTO) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['myBookings'] });
      await queryClient.cancelQueries({ queryKey: ['availability'] });

      // Snapshot previous value
      const previousBookings = queryClient.getQueryData<Booking[]>(['myBookings']);

      // Optimistically add the new booking
      const tempBooking: Booking = {
        id: `temp-${Date.now()}`,
        roomId: newBooking.roomId,
        userId: user?.id || '',
        startTime: newBooking.startTime,
        endTime: newBooking.endTime,
        status: 'active',
        roomName: selectedRoom?.name,
        userName: user?.name,
        createdAt: new Date().toISOString(),
      };

      queryClient.setQueryData<Booking[]>(['myBookings'], (old) => {
        return old ? [tempBooking, ...old] : [tempBooking];
      });

      return { previousBookings };
    },
    onError: (error, _variables, context) => {
      // Rollback on error
      if (context?.previousBookings) {
        queryClient.setQueryData(['myBookings'], context.previousBookings);
      }

      if (error instanceof BookingConflictError) {
        setConflictingBookings(error.conflictingBookings);
        setShowConflict(true);
      } else {
        toast.error('Failed to create booking. Please try again.');
      }
    },
    onSuccess: () => {
      toast.success('Booking created successfully!');
      // Invalidate queries to refetch fresh data
      queryClient.invalidateQueries({ queryKey: ['myBookings'] });
      queryClient.invalidateQueries({ queryKey: ['availability'] });
      navigate('/my-bookings');
    },
    onSettled: () => {
      // Ensure data consistency
      queryClient.invalidateQueries({ queryKey: ['myBookings'] });
      queryClient.invalidateQueries({ queryKey: ['availability'] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    // Construct ISO datetime strings
    const startDateTime = `${date}T${startTime}:00.000Z`;
    const endDateTime = `${date}T${endTime}:00.000Z`;

    createMutation.mutate({
      roomId,
      startTime: startDateTime,
      endTime: endDateTime,
    });
  };

  return (
    <Layout isConnected={isConnected}>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-primary mb-6 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Create Booking</h1>
          <p className="text-gray-500">Reserve a room for your meeting</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Room Selection */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <MapPin className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">Select Room</h2>
                <p className="text-sm text-gray-500">Choose where you want to meet</p>
              </div>
            </div>

            <div className="relative">
              <select
                id="room"
                value={roomId}
                onChange={(e) => {
                  setRoomId(e.target.value);
                  setErrors((prev) => ({ ...prev, roomId: undefined }));
                }}
                className={`w-full px-4 py-3 border rounded-xl text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer appearance-none ${
                  errors.roomId ? 'border-red-300' : 'border-gray-300'
                }`}
                disabled={roomsLoading}
              >
                <option value="">Select a room...</option>
                {rooms?.map((room: Room) => (
                  <option key={room.id} value={room.id}>
                    {room.name} (Capacity: {room.capacity})
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <Users className="w-5 h-5 text-gray-400" />
              </div>
            </div>
            {errors.roomId && (
              <p className="mt-2 text-sm text-red-500">{errors.roomId}</p>
            )}
            {selectedRoom && (
              <div className="mt-3 flex items-center gap-2 text-sm text-secondary">
                <CheckCircle className="w-4 h-4" />
                <span>Capacity: {selectedRoom.capacity} people</span>
              </div>
            )}
          </div>

          {/* Date Selection */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">Select Date</h2>
                <p className="text-sm text-gray-500">When do you need the room?</p>
              </div>
            </div>

            <input
              type="date"
              id="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setErrors((prev) => ({ ...prev, date: undefined }));
              }}
              min={getTodayString()}
              className={`w-full px-4 py-3 border rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer ${
                errors.date ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.date && (
              <p className="mt-2 text-sm text-red-500">{errors.date}</p>
            )}
            {date && (
              <p className="mt-2 text-sm text-gray-500">
                {formatDisplayDate(date)}
              </p>
            )}
          </div>

          {/* Time Selection */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">Select Time</h2>
                <p className="text-sm text-gray-500">Working hours: 8:00 AM - 6:00 PM</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-2">
                  Start Time
                </label>
                <select
                  id="startTime"
                  value={startTime}
                  onChange={(e) => handleStartTimeChange(e.target.value)}
                  className={`w-full px-4 py-3 border rounded-xl text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer ${
                    errors.startTime ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select...</option>
                  {TIME_SLOTS.map((slot) => (
                    <option key={slot.value} value={slot.value}>
                      {slot.label}
                    </option>
                  ))}
                </select>
                {errors.startTime && (
                  <p className="mt-2 text-sm text-red-500">{errors.startTime}</p>
                )}
              </div>

              <div>
                <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-2">
                  End Time
                </label>
                <select
                  id="endTime"
                  value={endTime}
                  onChange={(e) => {
                    setEndTime(e.target.value);
                    setErrors((prev) => ({ ...prev, endTime: undefined }));
                  }}
                  className={`w-full px-4 py-3 border rounded-xl text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer ${
                    errors.endTime ? 'border-red-300' : 'border-gray-300'
                  }`}
                  disabled={!startTime}
                >
                  <option value="">Select...</option>
                  {filteredEndSlots.map((slot) => (
                    <option key={slot.value} value={slot.value}>
                      {slot.label}
                    </option>
                  ))}
                </select>
                {errors.endTime && (
                  <p className="mt-2 text-sm text-red-500">{errors.endTime}</p>
                )}
              </div>
            </div>
          </div>

          {/* General Error */}
          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-red-600 text-sm">{errors.general}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="w-full bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 cursor-pointer"
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creating Booking...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                Create Booking
              </>
            )}
          </button>
        </form>
      </div>

      {/* Conflict Modal */}
      <ConflictModal
        isOpen={showConflict}
        onClose={() => setShowConflict(false)}
        conflictingBookings={conflictingBookings}
        selectedDate={date}
      />
    </Layout>
  );
};
