# 🎬 EVENTRA — Movie Ticket Booking Platform (BookMyShow Clone)

[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-22-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.21-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?logo=mysql&logoColor=white)](https://www.mysql.com/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Jest & Supertest](https://img.shields.io/badge/Backend_Tests-Jest_&_Supertest-C21325?logo=jest&logoColor=white)](https://jestjs.io/)
[![Vitest & RTL](https://img.shields.io/badge/Frontend_Tests-Vitest_&_RTL-6E9F18?logo=vitest&logoColor=white)](https://vitest.dev/)
[![Deployment](https://img.shields.io/badge/Deploy-Netlify_%7C_Render_%7C_Railway-00AD9F)](https://eventra.app)

**Eventra** is a full-stack movie ticketing platform inspired by BookMyShow. It demonstrates production-grade RESTful API design, database transaction safety (concurrency handling for seat reservations), automated testing pyramids (Unit, Integration, and Component tests), and multi-cloud deployment across **Netlify** (Frontend), **Render** (Backend API), and **Railway** (MySQL Database).

---

## 🏗️ Architecture & Deployment Overview

```
                      +---------------------------------------+
                      |         CLIENT (Netlify)              |
                      |   React 18 + Vite + Tailwind CSS      |
                      |   Axios Interceptors + React Router   |
                      +-------------------+-------------------+
                                          |
                                          | HTTPS API Requests
                                          v
                      +---------------------------------------+
                      |          BACKEND (Render)             |
                      |     Node.js + Express REST API        |
                      |  JWT Authentication + RBAC Middleware |
                      +-------------------+-------------------+
                                          |
                                          | Prisma ORM (Connection Pool)
                                          v
                      +---------------------------------------+
                      |         DATABASE (Railway)            |
                      |          MySQL 8.0 Instance           |
                      | ACID Transactions / Conflict Locking  |
                      +---------------------------------------+
```

---

## ✨ Key Features

- **Movie Discovery & Showtimes:** Filter movies by genre, search titles, view ratings, duration, languages, and showtimes organized across multiplexes (IMAX, Dolby Atmos).
- **Interactive Cinema Seat Matrix:** Visual screen visualizer with distinct seating tiers:
  - 🥈 **Silver** (Base price)
  - 🥇 **Gold** (1.3x multiplier)
  - 👑 **Platinum Recliners** (1.6x multiplier)
- **Concurrency & Race-Condition Safe Booking:** Atomic Prisma transaction (`prisma.$transaction`) checks for seat conflicts before booking, preventing double-bookings.
- **Perforated Cinema M-Ticket:** Realistic digital ticket with perforated tear stubs, booking reference, QR simulation, and browser print capability.
- **JWT Authentication & Demo Account:** Secure password hashing using `bcryptjs` and session tokens with 1-click Demo Account login button for quick recruiter evaluation.
- **User Dashboard:** "My Bookings" page with history, live booking cancellation, and status indicators.

---

## 🧪 Testing Suite (Resume Highlight)

The project includes automated test coverage on both backend and frontend layers:

### 1. Backend Testing (`server/tests/`) — Jest & Supertest
- **Auth Suite (`auth.test.js`):** User registration validation, password length checks, duplicate email conflict (409), login validation, and JWT protected `/me` endpoint.
- **Movies Suite (`movies.test.js`):** Query filtering, search strings, 404 handling, and role-based admin movie creation (403 forbidden vs 201 created).
- **Shows Suite (`shows.test.js`):** Showtime lookups by movie ID, date query parsing, and booked seats aggregation.
- **Bookings Suite (`bookings.test.js`):** Unauthenticated rejection (401), invalid payload rejection (400), **seat conflict detection (409 Conflict)**, and atomic database transaction execution.

### 2. Frontend Testing (`client/src/tests/`) — Vitest & React Testing Library
- **MovieCard Component (`MovieCard.test.jsx`):** Renders poster, genre, formatted duration (`2h 46m`), rating, and route links.
- **SeatGrid Component (`SeatGrid.test.jsx`):** Renders seat layout, screen indicator, verifies that booked seats are disabled, and ensures click toggles selected seats.
- **API Interceptors (`api.test.js`):** Validates automatic token injection into HTTP headers.

### Running the Tests:
```bash
# Run all tests (Server + Client)
npm test

# Run backend tests with coverage report
cd server
npm test

# Run frontend tests with coverage report
cd client
npm test
```

---

## 🗄️ Relational Database Schema (MySQL + Prisma)

```prisma
User (id, name, email, password, role, createdAt)
  └── Bookings (1:N)

Movie (id, title, description, posterUrl, bannerUrl, genre, duration, language, rating, releaseDate)
  └── Shows (1:N)

Theatre (id, name, city, location)
  └── Screens (1:N)

Screen (id, theatreId, name, totalSeats)
  ├── Seats (1:N)
  └── Shows (1:N)

Seat (id, screenId, seatRow, seatNumber, seatType)

Show (id, movieId, screenId, startTime, endTime, price)
  └── Bookings (1:N)

Booking (id, userId, showId, totalAmount, bookingStatus, bookingDate)
  └── BookingSeats (1:N) -> Junction to Seat
```

---

## 🚀 3-Tier Deployment Guide (Railway + Render + Netlify)

### Step 1: Deploy MySQL Database on Railway
1. Sign up at [Railway.app](https://railway.app).
2. Click **New Project** → **Provision MySQL**.
3. Once provisioned, open the MySQL service and go to the **Variables** tab.
4. Copy the connection string from `DATABASE_URL` (format: `mysql://root:password@monorail.proxy.rlwy.net:PORT/railway`).

### Step 2: Deploy Backend API on Render
1. Sign up at [Render.com](https://render.com).
2. Click **New +** → **Web Service** and connect your GitHub repository.
3. Configure the service:
   - **Root Directory:** `server`
   - **Environment:** `Node`
   - **Build Command:** `npm install && npx prisma generate && npx prisma migrate deploy && npm run prisma:seed`
   - **Start Command:** `npm start`
4. Under **Environment Variables**, add:
   - `DATABASE_URL` = *(Your Railway MySQL connection string from Step 1)*
   - `JWT_SECRET` = *(Generate any secure random string, e.g. `eventra_secret_98234`)*
   - `NODE_ENV` = `production`
   - `PORT` = `5000`
5. Click **Create Web Service**. Once deployed, copy your Render API URL (e.g., `https://eventra-api.onrender.com`).

### Step 3: Deploy Frontend on Netlify
1. Sign up at [Netlify.com](https://netlify.com).
2. Click **Add new site** → **Import an existing project** and link your GitHub repository.
3. Configure build settings:
   - **Base directory:** `client`
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
4. Under **Site configuration** → **Environment variables**, add:
   - `VITE_API_BASE_URL` = `https://eventra-api.onrender.com/api` *(Your Render backend URL from Step 2)*
5. Click **Deploy Site**. Netlify will build the SPA, apply redirect rules from `netlify.toml`, and assign your live URL!

---

## 💻 Local Development Setup

### Prerequisites
- Node.js (v18 or higher)
- MySQL server (Local, Docker, or Railway MySQL instance)

### 1. Backend Setup
```bash
cd server
npm install

# Configure your environment
cp .env.example .env
# Edit DATABASE_URL in .env with your MySQL credentials

# Generate Prisma Client & push schema to database
npx prisma db push

# Seed initial movies, theatres, seats, and test users
npm run prisma:seed

# Start backend server
npm run dev
# Server runs on http://localhost:5000
```

### 2. Frontend Setup
```bash
cd client
npm install

# Start Vite dev server
npm run dev
# App runs on http://localhost:3000
```

### Demo Test Credentials:
- **Email:** `john@example.com`
- **Password:** `password123`
*(Or click "Fill Demo Account Credentials" on the Sign-In screen)*

---

## 📁 Repository Structure

```
Eventra/
├── client/                     # Frontend (React 18, Vite, Tailwind CSS)
│   ├── src/
│   │   ├── components/         # Navbar, MovieCard, SeatGrid, TicketCard, ProtectedRoute
│   │   ├── context/            # AuthContext (JWT State Management)
│   │   ├── pages/              # Home, MovieDetails, Showtimes, SeatBooking, Checkout, Confirmation, MyBookings
│   │   ├── services/           # Axios instance with auth interceptors
│   │   └── tests/              # Vitest & RTL component and service test suites
│   ├── netlify.toml            # Netlify SPA redirect & build config
│   └── package.json
│
├── server/                     # Backend (Node.js, Express, Prisma ORM)
│   ├── prisma/
│   │   ├── schema.prisma       # Relational MySQL Schema
│   │   └── seed.js             # Realistic seed dataset
│   ├── src/
│   │   ├── controllers/        # Auth, Movies, Shows, Bookings
│   │   ├── middlewares/        # JWT verification, Admin RBAC, Error handler
│   │   ├── routes/             # REST route definitions
│   │   ├── config/             # Prisma client instance
│   │   ├── app.js              # Express app definition (separated for testing)
│   │   └── server.js           # Express listener
│   ├── tests/                  # Jest & Supertest integration tests
│   ├── render.yaml             # Render deployment blueprint
│   └── package.json
│
├── .gitignore
├── package.json                # Root scripts (run all tests, build all)
└── README.md                   # Full documentation & deployment guide
```
