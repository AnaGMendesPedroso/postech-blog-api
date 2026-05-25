# Docker & Dev environment

Este projeto foi pensado para rodar localmente com Colima (macOS) como runtime Docker.

Scripts úteis

- `npm run dev:setup` — inicializa Colima, sobe MongoDB via `docker-compose.dev.yml` e aguarda healthcheck
- `npm run dev:stop` — para os serviços iniciados pelo `dev:setup`
- `npm run docker:db` — sobe apenas o MongoDB
- `npm run docker:up` / `npm run docker:down` — stack completa (API + MongoDB)

Detalhes

- `Dockerfile` é multi-stage (baseado em `node:24-alpine`) e cria usuário não-root `nodejs` e diretório `logs/` para Winston.
- `docker-compose.yml` depende do serviço `mongodb` com healthchecks configurados.
- `scripts/mongo-init.js` popula a base com validação de schema, índices e 3 posts de exemplo na primeira execução.

Se preferir não usar Colima, exporte uma instância MongoDB local e ajuste `MONGODB_URI` em `.env`.
