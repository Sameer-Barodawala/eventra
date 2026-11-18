# 🎬 EVENTRA — Movie Ticket Booking Platform (BookMyShow Clone)

[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-22-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.21-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?logo=mysql&logoColor=white)](https://www.mysql.com/)
[![mysql2](https://img.shields.io/badge/mysql2-Driver-orange?logo=mysql&logoColor=white)](https://github.com/sidorares/node-mysql2)
[![Jest & Supertest](https://img.shields.io/badge/Backend_Tests-Jest_&_Supertest-C21325?logo=jest&logoColor=white)](https://jestjs.io/)
[![Vitest & RTL](https://img.shields.io/badge/Frontend_Tests-Vitest_&_RTL-6E9F18?logo=vitest&logoColor=white)](https://vitest.dev/)
[![Deployment](https://img.shields.io/badge/Deploy-Netlify_%7C_Render_%7C_Railway-00AD9F)](https://eventra.app)

**Eventra** is a full-stack movie ticketing platform inspired by BookMyShow. It demonstrates pure relational database design with **MySQL** (`mysql2/promise`), safe ACID database transactions (preventing double-booking race conditions), robust automated testing pyramids (Unit, Integration, and Component tests), and multi-cloud deployment across **Netlify** (Frontend), **Render** (Backend API), and **Railway** (MySQL Database).

---

## 🏗️ Architecture & Deployment Overview

```
                      +---------------------------------------+
                      |         CLIENT (Netlify)              |
                      |   React 18 + Vite + Tailwind CSS      |
                      |   Axios Interceptors + React Router   |
                      +-------------------+-------------------+
                                          |
                                          | HTTPS REST API
                                          v
                      +---------------------------------------+
                      |          BACKEND (Render)             |
                      |     Node.js + Express REST API        |
                      |  JWT Authentication + RBAC Middleware |
                      +-------------------+-------------------+
                                          |
                                          | mysql2 Connection Pool (Raw SQL)
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
- **Concurrency & Race-Condition Safe Booking:** Relational database transactions (`conn.beginTransaction()`, `conn.commit()`, `conn.rollback()`) verify seat conflicts prior to booking, preventing double-bookings.
- **Perforated Cinema M-Ticket:** Realistic digital ticket with perforated tear stubs, booking reference, QR simulation, and browser print capability.
- **JWT Authentication & Demo Account:** Secure password hashing using `bcryptjs` and session tokens with a 1-click Demo Account login button for quick recruiter evaluation.
- **User Dashboard:** "My Bookings" page with history, live booking cancellation, and status indicators.

---

## 🧪 Testing Suite Overview (Resume Highlight)

The project includes **33 automated tests** across both backend and frontend layers:

```
Total Test Suites : 8 (5 Backend, 3 Frontend)
Total Tests       : 33 Passed (25 Backend, 8 Frontend)
Success Rate      : 100%
```

### 1. Backend Testing (`server/tests/`) — Jest & Supertest
- **Health Suite (`health.test.js`):** Checks `/api/health` returns status 200 with `{ status: 'ok' }` and verifies unhandled routes return 404.
- **Auth Suite (`auth.test.js`):** User registration validation, password length checks, duplicate email conflict (`409 Conflict`), login password checks, and JWT protected `/me` endpoint.
- **Movies Suite (`movies.test.js`):** Query filtering, search strings, 404 handling, and role-based admin movie creation (`403 Forbidden` vs `201 Created`).
- **Shows Suite (`shows.test.js`):** Showtime lookups by movie ID, date query parsing, and booked seats aggregation.
- **Bookings Suite (`bookings.test.js`):** Unauthenticated rejection (401), invalid payload rejection (400), **seat conflict detection (`409 Conflict`)**, and atomic database transaction execution (`beginTransaction`, `commit`, `rollback`).

### 2. Frontend Testing (`client/src/tests/`) — Vitest & React Testing Library
- **MovieCard Component (`MovieCard.test.jsx`):** Renders poster, genre, formatted duration (`2h 46m`), rating, and route links.
- **SeatGrid Component (`SeatGrid.test.jsx`):** Renders seat layout, screen indicator, verifies that booked seats are disabled, and ensures click toggles selected seats.
- **API Interceptors (`api.test.js`):** Validates automatic JWT injection into HTTP headers and handles session state.

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

## 🗄️ Relational Database Schema (`server/src/db/schema.sql`)

```sql
users (id, name, email, password, role, created_at)
movies (id, title, description, poster_url, banner_url, genre, duration, language, rating, release_date)
theatres (id, name, city, location)
screens (id, theatre_id, name, total_seats)
seats (id, screen_id, seat_row, seat_number, seat_type)
shows (id, movie_id, screen_id, start_time, end_time, price)
bookings (id, user_id, show_id, total_amount, booking_status, booking_date)
booking_seats (id, booking_id, seat_id)
```

---

## 🚀 3-Tier Deployment Guide (Railway + Render + Netlify)

### Step 1: Deploy MySQL Database on Railway
1. Sign up at [Railway.app](https://railway.app).
2. Click **New Project** → **Provision MySQL**.
3. Once provisioned, open the MySQL service and go to the **Variables** tab.
4. Copy the connection string from `DATABASE_URL` (format: `mysql://root:password@monorail.proxy.rlwy.net:PORT/railway`).

### Step 2: Deploy Backend API on Render
1. Push this project to your GitHub repository.
2. Go to [Render.com](https://render.com) → **New +** → **Web Service** → Connect your repository.
3. Configure the service:
   - **Root Directory:** `server`
   - **Environment:** `Node`
   - **Build Command:** `npm install && npm run db:init && npm run db:seed`
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

### 1. Backend Setup
```bash
cd server
npm install

# Configure your environment
cp .env.example .env
# Edit DATABASE_URL in .env with your MySQL credentials

# Initialize tables & seed data
npm run db:init
npm run db:seed

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
