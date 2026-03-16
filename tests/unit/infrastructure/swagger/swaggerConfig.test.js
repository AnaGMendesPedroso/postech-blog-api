const swaggerJsdoc = require('swagger-jsdoc');

describe('Swagger Configuration', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('should export a valid swagger spec', () => {
    const swaggerSpec = require('../../../../src/infrastructure/swagger/swaggerConfig');

    expect(swaggerSpec).toBeDefined();
    expect(swaggerSpec.openapi).toBe('3.0.0');
  });

  it('should have correct API info', () => {
    const swaggerSpec = require('../../../../src/infrastructure/swagger/swaggerConfig');

    expect(swaggerSpec.info).toBeDefined();
    expect(swaggerSpec.info.title).toBe('Postech Blog API');
    expect(swaggerSpec.info.version).toBe('1.0.0');
  });

  it('should have server configuration', () => {
    const swaggerSpec = require('../../../../src/infrastructure/swagger/swaggerConfig');

    expect(swaggerSpec.servers).toBeDefined();
    expect(swaggerSpec.servers.length).toBeGreaterThan(0);
    expect(swaggerSpec.servers[0].url).toContain('localhost');
  });

  it('should have tags defined', () => {
    const swaggerSpec = require('../../../../src/infrastructure/swagger/swaggerConfig');

    expect(swaggerSpec.tags).toBeDefined();
    expect(swaggerSpec.tags.some((tag) => tag.name === 'Posts')).toBe(true);
    expect(swaggerSpec.tags.some((tag) => tag.name === 'Health')).toBe(true);
  });

  it('should have paths from route annotations', () => {
    const swaggerSpec = require('../../../../src/infrastructure/swagger/swaggerConfig');

    expect(swaggerSpec.paths).toBeDefined();
  });
});
