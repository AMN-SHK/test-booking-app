import mongoose, { Document, Schema } from 'mongoose';

export interface IBooking extends Document {
  _id: mongoose.Types.ObjectId;
  roomId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  startTime: Date;
  endTime: Date;
  status: 'active' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

const bookingSchema = new Schema<IBooking>(
  {
    roomId: {
      type: Schema.Types.ObjectId,
      ref: 'Room',
      required: [true, 'Room is required'],
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    startTime: {
      type: Date,
      required: [true, 'Start time is required'],
    },
    endTime: {
      type: Date,
      required: [true, 'End time is required'],
    },
    status: {
      type: String,
      enum: ['active', 'cancelled'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

// validate that startTime is before endTime
bookingSchema.pre('save', function (next) {
  if (this.startTime >= this.endTime) {
    const err = new Error('Start time must be before end time');
    return next(err);
  }
  next();
});

// compound index for checking room availability / conflicts
bookingSchema.index({ roomId: 1, startTime: 1, endTime: 1 });

// index for user's bookings
bookingSchema.index({ userId: 1 });

// index for filtering by status
bookingSchema.index({ status: 1 });

const Booking = mongoose.model<IBooking>('Booking', bookingSchema);

export default Booking;

