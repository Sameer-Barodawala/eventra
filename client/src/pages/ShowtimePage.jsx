import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { showsAPI, moviesAPI } from '../services/api';
import { ArrowLeft, Clock, MapPin, Calendar, Film, Sparkles } from 'lucide-react';

export default function ShowtimePage() {
  const { movieId } = useParams();
  const navigate = useNavigate();
  const [movie, setMovie] = useState(null);
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDateIndex, setSelectedDateIndex] = useState(0);

  // Helper to safely extract YYYY-MM-DD from any date value or MySQL timestamp
  const getLocalDateString = (dateVal) => {
    if (!dateVal) return '';
    if (typeof dateVal === 'string') {
      if (dateVal.includes('T')) {
        const d = new Date(dateVal);
        if (!isNaN(d.getTime())) {
          const pad = (n) => String(n).padStart(2, '0');
          return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
        }
      }
      const match = dateVal.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (match) return `${match[1]}-${match[2]}-${match[3]}`;
    }
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return '';
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };

  // Generate 5 consecutive days starting from today (using local calendar date)
  const dates = Array.from({ length: 5 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const pad = (n) => String(n).padStart(2, '0');
    return {
      dayName: i === 0 ? 'TODAY' : d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
      dayNumber: d.getDate(),
      month: d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
      fullDate: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
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
        const loadedShows = showsRes.data.shows || [];
        setMovie(movieRes.data.movie);
        setShows(loadedShows);

        // Automatically select the first date that has shows if today has 0 shows
        if (loadedShows.length > 0) {
          const firstAvailableIdx = dates.findIndex((d) =>
            loadedShows.some((s) => getLocalDateString(s.startTime) === d.fullDate)
          );
          if (firstAvailableIdx !== -1) {
            setSelectedDateIndex(firstAvailableIdx);
          } else {
            // If shows are outside the 5-day window, default to All Dates
            setSelectedDateIndex(-1);
          }
        }
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

  const selectedDateStr = selectedDateIndex >= 0 ? dates[selectedDateIndex]?.fullDate : null;

  // Filter shows to ONLY those matching the active date tab, or all shows if -1
  const showsForSelectedDate = selectedDateStr
    ? shows.filter((show) => getLocalDateString(show.startTime) === selectedDateStr)
    : shows;

  // Group filtered shows by Theatre
  const showsByTheatre = showsForSelectedDate.reduce((acc, show) => {
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

  const formatShowDateLabel = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
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
                {movie.genre} • {movie.language} • {movie.duration} mins • ⭐ {parseFloat(movie.rating).toFixed(1)}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Date Selector Tabs */}
      <div className="flex items-center gap-3 overflow-x-auto pb-4 mb-8">
        {/* All Dates Tab */}
        <button
          onClick={() => setSelectedDateIndex(-1)}
          className={`flex flex-col items-center justify-center px-5 py-3 rounded-2xl min-w-[85px] border transition-all ${
            selectedDateIndex === -1
              ? 'bg-rose-600 border-rose-500 text-white shadow-lg shadow-rose-600/30'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
          }`}
        >
          <span className="text-[10px] font-bold tracking-wider uppercase opacity-80">VIEW</span>
          <span className="text-base font-black my-0.5">ALL</span>
          <span className="text-[10px] font-bold uppercase">{shows.length} Shows</span>
        </button>

        {/* 5 Rolling Date Tabs */}
        {dates.map((dateObj, idx) => {
          const isSelected = selectedDateIndex === idx;
          const showCountForDate = shows.filter(
            (s) => getLocalDateString(s.startTime) === dateObj.fullDate
          ).length;

          return (
            <button
              key={dateObj.fullDate}
              onClick={() => setSelectedDateIndex(idx)}
              className={`flex flex-col items-center justify-center px-5 py-3 rounded-2xl min-w-[85px] border transition-all relative ${
                isSelected
                  ? 'bg-rose-600 border-rose-500 text-white shadow-lg shadow-rose-600/30'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <span className="text-[10px] font-bold tracking-wider uppercase opacity-80">{dateObj.dayName}</span>
              <span className="text-lg font-black my-0.5">{dateObj.dayNumber}</span>
              <span className="text-[10px] font-bold uppercase">{dateObj.month}</span>

              {/* Show availability indicator dot */}
              {showCountForDate > 0 && !isSelected && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 absolute bottom-1.5"></span>
              )}
            </button>
          );
        })}
      </div>

      {/* Theatres & Showtime Listings */}
      <div className="space-y-6">
        {Object.keys(showsByTheatre).length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-400">
            <Film className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-200">
              No shows scheduled for {selectedDateIndex >= 0 ? (dates[selectedDateIndex]?.dayName === 'TODAY' ? 'today' : dates[selectedDateIndex]?.dayName) : 'the selected filter'}
            </h3>
            <p className="text-xs text-slate-400 mt-1 mb-6">
              Shows are scheduled on other dates. Click "View All" or choose another date tab.
            </p>
            <button
              onClick={() => setSelectedDateIndex(-1)}
              className="inline-flex items-center gap-2 text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white px-6 py-2.5 rounded-full transition shadow-lg shadow-rose-600/30"
            >
              <Sparkles className="w-3.5 h-3.5" />
              View All Available Shows ({shows.length})
            </button>
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
                    {/* Show date label when viewing All Dates */}
                    {selectedDateIndex === -1 && (
                      <div className="text-[10px] text-rose-400 font-semibold mt-0.5">
                        {formatShowDateLabel(show.startTime)}
                      </div>
                    )}
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
