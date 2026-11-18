import React, { useEffect, useState } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { bookingsAPI } from '../services/api';
import TicketCard from '../components/TicketCard';
import { CheckCircle2, Home, Ticket, ArrowRight } from 'lucide-react';

export default function TicketConfirmationPage() {
  const { bookingId } = useParams();
  const location = useLocation();

  const [booking, setBooking] = useState(location.state?.booking || null);
  const [loading, setLoading] = useState(!booking);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!booking && bookingId) {
      const fetchBooking = async () => {
        setLoading(true);
        try {
          const res = await bookingsAPI.getById(bookingId);
          setBooking(res.data.booking);
        } catch (err) {
          console.error('Failed to load booking:', err);
          setError('Failed to fetch ticket details.');
        } finally {
          setLoading(false);
        }
      };

      fetchBooking();
    }
  }, [booking, bookingId]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-slate-900 border border-slate-800 rounded-3xl text-center">
        <p className="text-rose-400 font-semibold mb-4">{error || 'Booking not found'}</p>
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-white">
          <Home className="w-4 h-4" /> Return to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 max-w-4xl mx-auto flex flex-col items-center">
      {/* Success Banner */}
      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-3 border border-emerald-500/30">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">Booking Confirmed!</h1>
        <p className="text-sm text-slate-400 mt-1">
          Your tickets have been reserved and sent to your email.
        </p>
      </div>

      {/* Render the Ticket Card */}
      <TicketCard booking={booking} />

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-4 mt-8 print:hidden">
        <Link
          to="/"
          className="flex items-center gap-2 text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 px-6 py-2.5 rounded-full border border-slate-700 transition"
        >
          <Home className="w-4 h-4" />
          Browse More Movies
        </Link>
        <Link
          to="/my-bookings"
          className="flex items-center gap-2 text-sm font-semibold bg-rose-600 hover:bg-rose-500 text-white px-6 py-2.5 rounded-full shadow-lg shadow-rose-600/30 transition"
        >
          <Ticket className="w-4 h-4" />
          View All Bookings
        </Link>
      </div>
    </div>
  );
}
