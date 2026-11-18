const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/config/prisma');
const jwt = require('jsonwebtoken');

jest.mock('../src/config/prisma', () => ({
  show: {
    findUnique: jest.fn()
  },
  seat: {
    findMany: jest.fn()
  },
  bookingSeat: {
    findMany: jest.fn()
  },
  booking: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn()
  },
  $transaction: jest.fn()
}));

const createToken = (userId = 1, role = 'USER') => {
  return jwt.sign(
    { id: userId, email: 'test@example.com', role, name: 'Test User' },
    process.env.JWT_SECRET || 'eventra_super_secret_jwt_key_2026',
    { expiresIn: '1h' }
  );
};

describe('Booking Endpoints (/api/bookings)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/bookings', () => {
    it('should reject unauthenticated request with 401', async () => {
      const res = await request(app)
        .post('/api/bookings')
        .send({ showId: 1, seatIds: [10, 11] });

      expect(res.statusCode).toBe(401);
    });

    it('should reject invalid payload (empty seatIds)', async () => {
      const token = createToken();

      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${token}`)
        .send({ showId: 1, seatIds: [] });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('non-empty seatIds array are required');
    });

    it('should return 409 Conflict if any selected seat is already booked', async () => {
      const token = createToken();

      prisma.show.findUnique.mockResolvedValueOnce({
        id: 1,
        screenId: 1,
        price: 250
      });

      prisma.seat.findMany.mockResolvedValueOnce([
        { id: 10, seatRow: 'A', seatNumber: 1, seatType: 'SILVER' },
        { id: 11, seatRow: 'A', seatNumber: 2, seatType: 'SILVER' }
      ]);

      // Seat 10 is already booked!
      prisma.bookingSeat.findMany.mockResolvedValueOnce([
        { seatId: 10, seat: { seatRow: 'A', seatNumber: 1 } }
      ]);

      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${token}`)
        .send({ showId: 1, seatIds: [10, 11] });

      expect(res.statusCode).toBe(409);
      expect(res.body.message).toContain('Seats already booked: A1');
    });

    it('should successfully book seats and return 201 with confirmed booking', async () => {
      const token = createToken();

      prisma.show.findUnique.mockResolvedValueOnce({
        id: 1,
        screenId: 1,
        price: 200
      });

      prisma.seat.findMany.mockResolvedValueOnce([
        { id: 10, seatRow: 'A', seatNumber: 1, seatType: 'SILVER' },
        { id: 11, seatRow: 'C', seatNumber: 1, seatType: 'GOLD' }
      ]);

      // No conflict
      prisma.bookingSeat.findMany.mockResolvedValueOnce([]);

      // Mock transaction execution
      prisma.$transaction.mockImplementation(async (callback) => {
        const tx = {
          booking: {
            create: jest.fn().mockResolvedValue({ id: 99 })
          },
          bookingSeat: {
            createMany: jest.fn().mockResolvedValue({ count: 2 })
          }
        };
        return await callback(tx);
      });

      prisma.booking.findUnique.mockResolvedValueOnce({
        id: 99,
        userId: 1,
        showId: 1,
        totalAmount: 460, // 200 (silver) + 260 (gold 1.3x)
        bookingStatus: 'CONFIRMED',
        bookingSeats: [
          { seat: { seatRow: 'A', seatNumber: 1 } },
          { seat: { seatRow: 'C', seatNumber: 1 } }
        ]
      });

      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${token}`)
        .send({ showId: 1, seatIds: [10, 11] });

      expect(res.statusCode).toBe(201);
      expect(res.body.message).toContain('Booking confirmed');
      expect(res.body.booking.id).toBe(99);
      expect(res.body.booking.totalAmount).toBe(460);
    });
  });

  describe('GET /api/bookings/my-bookings', () => {
    it('should fetch user bookings', async () => {
      const token = createToken(1);

      prisma.booking.findMany.mockResolvedValueOnce([
        {
          id: 99,
          totalAmount: 460,
          bookingStatus: 'CONFIRMED',
          show: { movie: { title: 'Dune: Part Two' } }
        }
      ]);

      const res = await request(app)
        .get('/api/bookings/my-bookings')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.bookings).toHaveLength(1);
      expect(res.body.bookings[0].show.movie.title).toBe('Dune: Part Two');
    });
  });
});
