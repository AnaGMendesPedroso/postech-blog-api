const UserModel = require('../database/schemas/UserSchema');
const User = require('../../domain/entities/User');
const { NotFoundError } = require('../../domain/errors/AppError');

/**
 * User Repository - Infrastructure Layer
 * Handles database operations for User entity
 */
class UserRepository {
  /**
   * Create a new user
   * @param {Object} userData - User data
   * @returns {Promise<User>} Created user entity
   */
  async create(userData) {
    const userDoc = await UserModel.create(userData);
    return this._toEntity(userDoc);
  }

  /**
   * Find user by email
   * @param {string} email - User email
   * @returns {Promise<User|null>} User entity or null
   */
  async findByEmail(email) {
    const user = await UserModel.findOne({ email });

    if (!user) {
      return null;
    }

    return this._toEntity(user);
  }

  /**
   * Find user by ID
   * @param {string} id - User ID
   * @returns {Promise<User>} User entity
   */
  async findById(id) {
    const user = await UserModel.findById(id);

    if (!user) {
      throw new NotFoundError('Usuário');
    }

    return this._toEntity(user);
  }

  /**
   * Convert Mongoose document to domain entity
   * @param {Object} doc - Mongoose document
   * @returns {User} User entity
   * @private
   */
  _toEntity(doc) {
    return new User({
      id: doc._id.toString(),
      nome: doc.nome,
      email: doc.email,
      senha: doc.senha,
      role: doc.role,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }
}

module.exports = new UserRepository();
