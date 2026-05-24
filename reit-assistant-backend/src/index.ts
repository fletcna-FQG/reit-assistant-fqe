import express from 'express';
import cors from 'cors';
import { config } from './config/env';
import { supabaseAdmin } from './config/db';
import { redis } from './config/redis';
import authRoutes from './routes/auth';
import userRoutes from './routes/user';
import propertiesRoutes from './routes/properties';
import geocodeRoutes from './routes/geocode';

console.log('🔍 All modules imported successfully');

const app = express();

// CORS — Allow frontend to communicate with backend
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// Parse JSON bodies
app.use(express.json());

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/properties', propertiesRoutes);
app.use('/api/geocode', geocodeRoutes);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(config.server.port, () => {
  console.log(`🚀 Server running on port ${config.server.port}`);
  console.log(`🌍 Environment: ${config.server.env}`);
});

export default app;
