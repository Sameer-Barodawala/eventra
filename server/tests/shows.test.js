const request = require('supertest');
const app = require('../src/app');
const db = require('../src/config/db');

jest.mock('../src/config/db', () => ({
  query: jest.fn()
}));

describe('Show Endpoints (/api/shows)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/shows/movie/:movieId', () => {
    it('should return shows for a movie', async () => {
      const mockRows = [
        {
          id: 1,
          movieId: 1,
          screenId: 1,
          startTime: new Date().toISOString(),
          endTime: new Date().toISOString(),
          price: '250.00',
          screen_id: 1,
          screen_name: 'Audi 1',
          theatre_id: 1,
          theatre_name: 'PVR ICON',
          theatre_city: 'Mumbai',
          theatre_location: 'Lower Parel'
        }
      ];

      db.query.mockResolvedValueOnce([mockRows]);

      const res = await request(app).get('/api/shows/movie/1');

      expect(res.statusCode).toBe(200);
      expect(res.body.shows).toHaveLength(1);
      expect(res.body.shows[0].price).toBe(250);
      expect(res.body.shows[0].screen.name).toBe('Audi 1');
    });
  });

  describe('GET /api/shows/:id', () => {
    it('should return 404 if show is not found', async () => {
      db.query.mockResolvedValueOnce([[]]);

      const res = await request(app).get('/api/shows/999');

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toContain('Show not found');
    });

    it('should return show details with mapped bookedSeatIds', async () => {
      const mockShowRow = {
        id: 1,
        movieId: 1,
        screenId: 1,
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
        price: '300.00',
        movie_id: 1,
        movie_title: 'Dune 2',
        screen_id: 1,
        screen_name: 'Audi 1',
        theatre_id: 1,
        theatre_name: 'PVR ICON'
      };

      const mockSeats = [
        { id: 101, screenId: 1, seatRow: 'A', seatNumber: 1, seatType: 'SILVER' },
        { id: 102, screenId: 1, seatRow: 'A', seatNumber: 2, seatType: 'SILVER' }
      ];

      const mockBooked = [
        { seatId: 101 }
      ];

      db.query
        .mockResolvedValueOnce([[mockShowRow]])
        .mockResolvedValueOnce([mockSeats])
        .mockResolvedValueOnce([mockBooked]);

      const res = await request(app).get('/api/shows/1');

      expect(res.statusCode).toBe(200);
      expect(res.body.show.id).toBe(1);
      expect(res.body.bookedSeatIds).toEqual([101]);
    });
  });
});
