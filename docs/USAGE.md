# Uso e scripts

Variáveis de ambiente principais

- `PORT` — porta do servidor (padrão `3000`)
- `NODE_ENV` — `development|production|test`
- `MONGODB_URI` — URI de conexão do MongoDB
- `JWT_SECRET` — segredo para assinar tokens JWT (obrigatório)
- `JWT_EXPIRES_IN` — expiração do token JWT (`7d` por padrão)
- `TEACHER_ACCESS_CODE` — código de acesso para registro de teacher
- `ALLOWED_ORIGINS` — origens permitidas para CORS (comma-separated)

Principais scripts npm

- `npm run dev:setup` — start Colima + Docker + MongoDB (dev)
- `npm run dev` — start com nodemon (hot-reload)
- `npm start` — start em produção
- `npm test` — testes unitários (Jest)
- `npm run test:mutation` — Stryker mutation tests
- `npm run lint` / `npm run lint:fix` — ESLint

Exemplos de uso (curl)

Login

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"maria@email.com","senha":"123456"}'
```

Criar post (teacher):

```bash
curl -X POST http://localhost:3000/posts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"titulo":"Titulo","conteudo":"Conteudo...","autor":"Prof Maria"}'
```

Logs

- Winston escreve em console (todos os ambientes) e em arquivos em produção (`logs/`).
- Para testes, o logger é silenciado via `tests/setup.js`.
