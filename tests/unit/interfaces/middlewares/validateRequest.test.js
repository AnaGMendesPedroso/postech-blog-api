const {
  validateRequest,
  validateBody,
  validateQuery,
  validateParams,
} = require('../../../../src/interfaces/http/middlewares/validateRequest');
const { ValidationError } = require('../../../../src/domain/errors/AppError');
const Joi = require('joi');

describe('validateRequest Middleware', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = {
      body: {},
      query: {},
      params: {},
    };
    mockRes = {};
    mockNext = jest.fn();
  });

  describe('validateRequest', () => {
    const schema = Joi.object({
      name: Joi.string().required(),
      age: Joi.number().min(0),
    });

    it('should call next() when validation passes', () => {
      mockReq.body = { name: 'John', age: 25 };

      const middleware = validateRequest(schema, 'body');
      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockReq.body).toEqual({ name: 'John', age: 25 });
    });

    it('should call next with ValidationError when validation fails', () => {
      mockReq.body = { age: -5 };

      const middleware = validateRequest(schema, 'body');
      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ValidationError));
      const error = mockNext.mock.calls[0][0];
      expect(error.message).toBe('Dados inválidos');
      expect(error.details).toBeDefined();
    });

    it('should strip unknown fields', () => {
      mockReq.body = { name: 'John', unknown: 'field' };

      const middleware = validateRequest(schema, 'body');
      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockReq.body).toEqual({ name: 'John' });
      expect(mockReq.body.unknown).toBeUndefined();
    });

    it('should validate query parameters', () => {
      mockReq.query = { name: 'John' };

      const middleware = validateRequest(schema, 'query');
      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should validate path parameters', () => {
      mockReq.params = { name: 'John' };

      const middleware = validateRequest(schema, 'params');
      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should collect all validation errors', () => {
      const strictSchema = Joi.object({
        name: Joi.string().required(),
        email: Joi.string().email().required(),
      });
      mockReq.body = {};

      const middleware = validateRequest(strictSchema, 'body');
      middleware(mockReq, mockRes, mockNext);

      const error = mockNext.mock.calls[0][0];
      expect(error.details.length).toBe(2);
    });

    it('should use default source "body" when not specified', () => {
      mockReq.body = { name: 'John' };

      const middleware = validateRequest(schema);
      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockReq.body.name).toBe('John');
    });
  });

  describe('validateBody', () => {
    it('should create middleware for body validation', () => {
      const schema = Joi.object({ titulo: Joi.string().required() });
      mockReq.body = { titulo: 'Test' };

      const middleware = validateBody(schema);
      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });
  });

  describe('validateQuery', () => {
    it('should create middleware for query validation', () => {
      const schema = Joi.object({ page: Joi.number().default(1) });
      mockReq.query = {};

      const middleware = validateQuery(schema);
      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockReq.query.page).toBe(1);
    });
  });

  describe('validateParams', () => {
    it('should create middleware for params validation', () => {
      const schema = Joi.object({ id: Joi.string().required() });
      mockReq.params = { id: '123' };

      const middleware = validateParams(schema);
      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });
  });
});
