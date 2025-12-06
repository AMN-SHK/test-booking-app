import mongoose, { Document, Schema } from 'mongoose';

export interface IRoom extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  capacity: number;
  createdAt: Date;
  updatedAt: Date;
}

const roomSchema = new Schema<IRoom>(
  {
    name: {
      type: String,
      required: [true, 'Room name is required'],
      minlength: [2, 'Room name must be at least 2 characters'],
      trim: true,
    },
    capacity: {
      type: Number,
      required: [true, 'Capacity is required'],
      min: [1, 'Capacity must be at least 1'],
      max: [100, 'Capacity cannot exceed 100'],
    },
  },
  {
    timestamps: true,
  }
);

// index on name for faster lookups
roomSchema.index({ name: 1 });

const Room = mongoose.model<IRoom>('Room', roomSchema);

export default Room;

