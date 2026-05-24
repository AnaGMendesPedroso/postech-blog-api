# AGENTS.md

## Project Snapshot (May 2026)
- Node.js 24 LTS (Krypton) CommonJS (`"type": "commonjs"`) — entry point: `src/server.js`
- Express 5 REST API for educational blogging platform
- Layered architecture: DDD + Clean Code principles
- MongoDB 7 via Docker (Mongoose 9 ODM)
- **JWT authentication** with role-based authorization (teacher/student)
- **Status**: All endpoints implemented and verified. 293 unit tests, 97%+ coverage.

## Architecture
```
src/
├── domain/           # Pure business entities (zero framework deps)
│   ├── entities/     # Post, User — pure domain objects with toJSON()
│   └── errors/       # AppError, NotFoundError, ValidationError, ConflictError, InternalError, UnauthorizedError, ForbiddenError
├── application/      # Use cases + validation schemas
│   ├── usecases/     # PostService, AuthService (register, login)
│   └── validators/   # Joi schemas: createPost, updatePost, queryPosts, searchPosts, postId, register, login
├── infrastructure/   # External adapters
│   ├── database/     # connection.js + schemas/PostSchema.js, UserSchema.js
│   ├── repositories/ # PostRepository, UserRepository — singletons, map docs → entities
│   ├── logging/      # Winston logger (console always, file transports in production)
│   └── swagger/      # swaggerConfig.js (OpenAPI 3.0 from JSDoc annotations)
└── interfaces/       # HTTP layer
    └── http/
        ├── controllers/  # PostController, AuthController — thin, delegates to services
        ├── middlewares/   # errorHandler, validateRequest, authenticate (JWT), authorize (role)
        ├── routes/        # postRoutes.js, authRoutes.js, healthRoutes.js (Swagger JSDoc)
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

### Authentication & Authorization (JWT)
- `POST /auth/register` — creates account (student: open; teacher: requires `codigoAcesso` matching env `TEACHER_ACCESS_CODE`)
- `POST /auth/login` — returns JWT token with payload `{ id, email, role }`
- Protected routes use `authenticate` middleware (verifies JWT) + `authorizeRole('teacher')` middleware
- Token sent via `Authorization: Bearer <token>` header

**Register examples:**
```json
// Student (no code needed)
{ "nome": "Ana", "email": "ana@email.com", "senha": "123456", "role": "student" }

// Teacher (requires codigoAcesso)
{ "nome": "Maria", "email": "maria@email.com", "senha": "123456", "role": "teacher", "codigoAcesso": "POSTECH-TEACHER-2026" }
```
> `codigoAcesso` is validated against env var `TEACHER_ACCESS_CODE`. Default for dev: `POSTECH-TEACHER-2026`.

### Status-Based Filtering
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
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d
TEACHER_ACCESS_CODE=POSTECH-TEACHER-2026
```

## Testing
- **Jest** — 293 unit tests, 97%+ coverage (threshold: ≥95% branches/functions/lines/statements)
- **Supertest** — HTTP integration tests in route test files
- **Stryker** — mutation testing (`npm run test:mutation`), thresholds: high 90%, break 80%
- Test setup: `tests/setup.js` — silences logger, sets `NODE_ENV=test`
- Server exports `app` but only calls `startServer()` when `NODE_ENV !== 'test'`

## Quality
- **ESLint** + **Prettier** — Clean Code rules (max 30 lines/function, max 3 params, max depth 3, complexity 10)
- **SonarQube** — `sonar-project.properties` configured, coverage threshold 95%
- **DDD boundary enforcement** — ESLint `no-restricted-imports` per-layer overrides

## API
Swagger UI: `http://localhost:3000/api-docs`

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/health` | — | Health check (includes DB status) |
| POST | `/auth/register` | — | Create account (teacher requires codigoAcesso) |
| POST | `/auth/login` | — | Login, returns JWT |
| GET | `/posts` | — | Published posts (student view, paginated) |
| GET | `/posts?status=all` | — | All posts (teacher view, paginated) |
| GET | `/posts?status=draft` | — | Drafts only (teacher view) |
| GET | `/posts/search?q=term` | — | Full-text search — published only (student default) |
| GET | `/posts/search?q=term&status=all` | — | Full-text search — all posts (teacher view) |
| GET | `/posts/:id` | — | Single post by ID |
| POST | `/posts` | JWT (teacher) | Create post (defaults to draft) |
| PUT | `/posts/:id` | JWT (teacher) | Update post |
| DELETE | `/posts/:id` | JWT (teacher) | Delete post (returns 204) |