const bcrypt = require('bcryptjs');
const db = require('../config/db');

async function seed() {
  console.log('🌱 Starting comprehensive database seed...');
  try {
    // 1. Clean existing data in reverse order of foreign keys
    await db.query('DELETE FROM booking_seats');
    await db.query('DELETE FROM bookings');
    await db.query('DELETE FROM shows');
    await db.query('DELETE FROM seats');
    await db.query('DELETE FROM screens');
    await db.query('DELETE FROM theatres');
    await db.query('DELETE FROM movies');
    await db.query('DELETE FROM users');

    // 2. Seed Users
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

    // 3. Seed Complete Movie Catalog (Featured Premiere, Bollywood, Global Blockbusters)
    const movies = [
      // 1. Featured Premiere
      [
        'Avengers: Doomsday',
        'Earth\'s mightiest heroes face their greatest existential threat yet as the multiverse fractures and Doctor Victor von Doom emerges from the shadows to reshape reality and challenge every timeline.',
        'https://images.unsplash.com/photo-1635805737707-575885ab0820?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=1600&q=80',
        'Action, Sci-Fi, Adventure',
        175,
        'English',
        9.3,
        '2026-05-01'
      ],
      // 2. Bollywood Blockbuster 1
      [
        'Singham Again',
        'DCP Bajirao Singham embarks on a high-stakes cross-border rescue mission, uniting with fierce allies from the Cop Universe against a ruthless international crime syndicate.',
        'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1600&q=80',
        'Action, Drama, Thriller',
        160,
        'Hindi',
        8.5,
        '2024-11-01'
      ],
      // 3. Bollywood Blockbuster 2
      [
        'Bhool Bhulaiyaa 3',
        'Rooh Baba ventures into the haunted royal palace of Raktaghat in Bengal, encountering two menacing royal spirits claiming to be the vengeful ghost of Manjulika.',
        'https://images.unsplash.com/photo-1509248961158-e54f6934749c?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1600&q=80',
        'Comedy, Horror, Mystery',
        158,
        'Hindi',
        8.3,
        '2024-11-01'
      ],
      // 4. Bogota: City of the Lost
      [
        'Bogota: City of the Lost',
        'Set in the 1990s, a young Korean immigrant arrives in the dangerous streets of Bogota, Colombia, and rises from the bottom of the black market to become a powerful local boss.',
        'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1477959858617-67f30bc75b82?auto=format&fit=crop&w=1600&q=80',
        'Crime, Drama, Thriller',
        132,
        'Korean',
        8.4,
        '2024-12-15'
      ],
      // 5. The Gray Man
      [
        'The Gray Man',
        'When the CIA\'s top covert operative accidentally uncovers dark agency secrets, a psychopathic former colleague puts a massive bounty on his head, triggering a global manhunt by international assassins.',
        'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1600&q=80',
        'Action, Thriller',
        129,
        'English',
        8.1,
        '2022-07-22'
      ],
      // 6. Drawing Closer
      [
        'Drawing Closer',
        'With only a year left to live due to a terminal cardiac illness, Akito finds renewed hope and unexpected love when he meets Aoi, a cheerful girl with only six months left to live herself.',
        'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=1600&q=80',
        'Romance, Drama',
        118,
        'Japanese',
        8.7,
        '2024-06-27'
      ],
      // 7. Resident Evil: Death Island
      [
        'Resident Evil: Death Island',
        'BSAA agent Chris Redfield investigates a bio-organic outbreak in San Francisco, while Leon S. Kennedy and Jill Valentine track the infected virus trail straight to Alcatraz Island.',
        'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1600&q=80',
        'Action, Horror, Sci-Fi',
        91,
        'English',
        8.0,
        '2023-07-07'
      ],
      // 8. Dune: Part Two
      [
        'Dune: Part Two',
        'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family, facing a choice between love and the fate of the universe.',
        'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1600&q=80',
        'Sci-Fi, Adventure',
        166,
        'English',
        8.9,
        '2024-03-01'
      ],
      // 9. Oppenheimer
      [
        'Oppenheimer',
        'The story of American theoretical physicist J. Robert Oppenheimer and his role in the development of the atomic bomb during World War II.',
        'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1600&q=80',
        'Biography, Drama, History',
        180,
        'English',
        8.9,
        '2023-07-21'
      ],
      // 10. Interstellar
      [
        'Interstellar',
        'When Earth faces environmental collapse, a team of astronauts travel through a wormhole near Saturn in search of a new habitable world for humanity.',
        'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=1600&q=80',
        'Sci-Fi, Adventure, Drama',
        169,
        'English',
        8.8,
        '2014-11-07'
      ],
      // 11. Inception
      [
        'Inception',
        'A skilled thief who steals corporate secrets through dream-sharing technology is offered a chance to have his criminal history erased as payment for the implantation of another person\'s idea.',
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
    console.log(`✅ ${movieIds.length} movies seeded (including Avengers: Doomsday, Singham Again, Bhool Bhulaiyaa 3, Bogota, The Gray Man, Drawing Closer, Resident Evil).`);

    // 4. Seed Theatres & Screens
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

    // 5. Seed Seats (A to F, 10 per row)
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
    console.log('✅ 120 seats created across screens.');

    // 6. Seed Shows dynamically across 6 consecutive days starting TODAY
    const formatMySQLDateTime = (d) => {
      const pad = (n) => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    };

    let firstShowId = null;
    let totalShowsCount = 0;

    // Daily show timing patterns
    const timeSlots = [
      { hours: 10, minutes: 30, screenId: s1.insertId, price: 220.00 },
      { hours: 13, minutes: 45, screenId: s2.insertId, price: 320.00 },
      { hours: 17, minutes: 15, screenId: s1.insertId, price: 260.00 },
      { hours: 20, minutes: 30, screenId: s2.insertId, price: 350.00 }
    ];

    for (let dayOffset = 0; dayOffset < 6; dayOffset++) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + dayOffset);

      // Distribute shows for all movies across the day
      for (let mIdx = 0; mIdx < movieIds.length; mIdx++) {
        const movieId = movieIds[mIdx];
        
        // Give each movie 2 distinct shows per day
        const slot1 = timeSlots[mIdx % timeSlots.length];
        const slot2 = timeSlots[(mIdx + 2) % timeSlots.length];

        for (const slot of [slot1, slot2]) {
          const startTime = new Date(
            targetDate.getFullYear(),
            targetDate.getMonth(),
            targetDate.getDate(),
            slot.hours,
            slot.minutes,
            0
          );
          const endTime = new Date(startTime.getTime() + 150 * 60000);

          const [showResult] = await db.query(
            'INSERT INTO shows (movie_id, screen_id, start_time, end_time, price) VALUES (?, ?, ?, ?, ?)',
            [movieId, slot.screenId, formatMySQLDateTime(startTime), formatMySQLDateTime(endTime), slot.price]
          );

          totalShowsCount++;

          // Keep track of the very first show (Today's Avengers show) for sample demo pre-booking
          if (!firstShowId) {
            firstShowId = showResult.insertId;
          }
        }
      }
    }

    console.log(`✅ ${totalShowsCount} shows seeded across 6 consecutive days.`);

    // 7. Pre-book sample seats (C4 & C5) ONLY for the very first show (Show #1)
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
