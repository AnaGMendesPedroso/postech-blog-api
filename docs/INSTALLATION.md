# Installation & Quickstart

This document explains how to get the project running locally for the first time.

Prerequisites

- Node.js 24+ (LTS). Using nvm is recommended (`.nvmrc` included).
- npm
- (Optional for full dev) Colima + Docker + Docker Compose plugin (macOS recommended)

Quickstart (development)

```bash
# Clone
git clone <repository-url>
cd postech-blog-api

# Install dependencies
npm install

# Copy environment example and edit .env as needed
cp .env.example .env

# Start development environment (Colima + Docker + MongoDB)
npm run dev:setup

# Start API (hot-reload)
npm run dev
```

After these steps the API is reachable at http://localhost:3000 and Swagger UI at http://localhost:3000/api-docs

If you don't use Colima/Docker, you can run a local MongoDB and set `MONGODB_URI` in `.env` accordingly.

Useful npm scripts

- `npm run dev:setup` — start Colima + Docker + MongoDB (dev environment)
- `npm run dev` — start server with nodemon (development)
- `npm start` — production start
- `npm test` — run tests
- `npm run lint` — lint checks

For more details about Docker, testing and environment variables see the other docs in this repository (ARCHITECTURE, DOCKER, TESTS, USAGE).
