/* global db, print */
// MongoDB initialization script
// Runs automatically on first container start

// eslint-disable-next-line no-global-assign -- MongoDB shell idiom
db = db.getSiblingDB('postech_blog');

// Create posts collection with validation
db.createCollection('posts', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['titulo', 'conteudo', 'autor'],
      properties: {
        titulo: {
          bsonType: 'string',
          minLength: 3,
          maxLength: 200,
          description: 'Título do post — obrigatório, 3-200 caracteres',
        },
        conteudo: {
          bsonType: 'string',
          minLength: 10,
          description: 'Conteúdo do post — obrigatório, mínimo 10 caracteres',
        },
        autor: {
          bsonType: 'string',
          description: 'Nome do autor — obrigatório',
        },
        status: {
          bsonType: 'string',
          enum: ['draft', 'published'],
          description: 'Status do post — draft ou published',
        },
      },
    },
  },
});

// Create text index for search
db.posts.createIndex({ titulo: 'text', conteudo: 'text' });

// Create index for status filtering
db.posts.createIndex({ status: 1 });

// Create compound index for common queries
db.posts.createIndex({ status: 1, createdAt: -1 });

// Seed with sample data for development
db.posts.insertMany([
  {
    titulo: 'Introdução ao JavaScript',
    conteudo:
      'JavaScript é uma linguagem de programação que permite adicionar interatividade a páginas web. Nesta aula, vamos aprender os conceitos fundamentais como variáveis, tipos de dados e operadores.',
    autor: 'Professor Silva',
    status: 'published',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    titulo: 'Fundamentos de HTML5',
    conteudo:
      'HTML5 é a versão mais recente da linguagem de marcação padrão para criar páginas web. Vamos explorar as tags semânticas, formulários e APIs modernas do HTML5.',
    autor: 'Professora Santos',
    status: 'published',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    titulo: 'CSS Grid e Flexbox',
    conteudo:
      'Aprenda a criar layouts modernos e responsivos usando CSS Grid e Flexbox. Estas duas ferramentas são essenciais para qualquer desenvolvedor front-end.',
    autor: 'Professor Silva',
    status: 'draft',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]);

print('✅ Banco postech_blog inicializado com sucesso');
print('   → Collection "posts" criada com validação');
print('   → Índices criados (text, status)');
print('   → 3 posts de exemplo inseridos');
