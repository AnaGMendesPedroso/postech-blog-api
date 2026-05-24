const UserRepository = require('../../../../src/infrastructure/repositories/UserRepository');
const UserModel = require('../../../../src/infrastructure/database/schemas/UserSchema');
const User = require('../../../../src/domain/entities/User');
const { NotFoundError } = require('../../../../src/domain/errors/AppError');

jest.mock('../../../../src/infrastructure/database/schemas/UserSchema');

describe('UserRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockDoc = {
    _id: { toString: () => '507f1f77bcf86cd799439011' },
    nome: 'Ana Silva',
    email: 'ana@email.com',
    senha: 'hashed_password',
    role: 'teacher',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  };

  describe('create', () => {
    it('should create user and return entity', async () => {
      UserModel.create.mockResolvedValue(mockDoc);

      const result = await UserRepository.create({
        nome: 'Ana Silva',
        email: 'ana@email.com',
        senha: 'hashed_password',
        role: 'teacher',
      });

      expect(UserModel.create).toHaveBeenCalledWith({
        nome: 'Ana Silva',
        email: 'ana@email.com',
        senha: 'hashed_password',
        role: 'teacher',
      });
      expect(result).toBeInstanceOf(User);
      expect(result.id).toBe('507f1f77bcf86cd799439011');
      expect(result.nome).toBe('Ana Silva');
      expect(result.email).toBe('ana@email.com');
      expect(result.role).toBe('teacher');
    });
  });

  describe('findByEmail', () => {
    it('should find user by email when exists', async () => {
      UserModel.findOne.mockResolvedValue(mockDoc);

      const result = await UserRepository.findByEmail('ana@email.com');

      expect(UserModel.findOne).toHaveBeenCalledWith({ email: 'ana@email.com' });
      expect(result).toBeInstanceOf(User);
      expect(result.email).toBe('ana@email.com');
      expect(result.senha).toBe('hashed_password');
    });

    it('should return null when email not found', async () => {
      UserModel.findOne.mockResolvedValue(null);

      const result = await UserRepository.findByEmail('unknown@email.com');

      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('should find user by id when exists', async () => {
      UserModel.findById.mockResolvedValue(mockDoc);

      const result = await UserRepository.findById('507f1f77bcf86cd799439011');

      expect(UserModel.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(result).toBeInstanceOf(User);
      expect(result.id).toBe('507f1f77bcf86cd799439011');
    });

    it('should throw NotFoundError when id not found', async () => {
      UserModel.findById.mockResolvedValue(null);

      await expect(UserRepository.findById('507f1f77bcf86cd799439011')).rejects.toThrow(
        NotFoundError
      );
      await expect(UserRepository.findById('507f1f77bcf86cd799439011')).rejects.toThrow(
        'Usuário não encontrado'
      );
    });
  });

  describe('_toEntity', () => {
    it('should map mongoose doc to User entity correctly', () => {
      const result = UserRepository._toEntity(mockDoc);

      expect(result).toBeInstanceOf(User);
      expect(result.id).toBe('507f1f77bcf86cd799439011');
      expect(result.nome).toBe('Ana Silva');
      expect(result.email).toBe('ana@email.com');
      expect(result.senha).toBe('hashed_password');
      expect(result.role).toBe('teacher');
      expect(result.createdAt).toEqual(new Date('2026-01-01'));
      expect(result.updatedAt).toEqual(new Date('2026-01-01'));
    });
  });
});
