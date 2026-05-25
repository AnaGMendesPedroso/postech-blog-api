# Arquitetura

Resumo da arquitetura e organização do código.

Camadas principais (DDD + Clean Architecture):

- `src/domain` — entidades e erros (sem dependências externas). Exemplos: `Post`, `User`, `AppError`.
- `src/application` — casos de uso e validações (Joi). Exemplos: `PostService`, `AuthService`, validators.
- `src/infrastructure` — adaptadores externos (Mongoose, Winston, repositórios, swagger).
- `src/interfaces` — camada HTTP (controllers, middlewares, routes, presenters).

Dependência permitida (enforced via ESLint `no-restricted-imports`):

```
interfaces → application → domain
     ↓
infrastructure
```

Padrões e convenções

- Entidades do domínio são puras (sem Mongoose/Express). Repositórios retornam entidades.
- Mongoose é usado apenas na camada `infrastructure/database` com transforms `toJSON()` que convertem `_id` → `id` e removem `senha`/`__v`.
- Use `{ returnDocument: 'after' }` em `findByIdAndUpdate()` (Mongoose 9).
- Validação com Joi em `application/validators`; middleware `validateRequest` faz a ligação no HTTP layer.

Autenticação & Autorização

- JWT com payload mínimo `{ id, email, role }`.
- `authenticate` middleware valida token e popula `req.user`.
- `authorizeRole('teacher')` middleware protege rotas de escrita.
- Registro de professoras exige `codigoAcesso` válido contra `TEACHER_ACCESS_CODE`.

Observações

- Mantenha funções pequenas (máx 30 linhas) e complexidade baixa (regras no ESLint).
- Repositórios devem mapear documentos Mongoose para entidades de domínio antes de retornar.
