const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/config/prisma');

jest.mock('../src/config/prisma', () => ({
  show: {
    findMany: jest.fn(),
    findUnique: jest.fn()
  }
}));

describe('Show Endpoints (/api/shows)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/shows/movie/:movieId', () => {
    it('should return shows for a movie', async () => {
      const mockShows = [
        {
          id: 1,
          movieId: 1,
          screenId: 1,
          startTime: new Date().toISOString(),
          price: 250,
          screen: { name: 'Audi 1', theatre: { name: 'PVR ICON' } }
        }
      ];

      prisma.show.findMany.mockResolvedValueOnce(mockShows);

      const res = await request(app).get('/api/shows/movie/1');

      expect(res.statusCode).toBe(200);
      expect(res.body.shows).toHaveLength(1);
      expect(res.body.shows[0].price).toBe(250);
    });
  });

  describe('GET /api/shows/:id', () => {
    it('should return 404 if show is not found', async () => {
      prisma.show.findUnique.mockResolvedValueOnce(null);

      const res = await request(app).get('/api/shows/999');

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toContain('Show not found');
    });

    it('should return show details with mapped bookedSeatIds', async () => {
      const mockShow = {
        id: 1,
        movieId: 1,
        screenId: 1,
        price: 300,
        screen: {
          name: 'Audi 1',
          seats: [
            { id: 101, seatRow: 'A', seatNumber: 1, seatType: 'SILVER' },
            { id: 102, seatRow: 'A', seatNumber: 2, seatType: 'SILVER' }
          ]
        },
        bookings: [
          {
            id: 50,
            bookingStatus: 'CONFIRMED',
            bookingSeats: [{ seatId: 101 }]
          }
        ]
      };

      prisma.show.findUnique.mockResolvedValueOnce(mockShow);

      const res = await request(app).get('/api/shows/1');

      expect(res.statusCode).toBe(200);
      expect(res.body.show.id).toBe(1);
      expect(res.body.bookedSeatIds).toEqual([101]);
    });
  });
});
