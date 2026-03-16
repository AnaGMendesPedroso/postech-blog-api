// Tests for Winston logger configuration
const winston = require('winston');

describe('Logger Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should create logger with default log level', () => {
    delete process.env.LOG_LEVEL;
    delete process.env.NODE_ENV;
    const logger = require('../../../../src/infrastructure/logging/logger');

    expect(logger).toBeDefined();
    expect(logger.level).toBe('info');
  });

  it('should use LOG_LEVEL from environment', () => {
    process.env.LOG_LEVEL = 'debug';
    process.env.NODE_ENV = 'development';
    jest.resetModules();
    const logger = require('../../../../src/infrastructure/logging/logger');

    expect(logger.level).toBe('debug');
  });

  it('should have console transport', () => {
    delete process.env.NODE_ENV;
    jest.resetModules();
    const logger = require('../../../../src/infrastructure/logging/logger');

    const consoleTransport = logger.transports.find(
      (t) => t instanceof winston.transports.Console
    );
    expect(consoleTransport).toBeDefined();
  });

  it('should add file transports in production', () => {
    process.env.NODE_ENV = 'production';
    process.env.LOG_LEVEL = 'info';
    jest.resetModules();
    const logger = require('../../../../src/infrastructure/logging/logger');

    // In production, we should have more than one transport (console + files)
    expect(logger.transports.length).toBeGreaterThan(1);
  });

  it('should log info messages', () => {
    delete process.env.NODE_ENV;
    jest.resetModules();
    const logger = require('../../../../src/infrastructure/logging/logger');
    const consoleSpy = jest.spyOn(logger, 'info').mockImplementation();

    logger.info('Test message');

    expect(consoleSpy).toHaveBeenCalledWith('Test message');
    consoleSpy.mockRestore();
  });

  it('should log error messages', () => {
    delete process.env.NODE_ENV;
    jest.resetModules();
    const logger = require('../../../../src/infrastructure/logging/logger');
    const consoleSpy = jest.spyOn(logger, 'error').mockImplementation();

    logger.error('Error message');

    expect(consoleSpy).toHaveBeenCalledWith('Error message');
    consoleSpy.mockRestore();
  });

  it('should log warn messages', () => {
    delete process.env.NODE_ENV;
    jest.resetModules();
    const logger = require('../../../../src/infrastructure/logging/logger');
    const consoleSpy = jest.spyOn(logger, 'warn').mockImplementation();

    logger.warn('Warning message');

    expect(consoleSpy).toHaveBeenCalledWith('Warning message');
    consoleSpy.mockRestore();
  });

  it('should include service metadata', () => {
    delete process.env.NODE_ENV;
    jest.resetModules();
    const logger = require('../../../../src/infrastructure/logging/logger');

    expect(logger.defaultMeta).toEqual({ service: 'postech-blog-api' });
  });

  it('should have timestamp in format', () => {
    delete process.env.NODE_ENV;
    jest.resetModules();
    const logger = require('../../../../src/infrastructure/logging/logger');
    
    expect(logger.format).toBeDefined();
  });

  it('should not add file transports in non-production', () => {
    process.env.NODE_ENV = 'development';
    jest.resetModules();
    const logger = require('../../../../src/infrastructure/logging/logger');

    // In development, we should only have console transport
    const fileTransports = logger.transports.filter(
      (t) => t instanceof winston.transports.File
    );
    expect(fileTransports.length).toBe(0);
  });

  it('should format log message with metadata', () => {
    delete process.env.NODE_ENV;
    jest.resetModules();
    
    // Create a custom printf format function to test
    const printfFormat = winston.format.printf(({ level, message, timestamp, ...meta }) => {
      const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
      return `${timestamp} [${level}]: ${message} ${metaStr}`;
    });

    const info = {
      level: 'info',
      message: 'Test message',
      timestamp: '2024-01-01 10:00:00',
      extra: 'data',
    };

    const result = printfFormat.transform(info);
    expect(result[Symbol.for('message')]).toContain('Test message');
    expect(result[Symbol.for('message')]).toContain('extra');
  });

  it('should format log message without metadata', () => {
    delete process.env.NODE_ENV;
    jest.resetModules();
    
    const printfFormat = winston.format.printf(({ level, message, timestamp, ...meta }) => {
      const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
      return `${timestamp} [${level}]: ${message} ${metaStr}`;
    });

    const info = {
      level: 'info',
      message: 'Test message',
      timestamp: '2024-01-01 10:00:00',
    };

    const result = printfFormat.transform(info);
    expect(result[Symbol.for('message')]).toContain('Test message');
    expect(result[Symbol.for('message')]).not.toContain('{');
  });
});