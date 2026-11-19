import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { bookingsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, CreditCard, Smartphone, Film, MapPin, ArrowLeft, AlertCircle } from 'lucide-react';

export default function CheckoutPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const state = location.state;

  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [upiId, setUpiId] = useState('demo@okhdfcbank');
  const [cardNumber, setCardNumber] = useState('4532 •••• •••• 8892');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  if (!state || !state.show || !state.selectedSeats || state.selectedSeats.length === 0) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-slate-900 border border-slate-800 rounded-3xl text-center">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-white mb-2">No active booking session</h2>
        <p className="text-xs text-slate-400 mb-6">Please select a movie and seats to checkout.</p>
        <Link to="/" className="inline-flex items-center gap-2 text-sm bg-rose-600 hover:bg-rose-500 text-white font-semibold px-6 py-2.5 rounded-full transition">
          Browse Movies
        </Link>
      </div>
    );
  }

  const { show, selectedSeats, totalPrice } = state;
  const movie = show.movie;
  const screen = show.screen;
  const theatre = screen?.theatre;

  const convenienceFee = Math.round(selectedSeats.length * 28.5);
  const grandTotal = totalPrice + convenienceFee;

  const handlePayAndConfirm = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      // API call to book seats
      const seatIds = selectedSeats.map((s) => s.id);
      const res = await bookingsAPI.create({
        showId: show.id,
        seatIds
      });

      const confirmedBooking = {
        ...res.data.booking,
        show: res.data.booking?.show || show
      };
      // Navigate to confirmation page
      navigate(`/booking-confirmed/${confirmedBooking.id}`, {
        state: { booking: confirmedBooking },
        replace: true
      });
    } catch (err) {
      console.error('Booking failed:', err);
      const msg = err.response?.data?.message || 'Payment or booking confirmation failed. Please try again.';
      setErrorMessage(msg);
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen py-10 max-w-5xl mx-auto px-4 sm:px-6">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white mb-6 transition"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Seat Selection
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Payment Methods */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8">
            <h2 className="text-xl font-bold text-white mb-4">Payment Method (Simulation)</h2>
            <p className="text-xs text-slate-400 mb-6">
              This is a demonstration environment. No actual money will be charged.
            </p>

            {/* Payment Options */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <button
                type="button"
                onClick={() => setPaymentMethod('upi')}
                className={`p-4 rounded-2xl border flex flex-col items-center gap-2 text-center transition ${
                  paymentMethod === 'upi'
                    ? 'bg-rose-950/40 border-rose-500 text-rose-400 font-bold'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Smartphone className="w-6 h-6" />
                <span className="text-xs">UPI (Instant)</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`p-4 rounded-2xl border flex flex-col items-center gap-2 text-center transition ${
                  paymentMethod === 'card'
                    ? 'bg-rose-950/40 border-rose-500 text-rose-400 font-bold'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <CreditCard className="w-6 h-6" />
                <span className="text-xs">Credit / Debit Card</span>
              </button>
            </div>

            {/* Form simulation based on payment method */}
            {paymentMethod === 'upi' ? (
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 space-y-3">
                <label className="text-xs text-slate-300 font-semibold block">Enter Virtual Payment Address (VPA / UPI ID)</label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-rose-500"
                  placeholder="username@bank"
                />
                <p className="text-[11px] text-slate-500">Google Pay, PhonePe, Paytm, Cred accepted.</p>
              </div>
            ) : (
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 space-y-3">
                <label className="text-xs text-slate-300 font-semibold block">Card Number</label>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-rose-500"
                  placeholder="4532 0000 0000 0000"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    defaultValue="12/28"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm text-slate-200"
                    placeholder="MM/YY"
                  />
                  <input
                    type="password"
                    defaultValue="•••"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm text-slate-200"
                    placeholder="CVV"
                  />
                </div>
              </div>
            )}

            {/* Error banner */}
            {errorMessage && (
              <div className="mt-4 p-4 bg-rose-950/60 border border-rose-800 rounded-2xl text-xs text-rose-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Pay Button */}
            <button
              onClick={handlePayAndConfirm}
              disabled={isProcessing}
              className="mt-6 w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-3.5 rounded-2xl shadow-xl shadow-rose-600/30 transition flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Processing Payment...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5" />
                  <span>Pay ₹{grandTotal} & Confirm Booking</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Col: Order Summary */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
            <h3 className="text-base font-bold text-white mb-4">Order Summary</h3>

            {/* Movie preview */}
            <div className="flex gap-3 pb-4 border-b border-slate-800">
              <img
                src={movie.posterUrl}
                alt={movie.title}
                className="w-14 h-20 object-cover rounded-xl border border-slate-700/60"
              />
              <div>
                <h4 className="font-bold text-sm text-white">{movie.title}</h4>
                <p className="text-xs text-rose-400 mt-0.5">{movie.genre}</p>
                <p className="text-xs text-slate-400 mt-1">{theatre?.name}</p>
              </div>
            </div>

            {/* Seats detail */}
            <div className="py-4 border-b border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Selected Seats</span>
                <span className="font-bold text-white">
                  {selectedSeats.map((s) => `${s.seatRow}${s.seatNumber}`).join(', ')}
                </span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Total Seats</span>
                <span>{selectedSeats.length} Ticket(s)</span>
              </div>
            </div>

            {/* Pricing breakdown */}
            <div className="py-4 border-b border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Ticket Subtotal</span>
                <span>₹{totalPrice}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Convenience Fee & Taxes</span>
                <span>₹{convenienceFee}</span>
              </div>
            </div>

            {/* Grand Total */}
            <div className="pt-4 flex justify-between items-center text-sm font-bold text-white">
              <span>Amount Payable</span>
              <span className="text-rose-400 text-lg">₹{grandTotal}</span>
            </div>

            <p className="text-[11px] text-slate-500 mt-4 text-center">
              By confirming, you agree to Eventra's Terms of Service.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
