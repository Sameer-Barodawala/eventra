const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/config/prisma');
const jwt = require('jsonwebtoken');

jest.mock('../src/config/prisma', () => ({
  movie: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    delete: jest.fn()
  }
}));

const createToken = (role = 'USER') => {
  return jwt.sign(
    { id: 1, email: 'test@example.com', role, name: 'Test User' },
    process.env.JWT_SECRET || 'eventra_super_secret_jwt_key_2026',
    { expiresIn: '1h' }
  );
};

describe('Movie Endpoints (/api/movies)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/movies', () => {
    it('should return list of movies', async () => {
      const mockMovies = [
        { id: 1, title: 'Dune: Part Two', genre: 'Sci-Fi', rating: 8.9 },
        { id: 2, title: 'Oppenheimer', genre: 'Drama', rating: 8.9 }
      ];
      prisma.movie.findMany.mockResolvedValueOnce(mockMovies);

      const res = await request(app).get('/api/movies');

      expect(res.statusCode).toBe(200);
      expect(res.body.movies).toHaveLength(2);
      expect(res.body.movies[0].title).toBe('Dune: Part Two');
    });

    it('should pass search filter query to database query', async () => {
      prisma.movie.findMany.mockResolvedValueOnce([]);

      const res = await request(app).get('/api/movies?search=Inception');

      expect(res.statusCode).toBe(200);
      expect(prisma.movie.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.any(Array)
          })
        })
      );
    });
  });

  describe('GET /api/movies/:id', () => {
    it('should return 404 if movie does not exist', async () => {
      prisma.movie.findUnique.mockResolvedValueOnce(null);

      const res = await request(app).get('/api/movies/999');

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toContain('Movie not found');
    });

    it('should return movie details if found', async () => {
      const mockMovie = {
        id: 1,
        title: 'Interstellar',
        duration: 169,
        shows: []
      };
      prisma.movie.findUnique.mockResolvedValueOnce(mockMovie);

      const res = await request(app).get('/api/movies/1');

      expect(res.statusCode).toBe(200);
      expect(res.body.movie.title).toBe('Interstellar');
    });
  });

  describe('POST /api/movies (Admin Only)', () => {
    it('should block non-admin users with 403 Forbidden', async () => {
      const userToken = createToken('USER');

      const res = await request(app)
        .post('/api/movies')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ title: 'New Movie' });

      expect(res.statusCode).toBe(403);
      expect(res.body.message).toContain('Admin privileges required');
    });

    it('should allow admin to create a new movie', async () => {
      const adminToken = createToken('ADMIN');
      const newMovieData = {
        title: 'Avatar: The Way of Water',
        description: 'Jake Sully lives with his newfound family on the extrasolar moon Pandora.',
        posterUrl: 'https://example.com/avatar.jpg',
        genre: 'Sci-Fi, Action',
        duration: 192,
        language: 'English',
        rating: 7.8
      };

      prisma.movie.create.mockResolvedValueOnce({ id: 10, ...newMovieData });

      const res = await request(app)
        .post('/api/movies')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newMovieData);

      expect(res.statusCode).toBe(201);
      expect(res.body.movie.title).toBe('Avatar: The Way of Water');
    });
  });
});
