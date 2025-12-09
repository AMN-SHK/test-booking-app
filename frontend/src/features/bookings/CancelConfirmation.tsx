import { useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, AlertTriangle, Calendar, Clock, MapPin, Loader2 } from 'lucide-react';
import { cancelBooking } from '../../api/bookings';
import { useToast } from '../../hooks/useToast';
import { formatDisplayDate, formatTime } from '../../utils/date';
import type { Booking } from '../../types/booking';

interface CancelConfirmationProps {
  booking: Booking;
  isOpen: boolean;
  onClose: () => void;
}

export const CancelConfirmation = ({ booking, isOpen, onClose }: CancelConfirmationProps) => {
  const queryClient = useQueryClient();
  const toast = useToast();

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

  // Cancel mutation with optimistic updates
  const cancelMutation = useMutation({
    mutationFn: () => cancelBooking(booking.id),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['myBookings'] });
      await queryClient.cancelQueries({ queryKey: ['availability'] });

      const previousBookings = queryClient.getQueryData<Booking[]>(['myBookings']);

      // Optimistically update the booking status
      queryClient.setQueryData<Booking[]>(['myBookings'], (old) => {
        if (!old) return old;
        return old.map((b) =>
          b.id === booking.id ? { ...b, status: 'cancelled' as const } : b
        );
      });

      return { previousBookings };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousBookings) {
        queryClient.setQueryData(['myBookings'], context.previousBookings);
      }
      toast.error('Failed to cancel booking. Please try again.');
    },
    onSuccess: () => {
      toast.success('Booking cancelled successfully');
      queryClient.invalidateQueries({ queryKey: ['myBookings'] });
      queryClient.invalidateQueries({ queryKey: ['availability'] });
      onClose();
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['myBookings'] });
      queryClient.invalidateQueries({ queryKey: ['availability'] });
    },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" />
      
      <div 
        className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="p-6 pb-4">
          <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-7 h-7 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 text-center">Cancel Booking?</h2>
          <p className="text-gray-500 text-center mt-2">
            Are you sure you want to cancel this booking?
          </p>
        </div>

        {/* Booking Details */}
        <div className="px-6 pb-4">
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <div className="flex items-center gap-2 text-gray-600 mb-2">
              <MapPin className="w-4 h-4" />
              <span className="font-medium">{booking.roomName || 'Room'}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">{formatDisplayDate(booking.startTime)}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-500">
              <Clock className="w-4 h-4" />
              <span className="text-sm">{formatTime(booking.startTime)} - {formatTime(booking.endTime)}</span>
            </div>
          </div>
        </div>

        {/* Warning */}
        <div className="px-6 pb-4">
          <p className="text-sm text-red-600 text-center">
            ⚠️ This action cannot be undone
          </p>
        </div>

        {/* Actions */}
        <div className="p-6 pt-2 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-4 rounded-xl transition-colors cursor-pointer"
          >
            No, Keep Booking
          </button>
          <button
            onClick={() => cancelMutation.mutate()}
            disabled={cancelMutation.isPending}
            className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white font-semibold py-3 px-4 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            {cancelMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Cancelling...
              </>
            ) : (
              'Yes, Cancel Booking'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

