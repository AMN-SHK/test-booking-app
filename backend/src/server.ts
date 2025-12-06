import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/database';
import { errorHandler } from './middlewares/errorHandler';
import { authenticate, requireRole } from './middlewares/authMiddleware';
import { JWTPayload } from './types/auth';

// Extend Express Request type locally
declare module 'express-serve-static-core' {
  interface Request {
    user?: JWTPayload;
  }
}

// Load environment variables
dotenv.config();

// Initialize express app
const app: Application = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test route - just to check if api is working
app.get('/', (_req: Request, res: Response) => {
  res.json({ message: 'API running' });
});

// Health check route
app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});


// Error handler middleware - must be last
app.use(errorHandler);

// Port configuration
const PORT = process.env.PORT || 5000;

// Start server
const startServer = async (): Promise<void> => {
  try {
    // Connect to database
    await connectDB();
    
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
