const express = require('express');
const cors = require('cors');
const errorHandler = require('./middlewares/errorHandler');

const authRoutes = require('./routes/authRoutes');
const movieRoutes = require('./routes/movieRoutes');
const showRoutes = require('./routes/showRoutes');
const bookingRoutes = require('./routes/bookingRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auto-sync dynamic movies & live shows if needed (development & production)
if (process.env.NODE_ENV !== 'test') {
  const { autoSyncShowsIfNeeded } = require('./db/autoSync');
  app.use(async (req, res, next) => {
    if (req.method === 'GET' && (req.path.startsWith('/api/movies') || req.path.startsWith('/api/shows'))) {
      try {
        await autoSyncShowsIfNeeded();
      } catch (err) {
        // Continue even if db sync encounters a transient note
      }
    }
    next();
  });
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/shows', showRoutes);
app.use('/api/bookings', bookingRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ message: 'Resource not found' });
});

// Error handling middleware
app.use(errorHandler);

module.exports = app;
