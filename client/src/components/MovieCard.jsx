import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Clock } from 'lucide-react';

export default function MovieCard({ movie }) {
  const rating = parseFloat(movie.rating) || 8.5;
  const duration = parseInt(movie.duration, 10) || 0;

  const formatDuration = (mins) => {
    const hours = Math.floor(mins / 60);
    const minutes = mins % 60;
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="group bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 hover:border-rose-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-rose-950/30 flex flex-col">
      {/* Poster with Overlay */}
      <div className="relative aspect-[2/3] overflow-hidden bg-slate-950">
        <img
          src={movie.posterUrl}
          alt={movie.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-full flex items-center gap-1 border border-slate-700/60">
          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          <span className="text-xs font-bold text-white">{rating.toFixed(1)}</span>
        </div>

        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-slate-300 bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800">
          <span className="font-medium text-slate-200">{movie.language}</span>
          <span className="flex items-center gap-1 text-slate-400">
            <Clock className="w-3 h-3" />
            {formatDuration(duration)}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-bold text-lg text-white group-hover:text-rose-400 transition-colors line-clamp-1">
            {movie.title}
          </h3>
          <p className="text-xs text-slate-400 mt-1 line-clamp-1">
            {movie.genre}
          </p>
        </div>

        <Link
          to={`/movies/${movie.id}`}
          className="mt-4 block w-full text-center bg-slate-800 hover:bg-rose-600 text-slate-200 hover:text-white font-medium py-2 rounded-xl text-sm transition-colors duration-200"
        >
          Book Tickets
        </Link>
      </div>
    </div>
  );
}
