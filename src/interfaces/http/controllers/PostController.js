const postService = require('../../../application/usecases/PostService');
const { success, paginated } = require('../presenters/responseFormatter');

/**
 * Post Controller - Interface Layer
 * HTTP request handlers for Post operations
 */
class PostController {
  /**
   * Create a new post
   * POST /posts
   */
  async create(req, res, next) {
    try {
      const post = await postService.createPost(req.body);
      success(res, post.toJSON(), 201);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get all posts with optional filters
   * GET /posts
   */
  async getAll(req, res, next) {
    try {
      const { status, page, limit } = req.query;
      const result = await postService.getAllPosts({ status, page, limit });

      paginated(
        res,
        result.posts.map((post) => post.toJSON()),
        {
          page: result.page,
          limit: result.limit,
          total: result.total,
        }
      );
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get post by ID
   * GET /posts/:id
   */
  async getById(req, res, next) {
    try {
      const post = await postService.getPostById(req.params.id);
      success(res, post.toJSON());
    } catch (err) {
      next(err);
    }
  }

  /**
   * Update post by ID
   * PUT /posts/:id
   */
  async update(req, res, next) {
    try {
      const post = await postService.updatePost(req.params.id, req.body);
      success(res, post.toJSON());
    } catch (err) {
      next(err);
    }
  }

  /**
   * Delete post by ID
   * DELETE /posts/:id
   */
  async delete(req, res, next) {
    try {
      await postService.deletePost(req.params.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }

  /**
   * Search posts by keyword
   * GET /posts/search
   */
  async search(req, res, next) {
    try {
      const { q: keyword, page, limit } = req.query;
      const result = await postService.searchPosts(keyword, { page, limit });

      paginated(
        res,
        result.posts.map((post) => post.toJSON()),
        {
          page: result.page,
          limit: result.limit,
          total: result.total,
        }
      );
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new PostController();
