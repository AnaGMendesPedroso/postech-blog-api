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

A aplicação permite que **professores** criem e editem postagens (incluindo rascunhos), enquanto **alunos** acessam apenas o conteúdo já publicado. A diferenciação de perfis é feita via query parameters, sem necessidade de autenticação JWT nesta fase.

Construída sobre princípios de **Clean Architecture** e **Domain-Driven Design (DDD)**, a API possui separação estrita de camadas (domain, application, infrastructure, interfaces), com fronteiras enforçadas via ESLint. O código segue padrões de **Clean Code** com limites de complexidade, cobertura de testes unitários de 100% e testes de mutação via Stryker para garantir a qualidade e sensibilidade da suíte de testes.

### Funcionalidades

- ✅ Criar, editar e excluir postagens
- ✅ Listar postagens publicadas (para alunos)
- ✅ Listar todas as postagens incluindo rascunhos (para professores)
- ✅ Buscar postagens por palavra-chave (full-text search)
- ✅ Paginação em listagens
- ✅ Documentação interativa com Swagger
- ✅ Health check com status do banco de dados
- ✅ Containerização completa com Docker (dev + produção)

## 🏗️ Arquitetura

O projeto segue os princípios de **Clean Architecture** e **DDD (Domain-Driven Design)**:

```
src/
├── domain/           # Entidades e regras de negócio (sem dependências externas)
│   ├── entities/     # Post — publish(), setDraft(), update(), toJSON()
│   └── errors/       # AppError, NotFoundError, ValidationError, ConflictError, InternalError
├── application/      # Casos de uso e lógica de aplicação
│   ├── usecases/     # PostService com operações de negócio
│   └── validators/   # Schemas de validação Joi
├── infrastructure/   # Implementações externas
│   ├── database/     # Conexão MongoDB + schemas Mongoose
│   ├── repositories/ # PostRepository — singleton, mapeia docs → entidades
│   ├── logging/      # Winston (console + file em produção)
│   └── swagger/      # Configuração OpenAPI 3.0
└── interfaces/       # Adaptadores de interface
    └── http/
        ├── controllers/  # Handlers HTTP thin
        ├── middlewares/   # Validação Joi, error handler centralizado
        ├── routes/        # Rotas REST com anotações Swagger JSDoc
        └── presenters/    # Formatação padronizada de respostas
```

### Fluxo de Dependências (enforced via ESLint)

```
┌─────────────────────────────────────────┐
│  interfaces (Express, HTTP, rotas)      │
│  ┌───────────────────────────────────┐  │
│  │  application (use cases, Joi)     │  │
│  │  ┌─────────────────────────────┐  │  │
│  │  │  domain (Post, AppError)    │  │  │
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

Sem autenticação JWT nesta fase. A diferenciação professor/aluno é feita via query parameter `status`:
- **Aluno**: `GET /posts` → retorna apenas posts `published`
- **Professor**: `GET /posts?status=all` → retorna todos; `?status=draft` → apenas rascunhos

## 🛠️ Tecnologias

- **Runtime**: Node.js 24 LTS (Krypton)
- **Framework**: Express 5
- **Banco de Dados**: MongoDB 7 com Mongoose 9
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
cd tech-challange-faseII
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

| Método | Rota | Descrição | Ator |
|--------|------|-----------|------|
| GET | `/health` | Health check (inclui status do DB) | Sistema |
| GET | `/posts` | Lista posts publicados (paginado) | Aluno |
| GET | `/posts?status=all` | Lista todos os posts (paginado) | Professor |
| GET | `/posts?status=draft` | Lista rascunhos | Professor |
| GET | `/posts/search?q=termo` | Busca full-text por palavra-chave | Aluno/Professor |
| GET | `/posts/:id` | Busca post por ID | Aluno/Professor |
| POST | `/posts` | Cria novo post (status=draft por padrão) | Professor |
| PUT | `/posts/:id` | Atualiza post | Professor |
| DELETE | `/posts/:id` | Remove post (retorna 204) | Professor |

### Exemplo de Requisição

**Criar Post:**
```bash
curl -X POST http://localhost:3000/posts \
  -H "Content-Type: application/json" \
  -d '{
    "titulo": "Introdução ao JavaScript",
    "conteudo": "Neste post vamos aprender os fundamentos do JavaScript...",
    "autor": "Professor Silva"
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
    "autor": "Professor Silva",
    "status": "draft",
    "createdAt": "2026-03-15T10:30:00.000Z",
    "updatedAt": "2026-03-15T10:30:00.000Z"
  }
}
```

**Listar posts (visão professor):**
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
npm test              # Todos os testes com coverage (166 testes, 100% coverage)
npm run test:watch    # Modo watch — re-executa ao salvar
npm run test:mutation # Testes de mutação com Stryker
```

### Cobertura

- **166 testes unitários** em 15 test suites
- **100% de cobertura** (statements, branches, functions, lines)
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
├── setup.js                                    # Configuração global
└── unit/
    ├── domain/                                 # Testes de regras de negócio puras
    │   ├── entities/Post.test.js               # 16 testes
    │   └── errors/AppError.test.js             # 9 testes
    ├── application/                            # Testes de casos de uso e validação
    │   ├── usecases/PostService.test.js        # 10 testes
    │   └── validators/postValidator.test.js    # 18 testes
    ├── infrastructure/                         # Testes de adaptadores externos
    │   ├── database/connection.test.js         # 9 testes
    │   ├── database/PostSchema.test.js         # 8 testes
    │   ├── logging/logger.test.js              # 12 testes
    │   ├── repositories/PostRepository.test.js # 16 testes
    │   └── swagger/swaggerConfig.test.js       # 5 testes
    └── interfaces/                             # Testes da camada HTTP
        ├── controllers/PostController.test.js  # 12 testes
        ├── middlewares/errorHandler.test.js     # 7 testes
        ├── middlewares/validateRequest.test.js  # 10 testes
        ├── presenters/responseFormatter.test.js # 8 testes
        ├── routes/postRoutes.test.js           # 16 testes (integração HTTP)
        └── routes/healthRoutes.test.js         # 5 testes (integração HTTP)
```

---

### 🔵 Camada Domain — Testes Puros (25 testes)

Testes de unidade **sem nenhum mock** — a camada de domínio é JavaScript puro, sem dependências externas.

**`Post.test.js` (16 testes)** — Valida toda a entidade `Post`:
- Construção com valores padrão (`status=draft`, datas automáticas)
- Métodos de transição de estado: `publish()`, `setDraft()`
- Métodos de consulta: `isPublished()`, `isDraft()`
- Método `update()` com campos parciais
- Serialização `toJSON()` para resposta HTTP
- Verificação de que `updatedAt` é atualizado nas mutações

**`AppError.test.js` (9 testes)** — Valida toda a hierarquia de erros:
- `AppError`: status code padrão (500), flag `isOperational`, stack trace
- `NotFoundError`: mensagem com recurso dinâmico, status 404
- `ValidationError`: mensagem + array de detalhes, status 400
- `ConflictError`: status 409
- `InternalError`: mensagem padrão, status 500

---

### 🟢 Camada Application — Testes com Mock de Repository (31 testes)

Testes de unidade onde o **repositório é mockado** via `jest.mock()` — valida a lógica dos use cases sem tocar no banco de dados.

**`PostService.test.js` (10 testes)** — Valida todos os 6 use cases:
- `createPost`: delega ao repositório, retorna entidade
- `getAllPosts`: paginação (default e custom), parsing de string para int
- `getPostById`: busca por ID, delegação correta
- `updatePost`: delegação com ID + dados
- `deletePost`: delegação da exclusão
- `searchPosts`: busca por keyword com paginação, valores default

```javascript
// Exemplo de padrão: mock do repositório
jest.mock('../../../../src/infrastructure/repositories/PostRepository');
postRepository.create.mockResolvedValue(mockPost);
const result = await PostService.createPost(postData);
expect(postRepository.create).toHaveBeenCalledWith(postData);
```

**`postValidator.test.js` (18 testes)** — Valida todos os 5 schemas Joi:
- `createPostSchema`: campos obrigatórios, limites de tamanho (titulo ≥3, conteudo ≥10), status enum
- `updatePostSchema`: update parcial, rejeita body vazio
- `queryPostsSchema`: status válidos (published/draft/all), paginação com defaults
- `searchPostsSchema`: query `q` obrigatória, paginação
- `postIdSchema`: formato válido de MongoDB ObjectId

---

### 🟡 Camada Infrastructure — Testes com Mock do Mongoose (50 testes)

Testes onde o **Mongoose Model é mockado** — valida que o repositório traduz corretamente entre documentos Mongoose e entidades de domínio.

**`PostRepository.test.js` (16 testes)** — O teste mais rico, cobre:
- `create`: chama `PostModel.create()`, retorna instância de `Post`
- `findAll`: filtragem por status (`published`/`draft`/`all`/`undefined`), paginação (skip/limit), defaults
- `findById`: retorna entidade, lança `NotFoundError` quando `null`
- `update`: usa `returnDocument: 'after'` (Mongoose 9), lança `NotFoundError`
- `delete`: chama `findByIdAndDelete`, lança `NotFoundError`
- `search`: query `$text` com `$meta: textScore`, paginação, defaults

```javascript
// Exemplo de padrão: mock da cadeia fluente do Mongoose
const mockQuery = {
  sort: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  limit: jest.fn().mockResolvedValue([mockPostDoc]),
};
PostModel.find.mockReturnValue(mockQuery);
```

**`connection.test.js` (9 testes)** — Valida `connectDatabase()` e `disconnectDatabase()`:
- Conexão bem-sucedida, URI padrão quando env não definida
- Registro de event handlers (`error`, `disconnected`)
- Tratamento de falha na conexão (throw)
- Desconexão bem-sucedida e com erro

**`PostSchema.test.js` (8 testes)** — Valida o schema Mongoose:
- Campos obrigatórios, enum de status, default `draft`
- Constraints de tamanho (titulo min/max, conteudo min)
- Timestamps habilitados
- Transformação `_id` → `id` no `toJSON()`

**`logger.test.js` (12 testes)** — Valida a configuração do Winston:
- Nível default, override via `LOG_LEVEL`
- Console transport presente em todos os ambientes
- File transports adicionados apenas em produção (`logs/error.log`, `logs/combined.log`)
- Métodos `info`, `error`, `warn` funcionais
- Metadata `service: 'postech-blog-api'` incluída

**`swaggerConfig.test.js` (5 testes)** — Valida a spec OpenAPI:
- Exporta objeto válido, informações do projeto corretas
- Servidor configurado, tags definidas
- Paths extraídos das anotações JSDoc das rotas

---

### 🔴 Camada Interfaces — Testes com Mock de Service + Supertest (53 testes)

Dois tipos de teste: **unitários** (mock de req/res/next) e **integração HTTP** (Supertest com Express real).

#### Testes Unitários de Controllers/Middlewares/Presenters

**`PostController.test.js` (13 testes)** — Valida os 6 handlers (cada um com cenário de sucesso + erro):
- `create`: chama `postService.createPost`, retorna 201
- `getAll`: chama `getAllPosts`, retorna resposta paginada
- `getById`: chama `getPostById`, retorna 200
- `update`: chama `updatePost`, retorna 200
- `delete`: chama `deletePost`, retorna 204 sem body
- `search`: chama `searchPosts` com keyword e status, retorna resposta paginada
- Todos: delegam erros via `next(error)`

```javascript
// Padrão: mock de req/res/next do Express
mockReq = { body: {}, query: {}, params: {} };
mockRes = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
mockNext = jest.fn();
```

**`errorHandler.test.js` (7 testes)** — Valida o middleware centralizado de erros:
- Erros operacionais (`AppError`): propaga status code e mensagem
- `NotFoundError`: retorna 404 com mensagem localizada
- `ValidationError`: retorna 400 com array de `details`
- Erros não operacionais (bugs): retorna 500 genérico
- Mongoose `ValidationError`: converte para formato padronizado
- Mongoose `CastError`: retorna 400 "ID inválido"
- Logging de todos os erros via Winston

**`validateRequest.test.js` (10 testes)** — Valida o middleware de validação Joi:
- Validação de `body`, `query` e `params`
- Remoção de campos desconhecidos (strip unknown)
- Coleta de todos os erros de validação (abortEarly: false)
- Source padrão "body" quando não especificado
- Helpers `validateBody()`, `validateQuery()`, `validateParams()`

**`responseFormatter.test.js` (8 testes)** — Valida o presenter:
- `success()`: status default 200, custom status
- `paginated()`: cálculo de `totalPages`, formato completo
- `error()`: status default 500, custom status, com/sem `details`

#### Testes de Integração HTTP (Supertest)

Estes testes sobem uma **instância real do Express** em memória (sem banco), com rotas e middlewares montados, e fazem requisições HTTP reais.

**`postRoutes.test.js` (16 testes)** — Valida rotas end-to-end na camada HTTP:
- `GET /posts`: retorna lista paginada, filtra por status, rejeita status inválido
- `GET /posts/search?q=`: busca por keyword, rejeita sem query
- `GET /posts/:id`: retorna post, rejeita ID inválido (formato ObjectId)
- `POST /posts`: cria post, rejeita campos faltantes, rejeita titulo/conteudo curtos
- `PUT /posts/:id`: atualiza, rejeita body vazio, rejeita ID inválido
- `DELETE /posts/:id`: deleta com 204, rejeita ID inválido

```javascript
// Padrão: mini app Express para teste de integração
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

**`healthRoutes.test.js` (5 testes)** — Valida o endpoint de health check:
- Estado `connected` (readyState 1), `disconnected` (0), `connecting` (2), `disconnecting` (3)
- Estado inválido retorna `unknown`

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
- Threshold: break em 50% (mutation score)
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
  postech-blog-api
```

### Arquivos Docker

| Arquivo | Propósito |
|---------|-----------|
| `scripts/start-dev.sh` | Inicializa Colima + Docker + MongoDB em sequência |
| `Dockerfile` | Multi-stage build (node:20-alpine), non-root user `nodejs`, dir `logs/` para Winston, healthcheck |
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
| API REST completa (9 endpoints) | ✅ |
| MongoDB via Docker (dev + produção) | ✅ |
| 216 testes unitários, 100% coverage | ✅ |
| Swagger UI (`/api-docs`) | ✅ |
| ESLint + Prettier (Clean Code + DDD) | ✅ |
| SonarQube configurado | ✅ |
| Stryker (mutation testing) | ✅ |
| CI/CD GitHub Actions | ✅ |
| Node.js 24 LTS (Krypton) | ✅ Atualizado via CI |

## 📄 Licença

Este projeto está sob a licença ISC.