# Testes

Visão geral dos testes do projeto.

- Framework: Jest (+ Supertest para integração HTTP)
- Suites: 293 testes unitários cobrindo domain, application, infrastructure e interfaces
- Cobertura: ~97% (threshold mínimo configurado ≥95%)

Executando testes

```bash
npm test
npm run test:watch
npm run test:mutation
```

Arquitetura dos testes

- `tests/setup.js` — configuração global (NODE_ENV=test, logger silenciado)
- `tests/unit/*` — testes por camada (domain, application, infrastructure, interfaces)

Mutação

- Stryker é usado para mutation testing (`npm run test:mutation`).
- Thresholds: high 90%, break 80% (configurado em `stryker.conf.json`).

Boas práticas

- Mocks com `jest.mock()` para repositórios e adaptadores externos.
- Supertest para testes end-to-end das rotas Express.
