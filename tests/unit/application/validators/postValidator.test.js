const {
  createPostSchema,
  updatePostSchema,
  queryPostsSchema,
  searchPostsSchema,
  postIdSchema,
} = require('../../../../src/application/validators/postValidator');

describe('Post Validators', () => {
  describe('createPostSchema', () => {
    it('should validate a valid post with default status', () => {
      const data = {
        titulo: 'Test Title',
        conteudo: 'This is the content of the post',
        autor: 'Test Author',
      };

      const { error, value } = createPostSchema.validate(data);

      expect(error).toBeUndefined();
      expect(value.titulo).toBe('Test Title');
      expect(value.status).toBe('draft');
    });

    it('should reject missing titulo with Portuguese message', () => {
      const data = { conteudo: 'This is the content', autor: 'Test Author' };
      const { error } = createPostSchema.validate(data);

      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('titulo');
      expect(error.details[0].message).toBe('Título é obrigatório');
    });

    it('should reject non-string titulo with Portuguese message', () => {
      const data = { titulo: 123, conteudo: 'Valid content here', autor: 'Author' };
      const { error } = createPostSchema.validate(data);

      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('Título deve ser uma string');
    });

    it('should reject empty titulo with Portuguese message', () => {
      const data = { titulo: '', conteudo: 'Valid content here', autor: 'Author' };
      const { error } = createPostSchema.validate(data);

      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('Título é obrigatório');
    });

    it('should reject titulo with less than 3 characters', () => {
      const data = { titulo: 'AB', conteudo: 'This is the content', autor: 'Test Author' };
      const { error } = createPostSchema.validate(data);

      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('titulo');
      expect(error.details[0].message).toContain('mínimo');
    });

    it('should reject titulo exceeding 200 characters', () => {
      const data = { titulo: 'A'.repeat(201), conteudo: 'Valid content here', autor: 'Author' };
      const { error } = createPostSchema.validate(data);

      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('máximo');
    });

    it('should accept titulo with exactly 200 characters', () => {
      const data = { titulo: 'A'.repeat(200), conteudo: 'Valid content here', autor: 'Author' };
      const { error } = createPostSchema.validate(data);

      expect(error).toBeUndefined();
    });

    it('should reject missing conteudo with Portuguese message', () => {
      const data = { titulo: 'Valid Title', autor: 'Author' };
      const { error } = createPostSchema.validate(data);

      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('Conteúdo é obrigatório');
    });

    it('should reject non-string conteudo with Portuguese message', () => {
      const data = { titulo: 'Valid Title', conteudo: 999, autor: 'Author' };
      const { error } = createPostSchema.validate(data);

      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('Conteúdo deve ser uma string');
    });

    it('should reject conteudo with less than 10 characters', () => {
      const data = { titulo: 'Test Title', conteudo: 'Short', autor: 'Test Author' };
      const { error } = createPostSchema.validate(data);

      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('conteudo');
      expect(error.details[0].message).toContain('mínimo');
    });

    it('should reject missing autor with Portuguese message', () => {
      const data = { titulo: 'Valid Title', conteudo: 'Valid content here' };
      const { error } = createPostSchema.validate(data);

      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('Autor é obrigatório');
    });

    it('should reject non-string autor with Portuguese message', () => {
      const data = { titulo: 'Valid Title', conteudo: 'Valid content here', autor: 123 };
      const { error } = createPostSchema.validate(data);

      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('Autor deve ser uma string');
    });

    it('should reject empty autor with Portuguese message', () => {
      const data = { titulo: 'Valid Title', conteudo: 'Valid content here', autor: '' };
      const { error } = createPostSchema.validate(data);

      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('Autor é obrigatório');
    });

    it('should accept valid status values', () => {
      const data = {
        titulo: 'Test Title',
        conteudo: 'This is the content of the post',
        autor: 'Test Author',
        status: 'published',
      };

      const { error, value } = createPostSchema.validate(data);

      expect(error).toBeUndefined();
      expect(value.status).toBe('published');
    });

    it('should reject invalid status with Portuguese message', () => {
      const data = {
        titulo: 'Test Title',
        conteudo: 'This is the content of the post',
        autor: 'Test Author',
        status: 'invalid',
      };

      const { error } = createPostSchema.validate(data);

      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('status');
      expect(error.details[0].message).toContain('draft');
    });
  });

  describe('updatePostSchema', () => {
    it('should validate partial update with titulo', () => {
      const { error, value } = updatePostSchema.validate({ titulo: 'Updated Title' });

      expect(error).toBeUndefined();
      expect(value.titulo).toBe('Updated Title');
    });

    it('should validate partial update with conteudo', () => {
      const { error, value } = updatePostSchema.validate({ conteudo: 'Updated content here' });

      expect(error).toBeUndefined();
      expect(value.conteudo).toBe('Updated content here');
    });

    it('should reject empty update with Portuguese message', () => {
      const { error } = updatePostSchema.validate({});

      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('Pelo menos um campo');
    });

    it('should reject non-string titulo with Portuguese message', () => {
      const { error } = updatePostSchema.validate({ titulo: 123 });

      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('Título deve ser uma string');
    });

    it('should reject titulo below min length with Portuguese message', () => {
      const { error } = updatePostSchema.validate({ titulo: 'AB' });

      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('mínimo');
    });

    it('should reject titulo above max length with Portuguese message', () => {
      const { error } = updatePostSchema.validate({ titulo: 'A'.repeat(201) });

      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('máximo');
    });

    it('should reject non-string conteudo with Portuguese message', () => {
      const { error } = updatePostSchema.validate({ conteudo: 999 });

      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('Conteúdo deve ser uma string');
    });

    it('should reject short conteudo with Portuguese message', () => {
      const { error } = updatePostSchema.validate({ conteudo: 'Short' });

      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('mínimo');
    });

    it('should reject non-string autor with Portuguese message', () => {
      const { error } = updatePostSchema.validate({ autor: 123 });

      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('Autor deve ser uma string');
    });

    it('should reject invalid status with Portuguese message', () => {
      const { error } = updatePostSchema.validate({ status: 'invalid' });

      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('draft');
    });

    it('should validate multiple fields update', () => {
      const { error, value } = updatePostSchema.validate({
        titulo: 'Updated Title',
        status: 'published',
      });

      expect(error).toBeUndefined();
      expect(value.titulo).toBe('Updated Title');
      expect(value.status).toBe('published');
    });
  });

  describe('queryPostsSchema', () => {
    it('should validate valid status filter', () => {
      const { error, value } = queryPostsSchema.validate({ status: 'published' });

      expect(error).toBeUndefined();
      expect(value.status).toBe('published');
    });

    it('should validate "all" status', () => {
      const { error, value } = queryPostsSchema.validate({ status: 'all' });

      expect(error).toBeUndefined();
      expect(value.status).toBe('all');
    });

    it('should validate "draft" status', () => {
      const { error, value } = queryPostsSchema.validate({ status: 'draft' });

      expect(error).toBeUndefined();
      expect(value.status).toBe('draft');
    });

    it('should reject invalid status with Portuguese message', () => {
      const { error } = queryPostsSchema.validate({ status: 'invalid' });

      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('draft');
    });

    it('should apply default pagination', () => {
      const { error, value } = queryPostsSchema.validate({});

      expect(error).toBeUndefined();
      expect(value.page).toBe(1);
      expect(value.limit).toBe(10);
    });

    it('should validate custom pagination', () => {
      const { error, value } = queryPostsSchema.validate({ page: 2, limit: 20 });

      expect(error).toBeUndefined();
      expect(value.page).toBe(2);
      expect(value.limit).toBe(20);
    });

    it('should reject non-number page with Portuguese message', () => {
      const { error } = queryPostsSchema.validate({ page: 'abc' });

      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('Página deve ser um número');
    });

    it('should reject page zero with Portuguese message', () => {
      const { error } = queryPostsSchema.validate({ page: 0 });

      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('page');
      expect(error.details[0].message).toContain('maior que 0');
    });

    it('should reject non-number limit with Portuguese message', () => {
      const { error } = queryPostsSchema.validate({ limit: 'abc' });

      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('Limite deve ser um número');
    });

    it('should reject limit zero with Portuguese message', () => {
      const { error } = queryPostsSchema.validate({ limit: 0 });

      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('maior que 0');
    });

    it('should reject limit exceeding 100 with Portuguese message', () => {
      const { error } = queryPostsSchema.validate({ limit: 150 });

      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('limit');
      expect(error.details[0].message).toContain('máximo');
    });

    it('should accept limit of exactly 100', () => {
      const { error, value } = queryPostsSchema.validate({ limit: 100 });

      expect(error).toBeUndefined();
      expect(value.limit).toBe(100);
    });

    it('should reject non-integer page with Portuguese message', () => {
      const { error } = queryPostsSchema.validate({ page: 1.5 });

      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('inteiro');
    });

    it('should reject non-integer limit with Portuguese message', () => {
      const { error } = queryPostsSchema.validate({ limit: 1.5 });

      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('inteiro');
    });
  });

  describe('searchPostsSchema', () => {
    it('should validate valid search query', () => {
      const { error, value } = searchPostsSchema.validate({ q: 'javascript' });

      expect(error).toBeUndefined();
      expect(value.q).toBe('javascript');
    });

    it('should reject missing search query with Portuguese message', () => {
      const { error } = searchPostsSchema.validate({});

      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('q');
      expect(error.details[0].message).toBe('Termo de busca é obrigatório');
    });

    it('should reject empty search query with Portuguese message', () => {
      const { error } = searchPostsSchema.validate({ q: '' });

      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('Termo de busca é obrigatório');
    });

    it('should reject non-string search query with Portuguese message', () => {
      const { error } = searchPostsSchema.validate({ q: 123 });

      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('Termo de busca deve ser uma string');
    });

    it('should apply default pagination for search', () => {
      const { error, value } = searchPostsSchema.validate({ q: 'test' });

      expect(error).toBeUndefined();
      expect(value.page).toBe(1);
      expect(value.limit).toBe(10);
    });

    it('should reject non-number page with Portuguese message', () => {
      const { error } = searchPostsSchema.validate({ q: 'test', page: 'abc' });

      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('Página deve ser um número');
    });

    it('should reject page zero with Portuguese message', () => {
      const { error } = searchPostsSchema.validate({ q: 'test', page: 0 });

      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('maior que 0');
    });

    it('should reject non-integer page with Portuguese message', () => {
      const { error } = searchPostsSchema.validate({ q: 'test', page: 1.5 });

      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('inteiro');
    });

    it('should reject non-number limit with Portuguese message', () => {
      const { error } = searchPostsSchema.validate({ q: 'test', limit: 'abc' });

      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('Limite deve ser um número');
    });

    it('should reject limit zero with Portuguese message', () => {
      const { error } = searchPostsSchema.validate({ q: 'test', limit: 0 });

      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('maior que 0');
    });

    it('should reject limit exceeding 100 with Portuguese message', () => {
      const { error } = searchPostsSchema.validate({ q: 'test', limit: 101 });

      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('máximo');
    });

    it('should reject non-integer limit with Portuguese message', () => {
      const { error } = searchPostsSchema.validate({ q: 'test', limit: 1.5 });

      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('inteiro');
    });

    it('should accept valid status values', () => {
      const { error: e1 } = searchPostsSchema.validate({ q: 'test', status: 'draft' });
      const { error: e2 } = searchPostsSchema.validate({ q: 'test', status: 'published' });
      const { error: e3 } = searchPostsSchema.validate({ q: 'test', status: 'all' });

      expect(e1).toBeUndefined();
      expect(e2).toBeUndefined();
      expect(e3).toBeUndefined();
    });

    it('should reject invalid status with Portuguese message', () => {
      const { error } = searchPostsSchema.validate({ q: 'test', status: 'invalid' });

      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('Status deve ser "draft", "published" ou "all"');
    });
  });

  describe('postIdSchema', () => {
    it('should validate valid MongoDB ObjectId', () => {
      const { error, value } = postIdSchema.validate({ id: '507f1f77bcf86cd799439011' });

      expect(error).toBeUndefined();
      expect(value.id).toBe('507f1f77bcf86cd799439011');
    });

    it('should reject invalid ObjectId with Portuguese message', () => {
      const { error } = postIdSchema.validate({ id: 'invalid-id' });

      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('id');
      expect(error.details[0].message).toBe('ID do post inválido');
    });

    it('should reject missing id with Portuguese message', () => {
      const { error } = postIdSchema.validate({});

      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('ID do post é obrigatório');
    });

    it('should reject id with extra prefix characters', () => {
      const { error } = postIdSchema.validate({ id: 'zz507f1f77bcf86cd799439011' });

      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('ID do post inválido');
    });

    it('should reject id with extra suffix characters', () => {
      const { error } = postIdSchema.validate({ id: '507f1f77bcf86cd799439011zz' });

      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('ID do post inválido');
    });

    it('should reject id shorter than 24 hex characters', () => {
      const { error } = postIdSchema.validate({ id: '507f1f77bcf86cd79943901' });

      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('ID do post inválido');
    });
  });
});
