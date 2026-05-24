# Plan: Criação de Conta + Comentários (índice)

Este plano foi desmembrado em duas tasks independentes com ordem de execução definida.

## Tasks

### 1. [plan-userRegistration.prompt.md](./plan-userRegistration.prompt.md)
**Jornada: Criação de conta da usuária**
- Entidade User, registro, login, JWT, middlewares authenticate/authorize
- Proteção das rotas de posts por role (teacher)
- **Sem dependências** — implementar primeiro

### 2. [plan-postComments.prompt.md](./plan-postComments.prompt.md)
**Jornada: Comentários em posts**
- Entidade Comment, CRUD de comentários, autorização por ownership
- **Depende da Task 1** — requer autenticação JWT e `req.user` populado

## Ordem de Execução

```
Task 1 (User Registration) → Task 2 (Post Comments)
```