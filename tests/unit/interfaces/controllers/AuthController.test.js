const AuthController = require('../../../../src/interfaces/http/controllers/AuthController');
const authService = require('../../../../src/application/usecases/AuthService');
const User = require('../../../../src/domain/entities/User');

jest.mock('../../../../src/application/usecases/AuthService');

describe('AuthController', () => {
  let mockRes;
  let mockNext;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  const mockUser = new User({
    id: '507f1f77bcf86cd799439011',
    nome: 'Ana Silva',
    email: 'ana@email.com',
    senha: 'hashed',
    role: 'student',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  describe('register', () => {
    it('should return 201 with user data on successful register', async () => {
      // Given: valid registration data
      const mockReq = {
        body: { nome: 'Ana', email: 'ana@email.com', senha: '123456', role: 'student' },
      };
      authService.register.mockResolvedValue(mockUser);

      // When: register is called
      await AuthController.register(mockReq, mockRes, mockNext);

      // Then: responds with 201 and user data
      expect(authService.register).toHaveBeenCalledWith(mockReq.body);
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          id: mockUser.id,
          nome: mockUser.nome,
          email: mockUser.email,
          role: mockUser.role,
        }),
      });
      // senha should not be in response
      const responseData = mockRes.json.mock.calls[0][0].data;
      expect(responseData.senha).toBeUndefined();
    });

    it('should propagate errors to next middleware', async () => {
      // Given: service throws error
      const mockReq = { body: {} };
      const error = new Error('Something went wrong');
      authService.register.mockRejectedValue(error);

      // When: register is called
      await AuthController.register(mockReq, mockRes, mockNext);

      // Then: error is passed to next
      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('login', () => {
    it('should return 200 with user and token on successful login', async () => {
      // Given: valid credentials
      const mockReq = { body: { email: 'ana@email.com', senha: '123456' } };
      authService.login.mockResolvedValue({ user: mockUser, token: 'jwt-token-here' });

      // When: login is called
      await AuthController.login(mockReq, mockRes, mockNext);

      // Then: responds with 200, user and token
      expect(authService.login).toHaveBeenCalledWith(mockReq.body);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          user: expect.objectContaining({
            id: mockUser.id,
            email: mockUser.email,
          }),
          token: 'jwt-token-here',
        },
      });
    });

    it('should propagate errors to next middleware', async () => {
      // Given: service throws error
      const mockReq = { body: {} };
      const error = new Error('Auth failed');
      authService.login.mockRejectedValue(error);

      // When: login is called
      await AuthController.login(mockReq, mockRes, mockNext);

      // Then: error is passed to next
      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});
