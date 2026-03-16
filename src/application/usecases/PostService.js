const postRepository = require('../../infrastructure/repositories/PostRepository');
const logger = require('../../infrastructure/logging/logger');

/**
 * Post Service - Application Layer
 * Business logic and use cases for Post operations
 */
class PostService {
  /**
   * Create a new post
   * @param {Object} postData - Post data
   * @returns {Promise<Post>} Created post
   */
  async createPost(postData) {
    logger.info('Creating new post', { titulo: postData.titulo, autor: postData.autor });

    const post = await postRepository.create(postData);

    logger.info('Post created successfully', { postId: post.id });
    return post;
  }

  /**
   * Get all posts with filters and pagination
   * @param {Object} options - Query options
   * @returns {Promise<{posts: Post[], total: number, page: number, limit: number}>}
   */
  async getAllPosts({ status, page = 1, limit = 10 } = {}) {
    logger.info('Fetching posts', { status, page, limit });

    const result = await postRepository.findAll({ status, page, limit });

    logger.info('Posts fetched successfully', { count: result.posts.length, total: result.total });

    return {
      ...result,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    };
  }

  /**
   * Get post by ID
   * @param {string} id - Post ID
   * @returns {Promise<Post>} Post
   */
  async getPostById(id) {
    logger.info('Fetching post by ID', { postId: id });

    const post = await postRepository.findById(id);

    logger.info('Post fetched successfully', { postId: id });
    return post;
  }

  /**
   * Update post by ID
   * @param {string} id - Post ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Post>} Updated post
   */
  async updatePost(id, updateData) {
    logger.info('Updating post', { postId: id, fields: Object.keys(updateData) });

    const post = await postRepository.update(id, updateData);

    logger.info('Post updated successfully', { postId: id });
    return post;
  }

  /**
   * Delete post by ID
   * @param {string} id - Post ID
   * @returns {Promise<void>}
   */
  async deletePost(id) {
    logger.info('Deleting post', { postId: id });

    await postRepository.delete(id);

    logger.info('Post deleted successfully', { postId: id });
  }

  /**
   * Search posts by keyword
   * @param {string} keyword - Search keyword
   * @param {Object} options - Query options
   * @returns {Promise<{posts: Post[], total: number, page: number, limit: number}>}
   */
  async searchPosts(keyword, { page = 1, limit = 10 } = {}) {
    logger.info('Searching posts', { keyword, page, limit });

    const result = await postRepository.search(keyword, { page, limit });

    logger.info('Search completed', { keyword, count: result.posts.length });

    return {
      ...result,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    };
  }
}

module.exports = new PostService();
