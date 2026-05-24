/**
 * User Entity - Domain Layer
 * Pure business entity without framework dependencies
 */
class User {
  constructor({ id, nome, email, senha, role, createdAt, updatedAt }) {
    this.id = id;
    this.nome = nome;
    this.email = email;
    this.senha = senha;
    this.role = role;
    this.createdAt = createdAt || new Date();
    this.updatedAt = updatedAt || new Date();
  }

  /**
   * Check if user is a teacher
   * @returns {boolean}
   */
  isTeacher() {
    return this.role === 'teacher';
  }

  /**
   * Check if user is a student
   * @returns {boolean}
   */
  isStudent() {
    return this.role === 'student';
  }

  /**
   * Convert to plain object (omits senha)
   * @returns {Object}
   */
  toJSON() {
    return {
      id: this.id,
      nome: this.nome,
      email: this.email,
      role: this.role,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

module.exports = User;
