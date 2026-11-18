const db = require('../config/db');

const createBooking = async (req, res, next) => {
  let conn;
  try {
    const userId = req.user.id;
    const { showId, seatIds } = req.body;

    if (!showId || !Array.isArray(seatIds) || seatIds.length === 0) {
      return res.status(400).json({
        message: 'Invalid booking data. showId and a non-empty seatIds array are required.'
      });
    }

    conn = await db.getConnection();
    await conn.beginTransaction();

    // 1. Verify show exists
    const [shows] = await conn.query(
      `SELECT sh.id, sh.screen_id, sh.price, m.title AS movie_title
       FROM shows sh
       JOIN movies m ON sh.movie_id = m.id
       WHERE sh.id = ?`,
      [showId]
    );

    if (!shows || shows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ message: 'Show not found.' });
    }

    const show = shows[0];

    // 2. Fetch requested seats for this screen
    const [seats] = await conn.query(
      `SELECT id, screen_id, seat_row, seat_number, seat_type
       FROM seats
       WHERE id IN (?) AND screen_id = ?`,
      [seatIds, show.screen_id]
    );

    if (seats.length !== seatIds.length) {
      await conn.rollback();
      return res.status(400).json({ message: 'One or more selected seats are invalid for this screen.' });
    }

    // 3. Conflict detection: Check if any seat is already booked for this show
    const [existingBookings] = await conn.query(
      `SELECT bs.seat_id, s.seat_row, s.seat_number
       FROM booking_seats bs
       JOIN bookings b ON bs.booking_id = b.id
       JOIN seats s ON bs.seat_id = s.id
       WHERE b.show_id = ? AND b.booking_status = 'CONFIRMED' AND bs.seat_id IN (?)`,
      [show.id, seatIds]
    );

    if (existingBookings && existingBookings.length > 0) {
      await conn.rollback();
      const bookedSeatLabels = existingBookings.map(
        (b) => `${b.seat_row}${b.seat_number}`
      );
      return res.status(409).json({
        message: `Seats already booked: ${bookedSeatLabels.join(', ')}. Please select different seats.`
      });
    }

    // 4. Calculate total amount
    let totalAmount = 0;
    seats.forEach((seat) => {
      let multiplier = 1.0;
      if (seat.seat_type === 'GOLD') multiplier = 1.3;
      if (seat.seat_type === 'PLATINUM') multiplier = 1.6;
      totalAmount += Math.round(parseFloat(show.price) * multiplier);
    });

    // 5. Insert Booking
    const [bookingResult] = await conn.query(
      `INSERT INTO bookings (user_id, show_id, total_amount, booking_status)
       VALUES (?, ?, ?, 'CONFIRMED')`,
      [userId, show.id, totalAmount]
    );

    const bookingId = bookingResult.insertId;

    // 6. Insert Booking Seats
    for (const seat of seats) {
      await conn.query(
        'INSERT INTO booking_seats (booking_id, seat_id) VALUES (?, ?)',
        [bookingId, seat.id]
      );
    }

    // Commit transaction
    await conn.commit();

    // 7. Return complete booking details
    const booking = {
      id: bookingId,
      userId,
      showId: show.id,
      totalAmount,
      bookingStatus: 'CONFIRMED',
      bookingDate: new Date().toISOString(),
      bookingSeats: seats.map((s) => ({
        seat: {
          id: s.id,
          seatRow: s.seat_row,
          seatNumber: s.seat_number,
          seatType: s.seat_type
        }
      }))
    };

    return res.status(201).json({
      message: 'Booking confirmed successfully!',
      booking
    });
  } catch (error) {
    if (conn) await conn.rollback();
    next(error);
  } finally {
    if (conn) conn.release();
  }
};

const getMyBookings = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [rows] = await db.query(
      `SELECT b.id, b.total_amount AS totalAmount, b.booking_status AS bookingStatus, b.booking_date AS bookingDate,
              sh.id AS show_id, sh.start_time AS show_startTime, sh.end_time AS show_endTime, sh.price AS show_price,
              m.id AS movie_id, m.title AS movie_title, m.poster_url AS movie_poster,
              sc.id AS screen_id, sc.name AS screen_name,
              t.id AS theatre_id, t.name AS theatre_name, t.city AS theatre_city, t.location AS theatre_location
       FROM bookings b
       JOIN shows sh ON b.show_id = sh.id
       JOIN movies m ON sh.movie_id = m.id
       JOIN screens sc ON sh.screen_id = sc.id
       JOIN theatres t ON sc.theatre_id = t.id
       WHERE b.user_id = ?
       ORDER BY b.booking_date DESC`,
      [userId]
    );

    // Fetch seats for all user bookings
    const bookingIds = (rows || []).map((r) => r.id);
    let seatsByBooking = {};

    if (bookingIds.length > 0) {
      const [bookingSeats] = await db.query(
        `SELECT bs.booking_id, s.id, s.seat_row AS seatRow, s.seat_number AS seatNumber, s.seat_type AS seatType
         FROM booking_seats bs
         JOIN seats s ON bs.seat_id = s.id
         WHERE bs.booking_id IN (?)`,
        [bookingIds]
      );

      (bookingSeats || []).forEach((bs) => {
        if (!seatsByBooking[bs.booking_id]) {
          seatsByBooking[bs.booking_id] = [];
        }
        seatsByBooking[bs.booking_id].push({
          seat: {
            id: bs.id,
            seatRow: bs.seatRow,
            seatNumber: bs.seatNumber,
            seatType: bs.seatType
          }
        });
      });
    }

    const bookings = (rows || []).map((r) => ({
      id: r.id,
      totalAmount: parseFloat(r.totalAmount),
      bookingStatus: r.bookingStatus,
      bookingDate: r.bookingDate,
      show: {
        id: r.show_id,
        startTime: r.show_startTime,
        endTime: r.show_endTime,
        price: parseFloat(r.show_price),
        movie: {
          id: r.movie_id,
          title: r.movie_title,
          posterUrl: r.movie_poster
        },
        screen: {
          id: r.screen_id,
          name: r.screen_name,
          theatre: {
            id: r.theatre_id,
            name: r.theatre_name,
            city: r.theatre_city,
            location: r.theatre_location
          }
        }
      },
      bookingSeats: seatsByBooking[r.id] || []
    }));

    return res.status(200).json({ bookings });
  } catch (error) {
    next(error);
  }
};

const getBookingById = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid booking ID.' });
    }

    const [rows] = await db.query(
      `SELECT b.id, b.user_id AS userId, b.total_amount AS totalAmount, b.booking_status AS bookingStatus, b.booking_date AS bookingDate,
              sh.id AS show_id, sh.start_time AS show_startTime, sh.end_time AS show_endTime, sh.price AS show_price,
              m.id AS movie_id, m.title AS movie_title, m.poster_url AS movie_poster, m.genre AS movie_genre, m.duration AS movie_duration, m.language AS movie_language,
              sc.id AS screen_id, sc.name AS screen_name,
              t.id AS theatre_id, t.name AS theatre_name, t.city AS theatre_city, t.location AS theatre_location
       FROM bookings b
       JOIN shows sh ON b.show_id = sh.id
       JOIN movies m ON sh.movie_id = m.id
       JOIN screens sc ON sh.screen_id = sc.id
       JOIN theatres t ON sc.theatre_id = t.id
       WHERE b.id = ?`,
      [id]
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    const r = rows[0];

    if (r.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Access denied.' });
    }

    const [bookingSeats] = await db.query(
      `SELECT s.id, s.seat_row AS seatRow, s.seat_number AS seatNumber, s.seat_type AS seatType
       FROM booking_seats bs
       JOIN seats s ON bs.seat_id = s.id
       WHERE bs.booking_id = ?`,
      [id]
    );

    const booking = {
      id: r.id,
      totalAmount: parseFloat(r.totalAmount),
      bookingStatus: r.bookingStatus,
      bookingDate: r.bookingDate,
      show: {
        id: r.show_id,
        startTime: r.show_startTime,
        endTime: r.show_endTime,
        price: parseFloat(r.show_price),
        movie: {
          id: r.movie_id,
          title: r.movie_title,
          posterUrl: r.movie_poster,
          genre: r.movie_genre,
          duration: r.movie_duration,
          language: r.movie_language
        },
        screen: {
          id: r.screen_id,
          name: r.screen_name,
          theatre: {
            id: r.theatre_id,
            name: r.theatre_name,
            city: r.theatre_city,
            location: r.theatre_location
          }
        }
      },
      bookingSeats: (bookingSeats || []).map((s) => ({
        seat: {
          id: s.id,
          seatRow: s.seatRow,
          seatNumber: s.seatNumber,
          seatType: s.seatType
        }
      }))
    };

    return res.status(200).json({ booking });
  } catch (error) {
    next(error);
  }
};

const cancelBooking = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid booking ID.' });
    }

    const [rows] = await db.query(
      'SELECT id, user_id FROM bookings WHERE id = ?',
      [id]
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    if (rows[0].user_id !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Access denied.' });
    }

    await db.query(
      "UPDATE bookings SET booking_status = 'CANCELLED' WHERE id = ?",
      [id]
    );

    return res.status(200).json({
      message: 'Booking cancelled successfully.'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking
};
