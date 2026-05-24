const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userRepository = require('../../infrastructure/repositories/UserRepository');
const logger = require('../../infrastructure/logging/logger');
const {
  ConflictError,
  UnauthorizedError,
  ForbiddenError,
} = require('../../domain/errors/AppError');

/**
 * Auth Service - Application Layer
 * Business logic for authentication and registration
 */
class AuthService {
  /**
   * Register a new user
   * @param {Object} data - Registration data
   * @returns {Promise<User>} Created user (without senha)
   */
  async register({ nome, email, senha, role, codigoAcesso }) {
    logger.info('Registering new user', { email, role });

    this._validateTeacherAccess(role, codigoAcesso);

    const existing = await userRepository.findByEmail(email);

    if (existing) {
      throw new ConflictError('Email já cadastrado');
    }

    const hashedSenha = await bcrypt.hash(senha, 10);
    const user = await userRepository.create({
      nome,
      email,
      senha: hashedSenha,
      role,
    });

    logger.info('User registered successfully', {
      userId: user.id,
      role,
    });

    return user;
  }

  /**
   * Login user
   * @param {Object} data - Login credentials
   * @returns {Promise<{user: User, token: string}>}
   */
  async login({ email, senha }) {
    logger.info('Login attempt', { email });

    const user = await userRepository.findByEmail(email);

    if (!user) {
      throw new UnauthorizedError('Credenciais inválidas');
    }

    const isValid = await bcrypt.compare(senha, user.senha);

    if (!isValid) {
      throw new UnauthorizedError('Credenciais inválidas');
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    logger.info('Login successful', { userId: user.id });

    return { user, token };
  }

  /**
   * Validate teacher access code
   * @param {string} role - User role
   * @param {string} codigoAcesso - Access code
   * @private
   */
  _validateTeacherAccess(role, codigoAcesso) {
    if (role !== 'teacher') {
      return;
    }

    const validCode = process.env.TEACHER_ACCESS_CODE;

    if (!codigoAcesso || codigoAcesso !== validCode) {
      throw new ForbiddenError('Código de acesso inválido para perfil professor');
    }
  }
}

module.exports = new AuthService();
