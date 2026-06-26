# MERN Authentication System

![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)

A full-stack authentication system built with the MERN stack. Features secure JWT-based auth stored in HTTP-only cookies, protected routes, and a React frontend for register, login, and logout.

---

## Architecture

```
┌───────────────────────────────────────┐
│          React Frontend               │
│           localhost:3000              │
└─────────────────┬─────────────────────┘
                  │  HTTP + Cookie
┌─────────────────▼─────────────────────┐
│         Express REST API              │
│           localhost:4000              │
│  ┌─────────────────────────────────┐  │
│  │  JWT Middleware (cookie verify) │  │
│  └─────────────────────────────────┘  │
└─────────────────┬─────────────────────┘
                  │  Mongoose ODM
┌─────────────────▼─────────────────────┐
│               MongoDB                 │
└───────────────────────────────────────┘
```

---

## Features

- User registration with bcrypt password hashing
- Login / Logout with JWT stored in HTTP-only cookies
- Protected routes on both frontend and backend
- Custom middleware for token verification
- Clean React UI for all auth flows

---

## API Endpoints

| Method | Endpoint              | Description              | Auth Required |
|--------|-----------------------|--------------------------|:-------------:|
| POST   | `/api/auth/register`  | Create new user account  | No            |
| POST   | `/api/auth/login`     | Authenticate user        | No            |
| POST   | `/api/auth/logout`    | Clear auth cookie        | Yes           |
| GET    | `/api/auth/profile`   | Get current user profile | Yes           |

---

## Environment Variables

Create a `.env` file inside `backend/`:

| Variable      | Description                      | Example             |
|---------------|----------------------------------|---------------------|
| `PORT`        | Backend server port              | `4000`              |
| `MONGO_URI`   | MongoDB connection string        | `mongodb+srv://...` |
| `JWT_SECRET`  | Secret key for signing JWTs      | `your_secret_here`  |

---

## Prerequisites

- Node.js v18+
- MongoDB — local install or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)

---

## Installation & Running

```bash
git clone https://github.com/tursuntalha/MERN_AUTH.git
cd MERN_AUTH

# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

```bash
# Terminal 1 — backend
cd backend && npm start

# Terminal 2 — frontend
cd frontend && npm start
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:4000

---

## Project Structure

```
MERN_AUTH/
├── backend/
│   ├── controllers/      # Auth business logic
│   ├── middleware/        # JWT verification middleware
│   ├── models/           # Mongoose User schema
│   ├── routes/           # /api/auth routes
│   └── server.js
└── frontend/
    └── src/              # React components and auth context
```

---

## Build & Deploy

```bash
# Create frontend production build
cd frontend
npm run build
```
