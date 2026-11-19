const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const db = require('../config/db');

let isSyncing = false;
let lastSyncDate = null;

async function ensureTablesExist() {
  try {
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
    const statements = schemaSql
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    for (const stmt of statements) {
      await db.query(stmt);
    }
  } catch (err) {
    console.warn('⚠️ [AutoSync] Ensure tables notice:', err.message);
  }
}

const ALL_MOVIES = [
  // 1. Featured Premiere
  [
    'Avengers: Doomsday',
    'Earth\'s mightiest heroes face their greatest existential threat yet as the multiverse fractures and Doctor Victor von Doom emerges from the shadows to reshape reality and challenge every timeline.',
    '/movies/avengers-poster.jpg',
    '/movies/avengers-banner.jpg',
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
    '/movies/singham-poster.jpg',
    '/movies/singham-banner.jpg',
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
    '/movies/bhoolbhulaiyaa-poster.jpg',
    '/movies/bhoolbhulaiyaa-banner.jpg',
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
    '/movies/bogota-poster.jpg',
    '/movies/bogota-banner.jpg',
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
    '/movies/grayman-poster.jpg',
    '/movies/grayman-banner.jpg',
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
    '/movies/drawingcloser-poster.jpg',
    '/movies/drawingcloser-banner.jpg',
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
    '/movies/residentevil-poster.jpg',
    '/movies/residentevil-banner.jpg',
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
    '/movies/dune2-poster.jpg',
    '/movies/dune2-banner.jpg',
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
    '/movies/oppenheimer-poster.jpg',
    '/movies/oppenheimer-banner.jpg',
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
    '/movies/interstellar-poster.jpg',
    '/movies/interstellar-banner.jpg',
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
    '/movies/inception-poster.jpg',
    '/movies/inception-banner.jpg',
    'Action, Sci-Fi, Thriller',
    148,
    'English',
    8.8,
    '2010-07-16'
  ]
];

const formatMySQLDateTime = (d) => {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

async function autoSyncShowsIfNeeded() {
  if (process.env.NODE_ENV === 'test') return;
  if (isSyncing) return;

  const todayStr = new Date().toISOString().split('T')[0];
  if (lastSyncDate === todayStr) return;

  isSyncing = true;
  try {
    await ensureTablesExist();

    // 1. Check if movies table has Avengers: Doomsday
    const [existingAvengers] = await db.query(
      "SELECT id FROM movies WHERE title = 'Avengers: Doomsday' LIMIT 1"
    );

    // 2. Check how many upcoming shows exist from today onwards
    const [upcomingShows] = await db.query(
      "SELECT COUNT(*) AS count FROM shows WHERE DATE(start_time) >= CURDATE()"
    );

    // 3. Check if shows exist for today specifically
    const [todayShows] = await db.query(
      "SELECT COUNT(*) AS count FROM shows WHERE DATE(start_time) = CURDATE()"
    );

    const hasUpcoming = upcomingShows && upcomingShows[0] && upcomingShows[0].count >= 15;
    const hasToday = todayShows && todayShows[0] && todayShows[0].count >= 10;

    // If movies are missing or shows are outdated / fewer than 15, resync!
    if (!existingAvengers || existingAvengers.length === 0 || !hasUpcoming || !hasToday) {
      console.log('🔄 [AutoSync] Detected outdated or missing shows/movies. Synchronizing database with live dates...');

      // Clean old shows and bookings so they don't linger on past dates
      await db.query('DELETE FROM booking_seats');
      await db.query('DELETE FROM bookings');
      await db.query('DELETE FROM shows');

      // Check users
      const [existingUsers] = await db.query("SELECT id FROM users WHERE email = 'john@example.com'");
      let demoUserId;
      if (!existingUsers || existingUsers.length === 0) {
        const salt = await bcrypt.genSalt(10);
        const userPass = await bcrypt.hash('password123', salt);
        const [uRes] = await db.query(
          'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
          ['John Doe', 'john@example.com', userPass, 'USER']
        );
        demoUserId = uRes.insertId;
      } else {
        demoUserId = existingUsers[0].id;
      }

      // Check theatres
      let [theatres] = await db.query('SELECT id FROM theatres LIMIT 2');
      let t1Id, t2Id;
      if (!theatres || theatres.length < 2) {
        await db.query('DELETE FROM seats');
        await db.query('DELETE FROM screens');
        await db.query('DELETE FROM theatres');

        const [t1] = await db.query(
          'INSERT INTO theatres (name, city, location) VALUES (?, ?, ?)',
          ['PVR ICON: Gold Class', 'Mumbai', 'Phoenix Palladium, Lower Parel']
        );
        const [t2] = await db.query(
          'INSERT INTO theatres (name, city, location) VALUES (?, ?, ?)',
          ['INOX Megaplex: IMAX 3D', 'Mumbai', 'Inorbit Mall, Malad West']
        );
        t1Id = t1.insertId;
        t2Id = t2.insertId;
      } else {
        t1Id = theatres[0].id;
        t2Id = theatres[1].id;
      }

      // Check screens
      let [screens] = await db.query('SELECT id FROM screens LIMIT 2');
      let s1Id, s2Id;
      if (!screens || screens.length < 2) {
        const [s1] = await db.query(
          'INSERT INTO screens (theatre_id, name, total_seats) VALUES (?, ?, ?)',
          [t1Id, 'Audi 1 (Dolby Atmos)', 60]
        );
        const [s2] = await db.query(
          'INSERT INTO screens (theatre_id, name, total_seats) VALUES (?, ?, ?)',
          [t2Id, 'IMAX Laser Screen', 60]
        );
        s1Id = s1.insertId;
        s2Id = s2.insertId;
      } else {
        s1Id = screens[0].id;
        s2Id = screens[1].id;
      }

      // Ensure 120 seats are created across screens
      const [seats] = await db.query('SELECT COUNT(*) AS cnt FROM seats');
      if (!seats || seats[0].cnt < 120) {
        await db.query('DELETE FROM seats');
        const rows = [
          { row: 'A', type: 'SILVER' },
          { row: 'B', type: 'SILVER' },
          { row: 'C', type: 'GOLD' },
          { row: 'D', type: 'GOLD' },
          { row: 'E', type: 'PLATINUM' },
          { row: 'F', type: 'PLATINUM' }
        ];

        for (const screenId of [s1Id, s2Id]) {
          for (const { row, type } of rows) {
            for (let num = 1; num <= 10; num++) {
              await db.query(
                'INSERT INTO seats (screen_id, seat_row, seat_number, seat_type) VALUES (?, ?, ?, ?)',
                [screenId, row, num, type]
              );
            }
          }
        }
      }

      // Check and seed all 11 movies if missing
      await db.query('DELETE FROM movies');
      const movieIds = [];
      for (const m of ALL_MOVIES) {
        const [res] = await db.query(
          'INSERT INTO movies (title, description, poster_url, banner_url, genre, duration, language, rating, release_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          m
        );
        movieIds.push(res.insertId);
      }

      // Generate dynamic shows for 6 consecutive days starting TODAY
      const timeSlots = [
        { hours: 10, minutes: 30, screenId: s1Id, price: 220.00 },
        { hours: 13, minutes: 45, screenId: s2Id, price: 320.00 },
        { hours: 17, minutes: 15, screenId: s1Id, price: 260.00 },
        { hours: 20, minutes: 30, screenId: s2Id, price: 350.00 }
      ];

      let firstShowId = null;
      let count = 0;

      for (let dayOffset = 0; dayOffset < 6; dayOffset++) {
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + dayOffset);

        for (let mIdx = 0; mIdx < movieIds.length; mIdx++) {
          const movieId = movieIds[mIdx];
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

            count++;
            if (!firstShowId) {
              firstShowId = showResult.insertId;
            }
          }
        }
      }

      // Pre-book sample seats ONLY on Show #1
      const [cSeats] = await db.query(
        'SELECT id FROM seats WHERE screen_id = ? AND seat_row = ? AND seat_number IN (4, 5)',
        [s1Id, 'C']
      );

      if (firstShowId && cSeats && cSeats.length > 0) {
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
      }

      lastSyncDate = todayStr;
      console.log(`✅ [AutoSync] Successfully synced ${movieIds.length} movies and ${count} shows for the current week starting today!`);
    } else {
      lastSyncDate = todayStr;
    }
  } catch (error) {
    console.error('⚠️ [AutoSync] Note:', error.message);
  } finally {
    isSyncing = false;
  }
}

module.exports = {
  autoSyncShowsIfNeeded
};
