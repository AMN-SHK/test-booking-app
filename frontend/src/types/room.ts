export interface Room {
  id: string;
  name: string;
  capacity: number;
  createdAt: string;
}

export interface TimeSlot {
  start: string;
  end: string;
}

export interface RoomAvailability {
  roomId: string;
  roomName: string;
  capacity: number;
  availableSlots: TimeSlot[];
}

