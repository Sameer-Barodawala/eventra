const prisma = require('../config/prisma');

const getShowsByMovieId = async (req, res, next) => {
  try {
    const movieId = parseInt(req.params.movieId, 10);
    if (isNaN(movieId)) {
      return res.status(400).json({ message: 'Invalid movie ID.' });
    }

    const { date } = req.query; // optional date filter (YYYY-MM-DD)

    let dateFilter = {};
    if (date) {
      const startOfDay = new Date(`${date}T00:00:00.000Z`);
      const endOfDay = new Date(`${date}T23:59:59.999Z`);
      dateFilter = {
        startTime: {
          gte: startOfDay,
          lte: endOfDay
        }
      };
    }

    const shows = await prisma.show.findMany({
      where: {
        movieId,
        ...dateFilter
      },
      include: {
        screen: {
          include: {
            theatre: true
          }
        }
      },
      orderBy: {
        startTime: 'asc'
      }
    });

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

    const show = await prisma.show.findUnique({
      where: { id },
      include: {
        movie: true,
        screen: {
          include: {
            theatre: true,
            seats: {
              orderBy: [
                { seatRow: 'asc' },
                { seatNumber: 'asc' }
              ]
            }
          }
        },
        bookings: {
          where: {
            bookingStatus: 'CONFIRMED'
          },
          include: {
            bookingSeats: true
          }
        }
      }
    });

    if (!show) {
      return res.status(404).json({ message: 'Show not found.' });
    }

    // Extract booked seat IDs for this show
    const bookedSeatIds = [];
    show.bookings.forEach((booking) => {
      booking.bookingSeats.forEach((bs) => {
        bookedSeatIds.push(bs.seatId);
      });
    });

    // Remove raw bookings array to keep payload neat and protect other users' booking data
    const { bookings, ...showData } = show;

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

    const show = await prisma.show.create({
      data: {
        movieId: parseInt(movieId, 10),
        screenId: parseInt(screenId, 10),
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        price: parseFloat(price)
      },
      include: {
        movie: true,
        screen: {
          include: {
            theatre: true
          }
        }
      }
    });

    return res.status(201).json({ message: 'Show created successfully.', show });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getShowsByMovieId,
  getShowById,
  createShow
};
