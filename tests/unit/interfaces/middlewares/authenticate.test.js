const jwt = require('jsonwebtoken');
const authenticate = require('../../../../src/interfaces/http/middlewares/authenticate');
const { UnauthorizedError } = require('../../../../src/domain/errors/AppError');

describe('authenticate middleware', () => {
  const mockNext = jest.fn();
  const mockRes = {};

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
  });

  afterEach(() => {
    delete process.env.JWT_SECRET;
  });

  it('should attach user to req when token is valid', () => {
    // Given: a valid JWT token
    const payload = { id: '123', email: 'ana@email.com', role: 'teacher' };
    const token = jwt.sign(payload, 'test-secret', { expiresIn: '1h' });
    const mockReq = { headers: { authorization: `Bearer ${token}` } };

    // When: middleware is called
    authenticate(mockReq, mockRes, mockNext);

    // Then: user is attached to req
    expect(mockReq.user).toEqual(expect.objectContaining({
      id: '123',
      email: 'ana@email.com',
      role: 'teacher',
    }));
    expect(mockNext).toHaveBeenCalledWith();
  });

  it('should reject when Authorization header is missing', () => {
    // Given: no Authorization header
    const mockReq = { headers: {} };

    // When/Then: UnauthorizedError
    expect(() => authenticate(mockReq, mockRes, mockNext)).toThrow(UnauthorizedError);
    expect(() => authenticate(mockReq, mockRes, mockNext)).toThrow('Token não fornecido');
  });

  it('should reject when Authorization header does not start with Bearer', () => {
    // Given: wrong auth scheme
    const mockReq = { headers: { authorization: 'Basic abc123' } };

    // When/Then: UnauthorizedError
    expect(() => authenticate(mockReq, mockRes, mockNext)).toThrow(UnauthorizedError);
    expect(() => authenticate(mockReq, mockRes, mockNext)).toThrow('Token não fornecido');
  });

  it('should reject when token is expired', () => {
    // Given: an expired token
    const token = jwt.sign(
      { id: '123', email: 'ana@email.com', role: 'student' },
      'test-secret',
      { expiresIn: '-1s' }
    );
    const mockReq = { headers: { authorization: `Bearer ${token}` } };

    // When/Then: UnauthorizedError
    expect(() => authenticate(mockReq, mockRes, mockNext)).toThrow(UnauthorizedError);
    expect(() => authenticate(mockReq, mockRes, mockNext)).toThrow('Token inválido ou expirado');
  });

  it('should reject when token is malformed', () => {
    // Given: a malformed token
    const mockReq = { headers: { authorization: 'Bearer invalid.token.here' } };

    // When/Then: UnauthorizedError
    expect(() => authenticate(mockReq, mockRes, mockNext)).toThrow(UnauthorizedError);
    expect(() => authenticate(mockReq, mockRes, mockNext)).toThrow('Token inválido ou expirado');
  });
});
