# 🏨 Booking Management System

A full-stack room booking management system with an Airbnb-inspired UI, real-time updates via SSE, and comprehensive booking conflict detection. Built with TypeScript, React, and Node.js.

## 📑 Table of Contents

- [Architecture](#-architecture)
- [Quick Start (With Provided Env Files)](#-quick-start-with-provided-env-files)
- [Custom Setup (Your Own Config)](#-custom-setup-your-own-config)
- [Authentication Flow](#-authentication-flow)
- [Booking Conflict Logic](#-booking-conflict-logic)
- [API Endpoints](#-api-endpoints)
- [Tech Stack](#-tech-stack)
- [Test Credentials](#-test-credentials)

---

## 🏗️ Architecture

```
test-booking-app/
├── backend/                 # Express.js API server
│   ├── src/
│   │   ├── config/         # Database configuration
│   │   ├── controllers/    # Route controllers
│   │   ├── middlewares/    # Auth & error middlewares
│   │   ├── models/         # Mongoose models (User, Room, Booking)
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic (booking, availability, SSE)
│   │   ├── types/          # TypeScript interfaces
│   │   ├── utils/          # Auth helpers, errors, seed script
│   │   ├── validators/     # Zod validation schemas
│   │   └── server.ts       # Entry point
│   ├── .env.example        # Environment template
│   └── package.json
├── frontend/                # React + Vite application
│   ├── src/
│   │   ├── api/            # API client (auth, bookings, rooms)
│   │   ├── components/     # Reusable UI (Layout, Toast, Modals)
│   │   ├── contexts/       # React contexts (Toast)
│   │   ├── features/       # Feature modules
│   │   │   ├── admin/      # Admin dashboard, create room
│   │   │   ├── auth/       # Login, Register, AuthContext
│   │   │   ├── bookings/   # Availability, My Bookings, Create
│   │   │   └── dashboard/  # User dashboard
│   │   ├── hooks/          # Custom hooks (useBookingStream, useToast)
│   │   ├── types/          # TypeScript interfaces
│   │   ├── utils/          # Date utilities
│   │   └── App.tsx         # Root component with routes
│   ├── .env.example        # Environment template
│   └── package.json
└── README.md
```

---

## 🚀 Quick Start (With Provided Env Files)

If you have the pre-configured `.env` files from the email attachments, follow these steps:

### Prerequisites
- Node.js v20+
- npm or yarn

### Step 1: Backend Setup

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Copy the provided .env file (if not already present) or download them and move them to backend folder
# The .env should contain:
# - MONGODB_URI (connection string)
# - JWT_SECRET (secret key)
# - PORT=5000

# Seed the database with test data
npm run seed

# Start the server
npm run dev
```

**Expected output:**
```
MongoDB Connected: your-cluster.mongodb.net
Server is running on port 5000
```

### Step 2: Frontend Setup

```bash
# Navigate to frontend (in a new terminal)
cd frontend

# Install dependencies
npm install

# Copy the provided .env file (if not already present) or download them and move them to backend folder
# The .env should contain:
# - VITE_API_URL=http://localhost:5000/api

# Start the development server
npm run dev
```

**Expected output:**
```
VITE v7.x.x  ready in XXX ms
➜  Local:   http://localhost:5173/
```

### Step 3: Access the Application

1. Open `http://localhost:5173` in your browser
2. Login with test credentials (see [Test Credentials](#-test-credentials))

---

## ⚙️ Custom Setup (Your Own Config)

If you want to set up with your own MongoDB and configuration:

### Prerequisites
- Node.js v20+
- MongoDB Atlas account (or local MongoDB)
- npm or yarn

### Step 1: MongoDB Atlas Setup

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free cluster
3. Create a database user:
   - Go to **Database Access** → **Add New Database User**
   - Choose **Password** authentication
   - Set username and password (avoid special characters in password)
   - Set privileges to **Read and write to any database**
4. Configure network access:
   - Go to **Network Access** → **Add IP Address**
   - Click **Allow Access from Anywhere** (for development)
5. Get connection string:
   - Go to **Database** → **Connect** → **Connect your application**
   - Copy the connection string
   - Replace `<password>` with your database user password

### Step 2: Backend Configuration

```bash
cd backend
npm install
```

Create `.env` file:

```env
# MongoDB connection string
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/booking-app?retryWrites=true&w=majority

# JWT secret (generate a random string)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Server port
PORT=5000
```

**Important:** If your password contains special characters, URL-encode them:
- `@` → `%40`
- `#` → `%23`
- `$` → `%24`

Seed the database and start:

```bash
npm run seed   # Creates test users and rooms
npm run dev    # Start development server
```

### Step 3: Frontend Configuration

```bash
cd frontend
npm install
```

Create `.env` file:

```env
VITE_API_URL=http://localhost:5000/api
```

Start the development server:

```bash
npm run dev
```

---

## 🔐 Authentication Flow

The application uses **JWT (JSON Web Token)** based authentication:

### Registration Flow

```
┌─────────┐     POST /api/auth/register     ┌─────────┐
│ Client  │ ─────────────────────────────── │ Server  │
│         │   {name, email, password}       │         │
└─────────┘                                 └─────────┘
     │                                           │
     │                                           ▼
     │                              ┌─────────────────────┐
     │                              │ 1. Validate input   │
     │                              │ 2. Check email      │
     │                              │    exists (409)     │
     │                              │ 3. Hash password    │
     │                              │    (bcrypt, 10      │
     │                              │    salt rounds)     │
     │                              │ 4. Create user      │
     │                              │ 5. Generate JWT     │
     │                              │    (7 day expiry)   │
     │                              └─────────────────────┘
     │                                           │
     │      {success, data: {token, user}}       │
     │ ◄─────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────┐
│ Store token in memory/context  │
│ Set Authorization header       │
└─────────────────────────────────┘
```

### Login Flow

```
┌─────────┐      POST /api/auth/login       ┌─────────┐
│ Client  │ ─────────────────────────────── │ Server  │
│         │      {email, password}          │         │
└─────────┘                                 └─────────┘
     │                                           │
     │                                           ▼
     │                              ┌─────────────────────┐
     │                              │ 1. Find user by     │
     │                              │    email            │
     │                              │ 2. Compare password │
     │                              │    with bcrypt      │
     │                              │ 3. If invalid →     │
     │                              │    401 error        │
     │                              │ 4. Generate JWT     │
     │                              └─────────────────────┘
     │                                           │
     │      {success, data: {token, user}}       │
     │ ◄─────────────────────────────────────────┘
```

### Protected Routes

```
┌─────────┐    GET /api/bookings/me         ┌─────────┐
│ Client  │ ─────────────────────────────── │ Server  │
│         │  Authorization: Bearer <token>  │         │
└─────────┘                                 └─────────┘
     │                                           │
     │                                           ▼
     │                              ┌─────────────────────┐
     │                              │ authenticate        │
     │                              │ middleware:         │
     │                              │                     │
     │                              │ 1. Extract token    │
     │                              │    from header      │
     │                              │ 2. Verify JWT       │
     │                              │ 3. Decode payload   │
     │                              │    {userId, role}   │
     │                              │ 4. Attach to        │
     │                              │    req.user         │
     │                              └─────────────────────┘
     │                                           │
     │                                           ▼
     │                              ┌─────────────────────┐
     │                              │ Controller handles  │
     │                              │ request with        │
     │                              │ req.user available  │
     │                              └─────────────────────┘
```

### Role-Based Authorization

```javascript
// Admin-only routes use requireRole middleware
router.post('/rooms', authenticate, requireRole('admin'), createRoom);
router.get('/admin/bookings', authenticate, requireRole('admin'), getAllBookings);

// requireRole checks:
// 1. req.user exists (from authenticate middleware)
// 2. req.user.role is in allowed roles
// 3. Returns 403 if not authorized
```

### JWT Payload Structure

```typescript
interface JWTPayload {
  userId: string;    // MongoDB ObjectId
  role: 'user' | 'admin';
  iat: number;       // Issued at timestamp
  exp: number;       // Expiration timestamp (7 days)
}
```

---

## 📅 Booking Conflict Logic

The system prevents double-booking through comprehensive overlap detection:

### Working Hours

- **Available hours**: 8:00 AM - 6:00 PM (UTC)
- **Time slots**: 30-minute increments
- **Weekend booking**: Allowed (can be restricted if needed)

### Conflict Detection Algorithm

When creating or rescheduling a booking, the system checks for overlaps:

```javascript
// Query to find conflicting bookings
const conflicts = await Booking.find({
  roomId: requestedRoomId,
  status: 'active',
  $or: [
    // Case 1: Existing booking starts during new booking
    { startTime: { $gte: newStart, $lt: newEnd } },
    
    // Case 2: Existing booking ends during new booking
    { endTime: { $gt: newStart, $lte: newEnd } },
    
    // Case 3: Existing booking surrounds new booking
    { startTime: { $lte: newStart }, endTime: { $gte: newEnd } }
  ]
});
```

### Visual Overlap Scenarios

```
Timeline: 8AM -------- 10AM -------- 12PM -------- 2PM

Existing Booking:        [████████████]
                         10:00      12:00

❌ Conflict Cases:

1. Exact overlap:        [████████████]
                         10:00      12:00

2. Starts during:              [████████████]
                               11:00      1:00

3. Ends during:          [████████████]
                         9:00       11:00

4. Surrounds:            [██████████████████████]
                         9:00              1:00

5. Inside:                    [██████]
                              10:30  11:30

✅ No Conflict (Adjacent bookings allowed):

6. Before:               [████]
                         8:00  10:00

7. After:                              [████]
                                       12:00 2:00
```

### Conflict Response

When a conflict is detected, the API returns:

```json
{
  "success": false,
  "conflict": true,
  "message": "Room is already booked for this time slot",
  "conflictingBookings": [
    {
      "id": "...",
      "roomId": "...",
      "roomName": "Conference Room A",
      "startTime": "2025-03-10T10:00:00.000Z",
      "endTime": "2025-03-10T12:00:00.000Z",
      "userName": "John Doe"
    }
  ]
}
```

### Rescheduling Logic

When rescheduling, the system excludes the current booking from conflict check:

```javascript
// Exclude current booking when checking conflicts for reschedule
const conflicts = await Booking.find({
  roomId: booking.roomId,
  status: 'active',
  _id: { $ne: bookingId },  // Exclude current booking
  // ... overlap conditions
});
```

### Availability Calculation

The availability service calculates free slots by:

1. Get all active bookings for the room on the requested date
2. Start with full working hours (8 AM - 6 PM)
3. Subtract each booked time range
4. Return remaining free slots

```javascript
// Example: Room has bookings 10-11 AM and 2-3 PM
// Available slots returned:
[
  { start: "08:00", end: "10:00" },  // 2 hours
  { start: "11:00", end: "14:00" },  // 3 hours
  { start: "15:00", end: "18:00" }   // 3 hours
]
```

---

## 📡 API Endpoints

### Authentication

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | Login user | No |

### Rooms

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/rooms` | Get all rooms | No |
| POST | `/api/rooms` | Create room | Admin |
| GET | `/api/rooms/availability?date=YYYY-MM-DD` | Get availability | No |

### Bookings

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/bookings` | Create booking | User |
| GET | `/api/bookings/me` | Get my bookings | User |
| PATCH | `/api/bookings/:id/reschedule` | Reschedule booking | User* |
| PATCH | `/api/bookings/:id/cancel` | Cancel booking | User* |
| GET | `/api/bookings/stream` | SSE stream | Optional |

*User can modify own bookings, Admin can modify any booking

### Admin

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/admin/bookings` | Get all bookings grouped by room | Admin |

---

## 🛠️ Tech Stack

### Backend
| Technology | Purpose |
|------------|---------|
| Node.js | Runtime environment |
| Express.js | Web framework |
| MongoDB | Database |
| Mongoose | ODM for MongoDB |
| JWT | Authentication tokens |
| bcryptjs | Password hashing |
| Zod | Input validation |
| TypeScript | Type safety |

### Frontend
| Technology | Purpose |
|------------|---------|
| React 18 | UI framework |
| Vite | Build tool |
| TypeScript | Type safety |
| Tailwind CSS | Styling |
| TanStack Query | Server state management |
| React Router v6 | Routing |
| Axios | HTTP client |
| Lucide React | Icons |
| date-fns | Date utilities |

---

## 👤 Test Credentials

After running `npm run seed` in the backend:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@test.com | admin123 |
| User | user1@test.com | user123 |
| User | user2@test.com | user123 |

### Seeded Rooms

| Name | Capacity |
|------|----------|
| Conference Room A | 10 |
| Meeting Room B | 6 |
| Boardroom | 20 |
| Small Huddle | 4 |

---

## 📝 Available Scripts

### Backend

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Compile TypeScript to JavaScript |
| `npm start` | Start production server |
| `npm run seed` | Seed database with test data |

### Frontend

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

---

## 🎨 Design System

The UI follows an Airbnb-inspired design:

| Property | Value |
|----------|-------|
| Primary Color | `#FF5A5F` (Coral Red) |
| Secondary Color | `#00A699` (Teal) |
| Neutral Color | `#484848` (Dark Gray) |
| Border Radius | 12px (default), 16px (large) |
| Font Family | Circular, system-ui, sans-serif |

---

## 🔧 Troubleshooting

### MongoDB Connection Issues

1. **"bad auth: authentication failed"**
   - Check username/password in connection string
   - Ensure password is URL-encoded if it has special characters
   - Verify database user has correct permissions

2. **"Network timeout"**
   - Check Network Access in MongoDB Atlas
   - Add your IP or allow access from anywhere

### Frontend Issues

1. **CORS errors**
   - Ensure backend is running on port 5000
   - Check `VITE_API_URL` in frontend `.env`

2. **SSE not connecting**
   - Check browser console for connection errors
   - Verify `/api/bookings/stream` endpoint is accessible

---

## 📄 License

ISC
