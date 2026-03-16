require('dotenv').config();

const express = require('express');
const swaggerUi = require('swagger-ui-express');

const { connectDatabase } = require('./infrastructure/database/connection');
const logger = require('./infrastructure/logging/logger');
const swaggerSpec = require('./infrastructure/swagger/swaggerConfig');
const errorHandler = require('./interfaces/http/middlewares/errorHandler');
const postRoutes = require('./interfaces/http/routes/postRoutes');
const healthRoutes = require('./interfaces/http/routes/healthRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    query: req.query,
    ip: req.ip,
  });
  next();
});

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use('/health', healthRoutes);
app.use('/posts', postRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: 'Rota não encontrada',
    },
  });
});

// Error handler (must be last)
app.use(errorHandler);

/**
 * Start the server
 */
const startServer = async () => {
  try {
    // Connect to database
    await connectDatabase();

    // Start listening
    app.listen(PORT, () => {
      logger.info(`Servidor rodando na porta ${PORT}`);
      logger.info(`Documentação disponível em http://localhost:${PORT}/api-docs`);
      logger.info(`Health check disponível em http://localhost:${PORT}/health`);
    });
  } catch (error) {
    logger.error('Falha ao iniciar o servidor:', error);
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start server if not in test mode
if (process.env.NODE_ENV !== 'test') {
  startServer();
}

module.exports = app;
