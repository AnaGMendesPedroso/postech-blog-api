/**
 * scripts/generate-swagger.js
 * Gera o arquivo swagger.json a partir das anotações JSDoc das rotas.
 * Uso: npm run swagger:export
 */
const fs = require('fs');
const path = require('path');
const swaggerSpec = require('../src/infrastructure/swagger/swaggerConfig');

const outputDir = path.resolve(__dirname, '..', 'docs');
const outputFile = path.join(outputDir, 'swagger.json');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

fs.writeFileSync(outputFile, JSON.stringify(swaggerSpec, null, 2), 'utf-8');

console.info(`✅ swagger.json gerado em: ${outputFile}`);
console.info('   Importe este arquivo no Bruno: Collection → Import → OpenAPI V3');
