import React from 'react';
import { QrCode, Calendar, Clock, MapPin, Printer } from 'lucide-react';

export default function TicketCard({ booking }) {
  if (!booking) return null;

  const { show, bookingSeats, totalAmount, bookingDate, id } = booking;
  const movie = show?.movie;
  const screen = show?.screen;
  const theatre = screen?.theatre;

  const formatShowDate = (dateString) => {
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

  const formatShowTime = (dateString) => {
    if (!dateString) return 'Time TBA';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return 'Time TBA';
    return d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const seatLabels = bookingSeats?.map((bs) => `${bs.seat.seatRow}${bs.seat.seatNumber}`).join(', ');

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="w-full max-w-md mx-auto bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative text-slate-100">
      {/* Top Header */}
      <div className="bg-rose-600 px-6 py-4 flex items-center justify-between">
        <div>
          <span className="text-xs uppercase font-extrabold tracking-widest text-rose-200">
            Confirmed Booking
          </span>
          <h2 className="text-lg font-black text-white">EVENTRA CINEMAS</h2>
        </div>
        <button
          onClick={handlePrint}
          className="p-2 bg-rose-700 hover:bg-rose-800 rounded-xl text-white transition print:hidden"
          title="Print Ticket"
        >
          <Printer className="w-4 h-4" />
        </button>
      </div>

      {/* Main Ticket Body */}
      <div className="p-6 flex flex-col gap-5">
        {/* Movie Info */}
        <div className="flex gap-4">
          {movie?.posterUrl && (
            <img
              src={movie.posterUrl}
              alt={movie.title}
              className="w-20 h-28 object-cover rounded-xl shadow-md border border-slate-800"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80';
              }}
            />
          )}
          <div className="flex-1 flex flex-col justify-center">
            <h3 className="font-bold text-xl text-white leading-tight">{movie?.title}</h3>
            <p className="text-xs text-rose-400 font-medium mt-1">{movie?.genre}</p>
            <p className="text-xs text-slate-400 mt-1">{movie?.language} • {movie?.duration} mins</p>
          </div>
        </div>

        {/* Theatre & Screen */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 flex flex-col gap-2">
          <div className="flex items-start gap-2 text-sm text-slate-200 font-semibold">
            <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <div>
              <p>{theatre?.name || 'Grand Cinema'}</p>
              <p className="text-xs text-slate-400 font-normal">
                {theatre?.location ? `${theatre.location}${theatre.city ? `, ${theatre.city}` : ''}` : (theatre?.city || 'Location unavailable')}
              </p>
            </div>
          </div>
          <p className="text-xs text-rose-400 font-medium pl-6">{screen?.name || 'Screen 1'}</p>
        </div>

        {/* Show Timing & Seats */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
            <div className="flex items-center gap-1.5 text-slate-400 mb-1">
              <Calendar className="w-3.5 h-3.5 text-rose-500" />
              <span>Date</span>
            </div>
            <p className="font-semibold text-slate-200">{formatShowDate(show?.startTime)}</p>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
            <div className="flex items-center gap-1.5 text-slate-400 mb-1">
              <Clock className="w-3.5 h-3.5 text-rose-500" />
              <span>Time</span>
            </div>
            <p className="font-semibold text-slate-200">{formatShowTime(show?.startTime)}</p>
          </div>
        </div>

        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 flex justify-between items-center">
          <div>
            <p className="text-xs text-slate-400">Seats ({bookingSeats?.length || 0})</p>
            <p className="text-base font-bold text-rose-400 mt-0.5">{seatLabels || 'N/A'}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400">Total Paid</p>
            <p className="text-base font-bold text-emerald-400 mt-0.5">₹{totalAmount}</p>
          </div>
        </div>
      </div>

      {/* Perforation Cutout Effect */}
      <div className="relative flex items-center justify-between px-3">
        <div className="w-6 h-6 rounded-full bg-slate-950 -ml-6 border-r border-slate-800"></div>
        <div className="flex-1 border-b border-dashed border-slate-700/80 mx-2"></div>
        <div className="w-6 h-6 rounded-full bg-slate-950 -mr-6 border-l border-slate-800"></div>
      </div>

      {/* Bottom Stub with QR / Barcode simulation */}
      <div className="p-6 bg-slate-950/60 flex items-center justify-between">
        <div>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">Booking ID</p>
          <p className="text-xs font-mono font-bold text-slate-300">#EVT-{id}-{show?.id}</p>
          <p className="text-[10px] text-slate-500 mt-1">Booked on {formatShowDate(bookingDate)}</p>
        </div>

        <div className="bg-white p-2 rounded-xl flex items-center justify-center">
          <QrCode className="w-10 h-10 text-slate-950" />
        </div>
      </div>
    </div>
  );
}
