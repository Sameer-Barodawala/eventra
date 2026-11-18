const prisma = require('../config/prisma');

const createBooking = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { showId, seatIds } = req.body;

    if (!showId || !Array.isArray(seatIds) || seatIds.length === 0) {
      return res.status(400).json({
        message: 'Invalid booking data. showId and a non-empty seatIds array are required.'
      });
    }

    // 1. Verify show exists
    const show = await prisma.show.findUnique({
      where: { id: parseInt(showId, 10) },
      include: {
        movie: true,
        screen: {
          include: {
            theatre: true
          }
        }
      }
    });

    if (!show) {
      return res.status(404).json({ message: 'Show not found.' });
    }

    // 2. Fetch all requested seats
    const seats = await prisma.seat.findMany({
      where: {
        id: { in: seatIds.map((id) => parseInt(id, 10)) },
        screenId: show.screenId
      }
    });

    if (seats.length !== seatIds.length) {
      return res.status(400).json({ message: 'One or more selected seats are invalid for this screen.' });
    }

    // 3. Check if any seat is already booked for this show
    const existingBookings = await prisma.bookingSeat.findMany({
      where: {
        seatId: { in: seats.map((s) => s.id) },
        booking: {
          showId: show.id,
          bookingStatus: 'CONFIRMED'
        }
      },
      include: {
        seat: true
      }
    });

    if (existingBookings.length > 0) {
      const bookedSeatLabels = existingBookings.map(
        (b) => `${b.seat.seatRow}${b.seat.seatNumber}`
      );
      return res.status(409).json({
        message: `Seats already booked: ${bookedSeatLabels.join(', ')}. Please select different seats.`
      });
    }

    // 4. Calculate total amount based on seat tier
    // Base price = show.price (SILVER: 1x, GOLD: 1.3x, PLATINUM: 1.6x)
    let totalAmount = 0;
    seats.forEach((seat) => {
      let multiplier = 1.0;
      if (seat.seatType === 'GOLD') multiplier = 1.3;
      if (seat.seatType === 'PLATINUM') multiplier = 1.6;
      totalAmount += Math.round(show.price * multiplier);
    });

    // 5. Execute transaction: Create Booking + BookingSeat records
    const newBooking = await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.create({
        data: {
          userId,
          showId: show.id,
          totalAmount,
          bookingStatus: 'CONFIRMED'
        }
      });

      const bookingSeatsData = seats.map((seat) => ({
        bookingId: booking.id,
        seatId: seat.id
      }));

      await tx.bookingSeat.createMany({
        data: bookingSeatsData
      });

      return booking;
    });

    // 6. Fetch complete booking details to return
    const confirmedBooking = await prisma.booking.findUnique({
      where: { id: newBooking.id },
      include: {
        show: {
          include: {
            movie: true,
            screen: {
              include: {
                theatre: true
              }
            }
          }
        },
        bookingSeats: {
          include: {
            seat: true
          }
        }
      }
    });

    return res.status(201).json({
      message: 'Booking confirmed successfully!',
      booking: confirmedBooking
    });
  } catch (error) {
    next(error);
  }
};

const getMyBookings = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const bookings = await prisma.booking.findMany({
      where: { userId },
      include: {
        show: {
          include: {
            movie: true,
            screen: {
              include: {
                theatre: true
              }
            }
          }
        },
        bookingSeats: {
          include: {
            seat: true
          }
        }
      },
      orderBy: { bookingDate: 'desc' }
    });

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

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        show: {
          include: {
            movie: true,
            screen: {
              include: {
                theatre: true
              }
            }
          }
        },
        bookingSeats: {
          include: {
            seat: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    // Ensure only the owner or an admin can view this booking
    if (booking.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Access denied.' });
    }

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

    const booking = await prisma.booking.findUnique({
      where: { id }
    });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    if (booking.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Access denied.' });
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: { bookingStatus: 'CANCELLED' }
    });

    return res.status(200).json({
      message: 'Booking cancelled successfully.',
      booking: updated
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
