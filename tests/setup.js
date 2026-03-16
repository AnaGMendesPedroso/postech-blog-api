// Jest setup file
// Configure test environment

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error';

// Increase timeout for async tests
jest.setTimeout(10000);
