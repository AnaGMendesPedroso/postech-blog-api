# AGENTS.md

## Project Snapshot (March 2026)
- Node.js 24 LTS (Krypton) CommonJS (`"type": "commonjs"`) — entry point: `src/server.js`
- Express 5 REST API for educational blogging platform
- Layered architecture: DDD + Clean Code principles
- MongoDB 7 via Docker (Mongoose 9 ODM)
- **Status**: All endpoints implemented and verified. 216 unit tests, 100% coverage.

## Architecture
```
src/
├── domain/           # Pure business entities (zero framework deps)
│   ├── entities/     # Post — publish(), setDraft(), update(), toJSON()
│   └── errors/       # AppError, NotFoundError, ValidationError, ConflictError, InternalError
├── application/      # Use cases + validation schemas
│   ├── usecases/     # PostService (create, getAll, getById, update, delete, search)
│   └── validators/   # Joi schemas: createPost, updatePost, queryPosts, searchPosts, postId
├── infrastructure/   # External adapters
│   ├── database/     # connection.js (connect/disconnect) + schemas/PostSchema.js
│   ├── repositories/ # PostRepository — singleton, maps Mongoose docs → Post entities
│   ├── logging/      # Winston logger (console always, file transports in production)
│   └── swagger/      # swaggerConfig.js (OpenAPI 3.0 from JSDoc annotations)
└── interfaces/       # HTTP layer
    └── http/
        ├── controllers/  # PostController — thin, delegates to PostService
        ├── middlewares/   # errorHandler (centralized), validateRequest (Joi → Express)
        ├── routes/        # postRoutes.js (Swagger JSDoc inline), healthRoutes.js
        └── presenters/    # responseFormatter — success(), paginated(), error()
```

### Dependency Flow (strict, enforced by ESLint)
```
interfaces → application → domain
     ↓
infrastructure
```
- `domain/` — CANNOT import mongoose, express, infrastructure, interfaces
- `application/` — CANNOT import express, interfaces
- `infrastructure/` — CAN import domain, application
- `interfaces/` — CAN import application (avoids direct domain coupling)

## Key Patterns & Conventions

### Status-Based Filtering (replaces authentication)
No JWT. Teacher vs student views via query parameter:
- `GET /posts` → only `status=published` (student default)
- `GET /posts?status=all` → all posts (teacher view)
- `GET /posts?status=draft` → drafts only (teacher view)
- `GET /posts/search?q=term` → only `status=published` (student default)
- `GET /posts/search?q=term&status=all` → search across all posts (teacher view)

### Repository → Entity Mapping
`PostRepository._toEntity(doc)` converts every Mongoose document to a pure `Post` domain entity before returning. Controllers never see Mongoose objects.

### Mongoose 9 Specifics
- Use `{ returnDocument: 'after' }` instead of deprecated `{ new: true }` in `findByIdAndUpdate()`
- Schema transforms `_id` → `id` in `toJSON()` and removes `__v`

### Response Format
All responses follow the wrapper from `presenters/responseFormatter.js`:
```json
{ "success": true, "data": {...}, "pagination": { "page", "limit", "total", "totalPages" } }
{ "success": false, "error": { "message", "details" } }
```

### Validation
Joi schemas in `application/validators/postValidator.js`. Wired via `validateRequest` middleware (supports body, query, params). Exports: `validateBody(schema)`, `validateQuery(schema)`, `validateParams(schema)`.

### Error Handling
Custom error hierarchy in `domain/errors/AppError.js` → caught by `errorHandler` middleware. Also catches Mongoose `ValidationError` and `CastError` (invalid ObjectId).

## Developer Workflow

> **macOS com Colima**: Este projeto usa Colima como runtime Docker. O script `start-dev.sh` inicializa Colima + Docker + MongoDB em sequência.

```bash
npm install              # Install deps
npm run dev:setup        # Start Colima + Docker + MongoDB (one command)
npm run dev              # Dev server with nodemon hot-reload
npm start                # Production start
npm test                 # Jest with 100% coverage
npm run test:mutation    # Stryker mutation testing
npm run lint             # ESLint check
npm run lint:fix         # ESLint auto-fix
npm run format           # Prettier format
npm run dev:status       # Check Colima + Docker + MongoDB status
npm run dev:stop         # Stop MongoDB + Colima
```

## Docker
Uses `docker compose` V2 plugin (NOT legacy `docker-compose`).
Requires **Colima** as Docker runtime on macOS (`brew install colima docker docker-compose`).

```bash
# Full dev environment (Colima + MongoDB) — recommended
npm run dev:setup          # Start everything
npm run dev:stop           # Stop everything
npm run dev:reset          # Wipe MongoDB + restart with seed data
npm run dev:status         # Check all services

# Docker-only (assumes Docker/Colima already running)
npm run docker:db          # Start MongoDB only
npm run docker:db:stop     # Stop MongoDB
npm run docker:db:reset    # Wipe volume + restart with seed data

# Production — Full stack (API + MongoDB)
npm run docker:up          # Build & start
npm run docker:down        # Stop
npm run docker:logs        # Tail logs
```

### Docker Details
- `Dockerfile`: multi-stage build (`node:24-alpine`), non-root user `nodejs`, creates `logs/` dir for Winston
- `docker-compose.yml`: API (depends_on mongodb healthy) + MongoDB, bridge network
- `docker-compose.dev.yml`: MongoDB only, port 27017 exposed
- `scripts/mongo-init.js`: seeds collection with schema validation, text indexes, 3 example posts
- `.dockerignore`: excludes node_modules, tests, .env, coverage, *.md

## Environment Variables
```
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/postech_blog
LOG_LEVEL=info
```

## Testing
- **Jest** — 223 unit tests, 100% coverage (threshold: ≥95% branches/functions/lines/statements)
- **Supertest** — HTTP integration tests in route test files
- **Stryker** — mutation testing (`npm run test:mutation`)
- Test setup: `tests/setup.js` — silences logger, sets `NODE_ENV=test`
- Server exports `app` but only calls `startServer()` when `NODE_ENV !== 'test'`

## Quality
- **ESLint** + **Prettier** — Clean Code rules (max 30 lines/function, max 3 params, max depth 3, complexity 10)
- **SonarQube** — `sonar-project.properties` configured, coverage threshold 95%
- **DDD boundary enforcement** — ESLint `no-restricted-imports` per-layer overrides

## API
Swagger UI: `http://localhost:3000/api-docs`

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/health` | Health check (includes DB status) |
| GET | `/posts` | Published posts (student view, paginated) |
| GET | `/posts?status=all` | All posts (teacher view, paginated) |
| GET | `/posts?status=draft` | Drafts only (teacher view) |
| GET | `/posts/search?q=term` | Full-text search — published only (student default) |
| GET | `/posts/search?q=term&status=all` | Full-text search — all posts (teacher view) |
| GET | `/posts/:id` | Single post by ID |
| POST | `/posts` | Create post (defaults to draft) |
| PUT | `/posts/:id` | Update post |
| DELETE | `/posts/:id` | Delete post (returns 204) |