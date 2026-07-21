import express from 'express';
import dotenv from 'dotenv';
import logger from './utils/logger';
import { initializeDatabase } from './database/connection';
import authRoutes from './routes/auth.routes';
import complianceRoutes from './routes/compliance.routes';
import controlRoutes from './routes/control.routes';
import reportRoutes from './routes/report.routes';
import integrationRoutes from './routes/integration.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/compliance', complianceRoutes);
app.use('/api/controls', controlRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/integrations', integrationRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Initialize database and start server
const startServer = async () => {
  try {
    await initializeDatabase();
    logger.info('Database initialized successfully');
    
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
};

startServer();

export default app;
