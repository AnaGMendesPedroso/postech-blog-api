# Qualidade de Código

Ferramentas e políticas de qualidade usadas no projeto:

- ESLint + Prettier — regras para manter limites de complexidade, tamanhos de função e estilo.
- Jest — cobertura mínima configurada em `jest.config.js` (≥95%).
- Stryker — mutation testing para verificar sensibilidade da suíte de testes.
- SonarQube — análise estática e métricas (coverage, duplicação, maintainability).

Regras importantes

- Máx 30 linhas por função (rule aplicada via ESLint custom config)
- Máx 3 parâmetros por função
- Profundidade máxima 3
- Complexidade ciclomática ≤ 10

CI

O pipeline de CI executa lint, testes e análise de mutation/coverage antes de permitir merges na branch principal.
