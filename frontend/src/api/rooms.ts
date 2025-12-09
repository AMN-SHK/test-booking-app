import apiClient from './client';
import type { Room, RoomAvailability } from '../types/room';

interface BackendRoom {
  _id: string;
  name: string;
  capacity: number;
  createdAt: string;
}

interface RoomsResponse {
  success: boolean;
  data: BackendRoom[];
}

interface AvailabilityResponse {
  success: boolean;
  data: RoomAvailability[];
}

interface CreateRoomResponse {
  success: boolean;
  data: BackendRoom;
}

// Map backend _id to frontend id
const mapRoom = (room: BackendRoom): Room => ({
  id: room._id,
  name: room.name,
  capacity: room.capacity,
  createdAt: room.createdAt,
});

export const getRooms = async (): Promise<Room[]> => {
  const response = await apiClient.get<RoomsResponse>('/rooms');
  return response.data.data.map(mapRoom);
};

export const getRoomAvailability = async (date: string): Promise<RoomAvailability[]> => {
  const response = await apiClient.get<AvailabilityResponse>(`/rooms/availability?date=${date}`);
  return response.data.data;
};

export interface CreateRoomDTO {
  name: string;
  capacity: number;
}

export const createRoom = async (data: CreateRoomDTO): Promise<Room> => {
  const response = await apiClient.post<CreateRoomResponse>('/rooms', data);
  return mapRoom(response.data.data);
};
