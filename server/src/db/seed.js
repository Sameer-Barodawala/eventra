const bcrypt = require('bcryptjs');
const db = require('../config/db');

async function seed() {
  console.log('🌱 Starting database seed...');
  try {
    // Clean old data
    await db.query('DELETE FROM booking_seats');
    await db.query('DELETE FROM bookings');
    await db.query('DELETE FROM shows');
    await db.query('DELETE FROM seats');
    await db.query('DELETE FROM screens');
    await db.query('DELETE FROM theatres');
    await db.query('DELETE FROM movies');
    await db.query('DELETE FROM users');

    // 1. Seed Users
    const salt = await bcrypt.genSalt(10);
    const userPass = await bcrypt.hash('password123', salt);
    const adminPass = await bcrypt.hash('admin123', salt);

    const [userResult] = await db.query(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      ['John Doe', 'john@example.com', userPass, 'USER']
    );
    const demoUserId = userResult.insertId;

    await db.query(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      ['Admin Manager', 'admin@eventra.com', adminPass, 'ADMIN']
    );

    console.log('✅ Users seeded: john@example.com (password123)');

    // 2. Seed Movies
    const movies = [
      [
        'Dune: Part Two',
        'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family. Facing a choice between the love of his life and the fate of the universe, he endeavors to prevent a terrible future only he can foresee.',
        'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1600&q=80',
        'Sci-Fi, Adventure',
        166,
        'English',
        8.9,
        '2024-03-01'
      ],
      [
        'Oppenheimer',
        'The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb during World War II.',
        'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1600&q=80',
        'Biography, Drama, History',
        180,
        'English',
        8.9,
        '2023-07-21'
      ],
      [
        'Interstellar',
        'When Earth becomes uninhabitable in the future, a farmer and ex-NASA pilot, Joseph Cooper, is tasked to pilot a spacecraft, along with a team of researchers, to find a new planet for humans.',
        'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=1600&q=80',
        'Sci-Fi, Adventure, Drama',
        169,
        'English',
        8.7,
        '2014-11-07'
      ],
      [
        'Inception',
        'A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O., but his tragic past may doom the project and his team to disaster.',
        'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1600&q=80',
        'Action, Sci-Fi, Thriller',
        148,
        'English',
        8.8,
        '2010-07-16'
      ]
    ];

    const movieIds = [];
    for (const m of movies) {
      const [res] = await db.query(
        'INSERT INTO movies (title, description, poster_url, banner_url, genre, duration, language, rating, release_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        m
      );
      movieIds.push(res.insertId);
    }
    console.log(`✅ ${movieIds.length} movies seeded.`);

    // 3. Seed Theatres & Screens
    const [t1] = await db.query(
      'INSERT INTO theatres (name, city, location) VALUES (?, ?, ?)',
      ['PVR ICON: Gold Class', 'Mumbai', 'Phoenix Palladium, Lower Parel']
    );
    const [t2] = await db.query(
      'INSERT INTO theatres (name, city, location) VALUES (?, ?, ?)',
      ['INOX Megaplex: IMAX 3D', 'Mumbai', 'Inorbit Mall, Malad West']
    );

    const [s1] = await db.query(
      'INSERT INTO screens (theatre_id, name, total_seats) VALUES (?, ?, ?)',
      [t1.insertId, 'Audi 1 (Dolby Atmos)', 60]
    );
    const [s2] = await db.query(
      'INSERT INTO screens (theatre_id, name, total_seats) VALUES (?, ?, ?)',
      [t2.insertId, 'IMAX Laser Screen', 60]
    );

    // 4. Seed Seats (A to F, 10 per row)
    const rows = [
      { row: 'A', type: 'SILVER' },
      { row: 'B', type: 'SILVER' },
      { row: 'C', type: 'GOLD' },
      { row: 'D', type: 'GOLD' },
      { row: 'E', type: 'PLATINUM' },
      { row: 'F', type: 'PLATINUM' }
    ];

    for (const screenId of [s1.insertId, s2.insertId]) {
      for (const { row, type } of rows) {
        for (let num = 1; num <= 10; num++) {
          await db.query(
            'INSERT INTO seats (screen_id, seat_row, seat_number, seat_type) VALUES (?, ?, ?, ?)',
            [screenId, row, num, type]
          );
        }
      }
    }
    console.log('✅ 120 seats created.');

    // 5. Seed Shows dynamically across 5 consecutive days starting TODAY
    const formatMySQLDateTime = (d) => {
      const pad = (n) => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    };

    let firstShowId = null;

    const showSchedules = [
      // Dune 2
      {
        movieId: movieIds[0],
        durationMins: 166,
        slots: [
          { screenId: s1.insertId, hours: 13, minutes: 30, price: 250.00 },
          { screenId: s2.insertId, hours: 18, minutes: 0, price: 320.00 },
          { screenId: s1.insertId, hours: 21, minutes: 30, price: 280.00 }
        ]
      },
      // Oppenheimer
      {
        movieId: movieIds[1],
        durationMins: 180,
        slots: [
          { screenId: s2.insertId, hours: 14, minutes: 0, price: 300.00 },
          { screenId: s1.insertId, hours: 17, minutes: 45, price: 270.00 },
          { screenId: s2.insertId, hours: 21, minutes: 15, price: 340.00 }
        ]
      },
      // Interstellar
      {
        movieId: movieIds[2],
        durationMins: 169,
        slots: [
          { screenId: s1.insertId, hours: 10, minutes: 30, price: 220.00 },
          { screenId: s2.insertId, hours: 15, minutes: 45, price: 290.00 },
          { screenId: s1.insertId, hours: 19, minutes: 45, price: 280.00 }
        ]
      },
      // Inception
      {
        movieId: movieIds[3],
        durationMins: 148,
        slots: [
          { screenId: s2.insertId, hours: 11, minutes: 15, price: 240.00 },
          { screenId: s1.insertId, hours: 16, minutes: 0, price: 250.00 },
          { screenId: s2.insertId, hours: 20, minutes: 30, price: 310.00 }
        ]
      }
    ];

    let totalShowsCount = 0;

    for (let dayOffset = 0; dayOffset < 5; dayOffset++) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + dayOffset);

      for (const schedule of showSchedules) {
        for (const slot of schedule.slots) {
          const startTime = new Date(
            targetDate.getFullYear(),
            targetDate.getMonth(),
            targetDate.getDate(),
            slot.hours,
            slot.minutes,
            0
          );
          const endTime = new Date(startTime.getTime() + schedule.durationMins * 60000);

          const [showResult] = await db.query(
            'INSERT INTO shows (movie_id, screen_id, start_time, end_time, price) VALUES (?, ?, ?, ?, ?)',
            [schedule.movieId, slot.screenId, formatMySQLDateTime(startTime), formatMySQLDateTime(endTime), slot.price]
          );

          totalShowsCount++;

          // Track first show (Today's 1:30 PM Dune 2) for pre-booking demonstration
          if (!firstShowId) {
            firstShowId = showResult.insertId;
          }
        }
      }
    }

    console.log(`✅ ${totalShowsCount} shows seeded across 5 consecutive days.`);

    // 6. Pre-book sample seats (C4 & C5) ONLY for Show ID #1
    const [cSeats] = await db.query(
      'SELECT id FROM seats WHERE screen_id = ? AND seat_row = ? AND seat_number IN (4, 5)',
      [s1.insertId, 'C']
    );

    const [b1] = await db.query(
      'INSERT INTO bookings (user_id, show_id, total_amount, booking_status) VALUES (?, ?, ?, ?)',
      [demoUserId, firstShowId, 650.00, 'CONFIRMED']
    );

    for (const seat of cSeats) {
      await db.query(
        'INSERT INTO booking_seats (booking_id, seat_id) VALUES (?, ?)',
        [b1.insertId, seat.id]
      );
    }

    console.log(`✅ Sample pre-booked seats (C4, C5) created on Show #${firstShowId} ONLY.`);
    console.log('🎉 Seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    process.exit(0);
  }
}

seed();
