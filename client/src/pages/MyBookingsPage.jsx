import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { bookingsAPI } from '../services/api';
import { Ticket, Calendar, Clock, MapPin, XCircle, AlertCircle, ArrowRight, History, Sparkles } from 'lucide-react';

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' | 'past'

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await bookingsAPI.getMyBookings();
      setBookings(res.data.bookings || []);
    } catch (err) {
      console.error('Failed to load bookings:', err);
      setError('Failed to fetch your bookings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancelBooking = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    try {
      await bookingsAPI.cancel(id);
      fetchBookings();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel booking.');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Date TBA';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return 'Date TBA';
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'Time TBA';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return 'Time TBA';
    return d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Segregate into Upcoming vs Past bookings
  const now = new Date();
  const upcomingBookings = bookings.filter((b) => {
    const showTime = new Date(b.show?.startTime);
    const isCancelled = b.bookingStatus === 'CANCELLED';
    return (isNaN(showTime.getTime()) || showTime >= now) && !isCancelled;
  });

  const pastBookings = bookings.filter((b) => {
    const showTime = new Date(b.show?.startTime);
    const isCancelled = b.bookingStatus === 'CANCELLED';
    return (!isNaN(showTime.getTime()) && showTime < now) || isCancelled;
  });

  const displayedBookings = activeTab === 'upcoming' ? upcomingBookings : pastBookings;

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-10 max-w-4xl mx-auto px-4 sm:px-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5">
            <Ticket className="w-7 h-7 text-rose-500" />
            My Bookings
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            View your upcoming tickets, showtimes, and booking history
          </p>
        </div>

        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white px-5 py-2.5 rounded-full transition self-start sm:self-auto shadow-lg shadow-rose-600/30"
        >
          <Sparkles className="w-4 h-4" />
          Book More Movies
        </Link>
      </div>

      {error && (
        <div className="p-4 bg-rose-950/60 border border-rose-800 rounded-2xl text-xs text-rose-300 mb-6 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex items-center gap-3 border-b border-slate-800 pb-4 mb-6">
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-sm transition-all ${
            activeTab === 'upcoming'
              ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Ticket className="w-4 h-4" />
          <span>Upcoming Movies</span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-extrabold ${
              activeTab === 'upcoming'
                ? 'bg-rose-800 text-white'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            {upcomingBookings.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('past')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-sm transition-all ${
            activeTab === 'past'
              ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Past Bookings</span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-extrabold ${
              activeTab === 'past'
                ? 'bg-rose-800 text-white'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            {pastBookings.length}
          </span>
        </button>
      </div>

      {/* Empty State for the active tab */}
      {displayedBookings.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center">
          {activeTab === 'upcoming' ? (
            <>
              <Ticket className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-200">No upcoming movie bookings</h3>
              <p className="text-xs text-slate-400 mt-1 mb-6 max-w-sm mx-auto">
                Ready for your next cinema adventure? Grab seats for the latest releases!
              </p>
              <Link
                to="/"
                className="inline-flex items-center gap-2 text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white px-6 py-2.5 rounded-full transition shadow-lg shadow-rose-600/30"
              >
                Explore Now Showing
              </Link>
            </>
          ) : (
            <>
              <History className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-200">No past bookings found</h3>
              <p className="text-xs text-slate-400 mt-1 mb-6 max-w-sm mx-auto">
                Completed or cancelled ticket histories will be saved and archived here.
              </p>
              <Link
                to="/"
                className="inline-flex items-center gap-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 px-6 py-2.5 rounded-full border border-slate-700 transition"
              >
                Browse Movies
              </Link>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {displayedBookings.map((booking) => {
            const movie = booking.show?.movie;
            const screen = booking.show?.screen;
            const theatre = screen?.theatre;
            const seatLabels = booking.bookingSeats?.map((bs) => `${bs.seat.seatRow}${bs.seat.seatNumber}`).join(', ');
            const isCancelled = booking.bookingStatus === 'CANCELLED';

            return (
              <div
                key={booking.id}
                className={`bg-slate-900 border ${
                  isCancelled ? 'border-slate-800/50 opacity-60' : 'border-slate-800'
                } rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row gap-5 justify-between items-start sm:items-center transition hover:border-slate-700`}
              >
                <div className="flex gap-4 items-center">
                  <img
                    src={movie?.posterUrl || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400'}
                    alt={movie?.title || 'Movie'}
                    className="w-16 h-24 object-cover rounded-xl border border-slate-800 shrink-0"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-base text-white">{movie?.title || 'Movie Show'}</h3>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          isCancelled
                            ? 'bg-rose-950 text-rose-400 border border-rose-800/40'
                            : 'bg-emerald-950 text-emerald-400 border border-emerald-800/40'
                        }`}
                      >
                        {booking.bookingStatus}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 mt-1">
                      {theatre?.name || 'Grand Cinema'} • <span className="text-rose-400">{screen?.name || 'Screen'}</span>
                    </p>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 mt-2">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-rose-500" />
                        {formatDate(booking.show?.startTime)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-rose-500" />
                        {formatTime(booking.show?.startTime)}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 mt-1 font-semibold">
                      Seats: <span className="text-rose-400">{seatLabels || 'Seats Assigned'}</span> • Total: ₹{booking.totalAmount}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 w-full sm:w-auto justify-end pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                  <Link
                    to={`/booking-confirmed/${booking.id}`}
                    state={{ booking }}
                    className="text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-xl transition flex items-center gap-1.5"
                  >
                    View Ticket <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  {!isCancelled && (
                    <button
                      onClick={() => handleCancelBooking(booking.id)}
                      className="text-xs font-semibold text-rose-400 hover:text-rose-300 p-2 transition"
                      title="Cancel Booking"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
