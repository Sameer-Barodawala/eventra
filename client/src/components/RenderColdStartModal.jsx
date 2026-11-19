import React, { useState, useEffect } from 'react';
import { healthAPI } from '../services/api';
import { Film, Sparkles, CheckCircle2, ArrowRight, Quote, Clapperboard, Server } from 'lucide-react';

const MOVIE_QUOTES = [
  { quote: "May the Force be with you.", movie: "Star Wars", year: "1977" },
  { quote: "I'm going to make him an offer he can't refuse.", movie: "The Godfather", year: "1972" },
  { quote: "Why so serious?", movie: "The Dark Knight", year: "2008" },
  { quote: "To infinity and beyond!", movie: "Toy Story", year: "1995" },
  { quote: "There's no place like home.", movie: "The Wizard of Oz", year: "1939" },
  { quote: "Carpe diem. Seize the day, boys. Make your lives extraordinary.", movie: "Dead Poets Society", year: "1989" },
  { quote: "Here's looking at you, kid.", movie: "Casablanca", year: "1942" },
  { quote: "Life is like a box of chocolates. You never know what you're gonna get.", movie: "Forrest Gump", year: "1994" },
  { quote: "Houston, we have a problem.", movie: "Apollo 13", year: "1995" },
  { quote: "You can't handle the truth!", movie: "A Few Good Men", year: "1992" },
  { quote: "I'll be back.", movie: "The Terminator", year: "1984" },
  { quote: "Every man dies, not every man really lives.", movie: "Braveheart", year: "1995" }
];

export default function RenderColdStartModal() {
  const [isOpen, setIsOpen] = useState(() => {
    return !sessionStorage.getItem('eventra_coldstart_dismissed');
  });
  const [isServerReady, setIsServerReady] = useState(false);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [secondsWaiting, setSecondsWaiting] = useState(0);

  // Quote rotator
  useEffect(() => {
    if (!isOpen) return;
    const quoteInterval = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % MOVIE_QUOTES.length);
    }, 4500);

    return () => clearInterval(quoteInterval);
  }, [isOpen]);

  // Seconds counter
  useEffect(() => {
    if (!isOpen || isServerReady) return;
    const timer = setInterval(() => {
      setSecondsWaiting((s) => s + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, isServerReady]);

  // Health check polling
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    let pollTimeout;

    const checkServer = async () => {
      try {
        const res = await healthAPI.check();
        if (res.data?.status === 'ok') {
          if (isMounted) {
            setIsServerReady(true);
          }
          return;
        }
      } catch (err) {
        // Server still spinning up
      }

      // Retry in 3 seconds if not yet ready
      if (isMounted && !isServerReady) {
        pollTimeout = setTimeout(checkServer, 3000);
      }
    };

    checkServer();

    return () => {
      isMounted = false;
      clearTimeout(pollTimeout);
    };
  }, [isOpen, isServerReady]);

  const handleEnterCinema = () => {
    sessionStorage.setItem('eventra_coldstart_dismissed', 'true');
    setIsOpen(false);
  };

  if (!isOpen) return null;

  const currentQuote = MOVIE_QUOTES[quoteIndex];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-2xl">
      {/* Background ambient cinema glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-rose-600/15 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-rose-950/40 text-center flex flex-col items-center">
        {/* Cinema Logo */}
        <div className="flex items-center gap-2 mb-6">
          <div className="p-2.5 rounded-2xl bg-rose-600/20 text-rose-500 border border-rose-500/30">
            <Film className="w-7 h-7" />
          </div>
          <span className="font-black text-2xl tracking-wider text-white">
            EVENT<span className="text-rose-500">RA</span>
          </span>
        </div>

        {/* Famous Movie Quotes Display */}
        <div className="w-full bg-slate-950/80 border border-slate-800/80 rounded-2xl p-6 mb-6 min-h-[140px] flex flex-col justify-center items-center relative overflow-hidden transition-all duration-500">
          <Quote className="w-6 h-6 text-rose-500/30 absolute top-3 left-3" />
          <p className="text-sm sm:text-base font-serif italic text-slate-200 relative z-10 px-4 leading-relaxed">
            "{currentQuote.quote}"
          </p>
          <div className="flex items-center gap-1.5 text-xs text-rose-400 font-semibold mt-3">
            <Clapperboard className="w-3.5 h-3.5" />
            <span>{currentQuote.movie}</span>
            <span className="text-slate-500">({currentQuote.year})</span>
          </div>
        </div>

        {/* Server Status Section */}
        <div className="w-full mb-6">
          {isServerReady ? (
            <div className="bg-emerald-950/60 border border-emerald-500/40 rounded-2xl p-4 flex items-center justify-center gap-3 text-emerald-300 animate-fadeIn">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div className="text-left">
                <p className="text-xs font-bold text-white">Backend & Database Ready!</p>
                <p className="text-[11px] text-emerald-300">The projection room is open and ready to roll.</p>
              </div>
            </div>
          ) : (
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-left">
              <div className="flex items-center justify-between mb-2">
                <span className="flex items-center gap-2 text-xs font-semibold text-amber-400">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                  Spinning up free-tier server...
                </span>
                <span className="text-xs text-slate-500 font-mono">{secondsWaiting}s</span>
              </div>

              {/* Progress shimmer bar */}
              <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-amber-500 to-rose-500 rounded-full animate-pulse w-3/4"></div>
              </div>

              <p className="text-[11px] text-slate-400 mt-2.5 flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                Render free-tier instances sleep when inactive. Waking up takes ~30 to 45s.
              </p>
            </div>
          )}
        </div>

        {/* Action Button: "Dive into the World of Cinema" */}
        {isServerReady ? (
          <button
            onClick={handleEnterCinema}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-black text-sm shadow-xl shadow-rose-600/40 transition transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Dive into the World of Cinema</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>
        ) : (
          <button
            onClick={handleEnterCinema}
            className="text-xs text-slate-500 hover:text-slate-300 transition py-2 underline underline-offset-4"
          >
            Enter Website Directly (Skip Waiting)
          </button>
        )}
      </div>
    </div>
  );
}
