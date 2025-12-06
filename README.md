# 🏨 Booking Management System

A full-stack booking management system with an Airbnb-inspired UI, built with TypeScript, React, and Node.js.

## 🏗️ Architecture

```
test-booking-app/
├── backend/                 # Express.js API server
│   ├── src/
│   │   ├── config/         # Database and app configuration
│   │   ├── controllers/    # Route controllers
│   │   ├── middlewares/    # Express middlewares
│   │   ├── models/         # Mongoose models
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   ├── types/          # TypeScript types
│   │   ├── utils/          # Utility functions
│   │   └── server.ts       # Entry point
│   └── package.json
├── frontend/                # React + Vite application
│   ├── src/
│   │   ├── api/            # API client functions
│   │   ├── components/     # Reusable UI components
│   │   ├── features/       # Feature-based modules
│   │   ├── hooks/          # Custom React hooks
│   │   ├── types/          # TypeScript types
│   │   ├── utils/          # Utility functions
│   │   └── App.tsx         # Root component
│   └── package.json
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v20+)
- MongoDB (local or Atlas)
- npm or yarn

### Backend Setup

1. Navigate to backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file from example:
   ```bash
   cp .env.example .env
   ```

4. Update `.env` with your MongoDB connection string and JWT secret.

5. Start development server:
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:5000`

### Frontend Setup

1. Navigate to frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file from example:
   ```bash
   cp .env.example .env
   ```

4. Start development server:
   ```bash
   npm run dev
   ```

The app will be available at `http://localhost:5173`

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (jsonwebtoken)
- **Validation**: Zod
- **Language**: TypeScript

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: TanStack Query
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Icons**: Lucide React
- **Language**: TypeScript

## 📝 Available Scripts

### Backend

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm start` | Start production server |

### Frontend

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |

## 🎨 Design System

The UI follows an Airbnb-inspired design with:

- **Primary Color**: `#FF5A5F` (Coral Red)
- **Secondary Color**: `#00A699` (Teal)
- **Neutral Color**: `#484848` (Dark Gray)
- **Border Radius**: 12px (default), 16px (large)
- **Font Family**: Circular, system-ui, sans-serif

## 📄 License

ISC

