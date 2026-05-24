const Joi = require('joi');

/**
 * Auth Validators - Application Layer
 * Joi schemas for authentication request validation
 */

/**
 * Schema for user registration
 */
const registerSchema = Joi.object({
  nome: Joi.string().min(2).max(100).required().messages({
    'string.base': 'Nome deve ser uma string',
    'string.empty': 'Nome é obrigatório',
    'string.min': 'Nome deve ter no mínimo {#limit} caracteres',
    'string.max': 'Nome deve ter no máximo {#limit} caracteres',
    'any.required': 'Nome é obrigatório',
  }),
  email: Joi.string().email().required().messages({
    'string.base': 'Email deve ser uma string',
    'string.empty': 'Email é obrigatório',
    'string.email': 'Email deve ser um endereço válido',
    'any.required': 'Email é obrigatório',
  }),
  senha: Joi.string().min(6).required().messages({
    'string.base': 'Senha deve ser uma string',
    'string.empty': 'Senha é obrigatória',
    'string.min': 'Senha deve ter no mínimo {#limit} caracteres',
    'any.required': 'Senha é obrigatória',
  }),
  role: Joi.string().valid('teacher', 'student').required().messages({
    'string.base': 'Role deve ser uma string',
    'any.only': 'Role deve ser "teacher" ou "student"',
    'any.required': 'Role é obrigatório',
  }),
  codigoAcesso: Joi.string()
    .when('role', {
      is: 'teacher',
      then: Joi.required(),
      otherwise: Joi.forbidden(),
    })
    .messages({
      'any.required': 'Código de acesso é obrigatório para professores',
      'any.unknown': 'Código de acesso não é permitido para alunos',
    }),
});

/**
 * Schema for user login
 */
const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.base': 'Email deve ser uma string',
    'string.empty': 'Email é obrigatório',
    'string.email': 'Email deve ser um endereço válido',
    'any.required': 'Email é obrigatório',
  }),
  senha: Joi.string().required().messages({
    'string.base': 'Senha deve ser uma string',
    'string.empty': 'Senha é obrigatória',
    'any.required': 'Senha é obrigatória',
  }),
});

module.exports = {
  registerSchema,
  loginSchema,
};
