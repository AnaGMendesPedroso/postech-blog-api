const {
  success,
  paginated,
  error,
} = require('../../../../src/interfaces/http/presenters/responseFormatter');

describe('Response Formatter', () => {
  let mockRes;

  beforeEach(() => {
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  describe('success', () => {
    it('should return success response with default status code', () => {
      const data = { id: '123', titulo: 'Test' };

      success(mockRes, data);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data,
      });
    });

    it('should return success response with custom status code', () => {
      const data = { id: '123', titulo: 'Test' };

      success(mockRes, data, 201);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data,
      });
    });
  });

  describe('paginated', () => {
    it('should return paginated response', () => {
      const data = [{ id: '1' }, { id: '2' }];
      const pagination = {
        page: 1,
        limit: 10,
        total: 25,
      };

      paginated(mockRes, data, pagination);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data,
        pagination: {
          page: 1,
          limit: 10,
          total: 25,
          totalPages: 3,
        },
      });
    });

    it('should calculate totalPages correctly', () => {
      const data = [];
      const pagination = {
        page: 1,
        limit: 10,
        total: 5,
      };

      paginated(mockRes, data, pagination);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          pagination: expect.objectContaining({
            totalPages: 1,
          }),
        })
      );
    });
  });

  describe('error', () => {
    it('should return error response with default status code', () => {
      error(mockRes, 'Something went wrong');

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Something went wrong',
        },
      });
    });

    it('should return error response with custom status code', () => {
      error(mockRes, 'Not found', 404);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Not found',
        },
      });
    });

    it('should include details when provided', () => {
      const details = [{ field: 'titulo', message: 'Required' }];

      error(mockRes, 'Validation failed', 400, details);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Validation failed',
          details,
        },
      });
    });

    it('should not include details when null', () => {
      error(mockRes, 'Error', 500, null);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Error',
        },
      });
    });
  });
});
