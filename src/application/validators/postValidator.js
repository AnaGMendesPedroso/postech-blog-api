const Joi = require('joi');

/**
 * Post Validators - Application Layer
 * Joi schemas for request validation
 */

/**
 * Schema for creating a new post
 */
const createPostSchema = Joi.object({
  titulo: Joi.string().min(3).max(200).required().messages({
    'string.base': 'Título deve ser uma string',
    'string.empty': 'Título é obrigatório',
    'string.min': 'Título deve ter no mínimo {#limit} caracteres',
    'string.max': 'Título deve ter no máximo {#limit} caracteres',
    'any.required': 'Título é obrigatório',
  }),
  conteudo: Joi.string().min(10).required().messages({
    'string.base': 'Conteúdo deve ser uma string',
    'string.empty': 'Conteúdo é obrigatório',
    'string.min': 'Conteúdo deve ter no mínimo {#limit} caracteres',
    'any.required': 'Conteúdo é obrigatório',
  }),
  autor: Joi.string().required().messages({
    'string.base': 'Autor deve ser uma string',
    'string.empty': 'Autor é obrigatório',
    'any.required': 'Autor é obrigatório',
  }),
  status: Joi.string().valid('draft', 'published').default('draft').messages({
    'any.only': 'Status deve ser "draft" ou "published"',
  }),
});

/**
 * Schema for updating a post
 */
const updatePostSchema = Joi.object({
  titulo: Joi.string().min(3).max(200).messages({
    'string.base': 'Título deve ser uma string',
    'string.min': 'Título deve ter no mínimo {#limit} caracteres',
    'string.max': 'Título deve ter no máximo {#limit} caracteres',
  }),
  conteudo: Joi.string().min(10).messages({
    'string.base': 'Conteúdo deve ser uma string',
    'string.min': 'Conteúdo deve ter no mínimo {#limit} caracteres',
  }),
  autor: Joi.string().messages({
    'string.base': 'Autor deve ser uma string',
  }),
  status: Joi.string().valid('draft', 'published').messages({
    'any.only': 'Status deve ser "draft" ou "published"',
  }),
})
  .min(1)
  .messages({
    'object.min': 'Pelo menos um campo deve ser fornecido para atualização',
  });

/**
 * Schema for query parameters on GET /posts
 */
const queryPostsSchema = Joi.object({
  status: Joi.string().valid('draft', 'published', 'all').messages({
    'any.only': 'Status deve ser "draft", "published" ou "all"',
  }),
  page: Joi.number().integer().min(1).default(1).messages({
    'number.base': 'Página deve ser um número',
    'number.integer': 'Página deve ser um número inteiro',
    'number.min': 'Página deve ser maior que 0',
  }),
  limit: Joi.number().integer().min(1).max(100).default(10).messages({
    'number.base': 'Limite deve ser um número',
    'number.integer': 'Limite deve ser um número inteiro',
    'number.min': 'Limite deve ser maior que 0',
    'number.max': 'Limite deve ser no máximo {#limit}',
  }),
});

/**
 * Schema for search query parameters
 */
const searchPostsSchema = Joi.object({
  q: Joi.string().required().messages({
    'string.base': 'Termo de busca deve ser uma string',
    'string.empty': 'Termo de busca é obrigatório',
    'any.required': 'Termo de busca é obrigatório',
  }),
  page: Joi.number().integer().min(1).default(1).messages({
    'number.base': 'Página deve ser um número',
    'number.integer': 'Página deve ser um número inteiro',
    'number.min': 'Página deve ser maior que 0',
  }),
  limit: Joi.number().integer().min(1).max(100).default(10).messages({
    'number.base': 'Limite deve ser um número',
    'number.integer': 'Limite deve ser um número inteiro',
    'number.min': 'Limite deve ser maior que 0',
    'number.max': 'Limite deve ser no máximo {#limit}',
  }),
});

/**
 * Schema for post ID parameter
 */
const postIdSchema = Joi.object({
  id: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'ID do post inválido',
      'any.required': 'ID do post é obrigatório',
    }),
});

module.exports = {
  createPostSchema,
  updatePostSchema,
  queryPostsSchema,
  searchPostsSchema,
  postIdSchema,
};
