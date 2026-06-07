import express from 'express';
import cors from 'cors';
import { config } from './config/env';
import { supabaseAdmin } from './config/db';
import { redis } from './config/redis';
import authRoutes from './routes/auth';
import userRoutes from './routes/user';
import propertiesRoutes from './routes/properties';
import geocodeRoutes from './routes/geocode';
import dealsRoutes from './routes/deals';
import tasksRoutes from './routes/tasks';
import portfolioRoutes from './routes/portfolio';
import rulesRoutes from './routes/rules';
import { analyzeRouter, analysisRouter } from './routes/analyze';
import attomRoutes from './routes/attom';
import reitRoutes from './routes/reit';
import smsRoutes from './routes/sms';

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
app.use('/api/deals', dealsRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/analyze', analyzeRouter);
app.use('/api/analysis', analysisRouter);
app.use('/api/rules', rulesRoutes);
app.use('/api/attom', attomRoutes);
app.use('/api/reit', reitRoutes);
app.use('/api/sms', smsRoutes);

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
