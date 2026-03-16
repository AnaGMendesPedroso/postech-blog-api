const errorHandler = require('../../../../src/interfaces/http/middlewares/errorHandler');
const { AppError, NotFoundError, ValidationError } = require('../../../../src/domain/errors/AppError');

// Mock logger
jest.mock('../../../../src/infrastructure/logging/logger', () => ({
  error: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}));

describe('errorHandler Middleware', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = {
      path: '/test',
      method: 'GET',
      body: {},
      query: {},
      params: {},
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  it('should handle operational errors', () => {
    const error = new AppError('Test error', 400);

    errorHandler(error, mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      error: {
        message: 'Test error',
      },
    });
  });

  it('should handle NotFoundError', () => {
    const error = new NotFoundError('Post');

    errorHandler(error, mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      error: {
        message: 'Post não encontrado',
      },
    });
  });

  it('should handle ValidationError with details', () => {
    const details = [{ field: 'titulo', message: 'Required' }];
    const error = new ValidationError('Dados inválidos', details);

    errorHandler(error, mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      error: {
        message: 'Dados inválidos',
        details,
      },
    });
  });

  it('should handle non-operational errors as 500', () => {
    const error = new Error('Unexpected error');

    errorHandler(error, mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      error: {
        message: 'Erro interno do servidor',
      },
    });
  });

  it('should handle Mongoose ValidationError', () => {
    const error = {
      name: 'ValidationError',
      errors: {
        titulo: { path: 'titulo', message: 'Título é obrigatório' },
        conteudo: { path: 'conteudo', message: 'Conteúdo é obrigatório' },
      },
    };

    errorHandler(error, mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      error: {
        message: 'Dados inválidos',
        details: [
          { field: 'titulo', message: 'Título é obrigatório' },
          { field: 'conteudo', message: 'Conteúdo é obrigatório' },
        ],
      },
    });
  });

  it('should handle Mongoose CastError (invalid ObjectId)', () => {
    const error = {
      name: 'CastError',
      kind: 'ObjectId',
    };

    errorHandler(error, mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      error: {
        message: 'ID inválido',
      },
    });
  });

  it('should log errors', () => {
    const logger = require('../../../../src/infrastructure/logging/logger');
    const error = new Error('Test error');

    errorHandler(error, mockReq, mockRes, mockNext);

    expect(logger.error).toHaveBeenCalled();
  });
});
