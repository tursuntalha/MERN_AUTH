# AuthForge — Enterprise-Grade Authentication Microservice

> *"Auth'u bir kere kur, her projede kullan."*

![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)

![Status](https://img.shields.io/badge/Status-In%20Development-yellow?style=for-the-badge)

A production-ready, plug-and-play authentication microservice built on the MERN stack. Not just login/logout — a complete, battle-hardened auth system you can drop into any project. Solves the problem that every new project starts auth from scratch with copy-paste code that quietly harbors security flaws.

---

## Why AuthForge vs. Basic MERN Auth

| Feature | Basic MERN Auth | AuthForge |
|---|---|---|
| Password storage | bcrypt | bcrypt (configurable rounds) |
| Token storage | localStorage (XSS risk) | HTTP-only cookie (XSS safe) |
| Token refresh | None | Refresh token rotation |
| MFA | None | TOTP (Google Authenticator) |
| Social login | None | Google + GitHub OAuth 2.0 |
| Brute-force protection | None | Rate limiting + lockout |
| Session revocation | None | Redis-based token blacklist |
| Audit trail | None | Full log (IP, user-agent, event) |
| Email verification | None | Nodemailer + signed link |
| Deployment | Manual | Docker Compose ready |

---

## Security Features

| Feature | Library | Why It Matters |
|---|---|---|
| Password hashing | `bcrypt` (12 rounds) | Brute-force resistant, salted per-user |
| Access token | `jsonwebtoken` (15 min TTL) | Short-lived → minimizes breach window |
| Refresh token | HTTP-only cookie (7 days) | JS cannot read it → XSS safe |
| Refresh rotation | Custom middleware | Stolen refresh token is blacklisted after use |
| MFA (TOTP) | `otplib` | Time-based OTP; no SMS (SIM-swap safe) |
| Rate limiting | `express-rate-limit` | Blocks brute-force login attempts |
| Token blacklist | Redis | Instant session revocation on logout |
| CSRF protection | `csurf` | Prevents cross-site request forgery |

---

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                      React Client                        │
│   Login / Register / MFA Setup / Admin Panel             │
└───────────────────────────┬──────────────────────────────┘
                            │ HTTPS
                            ▼
┌──────────────────────────────────────────────────────────┐
│                   Express API Server                     │
│   Rate Limiter → CSRF Guard → Auth Middleware → Routes   │
└────────┬──────────────────┬───────────────────┬──────────┘
         │                  │                   │
         ▼                  ▼                   ▼
  ┌──────────┐      ┌──────────────┐    ┌──────────────┐
  │ MongoDB  │      │    Redis     │    │     SMTP     │
  │  Users   │      │Token Blacklist│   │  Nodemailer  │
  │ AuditLog │      │  Rate Counts │    │ (Verify/Reset│
  └──────────┘      └──────────────┘    └──────────────┘
```

---

## JWT Token Strategy

```
Login
  │
  ▼
Access Token (JWT, 15 min)   ──► Stored in React memory (never localStorage)
Refresh Token (JWT, 7 days)  ──► Stored in HTTP-only cookie (unreadable by JS)
  │
  │  (Access token expires)
  ▼
POST /auth/refresh
  ├─ Validate refresh cookie
  ├─ Blacklist old refresh token in Redis
  └─ Issue new access token + new refresh token   ← rotation complete
  │
  │  (Logout)
  ▼
Refresh token added to Redis blacklist (TTL = remaining token lifetime)
```

---

## MFA Flow (TOTP)

```
Setup:
  User enables MFA
    → Server generates TOTP secret
    → Returns QR code (otpauth:// URI)
    → User scans with Google Authenticator / Authy
    → User submits first 6-digit code to confirm setup

Login with MFA enabled:
  Password correct
    → MFA challenge screen
    → User enters 6-digit TOTP from app
    → otplib.totp.verify(token, secret) → ✓ or ✗
    → Issue access + refresh tokens on success
```

---

## API Endpoints

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/api/auth/register` | Register + send verification email | Public |
| POST | `/api/auth/login` | Login → access token + refresh cookie | Public |
| POST | `/api/auth/refresh` | Rotate refresh token | Refresh cookie |
| POST | `/api/auth/logout` | Blacklist refresh token | Bearer |
| GET | `/api/auth/me` | Current user profile | Bearer |
| POST | `/api/auth/verify-email` | Confirm email with signed token | Public |
| POST | `/api/auth/forgot-password` | Send reset email | Public |
| POST | `/api/auth/reset-password` | Reset with signed token | Public |
| POST | `/api/auth/mfa/setup` | Generate secret + QR code | Bearer |
| POST | `/api/auth/mfa/verify` | Confirm setup with first code | Bearer |
| GET | `/api/oauth/google` | Redirect to Google OAuth | Public |
| GET | `/api/oauth/github` | Redirect to GitHub OAuth | Public |
| GET | `/api/admin/users` | List all users | Admin |
| GET | `/api/admin/audit` | View audit log | Admin |
| DELETE | `/api/admin/sessions/:userId` | Revoke all sessions for user | Admin |

---

## Project Structure

```
MERN_AUTH/
├── backend/
│   ├── controllers/
│   │   ├── authController.js      # register, login, logout, refresh
│   │   ├── mfaController.js       # setup, verify TOTP
│   │   └── adminController.js     # user management, audit log
│   ├── middleware/
│   │   ├── authMiddleware.js      # verify JWT access token
│   │   ├── rateLimiter.js         # express-rate-limit config
│   │   └── adminGuard.js          # role-based access check
│   ├── models/
│   │   ├── User.js                # schema + bcrypt pre-save hook
│   │   └── AuditLog.js            # audit trail schema
│   ├── routes/
│   │   ├── auth.js
│   │   ├── oauth.js
│   │   └── admin.js
│   └── server.js
├── frontend/
│   └── src/
│       ├── pages/                 # Login, Register, MFA, AdminPanel
│       └── context/AuthContext.jsx
├── docker-compose.yml
└── .env.example
```

---

## Setup

```bash
cp .env.example .env
# Fill: MONGO_URI, JWT_SECRET, REFRESH_SECRET, REDIS_URL, SMTP_HOST, SMTP_USER, SMTP_PASS, GOOGLE_CLIENT_ID, GITHUB_CLIENT_ID

docker-compose up   # starts MongoDB + Redis + API + React dev server
```

---

## Roadmap

- [ ] **Phase 1** — Core auth: register, login, logout, JWT access + refresh tokens, bcrypt
- [ ] **Phase 2** — Security hardening: HTTP-only cookies, rate limiting, CSRF, Redis token blacklist
- [ ] **Phase 3** — Email flows: verification on register, password reset (Nodemailer + signed tokens)
- [ ] **Phase 4** — Social login (Google + GitHub via Passport.js) + MFA (TOTP via otplib + QR)
- [ ] **Phase 5** — Admin panel: user list, session revocation, audit log viewer, Docker Compose setup
