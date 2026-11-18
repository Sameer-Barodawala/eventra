import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SeatGrid from '../components/SeatGrid';
import { describe, it, expect, vi } from 'vitest';

const mockSeats = [
  { id: 1, seatRow: 'A', seatNumber: 1, seatType: 'SILVER' },
  { id: 2, seatRow: 'A', seatNumber: 2, seatType: 'SILVER' },
  { id: 3, seatRow: 'B', seatNumber: 1, seatType: 'GOLD' }
];

describe('SeatGrid Component', () => {
  it('renders seats and displays screen indicator', () => {
    const handleToggle = vi.fn();
    render(
      <SeatGrid
        seats={mockSeats}
        bookedSeatIds={[]}
        selectedSeats={[]}
        onToggleSeat={handleToggle}
        basePrice={200}
      />
    );

    expect(screen.getByText(/All eyes this way • Screen/i)).toBeInTheDocument();
    expect(screen.getByTitle(/A1 \(SILVER - ₹200\)/i)).toBeInTheDocument();
  });

  it('disables seats that are in bookedSeatIds', () => {
    const handleToggle = vi.fn();
    render(
      <SeatGrid
        seats={mockSeats}
        bookedSeatIds={[1]} // Seat A1 is booked
        selectedSeats={[]}
        onToggleSeat={handleToggle}
        basePrice={200}
      />
    );

    const seat1 = screen.getByTitle(/A1/i);
    expect(seat1).toBeDisabled();

    // Clicking booked seat should not trigger callback
    fireEvent.click(seat1);
    expect(handleToggle).not.toHaveBeenCalled();
  });

  it('triggers onToggleSeat when an available seat is clicked', () => {
    const handleToggle = vi.fn();
    render(
      <SeatGrid
        seats={mockSeats}
        bookedSeatIds={[]}
        selectedSeats={[]}
        onToggleSeat={handleToggle}
        basePrice={200}
      />
    );

    const seat2 = screen.getByTitle(/A2/i);
    fireEvent.click(seat2);
    expect(handleToggle).toHaveBeenCalledTimes(1);
    expect(handleToggle).toHaveBeenCalledWith(mockSeats[1]);
  });
});
