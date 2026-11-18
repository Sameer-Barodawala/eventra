const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clean existing data in reverse order of foreign keys
  await prisma.bookingSeat.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.show.deleteMany();
  await prisma.seat.deleteMany();
  await prisma.screen.deleteMany();
  await prisma.theatre.deleteMany();
  await prisma.movie.deleteMany();
  await prisma.user.deleteMany();

  console.log('Cleaned old records.');

  // 1. Seed Users
  const salt = await bcrypt.genSalt(10);
  const userPassword = await bcrypt.hash('password123', salt);
  const adminPassword = await bcrypt.hash('admin123', salt);

  const demoUser = await prisma.user.create({
    data: {
      name: 'John Doe',
      email: 'john@example.com',
      password: userPassword,
      role: 'USER'
    }
  });

  const adminUser = await prisma.user.create({
    data: {
      name: 'Admin Manager',
      email: 'admin@eventra.com',
      password: adminPassword,
      role: 'ADMIN'
    }
  });

  console.log('✅ Users seeded: john@example.com / admin@eventra.com');

  // 2. Seed Movies
  const movies = await Promise.all([
    prisma.movie.create({
      data: {
        title: 'Dune: Part Two',
        description: 'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family. Facing a choice between the love of his life and the fate of the universe, he endeavors to prevent a terrible future only he can foresee.',
        posterUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80',
        bannerUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1600&q=80',
        genre: 'Sci-Fi, Adventure',
        duration: 166,
        language: 'English',
        rating: 8.9,
        releaseDate: new Date('2024-03-01')
      }
    }),
    prisma.movie.create({
      data: {
        title: 'Oppenheimer',
        description: 'The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb during World War II.',
        posterUrl: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&w=800&q=80',
        bannerUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1600&q=80',
        genre: 'Biography, Drama, History',
        duration: 180,
        language: 'English',
        rating: 8.9,
        releaseDate: new Date('2023-07-21')
      }
    }),
    prisma.movie.create({
      data: {
        title: 'Interstellar',
        description: 'When Earth becomes uninhabitable in the future, a farmer and ex-NASA pilot, Joseph Cooper, is tasked to pilot a spacecraft, along with a team of researchers, to find a new planet for humans.',
        posterUrl: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=800&q=80',
        bannerUrl: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=1600&q=80',
        genre: 'Sci-Fi, Adventure, Drama',
        duration: 169,
        language: 'English',
        rating: 8.7,
        releaseDate: new Date('2014-11-07')
      }
    }),
    prisma.movie.create({
      data: {
        title: 'Inception',
        description: 'A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O., but his tragic past may doom the project and his team to disaster.',
        posterUrl: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?auto=format&fit=crop&w=800&q=80',
        bannerUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1600&q=80',
        genre: 'Action, Sci-Fi, Thriller',
        duration: 148,
        language: 'English',
        rating: 8.8,
        releaseDate: new Date('2010-07-16')
      }
    })
  ]);

  console.log(`✅ ${movies.length} movies seeded.`);

  // 3. Seed Theatres
  const pvr = await prisma.theatre.create({
    data: {
      name: 'PVR ICON: Gold Class',
      city: 'Mumbai',
      location: 'Phoenix Palladium, Lower Parel'
    }
  });

  const inox = await prisma.theatre.create({
    data: {
      name: 'INOX Megaplex: IMAX 3D',
      city: 'Mumbai',
      location: 'Inorbit Mall, Malad West'
    }
  });

  console.log('✅ Theatres seeded.');

  // 4. Seed Screens & Seats
  // Screen 1 in PVR
  const screen1 = await prisma.screen.create({
    data: {
      theatreId: pvr.id,
      name: 'Audi 1 (Dolby Atmos)',
      totalSeats: 60
    }
  });

  // Screen 2 in INOX
  const screen2 = await prisma.screen.create({
    data: {
      theatreId: inox.id,
      name: 'IMAX Laser Screen',
      totalSeats: 60
    }
  });

  // Helper to generate 6 rows (A to F), 10 seats per row
  // A & B: SILVER, C & D: GOLD, E & F: PLATINUM
  const generateSeats = (screenId) => {
    const rows = [
      { row: 'A', type: 'SILVER' },
      { row: 'B', type: 'SILVER' },
      { row: 'C', type: 'GOLD' },
      { row: 'D', type: 'GOLD' },
      { row: 'E', type: 'PLATINUM' },
      { row: 'F', type: 'PLATINUM' }
    ];

    const seatRecords = [];
    rows.forEach(({ row, type }) => {
      for (let num = 1; num <= 10; num++) {
        seatRecords.push({
          screenId,
          seatRow: row,
          seatNumber: num,
          seatType: type
        });
      }
    });
    return seatRecords;
  };

  await prisma.seat.createMany({
    data: [...generateSeats(screen1.id), ...generateSeats(screen2.id)]
  });

  console.log('✅ Screens and Seats seeded (120 total seats).');

  // 5. Seed Shows
  const today = new Date();
  const makeDate = (hours, minutes) => {
    const d = new Date(today);
    d.setHours(hours, minutes, 0, 0);
    return d;
  };

  const show1 = await prisma.show.create({
    data: {
      movieId: movies[0].id, // Dune 2
      screenId: screen1.id,
      startTime: makeDate(13, 30),
      endTime: makeDate(16, 15),
      price: 250.00
    }
  });

  const show2 = await prisma.show.create({
    data: {
      movieId: movies[0].id, // Dune 2
      screenId: screen2.id,
      startTime: makeDate(18, 0),
      endTime: makeDate(20, 45),
      price: 320.00
    }
  });

  const show3 = await prisma.show.create({
    data: {
      movieId: movies[1].id, // Oppenheimer
      screenId: screen1.id,
      startTime: makeDate(17, 0),
      endTime: makeDate(20, 0),
      price: 280.00
    }
  });

  const show4 = await prisma.show.create({
    data: {
      movieId: movies[2].id, // Interstellar
      screenId: screen2.id,
      startTime: makeDate(21, 15),
      endTime: makeDate(23, 59),
      price: 300.00
    }
  });

  console.log('✅ Shows seeded.');

  // 6. Pre-book a couple of seats for Show 1 to display booked state
  const screen1Seats = await prisma.seat.findMany({
    where: { screenId: screen1.id }
  });

  // Pick seats C4 and C5 to be pre-booked
  const bookedSeats = screen1Seats.filter(
    (s) => s.seatRow === 'C' && (s.seatNumber === 4 || s.seatNumber === 5)
  );

  const sampleBooking = await prisma.booking.create({
    data: {
      userId: demoUser.id,
      showId: show1.id,
      totalAmount: 650.00,
      bookingStatus: 'CONFIRMED'
    }
  });

  await prisma.bookingSeat.createMany({
    data: bookedSeats.map((s) => ({
      bookingId: sampleBooking.id,
      seatId: s.id
    }))
  });

  console.log('✅ Sample pre-booked seats created for demonstration.');
  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
