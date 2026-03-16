const swaggerJsdoc = require('swagger-jsdoc');

/**
 * Swagger Configuration - Infrastructure Layer
 * OpenAPI 3.0 specification for API documentation
 */
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Postech Blog API',
      version: '1.0.0',
      description:
        'API REST para professores publicarem conteúdo educacional para alunos da rede pública',
      contact: {
        name: 'Suporte',
        email: 'suporte@postech-blog.com',
      },
      license: {
        name: 'ISC',
        url: 'https://opensource.org/licenses/ISC',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Servidor de desenvolvimento',
      },
    ],
    tags: [
      {
        name: 'Health',
        description: 'Health check da aplicação',
      },
      {
        name: 'Posts',
        description: 'Operações relacionadas a postagens',
      },
    ],
  },
  apis: ['./src/interfaces/http/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
