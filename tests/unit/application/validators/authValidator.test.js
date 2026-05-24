const { registerSchema, loginSchema } = require('../../../../src/application/validators/authValidator');

describe('Auth Validators', () => {
  describe('registerSchema', () => {
    const validStudentData = {
      nome: 'Ana Silva',
      email: 'ana@email.com',
      senha: '123456',
      role: 'student',
    };

    const validTeacherData = {
      nome: 'Prof Maria',
      email: 'maria@email.com',
      senha: '123456',
      role: 'teacher',
      codigoAcesso: 'SOME-CODE',
    };

    it('should validate valid student registration data', () => {
      const { error } = registerSchema.validate(validStudentData);
      expect(error).toBeUndefined();
    });

    it('should validate valid teacher registration data', () => {
      const { error } = registerSchema.validate(validTeacherData);
      expect(error).toBeUndefined();
    });

    it('should reject missing nome', () => {
      const { error } = registerSchema.validate({ ...validStudentData, nome: undefined });
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('nome');
    });

    it('should reject nome shorter than 2 chars', () => {
      const { error } = registerSchema.validate({ ...validStudentData, nome: 'A' });
      expect(error).toBeDefined();
    });

    it('should reject missing email', () => {
      const { error } = registerSchema.validate({ ...validStudentData, email: undefined });
      expect(error).toBeDefined();
    });

    it('should reject invalid email format', () => {
      const { error } = registerSchema.validate({ ...validStudentData, email: 'not-an-email' });
      expect(error).toBeDefined();
    });

    it('should reject missing senha', () => {
      const { error } = registerSchema.validate({ ...validStudentData, senha: undefined });
      expect(error).toBeDefined();
    });

    it('should reject senha shorter than 6 chars', () => {
      const { error } = registerSchema.validate({ ...validStudentData, senha: '12345' });
      expect(error).toBeDefined();
    });

    it('should reject missing role', () => {
      const { error } = registerSchema.validate({ ...validStudentData, role: undefined });
      expect(error).toBeDefined();
    });

    it('should reject invalid role', () => {
      const { error } = registerSchema.validate({ ...validStudentData, role: 'admin' });
      expect(error).toBeDefined();
    });

    it('should require codigoAcesso when role is teacher', () => {
      const data = { ...validTeacherData, codigoAcesso: undefined };
      const { error } = registerSchema.validate(data);
      expect(error).toBeDefined();
    });

    it('should forbid codigoAcesso when role is student', () => {
      const data = { ...validStudentData, codigoAcesso: 'SOME-CODE' };
      const { error } = registerSchema.validate(data);
      expect(error).toBeDefined();
    });
  });

  describe('loginSchema', () => {
    const validLoginData = {
      email: 'ana@email.com',
      senha: '123456',
    };

    it('should validate valid login data', () => {
      const { error } = loginSchema.validate(validLoginData);
      expect(error).toBeUndefined();
    });

    it('should reject missing email', () => {
      const { error } = loginSchema.validate({ senha: '123456' });
      expect(error).toBeDefined();
    });

    it('should reject invalid email', () => {
      const { error } = loginSchema.validate({ email: 'invalid', senha: '123456' });
      expect(error).toBeDefined();
    });

    it('should reject missing senha', () => {
      const { error } = loginSchema.validate({ email: 'ana@email.com' });
      expect(error).toBeDefined();
    });
  });
});
