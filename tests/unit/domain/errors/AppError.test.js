const {
  AppError,
  NotFoundError,
  ValidationError,
  ConflictError,
  InternalError,
} = require('../../../../src/domain/errors/AppError');

describe('AppError Classes', () => {
  describe('AppError', () => {
    it('should create error with default status code', () => {
      const error = new AppError('Test error');

      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(500);
      expect(error.isOperational).toBe(true);
      expect(error).toBeInstanceOf(Error);
    });

    it('should create error with custom status code', () => {
      const error = new AppError('Test error', 400);

      expect(error.statusCode).toBe(400);
    });

    it('should capture stack trace', () => {
      const error = new AppError('Test error');

      expect(error.stack).toBeDefined();
    });
  });

  describe('NotFoundError', () => {
    it('should create error with default resource', () => {
      const error = new NotFoundError();

      expect(error.message).toBe('Recurso não encontrado');
      expect(error.statusCode).toBe(404);
      expect(error.isOperational).toBe(true);
    });

    it('should create error with custom resource', () => {
      const error = new NotFoundError('Post');

      expect(error.message).toBe('Post não encontrado');
      expect(error.resource).toBe('Post');
    });
  });

  describe('ValidationError', () => {
    it('should create error with message only', () => {
      const error = new ValidationError('Invalid data');

      expect(error.message).toBe('Invalid data');
      expect(error.statusCode).toBe(400);
      expect(error.details).toBeNull();
    });

    it('should create error with details', () => {
      const details = [{ field: 'titulo', message: 'Required' }];
      const error = new ValidationError('Invalid data', details);

      expect(error.details).toEqual(details);
    });
  });

  describe('ConflictError', () => {
    it('should create error with message', () => {
      const error = new ConflictError('Resource already exists');

      expect(error.message).toBe('Resource already exists');
      expect(error.statusCode).toBe(409);
    });
  });

  describe('InternalError', () => {
    it('should create error with default message', () => {
      const error = new InternalError();

      expect(error.message).toBe('Erro interno do servidor');
      expect(error.statusCode).toBe(500);
    });

    it('should create error with custom message', () => {
      const error = new InternalError('Database connection failed');

      expect(error.message).toBe('Database connection failed');
    });
  });
});
