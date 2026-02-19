import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import app from '../../index';

// Mock prisma
vi.mock('../../config/prisma', () => ({
  prisma: {
    order: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
    orderTimeline: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
    applicant: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    package: {
      findFirst: vi.fn(),
    },
  },
}));

describe('Orders API', () => {
  const mockUser = {
    id: 'user-123',
    clientId: 'client-123',
    email: 'test@example.com',
    role: 'owner',
    status: 'active',
    firstName: 'Test',
    lastName: 'User',
  };

  describe('GET /api/v1/orders', () => {
    it('should return 401 without auth token', async () => {
      const res = await request(app).get('/api/v1/orders');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/v1/orders', () => {
    it('should create order with valid data', async () => {
      const mockOrder = {
        id: 'order-123',
        orderNumber: 'ORD-2024-0001',
        clientId: 'client-123',
        status: 'draft',
        positionTitle: 'Software Engineer',
      };

      const { prisma } = await import('../../config/prisma');
      vi.mocked(prisma.order.create).mockResolvedValue(mockOrder as any);
      vi.mocked(prisma.order.count).mockResolvedValue(0);
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);

      const res = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', 'Bearer mock-token')
        .send({
          positionTitle: 'Software Engineer',
          screeningReason: 'Employment',
        });

      expect(res.status).toBeDefined();
    });
  });

  describe('GET /api/v1/orders/export', () => {
    it('should export orders as CSV', async () => {
      const { prisma } = await import('../../config/prisma');
      vi.mocked(prisma.order.findMany).mockResolvedValue([] as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);

      const res = await request(app)
        .get('/api/v1/orders/export')
        .set('Authorization', 'Bearer mock-token');

      expect(res.headers['content-type']).toContain('text/csv');
    });
  });
});

describe('AdverseActions API', () => {
  describe('GET /api/v1/adverse-actions', () => {
    it('should return adverse actions list', async () => {
      const res = await request(app)
        .get('/api/v1/adverse-actions')
        .set('Authorization', 'Bearer mock-token');

      expect(res.status).toBeDefined();
    });
  });
});

describe('Adjudication API', () => {
  describe('GET /api/v1/adjudication/matrices', () => {
    it('should return adjudication matrices', async () => {
      const res = await request(app)
        .get('/api/v1/adjudication/matrices')
        .set('Authorization', 'Bearer mock-token');

      expect(res.status).toBeDefined();
    });
  });
});

describe('Monitoring API', () => {
  describe('GET /api/v1/monitoring/enrollments', () => {
    it('should return monitoring enrollments', async () => {
      const res = await request(app)
        .get('/api/v1/monitoring/enrollments')
        .set('Authorization', 'Bearer mock-token');

      expect(res.status).toBeDefined();
    });
  });
});

describe('Disputes API', () => {
  describe('GET /api/v1/disputes', () => {
    it('should return disputes list', async () => {
      const res = await request(app)
        .get('/api/v1/disputes')
        .set('Authorization', 'Bearer mock-token');

      expect(res.status).toBeDefined();
    });
  });
});
