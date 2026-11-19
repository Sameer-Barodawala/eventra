const request = require('supertest');
const app = require('../src/app');
const db = require('../src/config/db');
const jwt = require('jsonwebtoken');

jest.mock('../src/config/db', () => ({
  query: jest.fn(),
  getConnection: jest.fn()
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

      const mockConn = {
        beginTransaction: jest.fn().mockResolvedValue(),
        commit: jest.fn().mockResolvedValue(),
        rollback: jest.fn().mockResolvedValue(),
        release: jest.fn(),
        query: jest.fn()
      };
      db.getConnection.mockResolvedValueOnce(mockConn);

      // 1. Show query
      mockConn.query
        .mockResolvedValueOnce([[{ id: 1, screen_id: 1, price: '250.00', movie_title: 'Dune 2' }]])
        // 2. Seats query
        .mockResolvedValueOnce([
          [
            { id: 10, screen_id: 1, seat_row: 'A', seat_number: 1, seat_type: 'SILVER' },
            { id: 11, screen_id: 1, seat_row: 'A', seat_number: 2, seat_type: 'SILVER' }
          ]
        ])
        // 3. Existing bookings conflict check (Seat 10 is already booked!)
        .mockResolvedValueOnce([
          [{ seat_id: 10, seat_row: 'A', seat_number: 1 }]
        ]);

      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${token}`)
        .send({ showId: 1, seatIds: [10, 11] });

      expect(res.statusCode).toBe(409);
      expect(res.body.message).toContain('Seats already booked: A1');
      expect(mockConn.rollback).toHaveBeenCalledTimes(1);
      expect(mockConn.release).toHaveBeenCalledTimes(1);
    });

    it('should successfully book seats with transaction and return 201', async () => {
      const token = createToken();

      const mockConn = {
        beginTransaction: jest.fn().mockResolvedValue(),
        commit: jest.fn().mockResolvedValue(),
        rollback: jest.fn().mockResolvedValue(),
        release: jest.fn(),
        query: jest.fn()
      };
      db.getConnection.mockResolvedValueOnce(mockConn);

      mockConn.query
        // 1. Show query with joined details
        .mockResolvedValueOnce([[
          {
            id: 1,
            movie_id: 1,
            screen_id: 1,
            start_time: '2026-11-20T10:00:00.000Z',
            end_time: '2026-11-20T13:00:00.000Z',
            price: '200.00',
            movie_title: 'Dune 2',
            movie_poster: 'poster.jpg',
            movie_genre: 'Sci-Fi',
            movie_duration: 166,
            movie_language: 'English',
            screen_name: 'Audi 1',
            theatre_id: 1,
            theatre_name: 'PVR ICON',
            theatre_city: 'Mumbai',
            theatre_location: 'Lower Parel'
          }
        ]])
        // 2. Seats query
        .mockResolvedValueOnce([
          [
            { id: 10, screen_id: 1, seat_row: 'A', seat_number: 1, seat_type: 'SILVER' },
            { id: 11, screen_id: 1, seat_row: 'C', seat_number: 1, seat_type: 'GOLD' }
          ]
        ])
        // 3. No conflict
        .mockResolvedValueOnce([[]])
        // 4. Insert booking
        .mockResolvedValueOnce([{ insertId: 99 }])
        // 5. Insert booking seat 10
        .mockResolvedValueOnce([{ insertId: 1 }])
        // 6. Insert booking seat 11
        .mockResolvedValueOnce([{ insertId: 2 }]);

      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${token}`)
        .send({ showId: 1, seatIds: [10, 11] });

      expect(res.statusCode).toBe(201);
      expect(res.body.message).toContain('Booking confirmed');
      expect(res.body.booking.id).toBe(99);
      expect(res.body.booking.totalAmount).toBe(460); // 200 + 260
      expect(mockConn.commit).toHaveBeenCalledTimes(1);
      expect(mockConn.release).toHaveBeenCalledTimes(1);
    });
  });

  describe('GET /api/bookings/my-bookings', () => {
    it('should fetch user bookings', async () => {
      const token = createToken(1);

      const mockBookingRow = {
        id: 99,
        totalAmount: '460.00',
        bookingStatus: 'CONFIRMED',
        bookingDate: new Date().toISOString(),
        show_id: 1,
        show_startTime: new Date().toISOString(),
        show_endTime: new Date().toISOString(),
        show_price: '200.00',
        movie_id: 1,
        movie_title: 'Dune: Part Two',
        movie_poster: 'poster.jpg',
        screen_id: 1,
        screen_name: 'Audi 1',
        theatre_id: 1,
        theatre_name: 'PVR ICON',
        theatre_city: 'Mumbai',
        theatre_location: 'Lower Parel'
      };

      const mockSeats = [
        { booking_id: 99, id: 10, seatRow: 'A', seatNumber: 1, seatType: 'SILVER' }
      ];

      db.query
        .mockResolvedValueOnce([[mockBookingRow]])
        .mockResolvedValueOnce([mockSeats]);

      const res = await request(app)
        .get('/api/bookings/my-bookings')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.bookings).toHaveLength(1);
      expect(res.body.bookings[0].show.movie.title).toBe('Dune: Part Two');
      expect(res.body.bookings[0].totalAmount).toBe(460);
    });
  });
});
