const request = require('supertest');
const express = require('express');
const healthRoutes = require('../../../../src/interfaces/http/routes/healthRoutes');
const mongoose = require('mongoose');

// Create test app
const createTestApp = () => {
  const app = express();
  app.use('/health', healthRoutes);
  return app;
};

describe('Health Routes', () => {
  describe('GET /health', () => {
    it('should return health check with connected database', async () => {
      // Mock mongoose connection state
      Object.defineProperty(mongoose.connection, 'readyState', {
        value: 1,
        writable: true,
      });

      const app = createTestApp();
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('status', 'ok');
      expect(response.body.data).toHaveProperty('timestamp');
      expect(response.body.data).toHaveProperty('uptime');
      expect(response.body.data).toHaveProperty('database', 'connected');
    });

    it('should return health check with disconnected database', async () => {
      Object.defineProperty(mongoose.connection, 'readyState', {
        value: 0,
        writable: true,
      });

      const app = createTestApp();
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body.data.database).toBe('disconnected');
    });

    it('should return health check with connecting database', async () => {
      Object.defineProperty(mongoose.connection, 'readyState', {
        value: 2,
        writable: true,
      });

      const app = createTestApp();
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body.data.database).toBe('connecting');
    });

    it('should return health check with disconnecting database', async () => {
      Object.defineProperty(mongoose.connection, 'readyState', {
        value: 3,
        writable: true,
      });

      const app = createTestApp();
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body.data.database).toBe('disconnecting');
    });

    it('should return unknown for invalid database state', async () => {
      Object.defineProperty(mongoose.connection, 'readyState', {
        value: 99,
        writable: true,
      });

      const app = createTestApp();
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body.data.database).toBe('unknown');
    });
  });
});
