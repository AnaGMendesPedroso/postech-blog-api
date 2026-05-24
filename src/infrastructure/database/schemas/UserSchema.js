const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * User Schema - Infrastructure Layer
 * Mongoose schema definition (separate from domain entity)
 */
const userSchema = new mongoose.Schema(
  {
    nome: {
      type: String,
      required: [true, 'Nome é obrigatório'],
      minlength: [2, 'Nome deve ter no mínimo 2 caracteres'],
      maxlength: [100, 'Nome deve ter no máximo 100 caracteres'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email é obrigatório'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    senha: {
      type: String,
      required: [true, 'Senha é obrigatória'],
      minlength: [6, 'Senha deve ter no mínimo 6 caracteres'],
    },
    role: {
      type: String,
      enum: {
        values: ['teacher', 'student'],
        message: 'Role deve ser "teacher" ou "student"',
      },
      required: [true, 'Role é obrigatório'],
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        delete ret.senha;
        return ret;
      },
    },
  }
);

// Index for email uniqueness
userSchema.index({ email: 1 }, { unique: true });

/**
 * Compare password with hash
 * @param {string} plainText - Plain text password
 * @returns {Promise<boolean>}
 */
userSchema.methods.comparePassword = async function (plainText) {
  return bcrypt.compare(plainText, this.senha);
};

const UserModel = mongoose.model('User', userSchema);

module.exports = UserModel;
