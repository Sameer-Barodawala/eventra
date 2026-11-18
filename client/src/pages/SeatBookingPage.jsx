import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { showsAPI } from '../services/api';
import SeatGrid from '../components/SeatGrid';
import { ArrowLeft, Film, Clock, Calendar, AlertCircle } from 'lucide-react';

export default function SeatBookingPage() {
  const { showId } = useParams();
  const navigate = useNavigate();

  const [show, setShow] = useState(null);
  const [bookedSeatIds, setBookedSeatIds] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchShowData = async () => {
      setLoading(true);
      try {
        const res = await showsAPI.getById(showId);
        setShow(res.data.show);
        setBookedSeatIds(res.data.bookedSeatIds || []);
      } catch (err) {
        console.error('Failed to load show details:', err);
        setError('Show not found or failed to load seating layout.');
      } finally {
        setLoading(false);
      }
    };

    fetchShowData();
  }, [showId]);

  const handleToggleSeat = (seat) => {
    setSelectedSeats((prev) => {
      const exists = prev.some((s) => s.id === seat.id);
      if (exists) {
        return prev.filter((s) => s.id !== seat.id);
      } else {
        if (prev.length >= 6) {
          alert('You can select a maximum of 6 seats per booking.');
          return prev;
        }
        return [...prev, seat];
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !show) {
    return (
      <div className="max-w-xl mx-auto my-20 p-8 bg-slate-900 border border-slate-800 rounded-3xl text-center">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
        <p className="text-rose-400 font-semibold mb-4">{error || 'Show not found'}</p>
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-white">
          <ArrowLeft className="w-4 h-4" /> Return to Home
        </Link>
      </div>
    );
  }

  const { movie, screen, price } = show;
  const theatre = screen?.theatre;

  const getSeatPrice = (type) => {
    if (type === 'GOLD') return Math.round(price * 1.3);
    if (type === 'PLATINUM') return Math.round(price * 1.6);
    return Math.round(price);
  };

  const totalPrice = selectedSeats.reduce((sum, s) => sum + getSeatPrice(s.seatType), 0);

  const formatShowTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatShowDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleProceedToCheckout = () => {
    if (selectedSeats.length === 0) return;
    navigate('/checkout', {
      state: {
        showId: show.id,
        show,
        selectedSeats,
        totalPrice
      }
    });
  };

  return (
    <div className="min-h-screen pb-32 pt-6">
      {/* Top Header */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 mb-8">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white mb-4 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Change Showtime
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Film className="w-5 h-5 text-rose-500" />
              {movie?.title}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              {theatre?.name} • <span className="text-rose-400">{screen?.name}</span>
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium bg-slate-950 px-4 py-2 rounded-xl border border-slate-800 self-start sm:self-auto">
            <span className="flex items-center gap-1.5 text-slate-300">
              <Calendar className="w-3.5 h-3.5 text-rose-500" />
              {formatShowDate(show.startTime)}
            </span>
            <span className="text-slate-700">|</span>
            <span className="flex items-center gap-1.5 text-emerald-400">
              <Clock className="w-3.5 h-3.5" />
              {formatTime(show.startTime)}
            </span>
          </div>
        </div>
      </div>

      {/* Visual Seating Grid */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 sm:p-10 backdrop-blur-md">
          <SeatGrid
            seats={screen?.seats || []}
            bookedSeatIds={bookedSeatIds}
            selectedSeats={selectedSeats}
            onToggleSeat={handleToggleSeat}
            basePrice={price}
          />
        </div>
      </div>

      {/* Sticky Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 py-4 px-4 sm:px-8 z-40">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div>
            <p className="text-xs text-slate-400">
              Selected Seats: {selectedSeats.length > 0 ? (
                <span className="text-white font-bold ml-1">
                  {selectedSeats.map((s) => `${s.seatRow}${s.seatNumber}`).join(', ')}
                </span>
              ) : (
                <span className="italic">None</span>
              )}
            </p>
            <p className="text-lg font-black text-rose-500 mt-0.5">
              ₹{totalPrice}
              <span className="text-xs text-slate-400 font-normal ml-1">
                ({selectedSeats.length} {selectedSeats.length === 1 ? 'seat' : 'seats'})
              </span>
            </p>
          </div>

          <button
            onClick={handleProceedToCheckout}
            disabled={selectedSeats.length === 0}
            className={`px-8 py-3 rounded-2xl font-bold text-sm transition-all duration-200 shadow-lg ${
              selectedSeats.length > 0
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30 cursor-pointer transform hover:-translate-y-0.5'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/40'
            }`}
          >
            Proceed to Checkout
          </button>
        </div>
      </div>
    </div>
  );
}
