import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { moviesAPI } from '../services/api';
import MovieCard from '../components/MovieCard';
import { Flame, Film, Sparkles, Filter } from 'lucide-react';

const GENRES = ['All', 'Sci-Fi', 'Action', 'Drama', 'Adventure'];

export default function HomePage() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();

  const currentGenre = searchParams.get('genre') || 'All';
  const searchQuery = searchParams.get('search') || '';

  useEffect(() => {
    const fetchMovies = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = {};
        if (currentGenre !== 'All') params.genre = currentGenre;
        if (searchQuery) params.search = searchQuery;

        const res = await moviesAPI.getAll(params);
        setMovies(res.data.movies || []);
      } catch (err) {
        console.error('Failed to fetch movies:', err);
        setError('Failed to load movies. Please check if the server is running.');
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, [currentGenre, searchQuery]);

  const handleGenreClick = (genre) => {
    const newParams = new URLSearchParams(searchParams);
    if (genre === 'All') {
      newParams.delete('genre');
    } else {
      newParams.set('genre', genre);
    }
    setSearchParams(newParams);
  };

  const featuredMovie = movies[0];

  return (
    <div className="min-h-screen pb-16">
      {/* Featured Hero Banner */}
      {featuredMovie && !searchQuery && currentGenre === 'All' && (
        <section className="relative h-[480px] w-full overflow-hidden mb-12">
          <div className="absolute inset-0">
            <img
              src={featuredMovie.bannerUrl || featuredMovie.posterUrl}
              alt={featuredMovie.title}
              className="w-full h-full object-cover object-center filter brightness-[0.4]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent"></div>
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col justify-end pb-12">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-600/30 text-rose-400 border border-rose-500/40 mb-3">
                <Sparkles className="w-3.5 h-3.5" /> Featured Premiere
              </span>
              <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                {featuredMovie.title}
              </h1>
              <p className="text-slate-300 text-sm mt-3 line-clamp-2">
                {featuredMovie.description}
              </p>
              <div className="flex items-center gap-4 mt-6">
                <Link
                  to={`/movies/${featuredMovie.id}`}
                  className="bg-rose-600 hover:bg-rose-500 text-white font-semibold px-6 py-2.5 rounded-full shadow-lg shadow-rose-600/30 transition transform hover:-translate-y-0.5"
                >
                  Book Tickets
                </Link>
                <span className="text-xs text-slate-400">
                  {featuredMovie.language} • {featuredMovie.duration} mins • ⭐ {featuredMovie.rating}
                </span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Main Catalog Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header & Genre Filter Chips */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Flame className="w-6 h-6 text-rose-500" />
              Now Showing
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              {searchQuery ? `Search results for "${searchQuery}"` : 'Book tickets for the latest blockbuster releases'}
            </p>
          </div>

          {/* Genre Filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
            {GENRES.map((genre) => (
              <button
                key={genre}
                onClick={() => handleGenreClick(genre)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  currentGenre === genre
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                    : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                }`}
              >
                {genre}
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse bg-slate-900 rounded-2xl aspect-[2/3] border border-slate-800"></div>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="p-6 bg-rose-950/40 border border-rose-800/60 rounded-2xl text-center text-rose-300">
            <p className="font-semibold">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && movies.length === 0 && (
          <div className="py-16 text-center">
            <Film className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-300">No movies found</h3>
            <p className="text-sm text-slate-500 mt-1">Try searching for a different title or genre.</p>
          </div>
        )}

        {/* Movie Grid */}
        {!loading && !error && movies.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-6">
            {movies.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
