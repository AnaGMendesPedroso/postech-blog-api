const PostModel = require('../database/schemas/PostSchema');
const Post = require('../../domain/entities/Post');
const { NotFoundError } = require('../../domain/errors/AppError');

/**
 * Post Repository - Infrastructure Layer
 * Handles database operations for Post entity
 */
class PostRepository {
  /**
   * Create a new post
   * @param {Object} postData - Post data
   * @returns {Promise<Post>} Created post entity
   */
  async create(postData) {
    const postDoc = await PostModel.create(postData);
    return this._toEntity(postDoc);
  }

  /**
   * Find all posts with optional filters and pagination
   * @param {Object} options - Query options
   * @returns {Promise<{posts: Post[], total: number}>}
   */
  async findAll({ status, page = 1, limit = 10 } = {}) {
    const query = {};

    if (status && status !== 'all') {
      query.status = status;
    } else if (!status) {
      // Default: only published posts
      query.status = 'published';
    }

    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      PostModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      PostModel.countDocuments(query),
    ]);

    return {
      posts: posts.map((post) => this._toEntity(post)),
      total,
    };
  }

  /**
   * Find post by ID
   * @param {string} id - Post ID
   * @returns {Promise<Post>} Post entity
   */
  async findById(id) {
    const post = await PostModel.findById(id);

    if (!post) {
      throw new NotFoundError('Post');
    }

    return this._toEntity(post);
  }

  /**
   * Update post by ID
   * @param {string} id - Post ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Post>} Updated post entity
   */
  async update(id, updateData) {
    const post = await PostModel.findByIdAndUpdate(id, updateData, {
      returnDocument: 'after',
      runValidators: true,
    });

    if (!post) {
      throw new NotFoundError('Post');
    }

    return this._toEntity(post);
  }

  /**
   * Delete post by ID
   * @param {string} id - Post ID
   * @returns {Promise<void>}
   */
  async delete(id) {
    const result = await PostModel.findByIdAndDelete(id);

    if (!result) {
      throw new NotFoundError('Post');
    }
  }

  /**
   * Search posts by keyword
   * @param {string} keyword - Search keyword
   * @param {Object} options - Query options
   * @returns {Promise<{posts: Post[], total: number}>}
   */
  async search(keyword, { status, page = 1, limit = 10 } = {}) {
    const query = {
      $text: { $search: keyword },
    };

    if (status && status !== 'all') {
      query.status = status;
    } else if (!status) {
      query.status = 'published';
    }

    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      PostModel.find(query, { score: { $meta: 'textScore' } })
        .sort({ score: { $meta: 'textScore' } })
        .skip(skip)
        .limit(limit),
      PostModel.countDocuments(query),
    ]);

    return {
      posts: posts.map((post) => this._toEntity(post)),
      total,
    };
  }

  /**
   * Convert Mongoose document to domain entity
   * @param {Object} doc - Mongoose document
   * @returns {Post} Post entity
   * @private
   */
  _toEntity(doc) {
    return new Post({
      id: doc._id.toString(),
      titulo: doc.titulo,
      conteudo: doc.conteudo,
      autor: doc.autor,
      status: doc.status,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }
}

module.exports = new PostRepository();
