const request = require('supertest');
const express = require('express');
const postRoutes = require('../../../../src/interfaces/http/routes/postRoutes');
const postService = require('../../../../src/application/usecases/PostService');
const Post = require('../../../../src/domain/entities/Post');
const errorHandler = require('../../../../src/interfaces/http/middlewares/errorHandler');

// Mock postService
jest.mock('../../../../src/application/usecases/PostService');

// Mock logger
jest.mock('../../../../src/infrastructure/logging/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}));

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/posts', postRoutes);
  app.use(errorHandler);
  return app;
};

describe('Post Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /posts', () => {
    it('should return list of published posts', async () => {
      const mockPosts = [
        new Post({
          id: '507f1f77bcf86cd799439011',
          titulo: 'Post 1',
          conteudo: 'Content 1',
          autor: 'Author',
          status: 'published',
        }),
      ];

      postService.getAllPosts.mockResolvedValue({
        posts: mockPosts,
        total: 1,
        page: 1,
        limit: 10,
      });

      const app = createTestApp();
      const response = await request(app).get('/posts');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.pagination).toBeDefined();
    });

    it('should filter by status', async () => {
      postService.getAllPosts.mockResolvedValue({
        posts: [],
        total: 0,
        page: 1,
        limit: 10,
      });

      const app = createTestApp();
      await request(app).get('/posts?status=draft');

      expect(postService.getAllPosts).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'draft' })
      );
    });

    it('should reject invalid status', async () => {
      const app = createTestApp();
      const response = await request(app).get('/posts?status=invalid');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /posts/search', () => {
    it('should search posts by keyword', async () => {
      const mockPosts = [
        new Post({
          id: '507f1f77bcf86cd799439011',
          titulo: 'JavaScript Tutorial',
          conteudo: 'Learn JS',
          autor: 'Author',
          status: 'published',
        }),
      ];

      postService.searchPosts.mockResolvedValue({
        posts: mockPosts,
        total: 1,
        page: 1,
        limit: 10,
      });

      const app = createTestApp();
      const response = await request(app).get('/posts/search?q=javascript');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(postService.searchPosts).toHaveBeenCalledWith('javascript', expect.any(Object));
    });

    it('should reject search without query', async () => {
      const app = createTestApp();
      const response = await request(app).get('/posts/search');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /posts/:id', () => {
    it('should return a post by id', async () => {
      const mockPost = new Post({
        id: '507f1f77bcf86cd799439011',
        titulo: 'Test Post',
        conteudo: 'Test Content',
        autor: 'Author',
      });

      postService.getPostById.mockResolvedValue(mockPost);

      const app = createTestApp();
      const response = await request(app).get('/posts/507f1f77bcf86cd799439011');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('507f1f77bcf86cd799439011');
    });

    it('should reject invalid id format', async () => {
      const app = createTestApp();
      const response = await request(app).get('/posts/invalid-id');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /posts', () => {
    it('should create a new post', async () => {
      const postData = {
        titulo: 'New Post Title',
        conteudo: 'Content of the post here',
        autor: 'Author Name',
      };

      const mockPost = new Post({
        id: '507f1f77bcf86cd799439011',
        ...postData,
        status: 'draft',
      });

      postService.createPost.mockResolvedValue(mockPost);

      const app = createTestApp();
      const response = await request(app).post('/posts').send(postData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.titulo).toBe('New Post Title');
    });

    it('should reject post with missing fields', async () => {
      const app = createTestApp();
      const response = await request(app).post('/posts').send({ titulo: 'Only Title' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject post with short title', async () => {
      const app = createTestApp();
      const response = await request(app).post('/posts').send({
        titulo: 'AB',
        conteudo: 'Valid content here',
        autor: 'Author',
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject post with short content', async () => {
      const app = createTestApp();
      const response = await request(app).post('/posts').send({
        titulo: 'Valid Title',
        conteudo: 'Short',
        autor: 'Author',
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /posts/:id', () => {
    it('should update a post', async () => {
      const mockPost = new Post({
        id: '507f1f77bcf86cd799439011',
        titulo: 'Updated Title',
        conteudo: 'Content',
        autor: 'Author',
      });

      postService.updatePost.mockResolvedValue(mockPost);

      const app = createTestApp();
      const response = await request(app)
        .put('/posts/507f1f77bcf86cd799439011')
        .send({ titulo: 'Updated Title' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should reject update with empty body', async () => {
      const app = createTestApp();
      const response = await request(app).put('/posts/507f1f77bcf86cd799439011').send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject update with invalid id', async () => {
      const app = createTestApp();
      const response = await request(app)
        .put('/posts/invalid-id')
        .send({ titulo: 'Updated Title' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /posts/:id', () => {
    it('should delete a post', async () => {
      postService.deletePost.mockResolvedValue();

      const app = createTestApp();
      const response = await request(app).delete('/posts/507f1f77bcf86cd799439011');

      expect(response.status).toBe(204);
    });

    it('should reject delete with invalid id', async () => {
      const app = createTestApp();
      const response = await request(app).delete('/posts/invalid-id');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
});
