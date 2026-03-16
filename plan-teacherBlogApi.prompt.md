## Plan: Backend Blogging API para Professores

> **Status geral (Março 2026):** ✅ Implementação concluída. Todos os endpoints funcionais, 166 testes unitários, 100% de cobertura, Docker (dev + produção) verificado e operacional.

Implementar uma API REST completa em Node.js/Express com MongoDB para permitir que professores publiquem e gerenciem conteúdo educacional, seguindo a arquitetura em camadas já definida no projeto.

### Decisões Técnicas (Refinadas)

- **Autenticação**: Não será implementada nesta fase. Endpoints públicos. (JWT pode ser adicionado futuramente)
- **Validação de dados**: Usar `Joi` para validação declarativa de schemas (na camada de interfaces)
- **Variáveis de ambiente**: `.env` com valores padrão de desenvolvimento (`PORT=3000`, `MONGODB_URI=mongodb://localhost:27017/postech_blog`, `NODE_ENV=development`)
- **Diferenciação de atores (Opção C)**: Campo `status` no Post com query parameter para filtrar visões de aluno vs professor (sem autenticação)
- **Testes de mutação**: Usar `Stryker` para validar qualidade dos testes unitários
- **Documentação API**: Usar `Swagger` (swagger-jsdoc + swagger-ui-express) para documentação interativa
- **Linter e Formatação**: Usar `ESLint` + `Prettier` para garantir padrão de código com boas práticas DDD e Clean Code
- **Análise de código**: Usar `SonarQube` para análise estática de qualidade, code smells, bugs e vulnerabilidades
- **Logging**: Usar `winston` para logs estruturados com níveis (error, warn, info, debug)
- **Tratamento de erros**: Middleware centralizado com classes de erro customizadas
- **Paginação**: Endpoints de listagem suportam `?page=1&limit=10`
- **Resposta padronizada**: Wrapper consistente para todas as respostas da API
- **MongoDB via Docker**: Container Docker para MongoDB em desenvolvimento (`docker-compose.dev.yml`) e stack completa em produção (`docker-compose.yml`), com script de inicialização para seed de dados
- **Docker Compose V2**: Usa `docker compose` (plugin V2), NÃO o legado `docker-compose` com hífen
- **Mongoose 9**: Usar `{ returnDocument: 'after' }` em vez do `{ new: true }` (deprecated) no `findByIdAndUpdate()`

### Steps

1. ✅ **Corrigir entrypoint e configurar `package.json`** — Atualizado scripts para apontar para `src/server.js`, adicionado scripts de teste (`jest`, `stryker`), lint (`eslint`), Docker (`docker compose` V2), e dependências: `dotenv`, `express@5`, `joi`, `mongoose@9`, `winston`, `swagger-jsdoc`, `swagger-ui-express`, `jest`, `supertest`, `nodemon`, `eslint`, `prettier`, `@stryker-mutator/core`, `@stryker-mutator/jest-runner`.

2. ✅ **Configurar arquivos de projeto** — Criados:
   - [.eslintrc.json](.eslintrc.json) com regras para Clean Code e DDD (restrições de import por camada)
   - [.prettierrc](.prettierrc) para formatação consistente
   - [.eslintignore](.eslintignore) e [.prettierignore](.prettierignore) para excluir arquivos
   - [.gitignore](.gitignore) com exclusões padrão Node.js
   - [.dockerignore](.dockerignore) para otimizar build Docker
   - [jest.config.js](jest.config.js) com configuração de testes, threshold ≥95% e mocks

3. ✅ **Configurar variáveis de ambiente** — Criados [.env.example](.env.example) e [.env](.env) com valores padrão (`PORT=3000`, `MONGODB_URI`, `NODE_ENV=development`, `LOG_LEVEL=info`).

4. ✅ **Criar camada de domínio** — Implementados:
   - [src/domain/entities/Post.js](src/domain/entities/Post.js) — entidade pura com `publish()`, `setDraft()`, `update()`, `isPublished()`, `isDraft()`, `toJSON()`
   - [src/domain/errors/AppError.js](src/domain/errors/AppError.js) — `AppError`, `NotFoundError`, `ValidationError`, `ConflictError`, `InternalError`

5. ✅ **Criar camada de infraestrutura** — Implementados:
   - [src/infrastructure/database/connection.js](src/infrastructure/database/connection.js) — `connectDatabase()` e `disconnectDatabase()`
   - [src/infrastructure/database/schemas/PostSchema.js](src/infrastructure/database/schemas/PostSchema.js) — schema Mongoose com transform `_id` → `id`, índices text e status
   - [src/infrastructure/repositories/PostRepository.js](src/infrastructure/repositories/PostRepository.js) — singleton com CRUD, `_toEntity()`, `search()` com `$text`, filtragem por status, paginação
   - [src/infrastructure/logging/logger.js](src/infrastructure/logging/logger.js) — Winston com console (sempre) + file transports (produção: `logs/error.log`, `logs/combined.log`)

6. ✅ **Criar camada de aplicação** — Implementados:
   - [src/application/usecases/PostService.js](src/application/usecases/PostService.js) — `createPost`, `getAllPosts`, `getPostById`, `updatePost`, `deletePost`, `searchPosts`
   - [src/application/validators/postValidator.js](src/application/validators/postValidator.js) — schemas Joi: `createPostSchema`, `updatePostSchema`, `queryPostsSchema`, `searchPostsSchema`, `postIdSchema`

7. ✅ **Criar camada de interfaces** — Implementados:
   - [src/interfaces/http/controllers/PostController.js](src/interfaces/http/controllers/PostController.js) — handlers thin delegando para PostService
   - [src/interfaces/http/middlewares/validateRequest.js](src/interfaces/http/middlewares/validateRequest.js) — `validateBody()`, `validateQuery()`, `validateParams()`
   - [src/interfaces/http/middlewares/errorHandler.js](src/interfaces/http/middlewares/errorHandler.js) — centralizado, trata erros operacionais, Mongoose ValidationError/CastError
   - [src/interfaces/http/routes/postRoutes.js](src/interfaces/http/routes/postRoutes.js) — rotas REST com anotações Swagger JSDoc inline
   - [src/interfaces/http/routes/healthRoutes.js](src/interfaces/http/routes/healthRoutes.js) — health check com status do banco
   - [src/interfaces/http/presenters/responseFormatter.js](src/interfaces/http/presenters/responseFormatter.js) — `success()`, `paginated()`, `error()`

8. ✅ **Implementar testes unitários completos** — 166 testes, 100% coverage. Criados:
   - [tests/setup.js](tests/setup.js) — silencia logger, define `NODE_ENV=test`
   - [tests/unit/domain/entities/Post.test.js](tests/unit/domain/entities/Post.test.js) — 16 testes
   - [tests/unit/domain/errors/AppError.test.js](tests/unit/domain/errors/AppError.test.js) — 9 testes
   - [tests/unit/application/usecases/PostService.test.js](tests/unit/application/usecases/PostService.test.js) — 10 testes
   - [tests/unit/application/validators/postValidator.test.js](tests/unit/application/validators/postValidator.test.js) — 18 testes
   - [tests/unit/infrastructure/database/connection.test.js](tests/unit/infrastructure/database/connection.test.js) — 9 testes
   - [tests/unit/infrastructure/database/PostSchema.test.js](tests/unit/infrastructure/database/PostSchema.test.js) — 8 testes
   - [tests/unit/infrastructure/logging/logger.test.js](tests/unit/infrastructure/logging/logger.test.js) — 12 testes
   - [tests/unit/infrastructure/repositories/PostRepository.test.js](tests/unit/infrastructure/repositories/PostRepository.test.js) — 16 testes
   - [tests/unit/infrastructure/swagger/swaggerConfig.test.js](tests/unit/infrastructure/swagger/swaggerConfig.test.js) — 5 testes
   - [tests/unit/interfaces/controllers/PostController.test.js](tests/unit/interfaces/controllers/PostController.test.js) — 12 testes
   - [tests/unit/interfaces/middlewares/errorHandler.test.js](tests/unit/interfaces/middlewares/errorHandler.test.js) — 7 testes
   - [tests/unit/interfaces/middlewares/validateRequest.test.js](tests/unit/interfaces/middlewares/validateRequest.test.js) — 10 testes
   - [tests/unit/interfaces/presenters/responseFormatter.test.js](tests/unit/interfaces/presenters/responseFormatter.test.js) — 8 testes
   - [tests/unit/interfaces/routes/postRoutes.test.js](tests/unit/interfaces/routes/postRoutes.test.js) — 16 testes (Supertest)
   - [tests/unit/interfaces/routes/healthRoutes.test.js](tests/unit/interfaces/routes/healthRoutes.test.js) — 5 testes

9. ✅ **Configurar Swagger** — Implementado:
   - [src/infrastructure/swagger/swaggerConfig.js](src/infrastructure/swagger/swaggerConfig.js) — OpenAPI 3.0
   - Anotações JSDoc inline em [src/interfaces/http/routes/postRoutes.js](src/interfaces/http/routes/postRoutes.js)
   - UI disponível em `http://localhost:3000/api-docs`

10. ✅ **Montar servidor Express** — Implementado [src/server.js](src/server.js):
    - Middleware JSON + URL-encoded
    - Request logging via Winston
    - Swagger UI em `/api-docs`
    - Rotas: `/health`, `/posts`
    - Handler 404 para rotas não encontradas
    - Error handler centralizado (último middleware)
    - `startServer()` conecta ao DB e escuta na porta
    - Só inicia quando `NODE_ENV !== 'test'`
    - Handlers para `uncaughtException` e `unhandledRejection`

11. ✅ **Configurar Docker** — Criados e verificados:
    - [Dockerfile](Dockerfile) — multi-stage build, node:20-alpine, non-root user `nodejs`, cria dir `logs/` para Winston, healthcheck via wget
    - [docker-compose.yml](docker-compose.yml) — stack completa API + MongoDB, bridge network, healthcheck, sem atributo `version` (obsoleto)
    - [docker-compose.dev.yml](docker-compose.dev.yml) — apenas MongoDB para dev local, sem atributo `version`
    - [scripts/mongo-init.js](scripts/mongo-init.js) — seed com schema validation, text indexes, 3 posts de exemplo
    - [.dockerignore](.dockerignore) — exclui node_modules, tests, .env, coverage, *.md

12. ⬜ **Configurar CI/CD** — Pendente: criar [.github/workflows/ci.yml](.github/workflows/ci.yml) com workflow de lint, testes, mutation tests, SonarQube analysis e build Docker.

13. ✅ **Configurar Stryker** — Criado [stryker.conf.json](stryker.conf.json) com Jest runner, mutação em `src/**/*.js` excluindo `server.js`.

14. ✅ **Configurar SonarQube** — Criado [sonar-project.properties](sonar-project.properties) com coverage, exclusões e quality gate.

15. ✅ **Criar documentação** — Criados [README.md](README.md) e [AGENTS.md](AGENTS.md) com setup, arquitetura e guia de uso.

### Correções aplicadas durante integração Docker

| # | Problema | Correção |
|---|----------|----------|
| 1 | `docker-compose` (legacy) não encontrado no macOS | Atualizado todos os scripts npm para `docker compose` (V2 plugin, sem hífen) |
| 2 | Container API crashando — user non-root sem permissão para criar `logs/` | Adicionado `RUN mkdir -p logs && chown nodejs:nodejs logs` no Dockerfile |
| 3 | Mongoose 9 deprecation warning `{ new: true }` | Substituído por `{ returnDocument: 'after' }` em `PostRepository.js` e no teste |
| 4 | `version: '3.8'` obsoleto nos docker-compose | Removido de ambos os arquivos |

### Endpoints Implementados

| Método | Rota | Descrição | Ator |
|--------|------|-----------|------|
| GET | `/health` | Health check da aplicação | Sistema |
| GET | `/posts?page=1&limit=10` | Lista posts publicados com paginação | Aluno |
| GET | `/posts?status=all&page=1&limit=10` | Lista todos os posts com paginação | Professor |
| GET | `/posts?status=draft` | Lista apenas rascunhos | Professor |
| GET | `/posts/search?q=termo` | Busca posts por palavra-chave | Aluno/Professor |
| GET | `/posts/:id` | Retorna um post específico | Aluno/Professor |
| POST | `/posts` | Cria novo post (status=draft por padrão) | Professor |
| PUT | `/posts/:id` | Atualiza post existente | Professor |
| DELETE | `/posts/:id` | Remove um post | Professor |

### Estrutura de Dados do Post

**Entidade de Domínio (pura, sem framework):**
```javascript
// src/domain/entities/Post.js
class Post {
  constructor({ id, titulo, conteudo, autor, status = 'draft', createdAt, updatedAt }) {
    this.id = id;
    this.titulo = titulo;
    this.conteudo = conteudo;
    this.autor = autor;
    this.status = status;
    this.createdAt = createdAt || new Date();
    this.updatedAt = updatedAt || new Date();
  }

  publish() {
    this.status = 'published';
    this.updatedAt = new Date();
  }

  setDraft() {
    this.status = 'draft';
    this.updatedAt = new Date();
  }

  update({ titulo, conteudo, autor, status }) {
    if (titulo) this.titulo = titulo;
    if (conteudo) this.conteudo = conteudo;
    if (autor) this.autor = autor;
    if (status) this.status = status;
    this.updatedAt = new Date();
  }

  isPublished() {
    return this.status === 'published';
  }

  isDraft() {
    return this.status === 'draft';
  }

  toJSON() {
    return {
      id: this.id,
      titulo: this.titulo,
      conteudo: this.conteudo,
      autor: this.autor,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = Post;
```

**Schema Mongoose (infraestrutura):**
```javascript
// src/infrastructure/database/schemas/PostSchema.js
const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  titulo: { type: String, required: true, minlength: 3, maxlength: 200 },
  conteudo: { type: String, required: true, minlength: 10 },
  autor: { type: String, required: true },
  status: { type: String, enum: ['draft', 'published'], default: 'draft' }
}, { timestamps: true });

// Índices para busca
postSchema.index({ titulo: 'text', conteudo: 'text' });
postSchema.index({ status: 1 });

module.exports = mongoose.model('Post', postSchema);
```

### Padronização de Respostas

```javascript
// src/interfaces/http/presenters/responseFormatter.js

// Resposta de sucesso
const success = (res, data, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    data
  });
};

// Resposta de sucesso com paginação
const paginated = (res, data, pagination) => {
  return res.status(200).json({
    success: true,
    data,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      totalPages: Math.ceil(pagination.total / pagination.limit)
    }
  });
};

// Resposta de erro
const error = (res, message, statusCode = 500, details = null) => {
  return res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(details && { details })
    }
  });
};

module.exports = { success, paginated, error };
```

### Classes de Erro Customizadas

```javascript
// src/domain/errors/AppError.js
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

class NotFoundError extends AppError {
  constructor(resource = 'Recurso') {
    super(`${resource} não encontrado`, 404);
  }
}

class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400);
    this.details = details;
  }
}

class ConflictError extends AppError {
  constructor(message) {
    super(message, 409);
  }
}

class InternalError extends AppError {
  constructor(message) {
    super(message, 500);
  }
}

module.exports = { AppError, NotFoundError, ValidationError, ConflictError, InternalError };
```

### Middleware de Tratamento de Erros

```javascript
// src/interfaces/http/middlewares/errorHandler.js
const logger = require('../../../infrastructure/logging/logger');
const { error } = require('../presenters/responseFormatter');

const errorHandler = (err, req, res, _next) => {
  logger.error({
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  if (err.isOperational) {
    return error(res, err.message, err.statusCode, err.details);
  }

  // Erro não operacional (bug)
  return error(res, 'Erro interno do servidor', 500);
};

module.exports = errorHandler;
```

### Configuração de Logging (Winston)

```javascript
// src/infrastructure/logging/logger.js
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'postech-blog-api' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

module.exports = logger;
```

### Configuração Jest

```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js',
    '!src/infrastructure/swagger/**'
  ],
  coverageThreshold: {
    global: {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95
    }
  },
  testMatch: ['**/tests/**/*.test.js'],
  setupFilesAfterEnv: ['./tests/setup.js'],
  verbose: true
};
```

### Arquivos de Configuração do Projeto

**.gitignore:**
```
# Dependencies
node_modules/

# Environment
.env
.env.local
.env.*.local

# Coverage & Reports
coverage/
reports/
.nyc_output/

# Build
dist/
build/

# IDE
.idea/
.vscode/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
logs/
*.log
npm-debug.log*

# Stryker
.stryker-tmp/
```

**.dockerignore:**
```
node_modules/
npm-debug.log
coverage/
reports/
.stryker-tmp/
.git/
.gitignore
.env
.env.*
*.md
tests/
.idea/
.vscode/
```

### Configuração Stryker

```javascript
// stryker.conf.json
{
  "$schema": "./node_modules/@stryker-mutator/core/schema/stryker-schema.json",
  "packageManager": "npm",
  "testRunner": "jest",
  "coverageAnalysis": "perTest",
  "mutate": [
    "src/**/*.js",
    "!src/server.js"
  ],
  "reporters": ["html", "clear-text", "progress"],
  "thresholds": {
    "high": 80,
    "low": 60,
    "break": 50
  }
}
```

### Configuração Swagger

```javascript
// src/infrastructure/swagger/swaggerConfig.js
const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Postech Blog API',
      version: '1.0.0',
      description: 'API para professores publicarem conteúdo educacional para alunos',
      contact: {
        name: 'Suporte',
        email: 'suporte@postech-blog.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Servidor de desenvolvimento'
      }
    ],
    tags: [
      {
        name: 'Posts',
        description: 'Operações relacionadas a postagens'
      }
    ]
  },
  apis: ['./src/interfaces/routes/*.js']
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
```

**Exemplo de anotação JSDoc nas rotas:**
```javascript
// src/interfaces/routes/postRoutes.js

/**
 * @swagger
 * components:
 *   schemas:
 *     Post:
 *       type: object
 *       required:
 *         - titulo
 *         - conteudo
 *         - autor
 *       properties:
 *         _id:
 *           type: string
 *           description: ID gerado automaticamente
 *         titulo:
 *           type: string
 *           minLength: 3
 *           maxLength: 200
 *           description: Título do post
 *         conteudo:
 *           type: string
 *           minLength: 10
 *           description: Conteúdo do post
 *         autor:
 *           type: string
 *           description: Nome do autor
 *         status:
 *           type: string
 *           enum: [draft, published]
 *           default: draft
 *           description: Status do post
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /posts:
 *   get:
 *     summary: Lista posts
 *     tags: [Posts]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, published, all]
 *         description: Filtrar por status (padrão retorna apenas published)
 *     responses:
 *       200:
 *         description: Lista de posts
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Post'
 *   post:
 *     summary: Cria novo post
 *     tags: [Posts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - titulo
 *               - conteudo
 *               - autor
 *             properties:
 *               titulo:
 *                 type: string
 *               conteudo:
 *                 type: string
 *               autor:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [draft, published]
 *     responses:
 *       201:
 *         description: Post criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Post'
 *       400:
 *         description: Dados inválidos
 */

/**
 * @swagger
 * /posts/search:
 *   get:
 *     summary: Busca posts por palavra-chave
 *     tags: [Posts]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Termo de busca
 *     responses:
 *       200:
 *         description: Posts encontrados
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Post'
 */

/**
 * @swagger
 * /posts/{id}:
 *   get:
 *     summary: Retorna um post específico
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do post
 *     responses:
 *       200:
 *         description: Post encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Post'
 *       404:
 *         description: Post não encontrado
 *   put:
 *     summary: Atualiza um post
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               titulo:
 *                 type: string
 *               conteudo:
 *                 type: string
 *               autor:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [draft, published]
 *     responses:
 *       200:
 *         description: Post atualizado
 *       404:
 *         description: Post não encontrado
 *   delete:
 *     summary: Remove um post
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Post removido
 *       404:
 *         description: Post não encontrado
 */
```

**Integração no servidor:**
```javascript
// src/server.js
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./infrastructure/swagger/swaggerConfig');

// Swagger UI disponível em /api-docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
```

**URL de acesso:** `http://localhost:3000/api-docs`

### Configuração ESLint + Prettier (Clean Code & DDD)

**Dependências:**
```json
{
  "devDependencies": {
    "eslint": "^8.57.0",
    "prettier": "^3.2.5",
    "eslint-config-prettier": "^9.1.0",
    "eslint-plugin-prettier": "^5.1.3",
    "eslint-plugin-node": "^11.1.0"
  }
}
```

**Scripts npm:**
```json
{
  "lint": "eslint src/ tests/ --ext .js",
  "lint:fix": "eslint src/ tests/ --ext .js --fix",
  "format": "prettier --write \"src/**/*.js\" \"tests/**/*.js\""
}
```

**.eslintrc.json** — Regras para Clean Code e DDD:
```json
{
  "env": {
    "node": true,
    "es2021": true,
    "jest": true
  },
  "extends": [
    "eslint:recommended",
    "plugin:prettier/recommended"
  ],
  "plugins": ["node"],
  "parserOptions": {
    "ecmaVersion": "latest"
  },
  "rules": {
    // === CLEAN CODE: Funções pequenas e focadas ===
    "max-lines-per-function": ["warn", { "max": 30, "skipBlankLines": true, "skipComments": true }],
    "max-params": ["warn", 3],
    "max-depth": ["warn", 3],
    "complexity": ["warn", 10],

    // === CLEAN CODE: Nomenclatura clara ===
    "camelcase": ["error", { "properties": "never" }],
    "id-length": ["warn", { "min": 2, "exceptions": ["i", "j", "k", "x", "y", "z", "e", "_"] }],

    // === CLEAN CODE: Evitar código morto ===
    "no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "no-unreachable": "error",
    "no-dead-code": "off",

    // === CLEAN CODE: Consistência ===
    "consistent-return": "error",
    "no-else-return": "warn",
    "prefer-const": "error",
    "no-var": "error",

    // === DDD: Separação de responsabilidades ===
    "no-restricted-imports": ["error", {
      "patterns": [
        {
          "group": ["**/infrastructure/**"],
          "message": "Domain e Application não devem importar diretamente de Infrastructure. Use injeção de dependência."
        }
      ]
    }],

    // === Async/Await ===
    "no-async-promise-executor": "error",
    "require-await": "warn",
    "no-return-await": "warn",

    // === Boas práticas gerais ===
    "eqeqeq": ["error", "always"],
    "no-console": ["warn", { "allow": ["warn", "error", "info"] }],
    "curly": ["error", "all"],
    "no-throw-literal": "error",
    "prefer-promise-reject-errors": "error"
  },
  "overrides": [
    {
      "files": ["src/domain/**/*.js"],
      "rules": {
        "no-restricted-imports": ["error", {
          "patterns": [
            {
              "group": ["mongoose", "express", "**/infrastructure/**", "**/interfaces/**"],
              "message": "Domain deve ser agnóstico a frameworks. Não importe mongoose, express ou camadas externas."
            }
          ]
        }]
      }
    },
    {
      "files": ["src/application/**/*.js"],
      "rules": {
        "no-restricted-imports": ["error", {
          "patterns": [
            {
              "group": ["express", "**/interfaces/**"],
              "message": "Application não deve depender de Express ou da camada de Interfaces."
            }
          ]
        }]
      }
    },
    {
      "files": ["tests/**/*.js"],
      "rules": {
        "max-lines-per-function": "off",
        "no-console": "off"
      }
    }
  ]
}
```

**.prettierrc** — Formatação consistente:
```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "bracketSpacing": true,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

**.eslintignore**:
```
node_modules/
coverage/
reports/
dist/
*.min.js
```

**.prettierignore**:
```
node_modules/
coverage/
reports/
dist/
package-lock.json
```

**Regras DDD implementadas via ESLint:**
| Camada | Restrição |
|--------|-----------|
| `domain/` | Não pode importar mongoose, express, infrastructure, interfaces |
| `application/` | Não pode importar express, interfaces |
| `infrastructure/` | Pode importar domain e application |
| `interfaces/` | Pode importar application (não domain diretamente) |

### Configuração SonarQube

**sonar-project.properties** — Configuração do projeto:
```properties
# Identificação do projeto
sonar.projectKey=postech-blog-api
sonar.projectName=Postech Blog API
sonar.projectVersion=1.0.0

# Configuração de source
sonar.sources=src
sonar.tests=tests
sonar.sourceEncoding=UTF-8

# Linguagem
sonar.language=js
sonar.javascript.lcov.reportPaths=coverage/lcov.info

# Exclusões
sonar.exclusions=**/node_modules/**,**/coverage/**,**/reports/**,**/*.test.js,**/*.spec.js
sonar.test.inclusions=**/*.test.js,**/*.spec.js

# Coverage
sonar.javascript.coveragePlugin=lcov
sonar.coverage.exclusions=**/tests/**,**/node_modules/**,src/server.js

# Duplicação
sonar.cpd.exclusions=**/*.test.js,**/*.spec.js

# Quality Gate
sonar.qualitygate.wait=true
```

**Integração com GitHub Actions:**
```yaml
# .github/workflows/ci.yml (seção SonarQube)
sonarqube:
  name: SonarQube Analysis
  runs-on: ubuntu-latest
  needs: [test]
  steps:
    - uses: actions/checkout@v4
      with:
        fetch-depth: 0  # Shallow clones disabled for better analysis

    - name: Download coverage report
      uses: actions/download-artifact@v4
      with:
        name: coverage-report
        path: coverage

    - name: SonarQube Scan
      uses: SonarSource/sonarqube-scan-action@master
      env:
        SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
        SONAR_HOST_URL: ${{ secrets.SONAR_HOST_URL }}

    - name: SonarQube Quality Gate
      uses: SonarSource/sonarqube-quality-gate-action@master
      timeout-minutes: 5
      env:
        SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
```

**SonarCloud (alternativa gratuita para projetos open source):**
```properties
# sonar-project.properties para SonarCloud
sonar.organization=seu-org-no-github
sonar.projectKey=seu-org_postech-blog-api

sonar.sources=src
sonar.tests=tests
sonar.javascript.lcov.reportPaths=coverage/lcov.info
sonar.exclusions=**/node_modules/**,**/coverage/**
sonar.coverage.exclusions=**/tests/**,src/server.js
```

**Secrets necessários no GitHub:**
| Secret | Descrição |
|--------|-----------|
| `SONAR_TOKEN` | Token de autenticação do SonarQube/SonarCloud |
| `SONAR_HOST_URL` | URL do servidor SonarQube (não necessário para SonarCloud) |

**Quality Gates recomendados:**
| Métrica | Condição | Valor |
|---------|----------|-------|
| Coverage | é menor que | 95% |
| Duplicated Lines | é maior que | 10% |
| Maintainability Rating | é pior que | A |
| Reliability Rating | é pior que | A |
| Security Rating | é pior que | A |
| Security Hotspots Reviewed | é menor que | 100% |

**Scripts npm para análise local (opcional):**
```json
{
  "sonar": "sonar-scanner"
}
```

**Docker Compose para SonarQube local (desenvolvimento):**
```yaml
# docker-compose.sonar.yml
version: '3.8'
services:
  sonarqube:
    image: sonarqube:community
    container_name: sonarqube
    ports:
      - "9000:9000"
    environment:
      - SONAR_ES_BOOTSTRAP_CHECKS_DISABLE=true
    volumes:
      - sonarqube_data:/opt/sonarqube/data
      - sonarqube_logs:/opt/sonarqube/logs
      - sonarqube_extensions:/opt/sonarqube/extensions

volumes:
  sonarqube_data:
  sonarqube_logs:
  sonarqube_extensions:
```

**Comandos úteis:**
```bash
# Subir SonarQube local
docker-compose -f docker-compose.sonar.yml up -d

# Acessar: http://localhost:9000 (admin/admin)

# Rodar análise local (após configurar token)
npm run test -- --coverage
npx sonar-scanner
```