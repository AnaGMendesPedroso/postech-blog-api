const Post = require('../../../../src/domain/entities/Post');

describe('Post Entity', () => {
  describe('constructor', () => {
    it('should create a post with default values', () => {
      const post = new Post({
        id: '123',
        titulo: 'Test Title',
        conteudo: 'Test Content',
        autor: 'Test Author',
      });

      expect(post.id).toBe('123');
      expect(post.titulo).toBe('Test Title');
      expect(post.conteudo).toBe('Test Content');
      expect(post.autor).toBe('Test Author');
      expect(post.status).toBe('draft');
      expect(post.createdAt).toBeInstanceOf(Date);
      expect(post.updatedAt).toBeInstanceOf(Date);
    });

    it('should create a post with provided status', () => {
      const post = new Post({
        id: '123',
        titulo: 'Test Title',
        conteudo: 'Test Content',
        autor: 'Test Author',
        status: 'published',
      });

      expect(post.status).toBe('published');
    });

    it('should use provided dates', () => {
      const createdAt = new Date('2024-01-01');
      const updatedAt = new Date('2024-01-02');

      const post = new Post({
        id: '123',
        titulo: 'Test Title',
        conteudo: 'Test Content',
        autor: 'Test Author',
        createdAt,
        updatedAt,
      });

      expect(post.createdAt).toBe(createdAt);
      expect(post.updatedAt).toBe(updatedAt);
    });
  });

  describe('publish', () => {
    it('should change status to published', () => {
      const post = new Post({
        id: '123',
        titulo: 'Test Title',
        conteudo: 'Test Content',
        autor: 'Test Author',
      });

      const originalUpdatedAt = post.updatedAt;

      // Wait a bit to ensure different timestamp
      jest.advanceTimersByTime(1000);

      post.publish();

      expect(post.status).toBe('published');
      expect(post.updatedAt).not.toBe(originalUpdatedAt);
    });
  });

  describe('setDraft', () => {
    it('should change status to draft', () => {
      const post = new Post({
        id: '123',
        titulo: 'Test Title',
        conteudo: 'Test Content',
        autor: 'Test Author',
        status: 'published',
      });

      post.setDraft();

      expect(post.status).toBe('draft');
    });
  });

  describe('isPublished', () => {
    it('should return true when status is published', () => {
      const post = new Post({
        id: '123',
        titulo: 'Test Title',
        conteudo: 'Test Content',
        autor: 'Test Author',
        status: 'published',
      });

      expect(post.isPublished()).toBe(true);
    });

    it('should return false when status is draft', () => {
      const post = new Post({
        id: '123',
        titulo: 'Test Title',
        conteudo: 'Test Content',
        autor: 'Test Author',
        status: 'draft',
      });

      expect(post.isPublished()).toBe(false);
    });
  });

  describe('isDraft', () => {
    it('should return true when status is draft', () => {
      const post = new Post({
        id: '123',
        titulo: 'Test Title',
        conteudo: 'Test Content',
        autor: 'Test Author',
        status: 'draft',
      });

      expect(post.isDraft()).toBe(true);
    });

    it('should return false when status is published', () => {
      const post = new Post({
        id: '123',
        titulo: 'Test Title',
        conteudo: 'Test Content',
        autor: 'Test Author',
        status: 'published',
      });

      expect(post.isDraft()).toBe(false);
    });
  });

  describe('update', () => {
    it('should update titulo', () => {
      const post = new Post({
        id: '123',
        titulo: 'Original Title',
        conteudo: 'Test Content',
        autor: 'Test Author',
      });

      post.update({ titulo: 'Updated Title' });

      expect(post.titulo).toBe('Updated Title');
    });

    it('should update conteudo', () => {
      const post = new Post({
        id: '123',
        titulo: 'Test Title',
        conteudo: 'Original Content',
        autor: 'Test Author',
      });

      post.update({ conteudo: 'Updated Content' });

      expect(post.conteudo).toBe('Updated Content');
    });

    it('should update autor', () => {
      const post = new Post({
        id: '123',
        titulo: 'Test Title',
        conteudo: 'Test Content',
        autor: 'Original Author',
      });

      post.update({ autor: 'Updated Author' });

      expect(post.autor).toBe('Updated Author');
    });

    it('should update status', () => {
      const post = new Post({
        id: '123',
        titulo: 'Test Title',
        conteudo: 'Test Content',
        autor: 'Test Author',
        status: 'draft',
      });

      post.update({ status: 'published' });

      expect(post.status).toBe('published');
    });

    it('should update multiple fields at once', () => {
      const post = new Post({
        id: '123',
        titulo: 'Original Title',
        conteudo: 'Original Content',
        autor: 'Original Author',
      });

      post.update({
        titulo: 'Updated Title',
        conteudo: 'Updated Content',
      });

      expect(post.titulo).toBe('Updated Title');
      expect(post.conteudo).toBe('Updated Content');
      expect(post.autor).toBe('Original Author');
    });

    it('should update updatedAt timestamp', () => {
      const post = new Post({
        id: '123',
        titulo: 'Test Title',
        conteudo: 'Test Content',
        autor: 'Test Author',
      });

      const originalUpdatedAt = post.updatedAt;

      post.update({ titulo: 'Updated Title' });

      expect(post.updatedAt).not.toBe(originalUpdatedAt);
    });
  });

  describe('toJSON', () => {
    it('should return plain object representation', () => {
      const createdAt = new Date('2024-01-01');
      const updatedAt = new Date('2024-01-02');

      const post = new Post({
        id: '123',
        titulo: 'Test Title',
        conteudo: 'Test Content',
        autor: 'Test Author',
        status: 'published',
        createdAt,
        updatedAt,
      });

      const json = post.toJSON();

      expect(json).toEqual({
        id: '123',
        titulo: 'Test Title',
        conteudo: 'Test Content',
        autor: 'Test Author',
        status: 'published',
        createdAt,
        updatedAt,
      });
    });
  });
});
