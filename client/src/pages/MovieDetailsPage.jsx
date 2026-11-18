import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { moviesAPI } from '../services/api';
import { Star, Clock, Calendar, Globe, Ticket, ArrowLeft } from 'lucide-react';

export default function MovieDetailsPage() {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMovie = async () => {
      setLoading(true);
      try {
        const res = await moviesAPI.getById(id);
        setMovie(res.data.movie);
      } catch (err) {
        console.error('Failed to load movie details:', err);
        setError('Movie not found or failed to load.');
      } finally {
        setLoading(false);
      }
    };

    fetchMovie();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="max-w-xl mx-auto my-20 p-8 bg-slate-900 border border-slate-800 rounded-3xl text-center">
        <p className="text-rose-400 font-semibold mb-4">{error || 'Movie not found'}</p>
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-white">
          <ArrowLeft className="w-4 h-4" /> Return to Home
        </Link>
      </div>
    );
  }

  const formatDuration = (mins) => {
    const hours = Math.floor(parseInt(mins, 10) / 60);
    const minutes = parseInt(mins, 10) % 60;
    return `${hours}h ${minutes}m`;
  };

  const rating = parseFloat(movie.rating) || 8.5;

  const formattedRelease = new Date(movie.releaseDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="min-h-screen pb-16">
      {/* Backdrop Banner */}
      <div className="relative h-[360px] sm:h-[460px] w-full overflow-hidden">
        <img
          src={movie.bannerUrl || movie.posterUrl}
          alt={movie.title}
          className="w-full h-full object-cover object-center filter brightness-[0.35]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent"></div>
        <div className="absolute top-6 left-4 sm:left-8">
          <Link
            to="/"
            className="flex items-center gap-2 text-xs font-semibold bg-slate-900/80 backdrop-blur-md text-slate-200 hover:text-white px-3 py-1.5 rounded-full border border-slate-700/60 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Movies
          </Link>
        </div>
      </div>

      {/* Main Details Card overlapping banner */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-36 relative z-10">
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl flex flex-col md:flex-row gap-8">
          {/* Movie Poster */}
          <div className="w-48 sm:w-64 shrink-0 mx-auto md:mx-0">
            <img
              src={movie.posterUrl}
              alt={movie.title}
              className="w-full aspect-[2/3] object-cover rounded-2xl shadow-xl border border-slate-700/60"
            />
          </div>

          {/* Info & Booking CTA */}
          <div className="flex-1 flex flex-col justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="bg-rose-600/30 text-rose-400 border border-rose-500/40 text-xs font-bold px-3 py-1 rounded-full">
                  {movie.genre}
                </span>
                <div className="flex items-center gap-1.5 bg-slate-800 text-amber-400 text-xs font-bold px-3 py-1 rounded-full border border-slate-700">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <span>{rating.toFixed(1)} / 10</span>
                </div>
              </div>

              <h1 className="text-3xl sm:text-4xl font-black text-white mt-4 tracking-tight">
                {movie.title}
              </h1>

              {/* Meta tags */}
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 mt-4 pb-6 border-b border-slate-800">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-rose-500" />
                  {formatDuration(movie.duration)}
                </span>
                <span className="flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-rose-500" />
                  {movie.language}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-rose-500" />
                  Released {formattedRelease}
                </span>
              </div>

              {/* About the movie */}
              <div className="mt-6">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                  About the Movie
                </h3>
                <p className="text-slate-300 text-sm sm:text-base leading-relaxed mt-2">
                  {movie.description}
                </p>
              </div>
            </div>

            {/* Book Tickets Action */}
            <div className="mt-8 pt-6 border-t border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">In Cinemas Now</p>
                <p className="text-sm font-semibold text-white">Select theatre & screen</p>
              </div>
              <Link
                to={`/shows/movie/${movie.id}`}
                className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white font-bold px-8 py-3 rounded-2xl shadow-xl shadow-rose-600/30 transition transform hover:-translate-y-0.5"
              >
                <Ticket className="w-5 h-5" />
                Book Tickets
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
