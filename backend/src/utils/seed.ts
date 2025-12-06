import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User';
import Room from '../models/Room';

dotenv.config();

const users = [
  {
    name: 'Admin User',
    email: 'admin@test.com',
    passwordHash: 'admin123',
    role: 'admin' as const,
  },
  {
    name: 'User One',
    email: 'user1@test.com',
    passwordHash: 'user123',
    role: 'user' as const,
  },
  {
    name: 'User Two',
    email: 'user2@test.com',
    passwordHash: 'user123',
    role: 'user' as const,
  },
];

const rooms = [
  {
    name: 'Conference Room A',
    capacity: 10,
  },
  {
    name: 'Meeting Room B',
    capacity: 6,
  },
  {
    name: 'Boardroom',
    capacity: 20,
  },
  {
    name: 'Small Huddle',
    capacity: 4,
  },
];

const seedDatabase = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) {
      throw new Error('MONGODB_URI not defined');
    }

    console.log('Connecting to database...');
    await mongoose.connect(mongoUri);
    console.log('Connected!');

    // clear existing data (be careful with this in prod lol)
    console.log('Clearing existing data...');
    await User.deleteMany({});
    await Room.deleteMany({});

    // insert seed users
    console.log('\nCreating seed users...');
    for (const userData of users) {
      const user = await User.create(userData);
      console.log(`  Created: ${user.email} (${user.role})`);
    }

    // insert seed rooms
    console.log('\nCreating seed rooms...');
    for (const roomData of rooms) {
      const room = await Room.create(roomData);
      console.log(`  Created: ${room.name} (capacity: ${room.capacity})`);
    }

    console.log('\n--- Seeding complete! ---');
    console.log('\nTest credentials:');
    console.log('  Admin: admin@test.com / admin123');
    console.log('  User1: user1@test.com / user123');
    console.log('  User2: user2@test.com / user123');
    console.log('\nRooms created: 4');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seedDatabase();
