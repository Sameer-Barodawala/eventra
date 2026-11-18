import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import MovieCard from '../components/MovieCard';
import { describe, it, expect } from 'vitest';

const mockMovie = {
  id: 42,
  title: 'Dune: Part Two',
  genre: 'Sci-Fi, Adventure',
  duration: 166,
  language: 'English',
  rating: 8.9,
  posterUrl: 'https://images.unsplash.com/photo-example.jpg'
};

describe('MovieCard Component', () => {
  it('renders movie title, genre, and formatted duration correctly', () => {
    render(
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <MovieCard movie={mockMovie} />
      </BrowserRouter>
    );

    expect(screen.getByText('Dune: Part Two')).toBeInTheDocument();
    expect(screen.getByText('Sci-Fi, Adventure')).toBeInTheDocument();
    expect(screen.getByText('8.9')).toBeInTheDocument();
    expect(screen.getByText('2h 46m')).toBeInTheDocument();
  });

  it('contains link pointing to movie details page', () => {
    render(
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <MovieCard movie={mockMovie} />
      </BrowserRouter>
    );

    const bookButton = screen.getByRole('link', { name: /book tickets/i });
    expect(bookButton).toBeInTheDocument();
    expect(bookButton).toHaveAttribute('href', '/movies/42');
  });
});
