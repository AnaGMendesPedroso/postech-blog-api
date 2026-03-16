const mongoose = require('mongoose');
const {
  connectDatabase,
  disconnectDatabase,
} = require('../../../../src/infrastructure/database/connection');
const logger = require('../../../../src/infrastructure/logging/logger');

// Mock mongoose
jest.mock('mongoose', () => ({
  connect: jest.fn(),
  disconnect: jest.fn(),
  connection: {
    on: jest.fn(),
    readyState: 1,
  },
}));

// Mock logger
jest.mock('../../../../src/infrastructure/logging/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}));

describe('Database Connection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
  });

  describe('connectDatabase', () => {
    it('should connect to MongoDB successfully', async () => {
      mongoose.connect.mockResolvedValue();

      await connectDatabase();

      expect(mongoose.connect).toHaveBeenCalledWith('mongodb://localhost:27017/test');
      expect(logger.info).toHaveBeenCalledWith('Conectado ao MongoDB com sucesso');
    });

    it('should use default URI when env not set', async () => {
      delete process.env.MONGODB_URI;
      mongoose.connect.mockResolvedValue();

      await connectDatabase();

      expect(mongoose.connect).toHaveBeenCalledWith('mongodb://localhost:27017/postech_blog');
    });

    it('should register error event handler', async () => {
      mongoose.connect.mockResolvedValue();

      await connectDatabase();

      expect(mongoose.connection.on).toHaveBeenCalledWith('error', expect.any(Function));
    });

    it('should register disconnected event handler', async () => {
      mongoose.connect.mockResolvedValue();

      await connectDatabase();

      expect(mongoose.connection.on).toHaveBeenCalledWith('disconnected', expect.any(Function));
    });

    it('should throw error when connection fails', async () => {
      const error = new Error('Connection failed');
      mongoose.connect.mockRejectedValue(error);

      await expect(connectDatabase()).rejects.toThrow('Connection failed');
      expect(logger.error).toHaveBeenCalled();
    });

    it('should handle error event', async () => {
      mongoose.connect.mockResolvedValue();
      let errorHandler;
      mongoose.connection.on.mockImplementation((event, handler) => {
        if (event === 'error') {
          errorHandler = handler;
        }
      });

      await connectDatabase();

      const testError = new Error('Connection error');
      errorHandler(testError);

      expect(logger.error).toHaveBeenCalledWith('Erro na conexão com MongoDB:', testError);
    });

    it('should handle disconnected event', async () => {
      mongoose.connect.mockResolvedValue();
      let disconnectedHandler;
      mongoose.connection.on.mockImplementation((event, handler) => {
        if (event === 'disconnected') {
          disconnectedHandler = handler;
        }
      });

      await connectDatabase();
      disconnectedHandler();

      expect(logger.warn).toHaveBeenCalledWith('Desconectado do MongoDB');
    });
  });

  describe('disconnectDatabase', () => {
    it('should disconnect from MongoDB successfully', async () => {
      mongoose.disconnect.mockResolvedValue();

      await disconnectDatabase();

      expect(mongoose.disconnect).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith('Desconectado do MongoDB');
    });

    it('should throw error when disconnect fails', async () => {
      const error = new Error('Disconnect failed');
      mongoose.disconnect.mockRejectedValue(error);

      await expect(disconnectDatabase()).rejects.toThrow('Disconnect failed');
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Erro ao desconectar'),
        expect.any(Error)
      );
    });
  });
});
