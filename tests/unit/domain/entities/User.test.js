const User = require('../../../../src/domain/entities/User');

describe('User Entity', () => {
  const userData = {
    id: '507f1f77bcf86cd799439011',
    nome: 'Ana Silva',
    email: 'ana@email.com',
    senha: 'hashed_password_123',
    role: 'teacher',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  };

  describe('constructor', () => {
    it('should create user with all fields', () => {
      const user = new User(userData);

      expect(user.id).toBe(userData.id);
      expect(user.nome).toBe(userData.nome);
      expect(user.email).toBe(userData.email);
      expect(user.senha).toBe(userData.senha);
      expect(user.role).toBe(userData.role);
      expect(user.createdAt).toBe(userData.createdAt);
      expect(user.updatedAt).toBe(userData.updatedAt);
    });

    it('should set default dates when not provided', () => {
      const user = new User({ ...userData, createdAt: undefined, updatedAt: undefined });

      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('isTeacher', () => {
    it('should return true when role is teacher', () => {
      const user = new User(userData);
      expect(user.isTeacher()).toBe(true);
    });

    it('should return false when role is student', () => {
      const user = new User({ ...userData, role: 'student' });
      expect(user.isTeacher()).toBe(false);
    });
  });

  describe('isStudent', () => {
    it('should return true when role is student', () => {
      const user = new User({ ...userData, role: 'student' });
      expect(user.isStudent()).toBe(true);
    });

    it('should return false when role is teacher', () => {
      const user = new User(userData);
      expect(user.isStudent()).toBe(false);
    });
  });

  describe('toJSON', () => {
    it('should omit senha from output', () => {
      const user = new User(userData);
      const json = user.toJSON();

      expect(json.senha).toBeUndefined();
    });

    it('should include all other fields', () => {
      const user = new User(userData);
      const json = user.toJSON();

      expect(json.id).toBe(userData.id);
      expect(json.nome).toBe(userData.nome);
      expect(json.email).toBe(userData.email);
      expect(json.role).toBe(userData.role);
      expect(json.createdAt).toBe(userData.createdAt);
      expect(json.updatedAt).toBe(userData.updatedAt);
    });
  });
});
