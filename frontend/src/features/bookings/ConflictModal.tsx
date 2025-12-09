import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, AlertTriangle, Calendar, Clock, User } from 'lucide-react';
import type { Booking } from '../../types/booking';
import { formatDisplayDate, formatTime } from '../../utils/date';

interface ConflictModalProps {
  isOpen: boolean;
  onClose: () => void;
  conflictingBookings: Booking[];
  selectedDate?: string;
}

export const ConflictModal = ({ isOpen, onClose, conflictingBookings, selectedDate }: ConflictModalProps) => {
  const navigate = useNavigate();

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

  if (!isOpen) return null;

  const handleViewAvailability = () => {
    const params = selectedDate ? `?date=${selectedDate}` : '';
    navigate(`/availability${params}`);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" />
      
      {/* Modal */}
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
          <h2 className="text-xl font-bold text-gray-900 text-center">Room Already Booked</h2>
          <p className="text-gray-500 text-center mt-2">
            This room is unavailable during your selected time
          </p>
        </div>

        {/* Conflicting Bookings */}
        {conflictingBookings.length > 0 && (
          <div className="px-6 pb-4">
            <p className="text-sm font-medium text-gray-700 mb-3">Existing bookings:</p>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {conflictingBookings.map((booking, index) => (
                <div 
                  key={booking.id || index}
                  className="bg-gray-50 rounded-xl p-3 border border-gray-100"
                >
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDisplayDate(booking.startTime)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                    <Clock className="w-4 h-4" />
                    <span>{formatTime(booking.startTime)} - {formatTime(booking.endTime)}</span>
                  </div>
                  {(booking.userName || booking.user?.name) && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <User className="w-4 h-4" />
                      <span>Booked by {booking.userName || booking.user?.name}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="p-6 pt-2 flex flex-col gap-3">
          <button
            onClick={onClose}
            className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 px-4 rounded-xl transition-colors cursor-pointer"
          >
            Choose Different Time
          </button>
          <button
            onClick={handleViewAvailability}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-4 rounded-xl transition-colors cursor-pointer"
          >
            View Availability
          </button>
        </div>
      </div>
    </div>
  );
};

