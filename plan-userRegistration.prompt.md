# Task: Jornada de Criação de Conta (Registro + Login + Autorização)

> **Status: ✅ IMPLEMENTADO** (24/05/2026)
> - 293 testes passando, cobertura 97.47%
> - ESLint: 0 erros
> - Collection Bruno, README, AGENTS.md, Swagger, Seed script — todos atualizados
> - Pendente: TDD puro (testes escritos junto ao código) e Stryker (requer MongoDB)

Implementar autenticação e autorização na API para que usuárias possam criar conta como `teacher` ou `student`, fazer login via JWT, e ter acesso controlado por role nas rotas de posts.

## Princípios e Práticas Obrigatórios

| Prática | Aplicação nesta task |
|---------|---------------------|
| **DDD** | Entidade `User` no domain layer (pura, sem deps de framework); erros de domínio (`UnauthorizedError`, `ForbiddenError`); separação estrita domain → application → infrastructure → interfaces |
| **TDD** | Red → Green → Refactor para cada unidade. Escrever o teste ANTES da implementação. Ordem: entity → repository → service → middleware → controller → routes |
| **BDD** | Testes descrevem comportamento do sistema com padrão Given-When-Then nos `describe`/`it`. Foco no "o quê" (ex: "should reject registration when teacher code is invalid") |
| **Clean Code** | Nomes descritivos em português/inglês consistente; funções ≤30 linhas; responsabilidade única; sem comentários óbvios; DRY across validators/controllers; SOLID (SRP nos services, OCP nos middlewares, DIP via repository pattern) |
| **Testes Unitários** | Cobertura mínima **≥ 80%** (branches/functions/lines/statements) — manter threshold do projeto em 95% se possível |
| **Testes de Mutação** | Stryker Mutator: meta **≥ 90%** mutation score, break em **80%**. Atualizar `stryker.conf.json` thresholds |

### Ciclo TDD por Funcionalidade

```
1. Escrever teste que falha (Red)
2. Implementar código mínimo para passar (Green)
3. Refatorar mantendo testes verdes (Refactor)
4. Repetir para próxima unidade
```

### Padrão BDD nos Testes

```javascript
describe('AuthService', () => {
  describe('register', () => {
    it('should create a student account when valid data is provided', async () => {
      // Given: valid student registration data
      // When: register is called
      // Then: user is created and returned without password
    });

    it('should reject teacher registration when access code is invalid', async () => {
      // Given: teacher role with wrong codigoAcesso
      // When: register is called
      // Then: ForbiddenError is thrown
    });
  });
});
```

## Pré-requisitos

Nenhum. Esta task é independente e deve ser implementada primeiro — a task de comentários depende dela.

## Regras de Negócio

- **Professora (`teacher`)**: pode criar, editar, excluir posts.
- **Aluna (`student`)**: pode apenas visualizar posts.
- Autenticação via **JWT** (stateless, token no header `Authorization: Bearer <token>`).
- **Registro controlado por role**:
  - `student`: registro livre, sem barreiras.
  - `teacher`: exige `codigoAcesso` (código secreto configurável via env var `TEACHER_ACCESS_CODE`). Compartilhado por canal seguro (ex: email institucional, coordenação). Sem código válido → 403.
- Email é único por conta — tentativa de registro com email existente retorna 409.
- Senha armazenada com hash bcrypt (salt rounds: 10), nunca exposta em responses.
- Token JWT expira em 7 dias (configurável via env).

### Mitigação de Privilege Escalation

| Risco | Mitigação |
|-------|-----------|
| Aluna se registra como teacher | `codigoAcesso` obrigatório para role teacher; sem código correto → 403 |
| Código de acesso vaza | Rotacionar env var `TEACHER_ACCESS_CODE` e reiniciar servidor |
| Brute-force no código | Rate limiting no endpoint de registro (futuro; fora do MVP) |

## Steps

### 0. Atualizar Stryker Thresholds

**Arquivo:** `stryker.conf.json` (modificar)

```json
"thresholds": {
  "high": 90,
  "low": 80,
  "break": 80
}
```

### 1. Dependências

```bash
npm install bcryptjs jsonwebtoken
```

Adicionar variáveis de ambiente ao `.env`:

```
JWT_SECRET=<random-secret>
JWT_EXPIRES_IN=7d
TEACHER_ACCESS_CODE=POSTECH-TEACHER-2026
```

### 2. Domain Layer — Entidade `User`

**Arquivo:** `src/domain/entities/User.js`

- Campos: `id`, `nome`, `email`, `senha` (hash), `role` (enum: `teacher` | `student`), `createdAt`, `updatedAt`.
- Métodos: `isTeacher()`, `isStudent()`, `toJSON()` (omite `senha`).

### 3. Domain Layer — Erros `UnauthorizedError` e `ForbiddenError`

**Arquivo:** `src/domain/errors/AppError.js` (adicionar às classes existentes)

- `UnauthorizedError` (401) — credenciais inválidas ou token ausente/expirado.
- `ForbiddenError` (403) — role sem permissão para a ação.

### 4. Infrastructure — Schema Mongoose `UserSchema`

**Arquivo:** `src/infrastructure/database/schemas/UserSchema.js`

- Índice único em `email`.
- Transform `_id → id`, remove `__v` e `senha` no `toJSON`.
- Hook `pre('save')` para hash automático da senha com `bcryptjs` (salt rounds: 10).
- Método de instância `comparePassword(plainText)` para verificação no login.

### 5. Infrastructure — `UserRepository`

**Arquivo:** `src/infrastructure/repositories/UserRepository.js`

- `create(userData)` → User entity
- `findByEmail(email)` → User entity | null (retorna com senha para uso interno do AuthService)
- `findById(id)` → User entity (lança `NotFoundError`)
- `_toEntity(doc)` — mapeia doc Mongoose → entidade User

> **Nota**: `findByEmail` retorna `null` (não lança erro) — a decisão de erro é do AuthService.

### 6. Application — `AuthService`

**Arquivo:** `src/application/usecases/AuthService.js`

- **Singleton exportado**: `module.exports = new AuthService()`
- **Logging estruturado**: loga entrada/saída de cada método (sem logar senha).
- **Throw-through**: não captura exceções; propaga ao controller/errorHandler.

**`register({ nome, email, senha, role, codigoAcesso })`**

1. `logger.info('Registering new user', { email, role })`
2. Se `role === 'teacher'`:
   - Se `!codigoAcesso || codigoAcesso !== process.env.TEACHER_ACCESS_CODE` → `throw new ForbiddenError('Código de acesso inválido para perfil professor')`
3. `const existing = await userRepository.findByEmail(email)`
4. Se `existing` → `throw new ConflictError('Email já cadastrado')`
5. Hash da senha: `const hashedSenha = await bcrypt.hash(senha, 10)`
6. `const user = await userRepository.create({ nome, email, senha: hashedSenha, role })`
7. `logger.info('User registered successfully', { userId: user.id, role })`
8. Retorna `user` (entidade, sem senha via toJSON)

**`login({ email, senha })`**

1. `logger.info('Login attempt', { email })`
2. `const user = await userRepository.findByEmail(email)`
3. Se `!user` → `throw new UnauthorizedError('Credenciais inválidas')`
4. `const isValid = await bcrypt.compare(senha, user.senha)`
5. Se `!isValid` → `throw new UnauthorizedError('Credenciais inválidas')`
6. Gera token: `const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, secret, { expiresIn })`
7. `logger.info('Login successful', { userId: user.id })`
8. Retorna `{ user, token }`

> **Segurança**: mensagem de erro genérica ("Credenciais inválidas") tanto para email inexistente quanto senha errada — evita enumeração de email.

### 7. Application — Validators Joi

**Arquivo:** `src/application/validators/authValidator.js`

```javascript
const registerSchema = Joi.object({
  nome: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  senha: Joi.string().min(6).required(),
  role: Joi.string().valid('teacher', 'student').required(),
  codigoAcesso: Joi.string().when('role', {
    is: 'teacher',
    then: Joi.required(),
    otherwise: Joi.forbidden(),
  }),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  senha: Joi.string().required(),
});
```

- Mensagens em pt-BR (padrão existente em postValidator.js).

### 8. Interfaces — Middleware `authenticate`

**Arquivo:** `src/interfaces/http/middlewares/authenticate.js`

1. Extrai header `Authorization`.
2. Se ausente ou não começa com `Bearer ` → `throw new UnauthorizedError('Token não fornecido')`
3. `const decoded = jwt.verify(token, secret)` — em caso de exceção do jsonwebtoken, lança `UnauthorizedError('Token inválido ou expirado')`.
4. Anexa `req.user = { id: decoded.id, email: decoded.email, role: decoded.role }`.
5. `next()`.

### 9. Interfaces — Middleware `authorize`

**Arquivo:** `src/interfaces/http/middlewares/authorize.js`

```javascript
const authorizeRole = (...allowedRoles) => (req, _res, next) => {
  if (!allowedRoles.includes(req.user.role)) {
    throw new ForbiddenError('Acesso negado para este perfil');
  }
  next();
};
```

### 10. Interfaces — `AuthController` + Rotas

**Arquivo:** `src/interfaces/http/controllers/AuthController.js`

- `register(req, res, next)` → try/catch → `success(res, user.toJSON(), 201)`
- `login(req, res, next)` → try/catch → `success(res, { user: user.toJSON(), token })`

**Arquivo:** `src/interfaces/http/routes/authRoutes.js`

- `POST /auth/register` — `validateBody(registerSchema)` → `AuthController.register`
- `POST /auth/login` — `validateBody(loginSchema)` → `AuthController.login`
- Swagger JSDoc annotations completas.

### 11. Proteger Rotas de Posts Existentes

**Arquivo:** `src/interfaces/http/routes/postRoutes.js` (modificar)

- `POST /posts` — adicionar `authenticate`, `authorizeRole('teacher')`
- `PUT /posts/:id` — adicionar `authenticate`, `authorizeRole('teacher')`
- `DELETE /posts/:id` — adicionar `authenticate`, `authorizeRole('teacher')`
- `GET /posts`, `GET /posts/:id`, `GET /posts/search` — permanecem **públicos**

### 12. Registrar Rotas no Server

**Arquivo:** `src/server.js` (modificar)

```javascript
const authRoutes = require('./interfaces/http/routes/authRoutes');
app.use('/auth', authRoutes);
```

### 13. Atualizar `errorHandler`

**Arquivo:** `src/interfaces/http/middlewares/errorHandler.js` (modificar)

- Tratar `JsonWebTokenError` → 401 "Token inválido"
- Tratar `TokenExpiredError` → 401 "Token expirado"
- `UnauthorizedError` e `ForbiddenError` já são `isOperational` (tratadas pelo bloco existente).
- Tratar Mongoose duplicate key (code 11000) → 409 "Email já cadastrado"

### 14. Seed Script

**Arquivo:** `scripts/mongo-init.js` (modificar)

- Criar collection `users` com schema validation.
- Seed com 1 professora (`teacher@example.com`) e 1 aluna (`student@example.com`), senhas hasheadas.

### 15. Documentação & Collection

#### 15a. Collection Bruno (API client)

Criar pasta `collection/Postech Blog API/Auth/` com:

**`folder.yml`:**
```yaml
info:
  name: Auth
  type: folder
  seq: 2
```

**`Registra nova conta.yml`:**
- `POST {{baseUrl}}/auth/register`
- Body com campos: nome, email, senha, role, codigoAcesso (condicional)
- Examples: 201 (student), 201 (teacher), 400 (validação), 409 (email duplicado), 403 (código inválido)

**`Realiza login.yml`:**
- `POST {{baseUrl}}/auth/login`
- Body com campos: email, senha
- Script `after-response`: salvar token em variável de ambiente `authToken`
```javascript
const res = bru.getResponseBody();
if (res.success && res.data.token) {
  bru.setEnvVar("authToken", res.data.token);
}
```
- Examples: 200 (sucesso), 401 (credenciais inválidas)

**Atualizar environment** (`environments/Servidor de desenvolvimento.yml`):
```yaml
name: Servidor de desenvolvimento
variables:
  - name: baseUrl
    value: http://localhost:3000
  - name: authToken
    value: ""
```

**Atualizar requests de Posts protegidos** (Cria, Atualiza, Remove):
- Adicionar header `Authorization: Bearer {{authToken}}` ou configurar auth no `folder.yml` de Posts:
```yaml
request:
  auth:
    type: bearer
    bearer:
      token: "{{authToken}}"
```

#### 15b. README.md

Adicionar seção "Autenticação" com:
- Descrição do fluxo registro → login → JWT
- Tabela de endpoints de auth
- Explicação do `TEACHER_ACCESS_CODE`
- Como configurar variáveis de ambiente

#### 15c. AGENTS.md

Atualizar:
- Estrutura de diretórios (novas entities, middlewares, routes)
- Tabela de API endpoints (adicionar `/auth/*`)
- Variáveis de ambiente (adicionar JWT_SECRET, JWT_EXPIRES_IN, TEACHER_ACCESS_CODE)
- Status do projeto (atualizar contagem de testes)

#### 15d. Swagger

- Regenerar: `npm run swagger:export`
- Verificar que `docs/swagger.json` inclui endpoints de auth com schemas de request/response

### 15. Testes (TDD + BDD + Mutação)

#### Ordem de implementação TDD

Seguir esta ordem — cada item é um ciclo Red → Green → Refactor:

1. `User` entity (testes → implementação)
2. `UnauthorizedError` + `ForbiddenError` (testes → implementação)
3. `UserRepository` (testes com mock do Mongoose → implementação)
4. `AuthService` (testes com mock do repository → implementação)
5. `authValidator` (testes dos schemas → implementação)
6. `authenticate` middleware (testes → implementação)
7. `authorize` middleware (testes → implementação)
8. `AuthController` (testes com mock do service → implementação)
9. `authRoutes` (testes de integração com supertest → implementação)
10. Proteger rotas de posts (testes das rotas protegidas → modificação)

#### Testes unitários (BDD style — Given/When/Then)

| Arquivo | Cenários (BDD) |
|---------|----------|
| `tests/unit/domain/entities/User.test.js` | should create user with all fields; should identify teacher role; should identify student role; should omit senha in toJSON; should include all other fields in toJSON |
| `tests/unit/domain/errors/AppError.test.js` | should create UnauthorizedError with 401 status; should create ForbiddenError with 403 status; should be operational errors |
| `tests/unit/infrastructure/repositories/UserRepository.test.js` | should create user and return entity; should find user by email when exists; should return null when email not found; should find user by id; should throw NotFoundError when id not found; should map mongoose doc to entity correctly |
| `tests/unit/application/usecases/AuthService.test.js` | should register student without access code; should register teacher with valid access code; should reject teacher with invalid access code (ForbiddenError); should reject teacher without access code (ForbiddenError); should reject duplicate email (ConflictError); should login with valid credentials and return token; should reject login with unknown email (UnauthorizedError); should reject login with wrong password (UnauthorizedError); should not log sensitive data (senha) |
| `tests/unit/application/validators/authValidator.test.js` | should validate valid register data; should reject missing required fields; should reject invalid email format; should reject senha shorter than 6 chars; should reject invalid role; should require codigoAcesso when role is teacher; should forbid codigoAcesso when role is student; should validate valid login data |
| `tests/unit/interfaces/middlewares/authenticate.test.js` | should attach user to req when token is valid; should reject when Authorization header is missing (401); should reject when token is expired (401); should reject when token is malformed (401) |
| `tests/unit/interfaces/middlewares/authorize.test.js` | should allow access when role is permitted; should deny access when role is not permitted (403) |
| `tests/unit/interfaces/controllers/AuthController.test.js` | should return 201 with user data on successful register; should return 200 with user and token on successful login; should propagate errors to next middleware |
| `tests/unit/interfaces/routes/authRoutes.test.js` | should register student successfully (201); should register teacher with valid code (201); should reject teacher without code (validation 400); should login successfully (200); should reject invalid credentials (401) |

#### Thresholds

**Jest** (`jest.config.js`): manter ≥ 95% (padrão do projeto existente — supera o mínimo de 80%).

**Stryker** (`stryker.conf.json`): atualizar para:
```json
"thresholds": {
  "high": 90,
  "low": 80,
  "break": 80
}
```

> **Meta**: mutation score ≥ 90%. Build quebra se cair abaixo de 80%.

#### Testes de Mutação — Foco

Mutantes mais comuns a matar nesta task:

| Tipo de mutante | Onde aparece | Como matar |
|----------------|--------------|------------|
| String literal mutation | Mensagens de erro | Assertions no texto exato da mensagem |
| Conditional boundary | `if (!user)`, `if (!isValid)` | Testar ambos os ramos (true/false) |
| Removed function call | `bcrypt.hash`, `jwt.sign` | Verificar que hash é diferente de plaintext; token é string válida |
| Equality operator | `codigoAcesso !== env` | Testar código errado E código certo |
| Block statement removal | `throw new ...` | Confirmar que exceção é de fato lançada |

**Cobertura mínima**: ≥ 95% branches/functions/lines/statements (Jest). ≥ 90% mutation score (Stryker).

## Estrutura de Arquivos

```
src/
├── domain/
│   ├── entities/
│   │   └── User.js              ← NEW
│   └── errors/
│       └── AppError.js          ← MODIFY (+UnauthorizedError, +ForbiddenError)
├── application/
│   ├── usecases/
│   │   └── AuthService.js       ← NEW
│   └── validators/
│       └── authValidator.js     ← NEW
├── infrastructure/
│   ├── database/schemas/
│   │   └── UserSchema.js        ← NEW
│   └── repositories/
│       └── UserRepository.js    ← NEW
└── interfaces/http/
    ├── controllers/
    │   └── AuthController.js    ← NEW
    ├── middlewares/
    │   ├── authenticate.js      ← NEW
    │   ├── authorize.js         ← NEW
    │   └── errorHandler.js      ← MODIFY
    └── routes/
        ├── authRoutes.js        ← NEW
        └── postRoutes.js        ← MODIFY (add auth guards)
```

## API Endpoints

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/auth/register` | — | Criar conta (teacher/student) |
| POST | `/auth/login` | — | Login, retorna JWT |

## Variáveis de Ambiente (novas)

```
JWT_SECRET=sua-chave-secreta-aqui
JWT_EXPIRES_IN=7d
TEACHER_ACCESS_CODE=POSTECH-TEACHER-2026
```

## Definition of Done

### Funcional
- [x] `POST /auth/register` como student (sem código) cria conta e retorna user sem senha (201)
- [x] `POST /auth/register` como teacher com código válido cria conta (201)
- [x] `POST /auth/register` como teacher sem código retorna 403 (via Joi validation 400)
- [x] `POST /auth/register` como teacher com código inválido retorna 403
- [x] `POST /auth/register` com email duplicado retorna 409
- [x] `POST /auth/login` retorna token JWT válido (200)
- [x] `POST /auth/login` com credenciais erradas retorna 401 (mensagem genérica)
- [x] Rotas POST/PUT/DELETE de posts exigem JWT de teacher
- [x] Rotas GET de posts continuam públicas
- [x] Token expirado retorna 401
- [x] Token ausente retorna 401
- [x] Student tentando criar/editar/excluir post retorna 403

### Qualidade & Práticas
- [x] DDD: entidade User pura (zero deps de framework); erros no domain layer; boundary enforcement respeitado
- [x] Clean Code: funções ≤30 linhas; nomes descritivos; SRP; sem comentários desnecessários
- [x] Cobertura de testes unitários: 97.47% (jest --coverage)
- [x] Stryker thresholds atualizados (high: 90, low: 80, break: 80)
- [x] Swagger atualizado com endpoints de auth (JSDoc annotations)
- [x] ESLint passa sem erros (`npm run lint`)

### Documentação & Collection (obrigatório em toda task)
- [x] **Collection Bruno atualizada** (`collection/Postech Blog API/Auth/`) com requests para register e login
- [x] Collection inclui `folder.yml` para pasta Auth
- [x] Collection inclui examples (201, 400, 401, 403, 409) em cada request
- [x] Variável `{{authToken}}` configurada no environment para uso em requests autenticados
- [x] Requests de Posts protegidos atualizados com bearer auth no `folder.yml`
- [x] **README.md** atualizado com seção de autenticação (endpoints, fluxo, env vars)
- [x] **AGENTS.md** atualizado com nova estrutura (entities, middlewares, rotas, env vars)
- [x] **Swagger/OpenAPI** (`docs/swagger.json`) regenerado com `npm run swagger:export`

### Pendências menores
- [x] Seed script com usuárias de exemplo (`scripts/mongo-init.js`)
- [ ] TDD puro não aplicado (implementação e testes escritos juntos por produtividade)
- [ ] Testes de mutação (Stryker) ainda não executados nesta task (requer MongoDB rodando)
