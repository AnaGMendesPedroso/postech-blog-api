const authorizeRole = require('../../../../src/interfaces/http/middlewares/authorize');
const { ForbiddenError } = require('../../../../src/domain/errors/AppError');

describe('authorize middleware', () => {
  const mockNext = jest.fn();
  const mockRes = {};

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should allow access when role is permitted', () => {
    // Given: user with teacher role, route allows teacher
    const mockReq = { user: { id: '123', role: 'teacher' } };
    const middleware = authorizeRole('teacher');

    // When: middleware is called
    middleware(mockReq, mockRes, mockNext);

    // Then: next is called without error
    expect(mockNext).toHaveBeenCalledWith();
  });

  it('should allow access when role is in multiple allowed roles', () => {
    // Given: user with student role, route allows both
    const mockReq = { user: { id: '123', role: 'student' } };
    const middleware = authorizeRole('teacher', 'student');

    // When: middleware is called
    middleware(mockReq, mockRes, mockNext);

    // Then: next is called
    expect(mockNext).toHaveBeenCalledWith();
  });

  it('should deny access when role is not permitted', () => {
    // Given: user with student role, route allows only teacher
    const mockReq = { user: { id: '123', role: 'student' } };
    const middleware = authorizeRole('teacher');

    // When/Then: ForbiddenError
    expect(() => middleware(mockReq, mockRes, mockNext)).toThrow(ForbiddenError);
    expect(() => middleware(mockReq, mockRes, mockNext)).toThrow('Acesso negado para este perfil');
  });
});
