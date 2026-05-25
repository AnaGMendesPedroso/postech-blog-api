# API — Endpoints e Documentação

A documentação interativa (Swagger / OpenAPI) está disponível em:

```
http://localhost:3000/api-docs
```

Endpoints principais

- `POST /auth/register` — registrar usuário (student: aberto; teacher: requer `codigoAcesso`)
- `POST /auth/login` — retornar JWT
- `GET /posts` — listar posts publicados (paginado)
- `GET /posts?status=all` — listar todos os posts (teacher view)
- `GET /posts?status=draft` — listar rascunhos
- `GET /posts/search?q=term` — busca full-text
- `GET /posts/:id` — obter post por id
- `POST /posts` — criar post (JWT teacher)
- `PUT /posts/:id` — atualizar post (JWT teacher)
- `DELETE /posts/:id` — deletar post (JWT teacher)
- `GET /health` — health check (inclui status do banco)

Autenticação

- Token é enviado no header `Authorization: Bearer <token>`.
- Token payload: `{ id, email, role }`.

Respostas

Todos os responses seguem o formato do presenter `responseFormatter`:

```json
{
  "success": true,
  "data": {},
  "pagination": { "page": 1, "limit": 10, "total": 0, "totalPages": 0 }
}
```

```json
{
  "success": false,
  "error": { "message": "Erro", "details": null }
}
```

Exemplos rápidos

Register (student)

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"nome":"Ana","email":"ana@email.com","senha":"123456","role":"student"}'
```

Register (teacher)

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"nome":"Maria","email":"maria@email.com","senha":"123456","role":"teacher","codigoAcesso":"POSTECH-TEACHER-2026"}'
```

Para todos os detalhes de parâmetros, exemplos de request/response e schemas consulte o Swagger UI (`/api-docs`) ou os JSDoc nas rotas em `src/interfaces/http/routes`.
