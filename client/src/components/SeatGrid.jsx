import React from 'react';

export default function SeatGrid({ seats, bookedSeatIds, selectedSeats, onToggleSeat, basePrice }) {
  const price = parseFloat(basePrice) || 0;

  // Group seats by row
  const rowsMap = seats.reduce((acc, seat) => {
    if (!acc[seat.seatRow]) {
      acc[seat.seatRow] = [];
    }
    acc[seat.seatRow].push(seat);
    return acc;
  }, {});

  // Sort rows alphabetically
  const sortedRows = Object.keys(rowsMap).sort();

  const getSeatPrice = (type) => {
    if (type === 'GOLD') return Math.round(price * 1.3);
    if (type === 'PLATINUM') return Math.round(price * 1.6);
    return Math.round(price);
  };

  return (
    <div className="flex flex-col items-center select-none w-full max-w-4xl mx-auto">
      {/* Cinema Screen Indicator */}
      <div className="w-full max-w-2xl mb-10 flex flex-col items-center">
        <div className="w-full h-3 bg-gradient-to-b from-rose-500/60 to-transparent rounded-t-[100%] shadow-[0_-10px_25px_rgba(244,63,94,0.4)]"></div>
        <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold mt-2">
          All eyes this way • Screen
        </p>
      </div>

      {/* Seating Grid */}
      <div className="flex flex-col gap-3 w-full items-center overflow-x-auto pb-4">
        {sortedRows.map((row) => {
          const rowSeats = rowsMap[row].sort((a, b) => a.seatNumber - b.seatNumber);
          const rowType = rowSeats[0]?.seatType || 'SILVER';

          return (
            <div key={row} className="flex items-center gap-2">
              <span className="w-6 text-xs font-bold text-slate-400 text-center">{row}</span>
              
              <div className="flex items-center gap-2">
                {rowSeats.map((seat, index) => {
                  const isBooked = bookedSeatIds.includes(seat.id);
                  const isSelected = selectedSeats.some((s) => s.id === seat.id);

                  // Create aisle gap after 5th seat for realistic cinema seating
                  const hasAisle = index === 4;

                  let seatStyle = "bg-slate-800 text-slate-300 hover:border-rose-400 border border-slate-700/60 cursor-pointer";

                  if (isBooked) {
                    seatStyle = "bg-slate-900/60 text-slate-600 border border-slate-800/80 cursor-not-allowed opacity-40";
                  } else if (isSelected) {
                    seatStyle = "bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-600/40 font-bold scale-105";
                  } else if (seat.seatType === 'PLATINUM') {
                    seatStyle = "bg-purple-950/40 text-purple-200 border border-purple-700/40 hover:border-purple-400 cursor-pointer";
                  } else if (seat.seatType === 'GOLD') {
                    seatStyle = "bg-amber-950/40 text-amber-200 border border-amber-700/40 hover:border-amber-400 cursor-pointer";
                  }

                  return (
                    <React.Fragment key={seat.id}>
                      <button
                        type="button"
                        disabled={isBooked}
                        onClick={() => onToggleSeat(seat)}
                        title={`${row}${seat.seatNumber} (${seat.seatType} - ₹${getSeatPrice(seat.seatType)})`}
                        className={`w-8 h-8 rounded-lg text-xs flex items-center justify-center transition-all duration-150 ${seatStyle}`}
                      >
                        {seat.seatNumber}
                      </button>
                      {hasAisle && <div className="w-5"></div>}
                    </React.Fragment>
                  );
                })}
              </div>

              <span className="w-6 text-xs font-bold text-slate-400 text-center">{row}</span>
            </div>
          );
        })}
      </div>

      {/* Legend & Seat Types */}
      <div className="mt-8 pt-6 border-t border-slate-800 w-full flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-slate-800 border border-slate-700"></div>
          <span>Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-rose-600 shadow-sm"></div>
          <span>Selected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-slate-900/60 border border-slate-800/80 opacity-40"></div>
          <span>Booked</span>
        </div>

        <div className="h-4 w-px bg-slate-800 hidden sm:block"></div>

        <div className="flex items-center gap-2 text-slate-300">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
          <span>Silver: ₹{Math.round(price)}</span>
        </div>
        <div className="flex items-center gap-2 text-amber-300">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
          <span>Gold: ₹{Math.round(price * 1.3)}</span>
        </div>
        <div className="flex items-center gap-2 text-purple-300">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
          <span>Platinum: ₹{Math.round(price * 1.6)}</span>
        </div>
      </div>
    </div>
  );
}
