export interface CreateRoomDTO {
  name: string;
  capacity: number;
}

export interface RoomResponse {
  id: string;
  name: string;
  capacity: number;
  createdAt: Date;
}

export interface TimeSlot {
  startTime: Date;
  endTime: Date;
}

export interface RoomAvailability {
  roomId: string;
  roomName: string;
  date: Date;
  availableSlots: TimeSlot[];
  bookedSlots: TimeSlot[];
}

