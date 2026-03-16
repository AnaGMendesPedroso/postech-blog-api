const PostRepository = require('../../../../src/infrastructure/repositories/PostRepository');
const PostModel = require('../../../../src/infrastructure/database/schemas/PostSchema');
const Post = require('../../../../src/domain/entities/Post');
const { NotFoundError } = require('../../../../src/domain/errors/AppError');

// Mock PostModel
jest.mock('../../../../src/infrastructure/database/schemas/PostSchema');

describe('PostRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockPostDoc = {
    _id: { toString: () => '507f1f77bcf86cd799439011' },
    titulo: 'Test Title',
    conteudo: 'Test Content here',
    autor: 'Test Author',
    status: 'draft',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-02'),
  };

  describe('create', () => {
    it('should create a new post and return entity', async () => {
      const postData = {
        titulo: 'Test Title',
        conteudo: 'Test Content here',
        autor: 'Test Author',
      };

      PostModel.create.mockResolvedValue(mockPostDoc);

      const result = await PostRepository.create(postData);

      expect(PostModel.create).toHaveBeenCalledWith(postData);
      expect(result).toBeInstanceOf(Post);
      expect(result.titulo).toBe('Test Title');
    });
  });

  describe('findAll', () => {
    it('should return published posts by default sorted by createdAt desc', async () => {
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([mockPostDoc]),
      };
      PostModel.find.mockReturnValue(mockQuery);
      PostModel.countDocuments.mockResolvedValue(1);

      const result = await PostRepository.findAll({});

      expect(PostModel.find).toHaveBeenCalledWith({ status: 'published' });
      expect(mockQuery.sort).toHaveBeenCalledWith({ createdAt: -1 });
      expect(result.posts.length).toBe(1);
      expect(result.posts[0]).toBeInstanceOf(Post);
      expect(result.posts[0].titulo).toBe('Test Title');
      expect(result.total).toBe(1);
    });

    it('should filter by status when provided', async () => {
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([mockPostDoc]),
      };
      PostModel.find.mockReturnValue(mockQuery);
      PostModel.countDocuments.mockResolvedValue(1);

      await PostRepository.findAll({ status: 'draft' });

      expect(PostModel.find).toHaveBeenCalledWith({ status: 'draft' });
    });

    it('should return all posts when status is "all"', async () => {
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([mockPostDoc]),
      };
      PostModel.find.mockReturnValue(mockQuery);
      PostModel.countDocuments.mockResolvedValue(1);

      await PostRepository.findAll({ status: 'all' });

      expect(PostModel.find).toHaveBeenCalledWith({});
    });

    it('should apply pagination', async () => {
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]),
      };
      PostModel.find.mockReturnValue(mockQuery);
      PostModel.countDocuments.mockResolvedValue(0);

      await PostRepository.findAll({ page: 2, limit: 5 });

      expect(mockQuery.skip).toHaveBeenCalledWith(5);
      expect(mockQuery.limit).toHaveBeenCalledWith(5);
    });

    it('should return published posts when status is undefined', async () => {
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([mockPostDoc]),
      };
      PostModel.find.mockReturnValue(mockQuery);
      PostModel.countDocuments.mockResolvedValue(1);

      await PostRepository.findAll({ status: undefined });

      expect(PostModel.find).toHaveBeenCalledWith({ status: 'published' });
    });

    it('should use default page and limit when not provided', async () => {
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]),
      };
      PostModel.find.mockReturnValue(mockQuery);
      PostModel.countDocuments.mockResolvedValue(0);

      await PostRepository.findAll();

      expect(mockQuery.skip).toHaveBeenCalledWith(0);
      expect(mockQuery.limit).toHaveBeenCalledWith(10);
    });

    it('should map all documents to Post entities with correct data', async () => {
      const secondDoc = {
        _id: { toString: () => '507f1f77bcf86cd799439022' },
        titulo: 'Second Post',
        conteudo: 'Second Content',
        autor: 'Second Author',
        status: 'published',
        createdAt: new Date('2024-02-01'),
        updatedAt: new Date('2024-02-02'),
      };
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([mockPostDoc, secondDoc]),
      };
      PostModel.find.mockReturnValue(mockQuery);
      PostModel.countDocuments.mockResolvedValue(2);

      const result = await PostRepository.findAll({});

      expect(result.posts).toHaveLength(2);
      expect(result.posts[0].id).toBe('507f1f77bcf86cd799439011');
      expect(result.posts[0].conteudo).toBe('Test Content here');
      expect(result.posts[1].id).toBe('507f1f77bcf86cd799439022');
      expect(result.posts[1].titulo).toBe('Second Post');
    });
  });

  describe('findById', () => {
    it('should return a post by id', async () => {
      PostModel.findById.mockResolvedValue(mockPostDoc);

      const result = await PostRepository.findById('507f1f77bcf86cd799439011');

      expect(PostModel.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(result).toBeInstanceOf(Post);
      expect(result.id).toBe('507f1f77bcf86cd799439011');
    });

    it('should throw NotFoundError with Post message when not found', async () => {
      PostModel.findById.mockResolvedValue(null);

      await expect(PostRepository.findById('nonexistent')).rejects.toThrow(NotFoundError);
      await expect(PostRepository.findById('nonexistent')).rejects.toThrow('Post não encontrado');
    });
  });

  describe('update', () => {
    it('should update a post and return entity', async () => {
      const updateData = { titulo: 'Updated Title' };
      const updatedDoc = { ...mockPostDoc, titulo: 'Updated Title' };

      PostModel.findByIdAndUpdate.mockResolvedValue(updatedDoc);

      const result = await PostRepository.update('507f1f77bcf86cd799439011', updateData);

      expect(PostModel.findByIdAndUpdate).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        updateData,
        { returnDocument: 'after', runValidators: true }
      );
      expect(result).toBeInstanceOf(Post);
      expect(result.titulo).toBe('Updated Title');
    });

    it('should throw NotFoundError with Post message when not found', async () => {
      PostModel.findByIdAndUpdate.mockResolvedValue(null);

      await expect(PostRepository.update('nonexistent', { titulo: 'Test' })).rejects.toThrow(
        NotFoundError
      );
      await expect(PostRepository.update('nonexistent', { titulo: 'Test' })).rejects.toThrow(
        'Post não encontrado'
      );
    });
  });

  describe('delete', () => {
    it('should delete a post', async () => {
      PostModel.findByIdAndDelete.mockResolvedValue(mockPostDoc);

      await expect(PostRepository.delete('507f1f77bcf86cd799439011')).resolves.not.toThrow();

      expect(PostModel.findByIdAndDelete).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });

    it('should throw NotFoundError with Post message when not found', async () => {
      PostModel.findByIdAndDelete.mockResolvedValue(null);

      await expect(PostRepository.delete('nonexistent')).rejects.toThrow(NotFoundError);
      await expect(PostRepository.delete('nonexistent')).rejects.toThrow('Post não encontrado');
    });
  });

  describe('search', () => {
    it('should search posts by keyword sorted by textScore', async () => {
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([mockPostDoc]),
      };
      PostModel.find.mockReturnValue(mockQuery);
      PostModel.countDocuments.mockResolvedValue(1);

      const result = await PostRepository.search('test', { page: 1, limit: 10 });

      expect(PostModel.find).toHaveBeenCalledWith(
        { $text: { $search: 'test' }, status: 'published' },
        { score: { $meta: 'textScore' } }
      );
      expect(mockQuery.sort).toHaveBeenCalledWith({ score: { $meta: 'textScore' } });
      expect(result.posts.length).toBe(1);
      expect(result.posts[0]).toBeInstanceOf(Post);
      expect(result.posts[0].titulo).toBe('Test Title');
      expect(result.total).toBe(1);
    });

    it('should apply pagination to search results', async () => {
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]),
      };
      PostModel.find.mockReturnValue(mockQuery);
      PostModel.countDocuments.mockResolvedValue(0);

      await PostRepository.search('test', { page: 2, limit: 5 });

      expect(mockQuery.skip).toHaveBeenCalledWith(5);
      expect(mockQuery.limit).toHaveBeenCalledWith(5);
    });

    it('should use default page and limit when not provided', async () => {
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]),
      };
      PostModel.find.mockReturnValue(mockQuery);
      PostModel.countDocuments.mockResolvedValue(0);

      await PostRepository.search('test');

      expect(mockQuery.skip).toHaveBeenCalledWith(0);
      expect(mockQuery.limit).toHaveBeenCalledWith(10);
    });

    it('should map all search results to Post entities', async () => {
      const secondDoc = {
        _id: { toString: () => '507f1f77bcf86cd799439022' },
        titulo: 'Found Post',
        conteudo: 'Found Content',
        autor: 'Found Author',
        status: 'published',
        createdAt: new Date('2024-03-01'),
        updatedAt: new Date('2024-03-02'),
      };
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([mockPostDoc, secondDoc]),
      };
      PostModel.find.mockReturnValue(mockQuery);
      PostModel.countDocuments.mockResolvedValue(2);

      const result = await PostRepository.search('test', { page: 1, limit: 10 });

      expect(result.posts).toHaveLength(2);
      expect(result.posts[0].id).toBe('507f1f77bcf86cd799439011');
      expect(result.posts[0].conteudo).toBe('Test Content here');
      expect(result.posts[1].id).toBe('507f1f77bcf86cd799439022');
      expect(result.posts[1].titulo).toBe('Found Post');
    });
  });
});
