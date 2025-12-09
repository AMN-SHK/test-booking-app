import { useState, useEffect, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Calendar, Clock, MapPin, Loader2 } from 'lucide-react';
import { rescheduleBooking, BookingConflictError } from '../../api/bookings';
import { useToast } from '../../hooks/useToast';
import { ConflictModal } from './ConflictModal';
import { formatDisplayDate, formatTime, getTodayString } from '../../utils/date';
import type { Booking, RescheduleBookingDTO } from '../../types/booking';

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
const parseBookingTime = (isoString: string): string => {
  try {
    const d = new Date(isoString);
    return `${d.getUTCHours().toString().padStart(2, '0')}:${d.getUTCMinutes().toString().padStart(2, '0')}`;
  } catch {
    return '';
  }
};

interface RescheduleModalProps {
  booking: Booking;
  isOpen: boolean;
  onClose: () => void;
}

export const RescheduleModal = ({ booking, isOpen, onClose }: RescheduleModalProps) => {
  const queryClient = useQueryClient();
  const toast = useToast();

  // Parse current booking times - computed values, not state
  const currentDate = booking.startTime.split('T')[0];
  const currentStartTime = formatTime(booking.startTime);
  const currentEndTime = formatTime(booking.endTime);
  const initialStartTime = parseBookingTime(booking.startTime);
  const initialEndTime = parseBookingTime(booking.endTime);

  // Form state - initialize with booking values
  const [date, setDate] = useState(currentDate);
  const [startTime, setStartTime] = useState(initialStartTime);
  const [endTime, setEndTime] = useState(initialEndTime);
  const [errors, setErrors] = useState<{ date?: string; startTime?: string; endTime?: string }>({});

  // Conflict modal state
  const [showConflict, setShowConflict] = useState(false);
  const [conflictingBookings, setConflictingBookings] = useState<Booking[]>([]);

  // Reset form when booking changes or modal opens
  const bookingKey = `${booking.id}-${booking.startTime}-${booking.endTime}`;
  useEffect(() => {
    if (isOpen) {
      setDate(booking.startTime.split('T')[0]);
      setStartTime(parseBookingTime(booking.startTime));
      setEndTime(parseBookingTime(booking.endTime));
      setErrors({});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingKey, isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  // Filter end times
  const filteredEndSlots = useMemo(() => {
    if (!startTime) return TIME_SLOTS;
    return TIME_SLOTS.filter((slot) => slot.value > startTime);
  }, [startTime]);

  // Handle start time change
  const handleStartTimeChange = (newStartTime: string) => {
    setStartTime(newStartTime);
    setErrors((prev) => ({ ...prev, startTime: undefined }));
    if (endTime && endTime <= newStartTime) {
      setEndTime('');
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (!date) {
      newErrors.date = 'Please select a date';
    } else {
      const selectedDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today) {
        newErrors.date = 'Cannot reschedule to a past date';
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Reschedule mutation with optimistic updates
  const rescheduleMutation = useMutation({
    mutationFn: (data: RescheduleBookingDTO) => rescheduleBooking(booking.id, data),
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: ['myBookings'] });
      await queryClient.cancelQueries({ queryKey: ['availability'] });

      const previousBookings = queryClient.getQueryData<Booking[]>(['myBookings']);

      // Optimistically update the booking
      queryClient.setQueryData<Booking[]>(['myBookings'], (old) => {
        if (!old) return old;
        return old.map((b) =>
          b.id === booking.id
            ? { ...b, startTime: newData.startTime, endTime: newData.endTime }
            : b
        );
      });

      return { previousBookings };
    },
    onError: (error, _variables, context) => {
      if (context?.previousBookings) {
        queryClient.setQueryData(['myBookings'], context.previousBookings);
      }

      if (error instanceof BookingConflictError) {
        setConflictingBookings(error.conflictingBookings);
        setShowConflict(true);
      } else {
        toast.error('Failed to reschedule booking. Please try again.');
      }
    },
    onSuccess: () => {
      toast.success('Booking rescheduled successfully!');
      queryClient.invalidateQueries({ queryKey: ['myBookings'] });
      queryClient.invalidateQueries({ queryKey: ['availability'] });
      onClose();
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['myBookings'] });
      queryClient.invalidateQueries({ queryKey: ['availability'] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const startDateTime = `${date}T${startTime}:00.000Z`;
    const endDateTime = `${date}T${endTime}:00.000Z`;

    rescheduleMutation.mutate({ startTime: startDateTime, endTime: endDateTime });
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" />
        
        <div 
          className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full animate-scale-in max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 cursor-pointer z-10"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="p-6 pb-4">
            <h2 className="text-xl font-bold text-gray-900">Reschedule Booking</h2>
            <p className="text-gray-500 text-sm mt-1">Choose a new date and time</p>
          </div>

          {/* Current Booking Info */}
          <div className="px-6 pb-4">
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Current Booking</p>
              <div className="flex items-center gap-2 text-gray-600 mb-1">
                <MapPin className="w-4 h-4" />
                <span className="text-sm font-medium">{booking.roomName || 'Room'}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-500">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">{formatDisplayDate(currentDate)}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-500">
                <Clock className="w-4 h-4" />
                <span className="text-sm">{currentStartTime} - {currentEndTime}</span>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-6 pb-6">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">New Time</p>
            
            {/* Date */}
            <div className="mb-4">
              <label htmlFor="reschedule-date" className="block text-sm font-medium text-gray-700 mb-2">
                Date
              </label>
              <input
                type="date"
                id="reschedule-date"
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
              {errors.date && <p className="mt-1 text-sm text-red-500">{errors.date}</p>}
            </div>

            {/* Time */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label htmlFor="reschedule-start" className="block text-sm font-medium text-gray-700 mb-2">
                  Start Time
                </label>
                <select
                  id="reschedule-start"
                  value={startTime}
                  onChange={(e) => handleStartTimeChange(e.target.value)}
                  className={`w-full px-4 py-3 border rounded-xl text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer ${
                    errors.startTime ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select...</option>
                  {TIME_SLOTS.map((slot) => (
                    <option key={slot.value} value={slot.value}>{slot.label}</option>
                  ))}
                </select>
                {errors.startTime && <p className="mt-1 text-sm text-red-500">{errors.startTime}</p>}
              </div>

              <div>
                <label htmlFor="reschedule-end" className="block text-sm font-medium text-gray-700 mb-2">
                  End Time
                </label>
                <select
                  id="reschedule-end"
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
                    <option key={slot.value} value={slot.value}>{slot.label}</option>
                  ))}
                </select>
                {errors.endTime && <p className="mt-1 text-sm text-red-500">{errors.endTime}</p>}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-4 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={rescheduleMutation.isPending}
                className="flex-1 bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-white font-semibold py-3 px-4 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                {rescheduleMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Conflict Modal */}
      <ConflictModal
        isOpen={showConflict}
        onClose={() => setShowConflict(false)}
        conflictingBookings={conflictingBookings}
        selectedDate={date}
      />
    </>
  );
};
