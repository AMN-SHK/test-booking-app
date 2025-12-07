import Room, { IRoom } from '../models/Room';
import { RoomResponse } from '../types/room';

/**
 * Convert room document to response DTO
 */
const toRoomResponse = (room: IRoom): RoomResponse => {
  return {
    id: room._id.toString(),
    name: room.name,
    capacity: room.capacity,
    createdAt: room.createdAt,
  };
};

/**
 * Create a new room
 */
export const createRoom = async (
  name: string,
  capacity: number
): Promise<RoomResponse> => {
  const room = await Room.create({ name, capacity });
  
  console.log('Room created:', room.name);
  
  return toRoomResponse(room);
};

/**
 * Get all rooms sorted by name
 */
export const getAllRooms = async (): Promise<RoomResponse[]> => {
  const rooms = await Room.find().sort({ name: 1 });
  
  return rooms.map(toRoomResponse);
};

