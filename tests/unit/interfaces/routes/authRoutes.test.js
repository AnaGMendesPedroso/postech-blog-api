const request = require('supertest');
const app = require('../../../../src/server');
const authService = require('../../../../src/application/usecases/AuthService');
const User = require('../../../../src/domain/entities/User');
const {
  ConflictError,
  UnauthorizedError,
  ForbiddenError,
} = require('../../../../src/domain/errors/AppError');

jest.mock('../../../../src/application/usecases/AuthService');

describe('Auth Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockUser = new User({
    id: '507f1f77bcf86cd799439011',
    nome: 'Ana Silva',
    email: 'ana@email.com',
    senha: 'hashed',
    role: 'student',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  });

  describe('POST /auth/register', () => {
    it('should register student successfully (201)', async () => {
      authService.register.mockResolvedValue(mockUser);

      const response = await request(app).post('/auth/register').send({
        nome: 'Ana Silva',
        email: 'ana@email.com',
        senha: '123456',
        role: 'student',
      });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe('ana@email.com');
      expect(response.body.data.senha).toBeUndefined();
    });

    it('should register teacher with valid code (201)', async () => {
      const teacherUser = new User({ ...mockUser, role: 'teacher' });
      authService.register.mockResolvedValue(teacherUser);

      const response = await request(app).post('/auth/register').send({
        nome: 'Prof Maria',
        email: 'maria@email.com',
        senha: '123456',
        role: 'teacher',
        codigoAcesso: 'VALID-CODE',
      });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it('should reject teacher without code (validation 400)', async () => {
      const response = await request(app).post('/auth/register').send({
        nome: 'Prof Maria',
        email: 'maria@email.com',
        senha: '123456',
        role: 'teacher',
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject student with codigoAcesso (validation 400)', async () => {
      const response = await request(app).post('/auth/register').send({
        nome: 'Ana',
        email: 'ana@email.com',
        senha: '123456',
        role: 'student',
        codigoAcesso: 'SOME-CODE',
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 409 when email already exists', async () => {
      authService.register.mockRejectedValue(new ConflictError('Email já cadastrado'));

      const response = await request(app).post('/auth/register').send({
        nome: 'Ana',
        email: 'ana@email.com',
        senha: '123456',
        role: 'student',
      });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Email já cadastrado');
    });

    it('should return 403 when teacher code is invalid', async () => {
      authService.register.mockRejectedValue(
        new ForbiddenError('Código de acesso inválido para perfil professor')
      );

      const response = await request(app).post('/auth/register').send({
        nome: 'Fake',
        email: 'fake@email.com',
        senha: '123456',
        role: 'teacher',
        codigoAcesso: 'WRONG',
      });

      expect(response.status).toBe(403);
      expect(response.body.error.message).toBe('Código de acesso inválido para perfil professor');
    });

    it('should return 400 for invalid data', async () => {
      const response = await request(app).post('/auth/register').send({ nome: 'A' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /auth/login', () => {
    it('should login successfully (200)', async () => {
      authService.login.mockResolvedValue({
        user: mockUser,
        token: 'valid-jwt-token',
      });

      const response = await request(app)
        .post('/auth/login')
        .send({ email: 'ana@email.com', senha: '123456' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBe('valid-jwt-token');
      expect(response.body.data.user.email).toBe('ana@email.com');
      expect(response.body.data.user.senha).toBeUndefined();
    });

    it('should reject invalid credentials (401)', async () => {
      authService.login.mockRejectedValue(new UnauthorizedError('Credenciais inválidas'));

      const response = await request(app)
        .post('/auth/login')
        .send({ email: 'ana@email.com', senha: 'wrong' });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Credenciais inválidas');
    });

    it('should return 400 for missing fields', async () => {
      const response = await request(app).post('/auth/login').send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
});
