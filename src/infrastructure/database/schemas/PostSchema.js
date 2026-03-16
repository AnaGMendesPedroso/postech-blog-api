const mongoose = require('mongoose');

/**
 * Post Schema - Infrastructure Layer
 * Mongoose schema definition (separate from domain entity)
 */
const postSchema = new mongoose.Schema(
  {
    titulo: {
      type: String,
      required: [true, 'Título é obrigatório'],
      minlength: [3, 'Título deve ter no mínimo 3 caracteres'],
      maxlength: [200, 'Título deve ter no máximo 200 caracteres'],
      trim: true,
    },
    conteudo: {
      type: String,
      required: [true, 'Conteúdo é obrigatório'],
      minlength: [10, 'Conteúdo deve ter no mínimo 10 caracteres'],
    },
    autor: {
      type: String,
      required: [true, 'Autor é obrigatório'],
      trim: true,
    },
    status: {
      type: String,
      enum: {
        values: ['draft', 'published'],
        message: 'Status deve ser "draft" ou "published"',
      },
      default: 'draft',
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Text index for search functionality
postSchema.index({ titulo: 'text', conteudo: 'text' });

// Index for status filtering
postSchema.index({ status: 1 });

// Compound index for common queries
postSchema.index({ status: 1, createdAt: -1 });

const PostModel = mongoose.model('Post', postSchema);

module.exports = PostModel;
