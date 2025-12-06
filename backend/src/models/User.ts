import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  role: 'user' | 'admin';
  createdAt: Date;
  updatedAt: Date;
  comparePassword(password: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required'],
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
  },
  {
    timestamps: true,
  }
);

// hash password before saving
userSchema.pre('save', async function (next) {
  // only hash if password was modified
  if (!this.isModified('passwordHash')) {
    return next();
  }

  try {
    const saltRounds = 10;
    this.passwordHash = await bcrypt.hash(this.passwordHash, saltRounds);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// compare password method
userSchema.methods.comparePassword = async function (
  password: string
): Promise<boolean> {
  // console.log('comparing passwords...'); // debug
  return bcrypt.compare(password, this.passwordHash);
};

const User = mongoose.model<IUser>('User', userSchema);

export default User;

