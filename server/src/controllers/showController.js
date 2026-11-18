const db = require('../config/db');

const getShowsByMovieId = async (req, res, next) => {
  try {
    const movieId = parseInt(req.params.movieId, 10);
    if (isNaN(movieId)) {
      return res.status(400).json({ message: 'Invalid movie ID.' });
    }

    const { date } = req.query;
    let query = `
      SELECT sh.id, sh.movie_id AS movieId, sh.screen_id AS screenId,
             sh.start_time AS startTime, sh.end_time AS endTime, sh.price,
             sc.id AS screen_id, sc.name AS screen_name,
             t.id AS theatre_id, t.name AS theatre_name, t.city AS theatre_city, t.location AS theatre_location
      FROM shows sh
      JOIN screens sc ON sh.screen_id = sc.id
      JOIN theatres t ON sc.theatre_id = t.id
      WHERE sh.movie_id = ?
    `;
    const params = [movieId];

    if (date) {
      query += ` AND DATE(sh.start_time) = ?`;
      params.push(date);
    }

    query += ` ORDER BY sh.start_time ASC`;

    const [rows] = await db.query(query, params);

    const shows = (rows || []).map((row) => ({
      id: row.id,
      movieId: row.movieId,
      screenId: row.screenId,
      startTime: row.startTime,
      endTime: row.endTime,
      price: parseFloat(row.price),
      screen: {
        id: row.screen_id,
        name: row.screen_name,
        theatre: {
          id: row.theatre_id,
          name: row.theatre_name,
          city: row.theatre_city,
          location: row.theatre_location
        }
      }
    }));

    return res.status(200).json({ shows });
  } catch (error) {
    next(error);
  }
};

const getShowById = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid show ID.' });
    }

    // 1. Fetch show, movie, screen, and theatre
    const [shows] = await db.query(
      `SELECT sh.id, sh.movie_id AS movieId, sh.screen_id AS screenId,
              sh.start_time AS startTime, sh.end_time AS endTime, sh.price,
              m.id AS movie_id, m.title AS movie_title, m.description AS movie_desc,
              m.poster_url AS movie_poster, m.banner_url AS movie_banner,
              m.genre AS movie_genre, m.duration AS movie_duration, m.language AS movie_language,
              sc.id AS screen_id, sc.name AS screen_name,
              t.id AS theatre_id, t.name AS theatre_name, t.city AS theatre_city, t.location AS theatre_location
       FROM shows sh
       JOIN movies m ON sh.movie_id = m.id
       JOIN screens sc ON sh.screen_id = sc.id
       JOIN theatres t ON sc.theatre_id = t.id
       WHERE sh.id = ?`,
      [id]
    );

    if (!shows || shows.length === 0) {
      return res.status(404).json({ message: 'Show not found.' });
    }

    const row = shows[0];

    // 2. Fetch seats for the screen
    const [seats] = await db.query(
      `SELECT id, screen_id AS screenId, seat_row AS seatRow,
              seat_number AS seatNumber, seat_type AS seatType
       FROM seats
       WHERE screen_id = ?
       ORDER BY seat_row ASC, seat_number ASC`,
      [row.screenId]
    );

    // 3. Fetch booked seat IDs for this show
    const [bookedRows] = await db.query(
      `SELECT bs.seat_id AS seatId
       FROM booking_seats bs
       JOIN bookings b ON bs.booking_id = b.id
       WHERE b.show_id = ? AND b.booking_status = 'CONFIRMED'`,
      [id]
    );

    const bookedSeatIds = (bookedRows || []).map((b) => b.seatId);

    const showData = {
      id: row.id,
      movieId: row.movieId,
      screenId: row.screenId,
      startTime: row.startTime,
      endTime: row.endTime,
      price: parseFloat(row.price),
      movie: {
        id: row.movie_id,
        title: row.movie_title,
        description: row.movie_desc,
        posterUrl: row.movie_poster,
        bannerUrl: row.movie_banner,
        genre: row.movie_genre,
        duration: row.movie_duration,
        language: row.movie_language
      },
      screen: {
        id: row.screen_id,
        name: row.screen_name,
        seats: seats || [],
        theatre: {
          id: row.theatre_id,
          name: row.theatre_name,
          city: row.theatre_city,
          location: row.theatre_location
        }
      }
    };

    return res.status(200).json({
      show: showData,
      bookedSeatIds
    });
  } catch (error) {
    next(error);
  }
};

const createShow = async (req, res, next) => {
  try {
    const { movieId, screenId, startTime, endTime, price } = req.body;

    if (!movieId || !screenId || !startTime || !endTime || !price) {
      return res.status(400).json({ message: 'Missing required show fields.' });
    }

    const [result] = await db.query(
      `INSERT INTO shows (movie_id, screen_id, start_time, end_time, price)
       VALUES (?, ?, ?, ?, ?)`,
      [movieId, screenId, startTime, endTime, price]
    );

    return res.status(201).json({
      message: 'Show created successfully.',
      show: { id: result.insertId, movieId, screenId, startTime, endTime, price }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getShowsByMovieId,
  getShowById,
  createShow
};
