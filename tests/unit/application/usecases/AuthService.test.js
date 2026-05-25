const AuthService = require('../../../../src/application/usecases/AuthService');
const userRepository = require('../../../../src/infrastructure/repositories/UserRepository');
const logger = require('../../../../src/infrastructure/logging/logger');
const User = require('../../../../src/domain/entities/User');
const {
  ConflictError,
  UnauthorizedError,
  ForbiddenError,
} = require('../../../../src/domain/errors/AppError');

jest.mock('../../../../src/infrastructure/repositories/UserRepository');
jest.mock('../../../../src/infrastructure/logging/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}));

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.TEACHER_ACCESS_CODE = 'POSTECH-TEACHER-2026';
    process.env.JWT_SECRET = 'test-secret';
    process.env.JWT_EXPIRES_IN = '7d';
  });

  afterEach(() => {
    delete process.env.TEACHER_ACCESS_CODE;
    delete process.env.JWT_SECRET;
    delete process.env.JWT_EXPIRES_IN;
  });

  const mockUser = new User({
    id: '507f1f77bcf86cd799439011',
    nome: 'Ana Silva',
    email: 'ana@email.com',
    senha: '$2a$10$hashedpassword',
    role: 'student',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  describe('register', () => {
    it('should create a student account when valid data is provided', async () => {
      // Given: valid student registration data
      userRepository.findByEmail.mockResolvedValue(null);
      userRepository.create.mockResolvedValue(mockUser);

      // When: register is called
      const result = await AuthService.register({
        nome: 'Ana Silva',
        email: 'ana@email.com',
        senha: '123456',
        role: 'student',
      });

      // Then: user is created and returned
      expect(userRepository.findByEmail).toHaveBeenCalledWith('ana@email.com');
      expect(userRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          nome: 'Ana Silva',
          email: 'ana@email.com',
          role: 'student',
        })
      );
      expect(result).toEqual(mockUser);
    });

    it('should register teacher with valid access code', async () => {
      // Given: teacher role with correct codigoAcesso
      const teacherUser = new User({ ...mockUser, role: 'teacher' });
      userRepository.findByEmail.mockResolvedValue(null);
      userRepository.create.mockResolvedValue(teacherUser);

      // When: register is called with valid code
      const result = await AuthService.register({
        nome: 'Prof Maria',
        email: 'maria@email.com',
        senha: '123456',
        role: 'teacher',
        codigoAcesso: 'POSTECH-TEACHER-2026',
      });

      // Then: teacher account is created
      expect(result).toEqual(teacherUser);
      expect(userRepository.create).toHaveBeenCalled();
    });

    it('should reject teacher registration when access code is invalid', async () => {
      // Given: teacher role with wrong codigoAcesso
      // When/Then: ForbiddenError is thrown
      await expect(
        AuthService.register({
          nome: 'Fake Teacher',
          email: 'fake@email.com',
          senha: '123456',
          role: 'teacher',
          codigoAcesso: 'WRONG-CODE',
        })
      ).rejects.toThrow(ForbiddenError);

      await expect(
        AuthService.register({
          nome: 'Fake Teacher',
          email: 'fake@email.com',
          senha: '123456',
          role: 'teacher',
          codigoAcesso: 'WRONG-CODE',
        })
      ).rejects.toThrow('Código de acesso inválido para perfil professor');

      expect(userRepository.findByEmail).not.toHaveBeenCalled();
    });

    it('should reject teacher registration when access code is missing', async () => {
      // Given: teacher role without codigoAcesso
      // When/Then: ForbiddenError is thrown
      await expect(
        AuthService.register({
          nome: 'Fake Teacher',
          email: 'fake@email.com',
          senha: '123456',
          role: 'teacher',
        })
      ).rejects.toThrow(ForbiddenError);

      expect(userRepository.findByEmail).not.toHaveBeenCalled();
    });

    it('should reject registration when email already exists', async () => {
      // Given: email already in use
      userRepository.findByEmail.mockResolvedValue(mockUser);

      // When/Then: ConflictError is thrown
      await expect(
        AuthService.register({
          nome: 'Ana',
          email: 'ana@email.com',
          senha: '123456',
          role: 'student',
        })
      ).rejects.toThrow(ConflictError);

      await expect(
        AuthService.register({
          nome: 'Ana',
          email: 'ana@email.com',
          senha: '123456',
          role: 'student',
        })
      ).rejects.toThrow('Email já cadastrado');
    });

    it('should hash the password before creating user', async () => {
      // Given: valid registration data
      userRepository.findByEmail.mockResolvedValue(null);
      userRepository.create.mockResolvedValue(mockUser);

      // When: register is called
      await AuthService.register({
        nome: 'Ana',
        email: 'ana@email.com',
        senha: '123456',
        role: 'student',
      });

      // Then: create is called with hashed password (not plain)
      const createCall = userRepository.create.mock.calls[0][0];
      expect(createCall.senha).not.toBe('123456');
      expect(createCall.senha).toMatch(/^\$2[aby]\$/);
    });

    it('should log registration attempt and success', async () => {
      userRepository.findByEmail.mockResolvedValue(null);
      userRepository.create.mockResolvedValue(mockUser);

      await AuthService.register({
        nome: 'Ana',
        email: 'ana@email.com',
        senha: '123456',
        role: 'student',
      });

      expect(logger.info).toHaveBeenCalledWith('Registering new user', {
        email: 'ana@email.com',
        role: 'student',
      });
      expect(logger.info).toHaveBeenCalledWith('User registered successfully', {
        userId: mockUser.id,
        role: 'student',
      });
    });
  });

  describe('login', () => {
    const userWithPassword = new User({
      id: '507f1f77bcf86cd799439011',
      nome: 'Ana Silva',
      email: 'ana@email.com',
      senha: '$2a$10$K8Y/mYPJo4JWkE6Fx.YQ8OQ3Q8dM0Y3.BG1Y5m5n0DhmXv3zTTtq', // hash of '123456'
      role: 'student',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    it('should login with valid credentials and return token', async () => {
      // Given: valid credentials
      const bcrypt = require('bcryptjs');
      const hashedSenha = await bcrypt.hash('123456', 10);
      const user = new User({ ...userWithPassword, senha: hashedSenha });
      userRepository.findByEmail.mockResolvedValue(user);

      // When: login is called
      const result = await AuthService.login({
        email: 'ana@email.com',
        senha: '123456',
      });

      // Then: returns user and valid JWT token
      expect(result.user).toEqual(user);
      expect(result.token).toBeDefined();
      expect(typeof result.token).toBe('string');
      expect(result.token.split('.')).toHaveLength(3);
    });

    it('should reject login with unknown email', async () => {
      // Given: email not found
      userRepository.findByEmail.mockResolvedValue(null);

      // When/Then: UnauthorizedError
      await expect(
        AuthService.login({ email: 'unknown@email.com', senha: '123456' })
      ).rejects.toThrow(UnauthorizedError);

      await expect(
        AuthService.login({ email: 'unknown@email.com', senha: '123456' })
      ).rejects.toThrow('Credenciais inválidas');
    });

    it('should reject login with wrong password', async () => {
      // Given: user exists but password is wrong
      const bcrypt = require('bcryptjs');
      const hashedSenha = await bcrypt.hash('correct_password', 10);
      const user = new User({ ...userWithPassword, senha: hashedSenha });
      userRepository.findByEmail.mockResolvedValue(user);

      // When/Then: UnauthorizedError
      await expect(
        AuthService.login({ email: 'ana@email.com', senha: 'wrong_password' })
      ).rejects.toThrow(UnauthorizedError);
    });

    it('should not log sensitive data (senha)', async () => {
      userRepository.findByEmail.mockResolvedValue(null);

      await expect(
        AuthService.login({ email: 'ana@email.com', senha: 'secret123' })
      ).rejects.toThrow(UnauthorizedError);

      const logCalls = logger.info.mock.calls.flat();
      const logString = JSON.stringify(logCalls);
      expect(logString).not.toContain('secret123');
    });

    it('should log login attempt and success', async () => {
      const bcrypt = require('bcryptjs');
      const hashedSenha = await bcrypt.hash('123456', 10);
      const user = new User({ ...userWithPassword, senha: hashedSenha });
      userRepository.findByEmail.mockResolvedValue(user);

      await AuthService.login({ email: 'ana@email.com', senha: '123456' });

      expect(logger.info).toHaveBeenCalledWith('Login attempt', { email: 'ana@email.com' });
      expect(logger.info).toHaveBeenCalledWith('Login successful', { userId: user.id });
    });
  });
});
