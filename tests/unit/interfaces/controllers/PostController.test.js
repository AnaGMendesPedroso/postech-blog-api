const PostController = require('../../../../src/interfaces/http/controllers/PostController');
const postService = require('../../../../src/application/usecases/PostService');
const Post = require('../../../../src/domain/entities/Post');

// Mock postService
jest.mock('../../../../src/application/usecases/PostService');

describe('PostController', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = {
      body: {},
      query: {},
      params: {},
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a post and return 201', async () => {
      const postData = {
        titulo: 'Test Title',
        conteudo: 'Test Content here',
        autor: 'Test Author',
      };
      const mockPost = new Post({ id: '123', ...postData });

      mockReq.body = postData;
      postService.createPost.mockResolvedValue(mockPost);

      await PostController.create(mockReq, mockRes, mockNext);

      expect(postService.createPost).toHaveBeenCalledWith(postData);
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockPost.toJSON(),
      });
    });

    it('should call next with error on failure', async () => {
      const error = new Error('Database error');
      mockReq.body = { titulo: 'Test' };
      postService.createPost.mockRejectedValue(error);

      await PostController.create(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('getAll', () => {
    it('should return paginated posts', async () => {
      const mockPosts = [
        new Post({ id: '1', titulo: 'Post 1', conteudo: 'Content 1', autor: 'Author' }),
        new Post({ id: '2', titulo: 'Post 2', conteudo: 'Content 2', autor: 'Author' }),
      ];

      mockReq.query = { status: 'published', page: '1', limit: '10' };
      postService.getAllPosts.mockResolvedValue({
        posts: mockPosts,
        total: 2,
        page: 1,
        limit: 10,
      });

      await PostController.getAll(mockReq, mockRes, mockNext);

      expect(postService.getAllPosts).toHaveBeenCalledWith({
        status: 'published',
        page: '1',
        limit: '10',
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockPosts.map((p) => p.toJSON()),
        pagination: {
          page: 1,
          limit: 10,
          total: 2,
          totalPages: 1,
        },
      });
    });

    it('should call next with error on failure', async () => {
      const error = new Error('Database error');
      postService.getAllPosts.mockRejectedValue(error);

      await PostController.getAll(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('getById', () => {
    it('should return a post by id', async () => {
      const mockPost = new Post({
        id: '123',
        titulo: 'Test',
        conteudo: 'Content',
        autor: 'Author',
      });

      mockReq.params = { id: '123' };
      postService.getPostById.mockResolvedValue(mockPost);

      await PostController.getById(mockReq, mockRes, mockNext);

      expect(postService.getPostById).toHaveBeenCalledWith('123');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockPost.toJSON(),
      });
    });

    it('should call next with error on failure', async () => {
      const error = new Error('Not found');
      mockReq.params = { id: '123' };
      postService.getPostById.mockRejectedValue(error);

      await PostController.getById(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('update', () => {
    it('should update a post', async () => {
      const updateData = { titulo: 'Updated Title' };
      const mockPost = new Post({
        id: '123',
        titulo: 'Updated Title',
        conteudo: 'Content',
        autor: 'Author',
      });

      mockReq.params = { id: '123' };
      mockReq.body = updateData;
      postService.updatePost.mockResolvedValue(mockPost);

      await PostController.update(mockReq, mockRes, mockNext);

      expect(postService.updatePost).toHaveBeenCalledWith('123', updateData);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockPost.toJSON(),
      });
    });

    it('should call next with error on failure', async () => {
      const error = new Error('Update failed');
      mockReq.params = { id: '123' };
      mockReq.body = { titulo: 'Test' };
      postService.updatePost.mockRejectedValue(error);

      await PostController.update(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('delete', () => {
    it('should delete a post and return 204', async () => {
      mockReq.params = { id: '123' };
      postService.deletePost.mockResolvedValue();

      await PostController.delete(mockReq, mockRes, mockNext);

      expect(postService.deletePost).toHaveBeenCalledWith('123');
      expect(mockRes.status).toHaveBeenCalledWith(204);
      expect(mockRes.send).toHaveBeenCalled();
    });

    it('should call next with error on failure', async () => {
      const error = new Error('Delete failed');
      mockReq.params = { id: '123' };
      postService.deletePost.mockRejectedValue(error);

      await PostController.delete(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('search', () => {
    it('should search posts by keyword', async () => {
      const mockPosts = [
        new Post({
          id: '1',
          titulo: 'JavaScript Tutorial',
          conteudo: 'Learn JS',
          autor: 'Author',
          status: 'published',
        }),
      ];

      mockReq.query = { q: 'JavaScript', page: '1', limit: '10' };
      postService.searchPosts.mockResolvedValue({
        posts: mockPosts,
        total: 1,
        page: 1,
        limit: 10,
      });

      await PostController.search(mockReq, mockRes, mockNext);

      expect(postService.searchPosts).toHaveBeenCalledWith('JavaScript', {
        page: '1',
        limit: '10',
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockPosts.map((p) => p.toJSON()),
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      });
    });

    it('should call next with error on failure', async () => {
      const error = new Error('Search failed');
      mockReq.query = { q: 'test' };
      postService.searchPosts.mockRejectedValue(error);

      await PostController.search(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});
