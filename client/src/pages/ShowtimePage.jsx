import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { showsAPI, moviesAPI } from '../services/api';
import { ArrowLeft, Clock, MapPin, Calendar, Film } from 'lucide-react';

export default function ShowtimePage() {
  const { movieId } = useParams();
  const navigate = useNavigate();
  const [movie, setMovie] = useState(null);
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDateIndex, setSelectedDateIndex] = useState(0);

  // Generate 4 consecutive days starting from today
  const dates = Array.from({ length: 4 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      dayName: i === 0 ? 'TODAY' : d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
      dayNumber: d.getDate(),
      month: d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
      fullDate: d.toISOString().split('T')[0]
    };
  });

  useEffect(() => {
    const fetchShowData = async () => {
      setLoading(true);
      try {
        const [movieRes, showsRes] = await Promise.all([
          moviesAPI.getById(movieId),
          showsAPI.getByMovieId(movieId)
        ]);
        setMovie(movieRes.data.movie);
        setShows(showsRes.data.shows || []);
      } catch (err) {
        console.error('Failed to load shows:', err);
        setError('Failed to load shows for this movie.');
      } finally {
        setLoading(false);
      }
    };

    fetchShowData();
  }, [movieId]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Group shows by Theatre
  const showsByTheatre = shows.reduce((acc, show) => {
    const theatre = show.screen?.theatre;
    const theatreId = theatre?.id || 'unknown';
    if (!acc[theatreId]) {
      acc[theatreId] = {
        theatre,
        shows: []
      };
    }
    acc[theatreId].shows.push(show);
    return acc;
  }, {});

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen py-10 max-w-5xl mx-auto px-4 sm:px-6">
      {/* Top Breadcrumb & Movie Header */}
      <div className="mb-6">
        <Link
          to={`/movies/${movieId}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white mb-4 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Movie Details
        </Link>

        {movie && (
          <div className="flex items-center gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
            <img
              src={movie.posterUrl}
              alt={movie.title}
              className="w-14 h-20 object-cover rounded-xl border border-slate-700/60"
            />
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white">{movie.title}</h1>
              <p className="text-xs text-slate-400 mt-1">
                {movie.genre} • {movie.language} • {movie.duration} mins
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Date Selector Tabs */}
      <div className="flex items-center gap-3 overflow-x-auto pb-4 mb-8">
        {dates.map((dateObj, idx) => {
          const isSelected = selectedDateIndex === idx;
          return (
            <button
              key={dateObj.fullDate}
              onClick={() => setSelectedDateIndex(idx)}
              className={`flex flex-col items-center justify-center px-5 py-3 rounded-2xl min-w-[80px] border transition-all ${
                isSelected
                  ? 'bg-rose-600 border-rose-500 text-white shadow-lg shadow-rose-600/30'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <span className="text-[10px] font-bold tracking-wider uppercase opacity-80">{dateObj.dayName}</span>
              <span className="text-lg font-black my-0.5">{dateObj.dayNumber}</span>
              <span className="text-[10px] font-bold uppercase">{dateObj.month}</span>
            </button>
          );
        })}
      </div>

      {/* Theatres & Showtime Listings */}
      <div className="space-y-6">
        {Object.keys(showsByTheatre).length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
            <Film className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <p className="font-semibold text-slate-300">No shows currently scheduled</p>
            <p className="text-xs text-slate-500 mt-1">Please check back later or select another movie.</p>
          </div>
        ) : (
          Object.values(showsByTheatre).map(({ theatre, shows }) => (
            <div
              key={theatre.id}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              {/* Theatre details */}
              <div className="md:w-1/3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                  {theatre.name}
                </h3>
                <p className="text-xs text-slate-400 mt-1 ml-6">{theatre.location}, {theatre.city}</p>
                <div className="flex items-center gap-2 mt-3 ml-6">
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                    M-Ticket Available
                  </span>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                    F&B
                  </span>
                </div>
              </div>

              {/* Show timings */}
              <div className="flex-1 flex flex-wrap gap-3">
                {shows.map((show) => (
                  <button
                    key={show.id}
                    onClick={() => navigate(`/booking/${show.id}`)}
                    className="group border border-slate-700/80 hover:border-rose-500 bg-slate-950/80 hover:bg-rose-950/30 px-4 py-2.5 rounded-xl transition-all text-left"
                  >
                    <div className="text-sm font-bold text-emerald-400 group-hover:text-rose-400 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {formatTime(show.startTime)}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">
                      {show.screen.name}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      Starting ₹{Math.round(show.price)}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
