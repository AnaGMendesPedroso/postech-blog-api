const mongoose = require('mongoose');

describe('PostSchema', () => {
  let PostModel;

  beforeEach(() => {
    jest.resetModules();
    delete mongoose.connection.models['Post'];
    delete mongoose.models['Post'];
    PostModel = require('../../../../src/infrastructure/database/schemas/PostSchema');
  });

  it('should export a Mongoose model', () => {
    expect(PostModel).toBeDefined();
    expect(PostModel.modelName).toBe('Post');
  });

  it('should have required fields', () => {
    const schema = PostModel.schema;

    expect(schema.path('titulo').isRequired).toBe(true);
    expect(schema.path('conteudo').isRequired).toBe(true);
    expect(schema.path('autor').isRequired).toBe(true);
  });

  it('should have status with enum values', () => {
    const statusPath = PostModel.schema.path('status');

    expect(statusPath.enumValues).toContain('draft');
    expect(statusPath.enumValues).toContain('published');
  });

  it('should have default status as draft', () => {
    const statusPath = PostModel.schema.path('status');

    expect(statusPath.defaultValue).toBe('draft');
  });

  it('should have timestamps enabled', () => {
    expect(PostModel.schema.options.timestamps).toBe(true);
  });

  it('should have titulo length constraints', () => {
    const tituloPath = PostModel.schema.path('titulo');

    expect(tituloPath.options.minlength[0]).toBe(3);
    expect(tituloPath.options.maxlength[0]).toBe(200);
  });

  it('should have conteudo minimum length', () => {
    const conteudoPath = PostModel.schema.path('conteudo');

    expect(conteudoPath.options.minlength[0]).toBe(10);
  });

  it('should transform _id to id in toJSON', () => {
    const doc = new PostModel({
      titulo: 'Test Title',
      conteudo: 'Test Content here',
      autor: 'Test Author',
    });

    const json = doc.toJSON();

    expect(json.id).toBeDefined();
    expect(json._id).toBeUndefined();
    expect(json.__v).toBeUndefined();
  });

  // --- New tests for killing survived mutants ---

  describe('validation error messages', () => {
    it('should return Portuguese error for missing titulo', () => {
      const doc = new PostModel({ conteudo: 'Valid content here', autor: 'Author' });
      const errors = doc.validateSync();

      expect(errors.errors.titulo.message).toBe('Título é obrigatório');
    });

    it('should return Portuguese error for short titulo', () => {
      const doc = new PostModel({
        titulo: 'AB',
        conteudo: 'Valid content here',
        autor: 'Author',
      });
      const errors = doc.validateSync();

      expect(errors.errors.titulo.message).toBe('Título deve ter no mínimo 3 caracteres');
    });

    it('should return Portuguese error for long titulo', () => {
      const doc = new PostModel({
        titulo: 'A'.repeat(201),
        conteudo: 'Valid content here',
        autor: 'Author',
      });
      const errors = doc.validateSync();

      expect(errors.errors.titulo.message).toBe('Título deve ter no máximo 200 caracteres');
    });

    it('should return Portuguese error for missing conteudo', () => {
      const doc = new PostModel({ titulo: 'Valid Title', autor: 'Author' });
      const errors = doc.validateSync();

      expect(errors.errors.conteudo.message).toBe('Conteúdo é obrigatório');
    });

    it('should return Portuguese error for short conteudo', () => {
      const doc = new PostModel({
        titulo: 'Valid Title',
        conteudo: 'Short',
        autor: 'Author',
      });
      const errors = doc.validateSync();

      expect(errors.errors.conteudo.message).toBe('Conteúdo deve ter no mínimo 10 caracteres');
    });

    it('should return Portuguese error for missing autor', () => {
      const doc = new PostModel({ titulo: 'Valid Title', conteudo: 'Valid content here' });
      const errors = doc.validateSync();

      expect(errors.errors.autor.message).toBe('Autor é obrigatório');
    });

    it('should return Portuguese error for invalid status', () => {
      const doc = new PostModel({
        titulo: 'Valid Title',
        conteudo: 'Valid content here',
        autor: 'Author',
        status: 'invalid',
      });
      const errors = doc.validateSync();

      expect(errors.errors.status.message).toBe('Status deve ser "draft" ou "published"');
    });
  });

  describe('trim behavior', () => {
    it('should trim titulo whitespace', () => {
      const doc = new PostModel({
        titulo: '  Test Title  ',
        conteudo: 'Valid content here',
        autor: 'Author',
      });

      expect(doc.titulo).toBe('Test Title');
    });

    it('should trim autor whitespace', () => {
      const doc = new PostModel({
        titulo: 'Test Title',
        conteudo: 'Valid content here',
        autor: '  Author  ',
      });

      expect(doc.autor).toBe('Author');
    });
  });

  describe('indexes', () => {
    it('should have text index on titulo and conteudo', () => {
      const indexes = PostModel.schema.indexes();
      const textIndex = indexes.find(([fields]) => fields.titulo === 'text');

      expect(textIndex).toBeDefined();
      expect(textIndex[0]).toEqual({ titulo: 'text', conteudo: 'text' });
    });

    it('should have index on status field', () => {
      const indexes = PostModel.schema.indexes();
      const statusIndex = indexes.find(([fields]) => fields.status === 1 && !fields.createdAt);

      expect(statusIndex).toBeDefined();
    });

    it('should have compound index with status asc and createdAt desc', () => {
      const indexes = PostModel.schema.indexes();
      const compoundIndex = indexes.find(
        ([fields]) => fields.status === 1 && fields.createdAt === -1
      );

      expect(compoundIndex).toBeDefined();
      expect(compoundIndex[0]).toEqual({ status: 1, createdAt: -1 });
    });
  });
});
