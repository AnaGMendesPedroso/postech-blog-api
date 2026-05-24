# Task: Jornada de Comentários em Posts

Implementar sistema de comentários em posts, permitindo que qualquer usuária autenticada (teacher ou student) comente, e que apenas o autor do comentário ou uma professora possa excluí-lo.

## Princípios e Práticas Obrigatórios

| Prática | Aplicação nesta task |
|---------|---------------------|
| **DDD** | Entidade `Comment` no domain layer (pura, sem deps de framework); CommentRepository como adapter de infraestrutura; CommentService contém regras de negócio (ownership check) |
| **TDD** | Red → Green → Refactor para cada unidade. Testes ANTES da implementação. Ordem: entity → repository → service → validator → controller → routes |
| **BDD** | Testes descrevem comportamento com Given-When-Then nos `describe`/`it`. Ex: "should deny deletion when student is not the comment author" |
| **Clean Code** | Nomes descritivos; funções ≤30 linhas; SRP (service não faz HTTP, controller não faz lógica); DRY; sem comentários óbvios |
| **Testes Unitários** | Cobertura ≥ 95% (threshold do projeto) — mínimo absoluto 80% |
| **Testes de Mutação** | Stryker: meta ≥ 90% mutation score, break em 80% |

### Ciclo TDD por Funcionalidade

```
1. Escrever teste que falha (Red)
2. Implementar código mínimo para passar (Green)
3. Refatorar mantendo testes verdes (Refactor)
4. Rodar Stryker para validar qualidade dos testes
```

## Pré-requisitos

- **Task concluída**: `plan-userRegistration.prompt.md` — depende de:
  - Entidade `User`, `UserSchema`, `UserRepository`
  - Middlewares `authenticate` e `authorize`
  - Erros `UnauthorizedError` e `ForbiddenError`
  - `req.user` populado via JWT em rotas protegidas

## Regras de Negócio

- Qualquer usuária autenticada (teacher ou student) pode criar comentários em posts publicados.
- Listagem de comentários de um post é **pública** (não requer autenticação).
- Exclusão de comentário: apenas o **autor do comentário** ou uma **professora** pode deletar.
- Não existe edição de comentário no MVP.
- Um comentário pertence a um post — se o post não existe, não é possível comentar (404).
- `autorId` e `autorNome` são extraídos de `req.user` no controller — **nunca** do request body (prevenção de impersonation).

## Steps

### 1. Domain Layer — Entidade `Comment`

**Arquivo:** `src/domain/entities/Comment.js`

- Campos: `id`, `postId`, `autorId`, `autorNome`, `conteudo`, `createdAt`, `updatedAt`.
- Métodos: `toJSON()` — retorna todos os campos (sem dados sensíveis nesta entidade).
- Padrão: classe pura sem dependências de framework (igual Post.js e User.js).

### 2. Infrastructure — Schema Mongoose `CommentSchema`

**Arquivo:** `src/infrastructure/database/schemas/CommentSchema.js`

```javascript
const commentSchema = new mongoose.Schema({
  postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
  autorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  autorNome: { type: String, required: true, trim: true },
  conteudo: { type: String, required: true, minlength: 1, maxlength: 1000, trim: true },
}, {
  timestamps: true,
  toJSON: { transform: (_doc, ret) => { ret.id = ret._id; delete ret._id; delete ret.__v; return ret; } }
});
```

- Índice composto: `{ postId: 1, createdAt: -1 }` — otimiza listagem paginada por post.
- **Não** usar `populate()` — manter dados denormalizados (autorNome salvo no doc) para performance em leitura.

### 3. Infrastructure — `CommentRepository`

**Arquivo:** `src/infrastructure/repositories/CommentRepository.js`

- **Singleton exportado**: `module.exports = new CommentRepository()`

**Métodos:**

- `create(commentData)` → Comment entity
- `findByPostId(postId, { page = 1, limit = 10 })` → `{ comments: Comment[], total: number }`
- `findById(id)` → Comment entity (lança `NotFoundError('Comentário')`)
- `delete(id)` → void (lança `NotFoundError('Comentário')`)
- `_toEntity(doc)` → mapeia Mongoose doc → entidade Comment

> **Padrão**: mesma estrutura do PostRepository — findAll retorna `{ items[], total }`, findById lança NotFoundError, _toEntity sempre converte.

### 4. Application — `CommentService`

**Arquivo:** `src/application/usecases/CommentService.js`

#### Padrões obrigatórios (lições aprendidas do PostService)

- **Singleton exportado** — `module.exports = new CommentService()`
- **Injeção implícita via require** — importa `commentRepository`, `postRepository` e `logger` no topo; facilita mock com `jest.mock()`.
- **Logging estruturado** — todo método loga entrada (com params relevantes) e saída (com resultado resumido). Usar `logger.info` para sucesso, `logger.warn` para tentativas de acesso negado.
- **parseInt de page/limit** — retornar `page` e `limit` como inteiros no resultado.
- **Não capturar exceções internamente** — deixar erros propagarem ao controller → errorHandler.
- **Funções ≤ 30 linhas** — ESLint enforça.
- **Máximo 3 parâmetros** — usar desestruturação de objeto.

#### Métodos

**`createComment({ postId, autorId, autorNome, conteudo })`**

1. `logger.info('Creating comment', { postId, autorId })`
2. Verifica existência do post: `await postRepository.findById(postId)` — propaga `NotFoundError` se inexistente.
3. `const comment = await commentRepository.create({ postId, autorId, autorNome, conteudo })`
4. `logger.info('Comment created successfully', { commentId: comment.id, postId })`
5. Retorna `comment` (entidade de domínio).

> **Decisão de design**: a verificação de existência do post ocorre no service (não no repository) porque é regra de negócio — um comentário não pode existir sem post válido. O repository é agnóstico à essa invariante.

**`getCommentsByPostId(postId, { page = 1, limit = 10 } = {})`**

1. `logger.info('Fetching comments for post', { postId, page, limit })`
2. `const result = await commentRepository.findByPostId(postId, { page, limit })`
3. `logger.info('Comments fetched successfully', { postId, count: result.comments.length, total: result.total })`
4. Retorna `{ comments: result.comments, total: result.total, page: parseInt(page, 10), limit: parseInt(limit, 10) }`

> **Nota**: NÃO verifica existência do post — retorna lista vazia se post não existe ou não tem comentários. Evita N+1 desnecessário; GET é idempotente.

**`deleteComment(commentId, { userId, userRole })`**

1. `logger.info('Deleting comment', { commentId, userId })`
2. `const comment = await commentRepository.findById(commentId)` — propaga `NotFoundError`.
3. Verifica permissão:
   - Se `comment.autorId !== userId && userRole !== 'teacher'` → `throw new ForbiddenError('Sem permissão para excluir este comentário')`
   - `logger.warn('Unauthorized comment deletion attempt', { commentId, userId, userRole })` no caso negado.
4. `await commentRepository.delete(commentId)`
5. `logger.info('Comment deleted successfully', { commentId, deletedBy: userId })`

> **Decisão de design**: autorização granular no service (não no middleware) porque depende de ownership — dado só disponível após buscar o comment no banco.

### 5. Application — Validator Joi

**Arquivo:** `src/application/validators/commentValidator.js`

```javascript
const createCommentSchema = Joi.object({
  conteudo: Joi.string().min(1).max(1000).required().messages({
    'string.base': 'Conteúdo deve ser uma string',
    'string.empty': 'Conteúdo é obrigatório',
    'string.min': 'Conteúdo deve ter no mínimo {#limit} caractere',
    'string.max': 'Conteúdo deve ter no máximo {#limit} caracteres',
    'any.required': 'Conteúdo é obrigatório',
  }),
});

const commentIdSchema = Joi.object({
  commentId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required().messages({
    'string.pattern.base': 'ID do comentário inválido',
    'any.required': 'ID do comentário é obrigatório',
  }),
});

const postIdParamSchema = Joi.object({
  postId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required().messages({
    'string.pattern.base': 'ID do post inválido',
    'any.required': 'ID do post é obrigatório',
  }),
});

const queryCommentsSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
});
```

### 6. Interfaces — `CommentController`

**Arquivo:** `src/interfaces/http/controllers/CommentController.js`

**`create(req, res, next)`**

```javascript
async create(req, res, next) {
  try {
    const { postId } = req.params;
    const { id: autorId, nome: autorNome } = req.user; // NUNCA do body
    const { conteudo } = req.body;
    const comment = await commentService.createComment({ postId, autorId, autorNome, conteudo });
    success(res, comment.toJSON(), 201);
  } catch (err) { next(err); }
}
```

> **CRÍTICO**: `autorId` e `autorNome` vêm de `req.user` (populado por `authenticate` middleware). Isso impede impersonation.

**`getByPostId(req, res, next)`** — extrai `postId` de params, `page`/`limit` de query → `paginated()`.

**`delete(req, res, next)`** — extrai `commentId` de params, `userId`/`userRole` de `req.user` → 204.

### 7. Interfaces — Rotas

**Arquivo:** `src/interfaces/http/routes/commentRoutes.js`

```
POST   /posts/:postId/comments       → authenticate → validateParams(postIdParamSchema) → validateBody(createCommentSchema) → CommentController.create
GET    /posts/:postId/comments       → validateParams(postIdParamSchema) → validateQuery(queryCommentsSchema) → CommentController.getByPostId
DELETE /posts/:postId/comments/:commentId → authenticate → validateParams(merged) → CommentController.delete
```

- Swagger JSDoc annotations completas em cada rota.
- Registrar no `src/server.js`:

```javascript
const commentRoutes = require('./interfaces/http/routes/commentRoutes');
app.use('/posts', commentRoutes); // monta em /posts/:postId/comments
```

### 8. Atualizar Seed Script

**Arquivo:** `scripts/mongo-init.js` (modificar)

- Criar collection `comments` com schema validation.
- Seed com 2-3 comentários de exemplo nos posts existentes.

### 10. Documentação & Collection

#### 10a. Collection Bruno (API client)

Criar pasta `collection/Postech Blog API/Comments/` com:

**`folder.yml`:**
```yaml
info:
  name: Comments
  type: folder
  seq: 3
```

**`Cria comentário em post.yml`:**
- `POST {{baseUrl}}/posts/{{postId}}/comments`
- Header: `Authorization: Bearer {{authToken}}`
- Body: `{ "conteudo": "{{randomConteudo}}" }`
- Examples: 201 (sucesso), 400 (conteúdo inválido), 401 (sem auth), 404 (post inexistente)

**`Lista comentários de um post.yml`:**
- `GET {{baseUrl}}/posts/{{postId}}/comments?page=1&limit=10`
- Sem auth (público)
- Examples: 200 (com comentários), 200 (lista vazia)

**`Remove um comentário.yml`:**
- `DELETE {{baseUrl}}/posts/{{postId}}/comments/{{commentId}}`
- Header: `Authorization: Bearer {{authToken}}`
- Examples: 204 (sucesso), 401 (sem auth), 403 (sem permissão), 404 (não encontrado)

**Atualizar environment** (`environments/Servidor de desenvolvimento.yml`):
```yaml
name: Servidor de desenvolvimento
variables:
  - name: baseUrl
    value: http://localhost:3000
  - name: authToken
    value: ""
  - name: postId
    value: ""
  - name: commentId
    value: ""
```

#### 10b. README.md

Adicionar seção "Comentários" com:
- Tabela de endpoints
- Regras de permissão (quem pode criar, quem pode deletar)
- Exemplos de request/response

#### 10c. AGENTS.md

Atualizar:
- Estrutura de diretórios (Comment entity, CommentSchema, CommentRepository, CommentService, CommentController, commentRoutes)
- Tabela de API endpoints (adicionar `/posts/:postId/comments/*`)
- Status do projeto (atualizar contagem de testes)

#### 10d. Swagger

- Regenerar: `npm run swagger:export`
- Verificar que `docs/swagger.json` inclui endpoints de comments com schemas corretos

### 9. Testes (TDD + BDD + Mutação)

#### Ordem de implementação TDD

Cada item é um ciclo Red → Green → Refactor:

1. `Comment` entity (testes → implementação)
2. `CommentRepository` (testes com mock do Mongoose → implementação)
3. `CommentService` (testes com mock do repository → implementação)
4. `commentValidator` (testes dos schemas → implementação)
5. `CommentController` (testes com mock do service → implementação)
6. `commentRoutes` (testes de integração com supertest → implementação)

#### Edge Cases & Validações (QA perspective)

| Cenário | Comportamento esperado | Status code |
|---------|----------------------|-------------|
| Post inexistente ao criar comentário | `NotFoundError('Post')` | 404 |
| `autorId` diferente do `req.user.id` (spoofing via body) | Controller ignora body; usa `req.user` | N/A (prevenido) |
| Aluna tenta deletar comentário de outra pessoa | `ForbiddenError` | 403 |
| Professora deleta comentário de qualquer pessoa | Sucesso | 204 |
| Autor (student) deleta próprio comentário | Sucesso | 204 |
| `commentId` inválido (não ObjectId) | Joi rejeita | 400 |
| `postId` inválido no path | Joi rejeita | 400 |
| Post sem comentários | Lista vazia | 200 |
| `conteudo` vazio | Joi rejeita | 400 |
| `conteudo` > 1000 chars | Joi rejeita | 400 |
| Paginação com page > totalPages | Lista vazia com total correto | 200 |
| Usuária não autenticada tenta criar comentário | `UnauthorizedError` | 401 |
| Usuária não autenticada tenta deletar comentário | `UnauthorizedError` | 401 |

#### Testes Unitários (BDD style — Given/When/Then)

| Arquivo | Cenários (BDD) |
|---------|----------|
| `tests/unit/domain/entities/Comment.test.js` | should create comment with all fields; should return all fields in toJSON |
| `tests/unit/infrastructure/repositories/CommentRepository.test.js` | should create comment and return entity; should find comments by postId with pagination; should return empty list when post has no comments; should find comment by id; should throw NotFoundError when comment id not found; should delete comment; should throw NotFoundError when deleting non-existent comment |
| `tests/unit/application/usecases/CommentService.test.js` | should create comment when post exists; should reject comment creation when post does not exist (NotFoundError); should return paginated comments for post; should use default page and limit when not provided; should allow author to delete own comment; should allow teacher to delete any comment; should deny student from deleting another user's comment (ForbiddenError); should reject deletion of non-existent comment (NotFoundError); should log warning on unauthorized deletion attempt; should log success on comment operations |
| `tests/unit/application/validators/commentValidator.test.js` | should validate valid comment content; should reject empty content; should reject content exceeding 1000 chars; should validate valid ObjectId; should reject invalid ObjectId format; should validate pagination params |
| `tests/unit/interfaces/controllers/CommentController.test.js` | should return 201 with comment using data from req.user; should return 200 with paginated comments; should return 204 on successful deletion; should propagate errors to next middleware |
| `tests/unit/interfaces/routes/commentRoutes.test.js` | should create comment when authenticated (201); should reject comment creation without auth (401); should list comments publicly (200); should delete own comment (204); should deny deletion by non-author student (403) |

#### Testes de Mutação — Foco

Mutantes mais comuns a matar nesta task:

| Tipo de mutante | Onde aparece | Como matar |
|----------------|--------------|------------|
| Conditional boundary | `comment.autorId !== userId && userRole !== 'teacher'` | Testar todas as combinações: autor/não-autor × teacher/student |
| Removed function call | `postRepository.findById(postId)` | Verificar que post inexistente causa 404 |
| String literal | Mensagens de erro | Assertions exatas no texto |
| Equality operator | `!==` na ownership check | Testar autor=correto e autor=incorreto |
| Block removal | `throw new ForbiddenError(...)` | Confirmar que exceção é lançada |

**Cobertura mínima**: ≥ 95% branches/functions/lines/statements (Jest). ≥ 90% mutation score (Stryker, break: 80%).

## Estrutura de Arquivos

```
src/
├── domain/entities/
│   └── Comment.js                    ← NEW
├── application/
│   ├── usecases/
│   │   └── CommentService.js        ← NEW
│   └── validators/
│       └── commentValidator.js      ← NEW
├── infrastructure/
│   ├── database/schemas/
│   │   └── CommentSchema.js         ← NEW
│   └── repositories/
│       └── CommentRepository.js     ← NEW
└── interfaces/http/
    ├── controllers/
    │   └── CommentController.js     ← NEW
    └── routes/
        └── commentRoutes.js         ← NEW
```

## API Endpoints

| Method | Route | Auth | Role | Description |
|--------|-------|------|------|-------------|
| POST | `/posts/:postId/comments` | JWT | teacher ou student | Criar comentário |
| GET | `/posts/:postId/comments` | — | — | Listar comentários do post (paginado) |
| DELETE | `/posts/:postId/comments/:commentId` | JWT | autor ou teacher | Excluir comentário |

## Response Format

**Criar comentário (201):**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "postId": "...",
    "autorId": "...",
    "autorNome": "Ana Silva",
    "conteudo": "Ótimo post!",
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

**Listar comentários (200):**
```json
{
  "success": true,
  "data": [...],
  "pagination": { "page": 1, "limit": 10, "total": 25, "totalPages": 3 }
}
```

**Deletar comentário (204):** sem body.

## Definition of Done

### Funcional
- [ ] `POST /posts/:postId/comments` cria comentário com dados de `req.user` (201)
- [ ] `POST /posts/:postId/comments` em post inexistente retorna 404
- [ ] `POST /posts/:postId/comments` sem autenticação retorna 401
- [ ] `GET /posts/:postId/comments` retorna lista paginada (público, 200)
- [ ] `GET /posts/:postId/comments` em post sem comentários retorna lista vazia (200)
- [ ] `DELETE /posts/:postId/comments/:commentId` pelo autor retorna 204
- [ ] `DELETE /posts/:postId/comments/:commentId` por teacher (não autor) retorna 204
- [ ] `DELETE /posts/:postId/comments/:commentId` por student (não autor) retorna 403
- [ ] `DELETE /posts/:postId/comments/:commentId` sem autenticação retorna 401
- [ ] `DELETE /posts/:postId/comments/:commentId` inexistente retorna 404
- [ ] Validação Joi rejeita conteúdo vazio ou > 1000 chars (400)
- [ ] Validação Joi rejeita IDs malformados (400)

### Qualidade & Práticas
- [ ] TDD aplicado: testes escritos ANTES da implementação (evidência via commits)
- [ ] BDD: testes descrevem comportamento com Given/When/Then
- [ ] DDD: entidade Comment pura (zero deps de framework); ownership check no domain/service layer
- [ ] Clean Code: funções ≤30 linhas; nomes descritivos; SRP; sem comentários óbvios
- [ ] Cobertura de testes unitários ≥ 95% (jest --coverage)
- [ ] Mutation score ≥ 90% (npm run test:mutation)
- [ ] Build não quebra (Stryker break threshold = 80%)
- [ ] Swagger atualizado com endpoints de comments
- [ ] Seed script inclui comentários de exemplo
- [ ] ESLint passa sem erros (`npm run lint`)

### Documentação & Collection (obrigatório em toda task)
- [ ] **Collection Bruno atualizada** (`collection/Postech Blog API/Comments/`) com requests para create, list, delete
- [ ] Collection inclui `folder.yml` para pasta Comments
- [ ] Collection inclui examples (201, 200, 204, 400, 401, 403, 404) em cada request
- [ ] Requests autenticados usam `{{authToken}}` (configurado na task anterior)
- [ ] **README.md** atualizado com seção de comentários (endpoints, permissões)
- [ ] **AGENTS.md** atualizado com nova estrutura e endpoints
- [ ] **Swagger/OpenAPI** (`docs/swagger.json`) regenerado com `npm run swagger:export`
