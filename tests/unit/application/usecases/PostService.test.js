const PostService = require('../../../../src/application/usecases/PostService');
const postRepository = require('../../../../src/infrastructure/repositories/PostRepository');
const logger = require('../../../../src/infrastructure/logging/logger');
const Post = require('../../../../src/domain/entities/Post');

// Mock the repository
jest.mock('../../../../src/infrastructure/repositories/PostRepository');

// Mock the logger
jest.mock('../../../../src/infrastructure/logging/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}));

describe('PostService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createPost', () => {
    it('should create a new post and log operations', async () => {
      const postData = {
        titulo: 'Test Title',
        conteudo: 'Test Content for the post',
        autor: 'Test Author',
      };

      const mockPost = new Post({ id: '123', ...postData, status: 'draft' });
      postRepository.create.mockResolvedValue(mockPost);

      const result = await PostService.createPost(postData);

      expect(postRepository.create).toHaveBeenCalledWith(postData);
      expect(result).toEqual(mockPost);
      expect(logger.info).toHaveBeenCalledWith('Creating new post', {
        titulo: postData.titulo,
        autor: postData.autor,
      });
      expect(logger.info).toHaveBeenCalledWith('Post created successfully', {
        postId: mockPost.id,
      });
    });
  });

  describe('getAllPosts', () => {
    it('should get all posts with default pagination and log', async () => {
      const mockPosts = [
        new Post({ id: '1', titulo: 'Post 1', conteudo: 'Content 1', autor: 'Author 1' }),
        new Post({ id: '2', titulo: 'Post 2', conteudo: 'Content 2', autor: 'Author 2' }),
      ];

      postRepository.findAll.mockResolvedValue({ posts: mockPosts, total: 2 });

      const result = await PostService.getAllPosts();

      expect(postRepository.findAll).toHaveBeenCalledWith({
        status: undefined,
        page: 1,
        limit: 10,
      });
      expect(result.posts).toEqual(mockPosts);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(logger.info).toHaveBeenCalledWith('Fetching posts', {
        status: undefined,
        page: 1,
        limit: 10,
      });
      expect(logger.info).toHaveBeenCalledWith('Posts fetched successfully', {
        count: 2,
        total: 2,
      });
    });

    it('should get posts with custom filters and log', async () => {
      const mockPosts = [
        new Post({
          id: '1',
          titulo: 'Post 1',
          conteudo: 'Content 1',
          autor: 'Author 1',
          status: 'published',
        }),
      ];

      postRepository.findAll.mockResolvedValue({ posts: mockPosts, total: 1 });

      const result = await PostService.getAllPosts({
        status: 'published',
        page: 2,
        limit: 5,
      });

      expect(postRepository.findAll).toHaveBeenCalledWith({
        status: 'published',
        page: 2,
        limit: 5,
      });
      expect(result.posts).toEqual(mockPosts);
      expect(result.page).toBe(2);
      expect(result.limit).toBe(5);
      expect(logger.info).toHaveBeenCalledWith('Fetching posts', {
        status: 'published',
        page: 2,
        limit: 5,
      });
    });

    it('should parse string page and limit to integers', async () => {
      postRepository.findAll.mockResolvedValue({ posts: [], total: 0 });

      const result = await PostService.getAllPosts({ page: '3', limit: '15' });

      expect(result.page).toBe(3);
      expect(result.limit).toBe(15);
    });
  });

  describe('getPostById', () => {
    it('should get a post by id and log operations', async () => {
      const mockPost = new Post({
        id: '123',
        titulo: 'Test Title',
        conteudo: 'Test Content',
        autor: 'Test Author',
      });

      postRepository.findById.mockResolvedValue(mockPost);

      const result = await PostService.getPostById('123');

      expect(postRepository.findById).toHaveBeenCalledWith('123');
      expect(result).toEqual(mockPost);
      expect(logger.info).toHaveBeenCalledWith('Fetching post by ID', { postId: '123' });
      expect(logger.info).toHaveBeenCalledWith('Post fetched successfully', { postId: '123' });
    });
  });

  describe('updatePost', () => {
    it('should update a post and log operations', async () => {
      const updateData = { titulo: 'Updated Title' };
      const mockPost = new Post({
        id: '123',
        titulo: 'Updated Title',
        conteudo: 'Test Content',
        autor: 'Test Author',
      });

      postRepository.update.mockResolvedValue(mockPost);

      const result = await PostService.updatePost('123', updateData);

      expect(postRepository.update).toHaveBeenCalledWith('123', updateData);
      expect(result).toEqual(mockPost);
      expect(logger.info).toHaveBeenCalledWith('Updating post', {
        postId: '123',
        fields: Object.keys(updateData),
      });
      expect(logger.info).toHaveBeenCalledWith('Post updated successfully', { postId: '123' });
    });
  });

  describe('deletePost', () => {
    it('should delete a post and log operations', async () => {
      postRepository.delete.mockResolvedValue();

      await PostService.deletePost('123');

      expect(postRepository.delete).toHaveBeenCalledWith('123');
      expect(logger.info).toHaveBeenCalledWith('Deleting post', { postId: '123' });
      expect(logger.info).toHaveBeenCalledWith('Post deleted successfully', { postId: '123' });
    });
  });

  describe('searchPosts', () => {
    it('should search posts by keyword and log operations', async () => {
      const mockPosts = [
        new Post({
          id: '1',
          titulo: 'JavaScript Tutorial',
          conteudo: 'Learn JavaScript',
          autor: 'Author',
          status: 'published',
        }),
      ];

      postRepository.search.mockResolvedValue({ posts: mockPosts, total: 1 });

      const result = await PostService.searchPosts('JavaScript', { page: 1, limit: 10 });

      expect(postRepository.search).toHaveBeenCalledWith('JavaScript', { page: 1, limit: 10 });
      expect(result.posts).toEqual(mockPosts);
      expect(result.total).toBe(1);
      expect(logger.info).toHaveBeenCalledWith('Searching posts', {
        keyword: 'JavaScript',
        page: 1,
        limit: 10,
      });
      expect(logger.info).toHaveBeenCalledWith('Search completed', {
        keyword: 'JavaScript',
        count: 1,
      });
    });

    it('should parse string page and limit to integers in search', async () => {
      postRepository.search.mockResolvedValue({ posts: [], total: 0 });

      const result = await PostService.searchPosts('test', { page: '2', limit: '20' });

      expect(result.page).toBe(2);
      expect(result.limit).toBe(20);
    });

    it('should use default options when not provided and log', async () => {
      postRepository.search.mockResolvedValue({ posts: [], total: 0 });

      const result = await PostService.searchPosts('test');

      expect(postRepository.search).toHaveBeenCalledWith('test', { page: 1, limit: 10 });
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(logger.info).toHaveBeenCalledWith('Searching posts', {
        keyword: 'test',
        page: 1,
        limit: 10,
      });
      expect(logger.info).toHaveBeenCalledWith('Search completed', {
        keyword: 'test',
        count: 0,
      });
    });
  });
});
