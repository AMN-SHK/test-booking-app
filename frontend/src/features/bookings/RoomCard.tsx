import { useNavigate } from 'react-router-dom';
import { Users, Clock, Ban } from 'lucide-react';
import type { RoomAvailability } from '../../types/room';
import { formatTime } from '../../utils/date';

interface RoomCardProps {
  room: RoomAvailability;
  selectedDate: string;
}

export const RoomCard = ({ room, selectedDate }: RoomCardProps) => {
  const navigate = useNavigate();
  const hasSlots = room.availableSlots.length > 0;

  const handleSlotClick = (slot: { start: string; end: string }) => {
    const params = new URLSearchParams({
      roomId: room.roomId,
      roomName: room.roomName,
      date: selectedDate,
      startTime: slot.start,
      endTime: slot.end,
    });
    navigate(`/bookings/new?${params.toString()}`);
  };

  return (
    <div className={`rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden ${
      hasSlots 
        ? 'bg-gradient-to-br from-primary/5 via-white to-secondary/5' 
        : 'bg-gray-100'
    }`}>
      {/* Header */}
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{room.roomName}</h3>
            <div className="flex items-center gap-1.5 mt-1 text-gray-500">
              <Users className="w-4 h-4" />
              <span className="text-sm">Capacity: {room.capacity}</span>
            </div>
          </div>
          {hasSlots ? (
            <span className="px-3 py-1 bg-secondary/10 text-secondary text-xs font-semibold rounded-full">
              {room.availableSlots.length} slot{room.availableSlots.length !== 1 ? 's' : ''}
            </span>
          ) : (
            <span className="px-3 py-1 bg-red-100 text-red-600 text-xs font-semibold rounded-full">
              Fully Booked
            </span>
          )}
        </div>
      </div>

      {/* Slots */}
      <div className="p-5">
        {hasSlots ? (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-gray-500 mb-3">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-medium">Available Times</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {room.availableSlots.map((slot, index) => (
                <button
                  key={index}
                  onClick={() => handleSlotClick(slot)}
                  className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:border-primary hover:text-primary hover:bg-primary/5 transition-all cursor-pointer shadow-sm hover:shadow"
                >
                  {formatTime(slot.start)} - {formatTime(slot.end)}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-gray-400">
            <Ban className="w-10 h-10 mb-2" />
            <p className="text-sm font-medium">No availability</p>
            <p className="text-xs">Try a different date</p>
          </div>
        )}
      </div>
    </div>
  );
};
