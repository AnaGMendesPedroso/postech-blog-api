# Postech Blog API

> API REST para professores da rede pública de educação publicarem e gerenciarem conteúdo educacional para alunos — Tech Challenge FIAP/Alura PosTech.

## 📋 Índice

- [Sobre o Projeto](#sobre-o-projeto)
- [Arquitetura](#arquitetura)
- [Tecnologias](#tecnologias)
- [Instalação](#instalação)
- [Uso](#uso)
- [Endpoints](#endpoints)
- [Testes](#testes)
- [Docker](#docker)
- [Documentação da API](#documentação-da-api)
- [Qualidade de Código](#-qualidade-de-código)
- [Status do Projeto](#-status-do-projeto)

## 📖 Sobre o Projeto

A **Postech Blog API** é uma API REST desenvolvida como parte do Tech Challenge da pós-graduação em Desenvolvimento Full Stack da FIAP/Alura (PosTech). O projeto aborda um problema real da educação pública brasileira: a ausência de uma plataforma centralizada onde professores possam criar, gerenciar e compartilhar conteúdo educacional de forma prática e acessível.

A aplicação permite que **professores** criem e editem postagens (incluindo rascunhos), enquanto **alunos** acessam apenas o conteúdo já publicado. A diferenciação de perfis é feita via **autenticação JWT com roles** (`teacher`/`student`): rotas de escrita exigem um token válido de professora. O registro de professoras é protegido por um código de acesso (`TEACHER_ACCESS_CODE`) para mitigar escalação de privilégios.

Construída sobre princípios de **Clean Architecture** e **Domain-Driven Design (DDD)**, a API possui separação estrita de camadas (domain, application, infrastructure, interfaces), com fronteiras enforçadas via ESLint. O código segue padrões de **Clean Code** com limites de complexidade, cobertura de testes unitários superior a 97% e testes de mutação via Stryker para garantir a qualidade e sensibilidade da suíte de testes.

### Funcionalidades

- ✅ Criar, editar e excluir postagens
- ✅ Listar postagens publicadas (para alunas)
- ✅ Listar todas as postagens incluindo rascunhos (para professoras)
- ✅ Buscar postagens por palavra-chave (full-text search)
- ✅ Paginação em listagens
- ✅ **Autenticação JWT** com registro e login
- ✅ **Autorização por role** (`teacher`/`student`) nas rotas de escrita
- ✅ **Código de acesso** para registro de professoras (mitigação de privilege escalation)
- ✅ Documentação interativa com Swagger
- ✅ Health check com status do banco de dados
- ✅ Containerização completa com Docker (dev + produção)

## 🏗️ Arquitetura

O projeto segue os princípios de **Clean Architecture** e **DDD (Domain-Driven Design)**:

```
src/
├── domain/           # Entidades e regras de negócio (sem dependências externas)
│   ├── entities/     # Post, User — entidades puras com toJSON()
│   └── errors/       # AppError, NotFoundError, ValidationError, ConflictError,
│                     # InternalError, UnauthorizedError, ForbiddenError
├── application/      # Casos de uso e lógica de aplicação
│   ├── usecases/     # PostService, AuthService (register, login)
│   └── validators/   # Schemas de validação Joi (posts + auth)
├── infrastructure/   # Implementações externas
│   ├── database/     # Conexão MongoDB + schemas Mongoose (PostSchema, UserSchema)
│   ├── repositories/ # PostRepository, UserRepository — singletons, mapeiam docs → entidades
│   ├── logging/      # Winston (console + file em produção)
│   └── swagger/      # Configuração OpenAPI 3.0
└── interfaces/       # Adaptadores de interface
    └── http/
        ├── controllers/  # PostController, AuthController — handlers thin
        ├── middlewares/   # validateRequest, errorHandler, authenticate (JWT), authorize (role)
        ├── routes/        # postRoutes, authRoutes, healthRoutes (Swagger JSDoc)
        └── presenters/    # Formatação padronizada de respostas
```

### Fluxo de Dependências (enforced via ESLint)

```
┌─────────────────────────────────────────┐
│  interfaces (Express, HTTP, rotas)      │
│  ┌───────────────────────────────────┐  │
│  │  application (use cases, Joi)     │  │
│  │  ┌─────────────────────────────┐  │  │
│  │  │  domain (Post, User, erros) │  │  │
│  │  │  Núcleo puro, zero deps     │  │  │
│  │  └─────────────────────────────┘  │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
        ↕
┌─────────────────────────────────────────┐
│  infrastructure (Mongoose, Winston)     │
└─────────────────────────────────────────┘
```

| Camada | Restrição |
|--------|-----------|
| `domain/` | Não importa mongoose, express, infrastructure, interfaces |
| `application/` | Não importa express, interfaces |
| `infrastructure/` | Pode importar domain e application |
| `interfaces/` | Pode importar application (não domain diretamente) |

### Diferenciação de Atores

A diferenciação professora/aluna é feita via **autenticação JWT com roles**:
- **Aluna (`student`)**: visualiza posts publicados e pode buscar por palavra-chave. Registro aberto, sem código.
- **Professora (`teacher`)**: cria, edita e exclui posts (requer JWT com `role: teacher` no payload). Registro exige `codigoAcesso` correspondente à env `TEACHER_ACCESS_CODE`.
- **Token**: enviado via header `Authorization: Bearer <token>`. Payload inclui `{ id, email, role }`.
- **Endpoints de leitura** (`GET /posts`, `GET /posts/search`, `GET /posts/:id`) são públicos — não exigem JWT.

## 🛠️ Tecnologias

- **Runtime**: Node.js 24 LTS (Krypton)
- **Framework**: Express 5
- **Banco de Dados**: MongoDB 7 com Mongoose 9
- **Autenticação**: JSON Web Tokens (jsonwebtoken) + bcryptjs
- **Validação**: Joi
- **Documentação**: Swagger (OpenAPI 3.0)
- **Logging**: Winston
- **Testes**: Jest + Supertest
- **Testes de Mutação**: Stryker
- **Linter**: ESLint + Prettier
- **Análise de Código**: SonarQube
- **Container**: Docker (Compose V2) via Colima (macOS)

## 🚀 Instalação

### Pré-requisitos

- Node.js 24+ (LTS Krypton) — recomendamos usar [nvm](https://github.com/nvm-sh/nvm) com o `.nvmrc` incluso
- [Colima](https://github.com/abiosoft/colima) + Docker CLI + Docker Compose plugin
- npm

```bash
# Instalar pré-requisitos via Homebrew (macOS)
brew install colima docker docker-compose nvm

# Ativar a versão correta do Node.js via .nvmrc
nvm install
nvm use
```

### Passos

1. Clone o repositório:
```bash
git clone <repository-url>
cd postech-blog-api
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env
```

4. Inicie o ambiente de desenvolvimento (Colima + Docker + MongoDB):
```bash
npm run dev:setup
```
> Este comando inicializa o Colima, aguarda o Docker daemon, sobe o MongoDB e verifica a conectividade. Na primeira execução, o banco é populado com 3 posts de exemplo.

5. Inicie a aplicação:
```bash
# Desenvolvimento (com hot-reload)
npm run dev

# Produção
npm start
```

6. Para parar tudo (MongoDB + Colima):
```bash
npm run dev:stop
```

## 📝 Uso

### Variáveis de Ambiente

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `PORT` | Porta do servidor | `3000` |
| `NODE_ENV` | Ambiente (development/production/test) | `development` |
| `MONGODB_URI` | URI de conexão MongoDB | `mongodb://localhost:27017/postech_blog` |
| `LOG_LEVEL` | Nível de log (error/warn/info/debug) | `info` |
| `JWT_SECRET` | Chave secreta para assinar tokens JWT | — (obrigatório) |
| `JWT_EXPIRES_IN` | Tempo de expiração do token JWT | `7d` |
| `TEACHER_ACCESS_CODE` | Código de acesso para registro de professoras | — (obrigatório) |

### Scripts npm

```bash
# Ambiente de desenvolvimento
npm run dev:setup     # Inicia Colima + Docker + MongoDB
npm run dev:stop      # Para tudo (MongoDB + Colima)
npm run dev:reset     # Reseta dados do MongoDB e reinicia
npm run dev:status    # Mostra status de todos os serviços

# Aplicação
npm start             # Inicia em produção
npm run dev           # Inicia com hot-reload (nodemon)

# Testes
npm test              # Executa testes com coverage
npm run test:watch    # Executa testes em modo watch
npm run test:mutation # Executa testes de mutação (Stryker)

# Qualidade
npm run lint          # Verifica código com ESLint
npm run lint:fix      # Corrige problemas de lint
npm run format        # Formata código com Prettier
npm run sonar         # Executa análise SonarQube

# Docker (baixo nível — geralmente use dev:* acima)
npm run docker:db     # Sobe MongoDB (sem Colima)
npm run docker:up     # Stack completa: API + MongoDB
npm run docker:down   # Para stack completa
npm run docker:logs   # Acompanha logs dos containers
```

## 📡 Endpoints

### Autenticação

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| POST | `/auth/register` | — | Criar conta (`teacher` requer `codigoAcesso`) |
| POST | `/auth/login` | — | Login, retorna JWT |

### Posts

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/health` | — | Health check (inclui status do DB) |
| GET | `/posts` | — | Lista posts publicados (paginado) |
| GET | `/posts?status=all` | — | Lista todos os posts (paginado) |
| GET | `/posts?status=draft` | — | Lista rascunhos |
| GET | `/posts/search?q=termo` | — | Busca full-text por palavra-chave |
| GET | `/posts/:id` | — | Busca post por ID |
| POST | `/posts` | JWT (teacher) | Cria novo post |
| PUT | `/posts/:id` | JWT (teacher) | Atualiza post |
| DELETE | `/posts/:id` | JWT (teacher) | Remove post (retorna 204) |

### Exemplos de Requisição

**Registrar conta (student):**
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Ana Silva",
    "email": "ana@email.com",
    "senha": "123456",
    "role": "student"
  }'
```

**Registrar conta (teacher — requer `codigoAcesso`):**
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Professora Maria",
    "email": "maria@email.com",
    "senha": "123456",
    "role": "teacher",
    "codigoAcesso": "POSTECH-TEACHER-2026"
  }'
```

> ⚠️ O campo `codigoAcesso` é **obrigatório** para `role: teacher` e **proibido** para `role: student`.
> O valor deve corresponder à variável de ambiente `TEACHER_ACCESS_CODE` configurada no servidor.
> Valor padrão para desenvolvimento: `POSTECH-TEACHER-2026`.

**Login:**
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "maria@email.com",
    "senha": "123456"
  }'
```

**Resposta de login (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "nome": "Professora Maria",
      "email": "maria@email.com",
      "role": "teacher",
      "createdAt": "2026-05-24T10:00:00.000Z",
      "updatedAt": "2026-05-24T10:00:00.000Z"
    },
    "token": "<jwt>"
  }
}
```

**Criar Post (requer token de teacher):**
```bash
curl -X POST http://localhost:3000/posts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token-jwt>" \
  -d '{
    "titulo": "Introdução ao JavaScript",
    "conteudo": "Neste post vamos aprender os fundamentos do JavaScript...",
    "autor": "Professora Maria"
  }'
```

**Resposta (201):**
```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "titulo": "Introdução ao JavaScript",
    "conteudo": "Neste post vamos aprender os fundamentos do JavaScript...",
    "autor": "Professora Maria",
    "status": "draft",
    "createdAt": "2026-05-24T10:30:00.000Z",
    "updatedAt": "2026-05-24T10:30:00.000Z"
  }
}
```

**Listar posts (visão professora):**
```bash
curl http://localhost:3000/posts?status=all&page=1&limit=10
```

**Buscar posts:**
```bash
curl http://localhost:3000/posts/search?q=JavaScript
```

## 🧪 Testes

### Filosofia de Testes

A estratégia de testes segue os mesmos princípios da arquitetura DDD do projeto: **cada camada é testada isoladamente**, com suas dependências externas mockadas. Isso garante que os testes validam o comportamento real de cada módulo sem efeitos colaterais de banco de dados, rede ou filesystem.

### Executar Testes

```bash
npm test              # Todos os testes com coverage (293 testes, ~97% coverage)
npm run test:watch    # Modo watch — re-executa ao salvar
npm run test:mutation # Testes de mutação com Stryker
```

### Cobertura

- **293 testes unitários** em 23 test suites
- **~97% de cobertura** (statements, branches, functions, lines)
- Threshold mínimo configurado: **≥95%** — o build falha se cair abaixo

### Configuração

| Arquivo | Propósito |
|---------|-----------|
| `jest.config.js` | Ambiente `node`, threshold ≥95%, coleta coverage de `src/` (exclui `server.js` e `swagger/`) |
| `tests/setup.js` | Define `NODE_ENV=test` e `LOG_LEVEL=error` (silencia logs nos testes), timeout 10s |
| `stryker.conf.json` | Mutation testing com Jest runner, reports HTML + JSON em `reports/mutation/` |

### Arquitetura de Testes por Camada

A estrutura de testes espelha a estrutura do `src/`, garantindo que cada camada tenha cobertura completa:

```
tests/
├── setup.js                                         # Configuração global
└── unit/
    ├── domain/                                      # Testes de regras de negócio puras
    │   ├── entities/Post.test.js
    │   ├── entities/User.test.js
    │   └── errors/AppError.test.js
    ├── application/                                 # Testes de casos de uso e validação
    │   ├── usecases/PostService.test.js
    │   ├── usecases/AuthService.test.js
    │   ├── validators/postValidator.test.js
    │   └── validators/authValidator.test.js
    ├── infrastructure/                              # Testes de adaptadores externos
    │   ├── database/connection.test.js
    │   ├── database/PostSchema.test.js
    │   ├── logging/logger.test.js
    │   ├── repositories/PostRepository.test.js
    │   ├── repositories/UserRepository.test.js
    │   └── swagger/swaggerConfig.test.js
    └── interfaces/                                  # Testes da camada HTTP
        ├── controllers/PostController.test.js
        ├── controllers/AuthController.test.js
        ├── middlewares/errorHandler.test.js
        ├── middlewares/validateRequest.test.js
        ├── middlewares/authenticate.test.js
        ├── middlewares/authorize.test.js
        ├── presenters/responseFormatter.test.js
        ├── routes/postRoutes.test.js
        ├── routes/authRoutes.test.js
        └── routes/healthRoutes.test.js
```

---

### 🔵 Camada Domain — Testes Puros

Testes de unidade **sem nenhum mock** — a camada de domínio é JavaScript puro, sem dependências externas.

**`Post.test.js`** — Valida toda a entidade `Post`:
- Construção com valores padrão (`status=draft`, datas automáticas)
- Métodos de transição de estado: `publish()`, `setDraft()`
- Métodos de consulta: `isPublished()`, `isDraft()`
- Método `update()` com campos parciais
- Serialização `toJSON()` para resposta HTTP
- Verificação de que `updatedAt` é atualizado nas mutações

**`User.test.js`** — Valida toda a entidade `User`:
- Construção com todos os campos e datas padrão
- Métodos `isTeacher()` e `isStudent()` com base no role
- `toJSON()` omite o campo `senha` para segurança

**`AppError.test.js`** — Valida toda a hierarquia de erros:
- `AppError`: status code padrão (500), flag `isOperational`, stack trace
- `NotFoundError`: mensagem com recurso dinâmico, status 404
- `ValidationError`: mensagem + array de detalhes, status 400
- `ConflictError`: status 409
- `UnauthorizedError`: status 401
- `ForbiddenError`: status 403
- `InternalError`: mensagem padrão, status 500

---

### 🟢 Camada Application — Testes com Mock de Repository

Testes de unidade onde o **repositório é mockado** via `jest.mock()` — valida a lógica dos use cases sem tocar no banco de dados.

**`PostService.test.js`** — Valida todos os 6 use cases de posts:
- `createPost`: delega ao repositório, retorna entidade
- `getAllPosts`: paginação (default e custom), parsing de string para int, filtro por status
- `getPostById`: busca por ID, delegação correta
- `updatePost`: delegação com ID + dados
- `deletePost`: delegação da exclusão
- `searchPosts`: busca por keyword com paginação e status, valores default

**`AuthService.test.js`** — Valida os casos de uso de autenticação:
- `register` (student): cria conta sem código de acesso, hasheia senha com bcrypt
- `register` (teacher): valida `codigoAcesso` contra `TEACHER_ACCESS_CODE`, rejeita código inválido ou ausente
- `register`: rejeita email duplicado com `ConflictError`
- `login`: autentica credenciais, retorna JWT com payload `{ id, email, role }`
- `login`: rejeita email desconhecido e senha incorreta com `UnauthorizedError`
- Nunca loga o campo `senha`

**`postValidator.test.js`** e **`authValidator.test.js`** — Validam todos os schemas Joi:
- `createPostSchema`, `updatePostSchema`, `queryPostsSchema`, `searchPostsSchema`, `postIdSchema`
- `registerSchema`: student (sem `codigoAcesso`), teacher (com `codigoAcesso`), restrições de tamanho, roles válidos
- `loginSchema`: campos obrigatórios, formato de email
- Mensagens de erro em português, `abortEarly: false`

---

### 🟡 Camada Infrastructure — Testes com Mock do Mongoose

Testes onde o **Mongoose Model é mockado** — valida que os repositórios traduzem corretamente entre documentos Mongoose e entidades de domínio.

**`PostRepository.test.js`** — Cobre `create`, `findAll` (filtro de status, paginação, defaults), `findById`, `update` (`returnDocument: 'after'`), `delete`, `search` (`$text` + `$meta: textScore`). Cada operação valida o lançamento de `NotFoundError` quando aplicável.

**`UserRepository.test.js`** — Cobre `create` (retorna entidade `User`), `findByEmail` (retorna entidade ou `null`), `findById` (retorna entidade ou lança `NotFoundError`).

**`connection.test.js`** — Valida `connectDatabase()` e `disconnectDatabase()`:
- Conexão bem-sucedida, URI padrão quando env não definida
- Registro de event handlers (`error`, `disconnected`)
- Tratamento de falha na conexão (throw)
- Desconexão bem-sucedida e com erro

**`PostSchema.test.js`** — Valida o schema Mongoose de posts:
- Campos obrigatórios, enum de status, default `draft`
- Constraints de tamanho (titulo min/max, conteudo min), trim de whitespace
- Timestamps habilitados; transformação `_id` → `id` no `toJSON()`
- Mensagens de validação em português
- Índices: texto (`titulo` + `conteudo`), status, composto (`status` asc + `createdAt` desc)

**`logger.test.js`** — Valida a configuração do Winston:
- Nível default, override via `LOG_LEVEL`
- Console transport presente em todos os ambientes
- File transports adicionados apenas em produção (`logs/error.log`, `logs/combined.log`)
- Métodos `info`, `error`, `warn` funcionais; metadata `service: 'postech-blog-api'`

**`swaggerConfig.test.js`** — Valida a spec OpenAPI: informações do projeto, servidor configurado, tags definidas, paths extraídos das anotações JSDoc.

---

### 🔴 Camada Interfaces — Testes com Mock de Service + Supertest

Dois tipos: **unitários** (mock de req/res/next) e **integração HTTP** (Supertest com Express real).

#### Controllers

**`PostController.test.js`** — Valida os 6 handlers (sucesso + propagação de erro via `next`): `create` (201), `getAll` (paginado), `getById`, `update`, `delete` (204 sem body), `search` (com keyword e status).

**`AuthController.test.js`** — Valida `register` (201 com dados do usuário) e `login` (200 com user + token); propagação de erros via `next`.

#### Middlewares

**`authenticate.test.js`** — Valida o middleware JWT:
- Token válido → popula `req.user` com `{ id, email, role }`
- Header ausente → `UnauthorizedError`
- Header sem prefixo `Bearer` → `UnauthorizedError`
- Token expirado ou malformado → `UnauthorizedError`

**`authorize.test.js`** — Valida o middleware de roles:
- Role permitida (único ou múltiplos roles) → chama `next()`
- Role não permitida → `ForbiddenError`

**`errorHandler.test.js`** — Valida o middleware centralizado de erros:
- Erros operacionais (`AppError`): propaga status code e mensagem
- `NotFoundError` (404), `ValidationError` (400 com `details`), `UnauthorizedError` (401), `ForbiddenError` (403)
- Erros não operacionais (bugs): retorna 500 genérico
- Mongoose `ValidationError` e `CastError` (ID inválido → 400)
- Logging de todos os erros via Winston

**`validateRequest.test.js`** — Valida validação de `body`, `query` e `params`; strip de campos desconhecidos; coleta todos os erros (`abortEarly: false`); helpers `validateBody()`, `validateQuery()`, `validateParams()`.

#### Presenters & Routes (integração HTTP)

**`responseFormatter.test.js`** — `success()`, `paginated()` (cálculo de totalPages), `error()` com e sem `details`.

**`postRoutes.test.js`** — 18 testes end-to-end via Supertest:
- Listagem, filtro de status, busca, busca por ID
- **Novo**: rejeita POST/PUT sem token (401) e com token de aluna (403)
- Validações Joi integradas (campos faltantes, título/conteúdo curtos, ID inválido)

**`authRoutes.test.js`** — 10 testes end-to-end:
- Registro de aluna (201) e professora com código válido (201)
- Rejeita professora sem `codigoAcesso` (400), aluna com `codigoAcesso` (400)
- Email duplicado (409), código inválido (403), dados inválidos (400)
- Login bem-sucedido (200) e credenciais inválidas (401)

**`healthRoutes.test.js`** — Valida todos os estados de conexão MongoDB: `connected`, `disconnected`, `connecting`, `disconnecting`, `unknown`.

```javascript
// Padrão de integração HTTP (Supertest)
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/posts', postRoutes);
  app.use(errorHandler);
  return app;
};

// Requisição real via Supertest
const response = await request(app).get('/posts');
expect(response.status).toBe(200);
expect(response.body.success).toBe(true);
```

---

### 🧬 Testes de Mutação (Stryker)

O Stryker modifica o código-fonte (mutantes) e re-executa os testes para verificar se eles detectam as mudanças. Se um teste **não falha** com o mutante, significa que há uma lacuna na cobertura.

```bash
npm run test:mutation
```

**Configuração** (`stryker.conf.json`):
- Runner: Jest
- Mutação: `src/**/*.js` (exclui `server.js`, `swagger/`, `logging/`)
- Reports: HTML + JSON em `reports/mutation/`
- Threshold: break em 80%, high 90%
- Concorrência: 4 workers paralelos

### Padrões de Teste Utilizados

| Padrão | Onde é usado | Descrição |
|--------|-------------|-----------|
| **Mock de módulo** (`jest.mock()`) | Service, Controller, Repository | Substitui dependências inteiras por mocks |
| **Mock de cadeia fluente** | Repository (Mongoose queries) | Mock de `.find().sort().skip().limit()` |
| **Mock de req/res/next** | Controller, Middleware | Simula objetos Express com `jest.fn().mockReturnThis()` |
| **Supertest + Express** | Routes | App real em memória para teste de integração HTTP |
| **Teste puro (sem mock)** | Domain entities, errors, validators, presenters | Código sem dependências externas testado diretamente |
| **beforeEach + clearAllMocks** | Todos os testes | Isolamento entre testes, sem estado compartilhado |

## 🐳 Docker

> **macOS**: Este projeto usa [Colima](https://github.com/abiosoft/colima) como runtime Docker.
> Scripts npm usam `docker compose` (V2 plugin), NÃO o legado `docker-compose` com hífen.

### Setup Rápido (recomendado)

O script `scripts/start-dev.sh` automatiza todo o ciclo: Colima → Docker → MongoDB.

```bash
npm run dev:setup     # Inicia Colima + Docker + MongoDB
npm run dev:status    # Verifica status de todos os serviços
npm run dev:reset     # Reseta MongoDB (limpa dados + seed)
npm run dev:stop      # Para tudo (MongoDB + Colima)
```

O que o script faz em sequência:
1. Verifica se `colima` e `docker` estão instalados
2. Inicia Colima (se já estiver rodando, pula)
3. Aguarda o Docker daemon ficar disponível
4. Sobe o container MongoDB via `docker-compose.dev.yml`
5. Aguarda o MongoDB ficar healthy
6. Verifica conectividade e dados de seed
7. Exibe status final de todos os serviços

### Desenvolvimento (Docker-only, se Colima já estiver rodando)

```bash
npm run docker:db          # Sobe MongoDB
npm run docker:db:stop     # Para MongoDB
npm run docker:db:reset    # Limpa volume + recria com seed
```

O container inicializa automaticamente:
- Cria a collection `posts` com validação de schema
- Cria índices de texto (busca) e status (filtro)
- Insere 3 posts de exemplo para desenvolvimento

### Produção (API + MongoDB)

Stack completa em containers.

```bash
npm run docker:up          # Build + start
npm run docker:logs        # Acompanhar logs
npm run docker:down        # Parar tudo
docker compose down -v     # Parar e remover dados
```

### Build manual

```bash
# Build da imagem
docker build -t postech-blog-api .

# Executar container
docker run -p 3000:3000 \
  -e MONGODB_URI=mongodb://host.docker.internal:27017/postech_blog \
  -e JWT_SECRET=my-secret \
  -e TEACHER_ACCESS_CODE=POSTECH-TEACHER-2026 \
  postech-blog-api
```

### Arquivos Docker

| Arquivo | Propósito |
|---------|-----------|
| `scripts/start-dev.sh` | Inicializa Colima + Docker + MongoDB em sequência |
| `Dockerfile` | Multi-stage build (node:24-alpine), non-root user `nodejs`, dir `logs/` para Winston, healthcheck |
| `docker-compose.yml` | Stack completa: API + MongoDB com bridge network e healthchecks |
| `docker-compose.dev.yml` | Apenas MongoDB para desenvolvimento local |
| `scripts/mongo-init.js` | Seed: cria collection, índices e 3 posts de exemplo |
| `.dockerignore` | Exclui node_modules, tests, .env, coverage, *.md |

### Detalhes Técnicos Docker
- **Dockerfile**: multi-stage build para imagem leve, cria dir `logs/` com ownership para user `nodejs` (necessário para Winston file transports em produção)
- **API depende de MongoDB healthy**: usa `depends_on` com `condition: service_healthy`
- **Sem atributo `version`**: removido por ser obsoleto no Docker Compose V2

## 📚 Documentação da API

A documentação interativa Swagger está disponível em:

```
http://localhost:3000/api-docs
```

## 🔍 Qualidade de Código

### ESLint + Prettier

Configurado com regras para Clean Code e DDD:
- Funções pequenas (máx 30 linhas)
- Máximo 3 parâmetros
- Profundidade máxima 3
- Complexidade ciclomática máx 10
- Separação de camadas via `no-restricted-imports` por diretório

### SonarQube

Quality Gates:
- Coverage ≥ 95%
- Duplicação ≤ 10%
- Maintainability Rating: A
- Reliability Rating: A
- Security Rating: A

### Mongoose 9

Atenção ao usar Mongoose 9: usar `{ returnDocument: 'after' }` em vez de `{ new: true }` (deprecated) no `findByIdAndUpdate()`.

## 📊 Status do Projeto

| Item | Status |
|------|--------|
| API REST completa (11 endpoints) | ✅ |
| Autenticação JWT (register + login) | ✅ |
| Autorização por role (teacher/student) | ✅ |
| MongoDB via Docker (dev + produção) | ✅ |
| 293 testes unitários, ~97% coverage | ✅ |
| Swagger UI (`/api-docs`) | ✅ |
| ESLint + Prettier (Clean Code + DDD) | ✅ |
| SonarQube configurado | ✅ |
| Stryker (mutation testing) | ✅ |
| CI/CD GitHub Actions | ✅ |
| Node.js 24 LTS (Krypton) | ✅ |

## 📄 Licença

Este projeto está sob a licença ISC.
