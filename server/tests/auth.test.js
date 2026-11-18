const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/config/prisma');
const bcrypt = require('bcryptjs');

jest.mock('../src/config/prisma', () => ({
  user: {
    findUnique: jest.fn(),
    create: jest.fn()
  }
}));

describe('Auth Endpoints (/api/auth)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should fail if required fields are missing', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@example.com' });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('Name, email, and password are required');
    });

    it('should fail if password is too short', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Test', email: 'test@example.com', password: '123' });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('at least 6 characters');
    });

    it('should fail if email already exists (409 Conflict)', async () => {
      prisma.user.findUnique.mockResolvedValueOnce({ id: 1, email: 'duplicate@example.com' });

      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Duplicate', email: 'duplicate@example.com', password: 'password123' });

      expect(res.statusCode).toBe(409);
      expect(res.body.message).toContain('already exists');
    });

    it('should register user and return token on valid data', async () => {
      prisma.user.findUnique.mockResolvedValueOnce(null);
      prisma.user.create.mockResolvedValueOnce({
        id: 1,
        name: 'Jane Doe',
        email: 'jane@example.com',
        role: 'USER',
        createdAt: new Date().toISOString()
      });

      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Jane Doe', email: 'jane@example.com', password: 'password123' });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toHaveProperty('email', 'jane@example.com');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should reject non-existing email', async () => {
      prisma.user.findUnique.mockResolvedValueOnce(null);

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nonexistent@example.com', password: 'password123' });

      expect(res.statusCode).toBe(401);
      expect(res.body.message).toContain('Invalid email or password');
    });

    it('should reject wrong password', async () => {
      const hashedPassword = await bcrypt.hash('correctpassword', 10);
      prisma.user.findUnique.mockResolvedValueOnce({
        id: 1,
        name: 'Jane',
        email: 'jane@example.com',
        password: hashedPassword,
        role: 'USER'
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'jane@example.com', password: 'wrongpassword' });

      expect(res.statusCode).toBe(401);
      expect(res.body.message).toContain('Invalid email or password');
    });

    it('should return token on correct credentials', async () => {
      const hashedPassword = await bcrypt.hash('secret123', 10);
      prisma.user.findUnique.mockResolvedValueOnce({
        id: 1,
        name: 'Jane',
        email: 'jane@example.com',
        password: hashedPassword,
        role: 'USER',
        createdAt: new Date()
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'jane@example.com', password: 'secret123' });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.email).toBe('jane@example.com');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return 401 when no token is provided', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.statusCode).toBe(401);
      expect(res.body.message).toContain('Authentication required');
    });

    it('should return current user when valid token is supplied', async () => {
      const hashedPassword = await bcrypt.hash('secret123', 10);
      prisma.user.findUnique
        .mockResolvedValueOnce({
          id: 1,
          name: 'Jane',
          email: 'jane@example.com',
          password: hashedPassword,
          role: 'USER'
        })
        .mockResolvedValueOnce({
          id: 1,
          name: 'Jane',
          email: 'jane@example.com',
          role: 'USER',
          createdAt: new Date()
        });

      // Log in first to get a real signed JWT
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'jane@example.com', password: 'secret123' });

      const token = loginRes.body.token;

      const profileRes = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(profileRes.statusCode).toBe(200);
      expect(profileRes.body.user.email).toBe('jane@example.com');
    });
  });
});
