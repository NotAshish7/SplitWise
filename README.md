# 💰 SplitWise — Smart Expense Manager

> **Major Project — Full Stack Web Application**
> *Intelligent personal finance tracking, group expense splitting & visual analytics*

[![Live Site](https://img.shields.io/badge/Live-splitwise.space-667eea?logo=cloudflare&logoColor=white)](https://splitwise.space)
![Node.js](https://img.shields.io/badge/Node.js-v18+-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-4.x-000000?logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-8.x-47A248?logo=mongodb&logoColor=white)
![Bootstrap](https://img.shields.io/badge/Bootstrap-5.3-7952B3?logo=bootstrap&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?logo=javascript&logoColor=black)
![Cloudflare Pages](https://img.shields.io/badge/Cloudflare-Pages-F38020?logo=cloudflare&logoColor=white)
![Render](https://img.shields.io/badge/Backend-Render-46E3B7?logo=render&logoColor=white)

---

## 🌐 Live Deployment

| Service | URL | Notes |
|---------|-----|-------|
| **Frontend** | [splitwise.space](https://splitwise.space) | Cloudflare Pages (auto-deploys from GitHub) |
| **API Backend** | [api.splitwise.space](https://api.splitwise.space) | Render (Node.js server) |
| **Support Portal** | [splitwise.space/support-portal.html](https://splitwise.space/support-portal.html) | Admin & Agent login |
| **GitHub Repo** | [NotAshish7/SplitWise](https://github.com/NotAshish7/SplitWise) | Main branch |

---

## 📋 Table of Contents

1. [Project Overview](#1-project-overview)
2. [Problem Statement](#2-problem-statement)
3. [Objectives](#3-objectives)
4. [Scope of the Project](#4-scope-of-the-project)
5. [System Architecture](#5-system-architecture)
6. [Technology Stack](#6-technology-stack)
7. [UI/UX Design System](#7-uiux-design-system)
8. [Features & Modules](#8-features--modules)
9. [Project Structure](#9-project-structure)
10. [Database Design](#10-database-design)
11. [API Documentation](#11-api-documentation)
12. [Security Implementation](#12-security-implementation)
13. [Installation & Setup](#13-installation--setup)
14. [Environment Variables](#14-environment-variables)
15. [Running the Application](#15-running-the-application)
16. [Limitations](#16-limitations)
17. [Future Scope](#17-future-scope)
18. [Conclusion](#18-conclusion)
19. [References](#19-references)

---

## 1. Project Overview

**SplitWise** is a comprehensive, production-grade full-stack web application deployed at [splitwise.space](https://splitwise.space). Built as an academic **Major Project**, it solves real-world problems in personal finance tracking and multi-user expense splitting by providing a unified digital platform accessible from any modern browser.

The application delivers a complete financial management ecosystem:
- 🔐 Secure JWT-based authentication with email OTP verification
- 💱 Multi-currency personal expense tracking (INR, USD, EUR, GBP, JPY, AUD)
- 👥 Intelligent group expense splitting with four distinct algorithms
- 📊 Real-time balance ledgers with debt-graph reduction
- 📈 Interactive visual analytics (Pie, Bar, Line charts via Chart.js)
- 📄 Exportable PDF/Excel reports
- 🔔 In-app + email notification system
- 🎫 Full-featured Support Ticket System with Admin & Agent portals
- 🎨 Premium responsive UI with glassmorphic animations and skeleton loaders

### Project Identity

| Field | Details |
|-------|---------|
| **Project Name** | SplitWise |
| **Category** | Major Project — Full Stack Web Application |
| **Domain** | Personal Finance / FinTech |
| **Developer** | Ashish |
| **Academic Year** | 2025–2026 |
| **Live URL** | https://splitwise.space |
| **Backend** | Node.js v18+ + Express.js 4.x + MongoDB Atlas |
| **Frontend** | HTML5 + CSS3 + Vanilla JavaScript ES6+ + Bootstrap 5.3 |
| **Deployment** | Cloudflare Pages (frontend) + Render (backend) |
| **Contact** | support@splitwise.space |

---

## 2. Problem Statement

People routinely share expenses — rent with roommates, bills at restaurants, costs on group trips — yet no simple, unified tool exists for students and everyday users to simultaneously track *personal* spending and *shared* bills in one place.

Traditional approaches (spreadsheets, paper notes, mental arithmetic) are:
- **Error-prone:** Manual calculation mistakes cause disputes.
- **Non-transparent:** No audit trail of who paid what and when.
- **Fragmented:** Personal expenses live separately from group tabs.
- **Inaccessible:** No real-time access or visual summary across devices.
- **Unsupported:** No response system when users face issues.

**SplitWise solves all these problems** by providing a unified, secure, always-accessible web application with mathematical precision in all settlements and a professional support infrastructure.

---

## 3. Objectives

1. **Build** a secure REST API backend (Node.js, Express, MongoDB) following industry-standard patterns.
2. **Implement** four distinct expense-splitting algorithms: Equal, Selective, Percentage, and Manual.
3. **Deliver** real-time balance ledger computation — automatically answering *"who owes whom how much"* at any point.
4. **Provide** multi-currency support (INR, USD, EUR, GBP, JPY, AUD) with live ExchangeRate API conversion.
5. **Integrate** OAuth 2.0 social login (Google & Facebook) alongside email/password auth with OTP verification.
6. **Design** a premium, fully responsive UI with modern animations, glassmorphic top navigation, and skeleton loaders.
7. **Generate** downloadable financial reports in PDF and Excel/CSV formats.
8. **Enforce** security through bcrypt password hashing, JWT tokens, Zod input validation, and CORS policies.
9. **Deploy** the full application to a live production environment with a custom domain.
10. **Build** a complete Support Ticket System with Admin and Agent management portals.

---

## 4. Scope of the Project

### 4.1 In Scope ✅

| Feature | Details |
|---------|---------|
| User Authentication | Email+Password with OTP, Google OAuth, Facebook OAuth |
| Personal Expenses | Full CRUD — title, amount, currency, category, date, notes |
| Expense Categories | Food, Transport, Shopping, Entertainment, Health, Education, Others |
| Multi-Currency | Live rate conversion — INR, USD, EUR, GBP, JPY, AUD |
| Group Management | Create, join (invite code), leave, delete groups |
| Expense Splitting | Equal, Select, Percentage, Manual split methods |
| Balance Ledger | Real-time "who owes whom" computation per group |
| Settle Up | Record payments to clear group balances |
| Previous Groups | View history of groups the user has left or been removed from |
| Analytics & Reports | Pie chart, Bar chart, Line chart via Chart.js |
| Export | PDF report (jsPDF) + Excel/CSV (SheetJS) |
| Notifications | In-app bell + email notifications (Nodemailer/SMTP) |
| Profile & Settings | Avatar, currency preference, dark/light theme, password change |
| Responsive Design | Mobile, tablet, and desktop optimized with overscroll handling |
| Top Navigation | Premium glassmorphic top nav replacing legacy sidebar |
| Support Ticket System | Public contact form → automated tickets with sequential IDs (SW-101) |
| Admin Portal | Manage agents, tokens, view all tickets, system dashboard |
| Agent Portal | Handle tickets, reply to users, multi-step login with OTP reset |
| Live Deployment | Cloudflare Pages (frontend) + Render (backend) + custom domain |

### 4.2 Out of Scope ❌

- Native mobile app (iOS / Android)
- Real payment gateway (UPI, Razorpay, Stripe)
- AI/ML budget predictions
- Receipt OCR scanning
- Bank account / credit card linking
- Multi-language (i18n) support
- Recurring/automated expense scheduling

---

## 5. System Architecture

### 5.1 Three-Tier Client-Server Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                   CLIENT LAYER (Browser)                      │
│  HTML5 Pages · CSS3 Animations · Vanilla ES6 JavaScript      │
│  Bootstrap 5.3 · Chart.js · jsPDF · SheetJS                 │
│  Pages: Landing → Auth → Dashboard → Expenses →              │
│          Groups → Reports → Settings → Support Portal         │
└─────────────────────────┬────────────────────────────────────┘
                          │ HTTPS REST API
                          │ JSON Request/Response
                          │ Authorization: Bearer <JWT>
                          ▼
┌──────────────────────────────────────────────────────────────┐
│           SERVER LAYER (Node.js + Express.js on Render)       │
│  Port: 4000 → api.splitwise.space                            │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Middleware Stack                                       │  │
│  │  CORS · express.json · JWT Token Passthrough           │  │
│  │  requireAuth (JWT Verify) · Zod Validation             │  │
│  │  Global Error Handler (AppError)                       │  │
│  └────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  REST API Routers                                       │  │
│  │  /api/auth · /api/oauth · /api/expenses                │  │
│  │  /api/groups · /api/reports · /api/payments            │  │
│  │  /api/notifications · /api/contact                     │  │
│  │  /api/support/auth · /api/admin/auth                   │  │
│  │  /api/sse · /api/health                                │  │
│  └────────────────────────────────────────────────────────┘  │
└─────────────────────────┬────────────────────────────────────┘
                          │ Mongoose ODM
                          ▼
┌──────────────────────────────────────────────────────────────┐
│              DATA LAYER (MongoDB Atlas Cloud)                  │
│  Collections: users · expenses · groups · groupexpenses      │
│  payments · notifications · otps · supporttickets            │
│  supportagents                                               │
└──────────────────────────────────────────────────────────────┘
```

### 5.2 Deployment Architecture

```
GitHub (NotAshish7/SplitWise)
    │
    ├── Push to main
    │
    ├──▶ Cloudflare Pages  ──▶  splitwise.space
    │       (frontend/)           Custom domain via DNS
    │
    └──▶ Render             ──▶  api.splitwise.space
            (backend/)            Node.js server, always-on
                │
                └──▶ MongoDB Atlas (cloud database)
```

### 5.3 Authentication Flow

```
Register → OTP Email Sent (2 min expiry) → Verify OTP → JWT Issued → Dashboard
Login → bcrypt Compare → JWT Issued (7-day) → Stored in localStorage
OAuth → Google/Facebook Code → Backend Exchange → JWT Issued → Dashboard
Reset Password → OTP Email → Verify → New bcrypt Hash → Saved
```

---

## 6. Technology Stack

### 6.1 Backend

| Package | Version | Role |
|---------|---------|------|
| **Node.js** | v18+ | JavaScript runtime — event-driven, non-blocking I/O |
| **Express.js** | 4.x | HTTP server, routing, middleware pipeline |
| **MongoDB Atlas** | 8.x | Cloud NoSQL document database |
| **Mongoose** | 8.x | ODM — schema definitions, validation, indexing, population |
| **jsonwebtoken** | Latest | JWT signing (`issueJwt`) and verification (`requireAuth`) — 7-day expiry |
| **bcryptjs** | Latest | Password hashing — 10 salt rounds, one-way irreversible |
| **zod** | Latest | TypeScript-first schema validation for every request body |
| **nodemailer** | Latest | SMTP email delivery for OTPs, tickets, and notification emails |
| **google-auth-library** | Latest | Google OAuth 2.0 ID token verification |
| **node-fetch** | Latest | Facebook OAuth token exchange HTTP calls |
| **cors** | Latest | Cross-Origin Resource Sharing — allowlist with preflight cache |
| **dotenv** | Latest | `.env` environment variable loading |
| **csv-stringify** | Latest | Server-side CSV generation for report downloads |

### 6.2 Frontend

| Technology | Role |
|------------|------|
| **HTML5** | Semantic page structure — 15+ HTML pages |
| **CSS3** | Custom animations, keyframes, gradients, transitions |
| **Vanilla JavaScript ES6+** | All client logic — `fetch()` API, DOM manipulation |
| **Bootstrap 5.3** | Responsive grid, modals, form components |
| **Chart.js** | Interactive pie, bar, and line charts on Reports page |
| **jsPDF** | Client-side PDF report generation and download |
| **SheetJS (xlsx)** | Client-side Excel/CSV export |
| **ExchangeRate API** | Live currency conversion rates |

### 6.3 Infrastructure & Deployment

| Service | Role |
|---------|------|
| **Cloudflare Pages** | Frontend hosting — auto-deploys from GitHub on push |
| **Render** | Backend Node.js server — persistent, auto-deploy |
| **MongoDB Atlas** | Cloud database — free M0 tier, globally accessible |
| **GitHub** | Source control — `NotAshish7/SplitWise` |
| **Custom Domain** | `splitwise.space` — DNS managed via Cloudflare |

### 6.4 Custom CSS Modules

| File | Purpose |
|------|---------|
| `auth-split.css` | Split-screen auth pages (login/signup) — purple gradient theme |
| `topnav.css` | Premium glassmorphic top navigation bar, animated accent line |
| `design-system.css` | Global CSS variables, color palette, typography tokens |
| `responsive.css` | Media queries for mobile/tablet/desktop breakpoints |
| `skeleton-loading.css` | Shimmer animation skeleton placeholders |
| `notifications.css` | Notification panel dropdown styles |
| `performance.css` | `will-change`, `contain`, GPU-compositing hints |

### 6.5 Custom JavaScript Modules

| File | Purpose |
|------|---------|
| `topnav.js` | Dynamically builds top nav HTML, handles mobile drawer, active links |
| `config.js` | Auto-detects API base URL (localhost or production) |
| `auth-check.js` | Route guard — redirects to login if JWT missing/expired |
| `currency.js` | Currency detection, live rate fetch, amount formatting |
| `groups-api.js` | All Groups API calls encapsulated as `window.GroupsAPI.*` |
| `notifications-manager.js` | Polls backend for notifications, updates badge count |
| `notification-panel.js` | Notification dropdown UI, mark-read, delete actions |
| `skeleton-loader.js` | Renders shimmer skeletons for every page's loading state |
| `sw-engine.js` | Core SplitWise utility functions shared across pages |
| `realtime.js` | SSE (Server-Sent Events) client for live data updates |
| `modal-scroll-lock.js` | iOS-safe scroll lock for Bootstrap modals |

---

## 7. UI/UX Design System

### 7.1 Design Philosophy

SplitWise implements a **Premium FinTech Design Language** — moving beyond standard academic projects to deliver an interface competitive with industry apps like Splitwise, Monzo, and Notion.

### 7.2 Color System

| Token | Value | Usage |
|-------|-------|-------|
| Primary | `#6C63FF` | Buttons, active states, links |
| Success/Cash | `#00D4AA` | Positive balances, export Excel |
| Danger | `#FF6B8A` | Debts, delete actions |
| Background Dark | `#0f0c29 → #302b63 → #24243e` | Gradient page backgrounds |
| Surface | `rgba(255,255,255,0.08)` | Glassmorphic card backgrounds |
| Auth Purple | `#667eea → #764ba2` | Login/Signup/Agent portal gradient |
| Auth Crimson | `#c53030 → #744210` | Admin portal gradient |

### 7.3 Auth Pages — Split-Screen Design

Both login and signup pages use a premium **2-column split-screen** layout:
- **Left panel:** Full-height gradient background with floating animated shapes, brand info, and feature list
- **Right panel:** White card with form — email, password, OAuth buttons
- **Mobile:** Left panel collapses — right card fills full screen with gradient background
- **Zero overscroll:** Fixed `body::before` gradient + JS touchmove handler blocks iOS rubber-band effect

### 7.4 Top Navigation Bar

- **Full-width sticky header** with `backdrop-filter: blur` glassmorphic effect
- **Animated 3px rainbow accent line** across the top edge via CSS `@keyframes`
- **Gradient brand text** — "SplitWise" with `linear-gradient` clip
- **Mobile drawer** — slides in from top with `translateY` animation
- **Notification bell** — keyframe ring animation, unread badge count

### 7.5 Skeleton Loading System

Every page displays animated shimmer placeholders during API fetches:
- Structural skeleton shapes match the exact final layout
- CSS `@keyframes shimmer` — gradient sweep left-to-right at 1.5s cycle
- Replaced seamlessly with real data on API response

### 7.6 Micro-Interactions & Animations

- **Button hover:** `translateY(-2px)` lift + deepened `box-shadow`
- **Cards:** Scale + shadow on hover (`transform: scale(1.02)`)
- **Page transitions:** `opacity` + `translateY` fade-in on content load
- **Chart.js:** Animated draw-in on Reports page load
- **Notification panel:** Slide-down with `opacity` and `translateY`

---

## 8. Features & Modules

### Module 1: Authentication & User Management

**Backend:** `routers/auth.js` + `middleware/auth.js`

| Feature | Implementation Detail |
|---------|--------------------|
| **Email Signup** | Zod validated. If email exists but unverified, account updated (not duplicate-rejected). OTP auto-deleted before new one generated. |
| **Email OTP Verification** | 6-digit OTP, 2-min TTL, MongoDB TTL index auto-purges. On verify: JWT issued, welcome email dispatched asynchronously. |
| **JWT Login** | `bcrypt.compare()` validates password. JWT signed 7-day. Stored in `localStorage`. Passed as `Authorization: Bearer <token>`. |
| **Resend OTP** | Deletes all old unused OTPs for email, generates fresh 6-digit code. |
| **Forgot Password** | OTP sent to registered email only (404 if not found — no info leakage). |
| **Reset Password** | Verifies OTP → `bcrypt.hash(newPassword, 10)` → updates DB → appends to `password_history[]`. |
| **Google OAuth 2.0** | `google-auth-library` verifies Google ID token → finds/creates user → issues app JWT. |
| **Facebook OAuth** | `node-fetch` exchanges Facebook access token for profile → finds/creates user → issues app JWT. |
| **Profile Update** | Name, phone, avatar URL, currency preference, theme. |
| **Account Delete** | Cascades deletion of all user expenses, group memberships, notifications. |
| **Cross-Tab Logout** | `localStorage` event listener signs out all open tabs on logout. |
| **Themed Emails** | 5 color themes (verification=indigo, welcome=green, warning=amber, danger=red, info=blue). |

---

### Module 2: Personal Expense Management

**Backend:** `routers/expenses.js` | **Frontend:** `expenses.html`

- **Add Expense:** Title, amount, currency, category (7 options), date, optional notes
- **Edit & Delete:** Full ownership-checked CRUD
- **Advanced Filters:** Keyword search, date range, category filter
- **Summary Endpoint:** Aggregated totals, top category, period stats
- **Compound Index:** `(user_id, spent_at DESC)` for fast sorted queries

---

### Module 3: Group Expense Splitting

**Backend:** `routers/groups.js` — the most complex module

#### Group Lifecycle

| Action | Who | Behaviour |
|--------|-----|----------|
| Create | Any user | Generates unique 8-char uppercase `invite_code` |
| Join | Any user | POST body: `{ code }` — validates code, adds member with `status: 'active'` |
| Invite by Email | Any member | Sends HTML email via Nodemailer with group invite link |
| Leave | Non-owner | Sets `status: 'left'`, records `left_at` timestamp |
| Remove Member | Owner only | Sets `status: 'removed'`, fires in-app notification to removed user |
| Delete Group | Owner only | Marks ALL active members as `left` with same timestamp (soft-delete). Expenses preserved. |
| Previous Groups | Any user | Shows groups where `status ∈ ['left', 'removed']`, with filtered expense history. |

#### Four Split Algorithms

| Method | Key | How It Works |
|--------|-----|-------------|
| **Equal** | `'equal'` | `amount / activeMembers.length` — each member owes the same share |
| **Select** | `'select'` | Only chosen members participate — equal split among selected subset |
| **Percentage** | `'percent'` | Custom `%` per member. Must total 100% |
| **Manual** | `'manual'` | Exact fiat amount per member in `split_data` |

#### Balance Ledger
`GET /api/groups/:id/balances` aggregates all `GroupExpense` documents → returns net "User A owes User B" map via graph-reduction algorithm.

---

### Module 4: Reports & Analytics

**Backend:** `routers/reports.js` | **Frontend:** `reports.html`

| Feature | Implementation |
|---------|--------------|
| **Pie Chart** | Category-wise expense totals → `Chart.js` Doughnut |
| **Bar Chart** | Monthly aggregated totals → `Chart.js` Bar |
| **Line Chart** | Day-by-day expense timeline → `Chart.js` Line |
| **Date Filters** | Preset ranges (30d, 3m, 6m, 1y) + custom date range picker |
| **PDF Export** | `jsPDF` client-side — expense table, summary stats, date range in header |
| **Excel Export** | `SheetJS` client-side — CSV-compatible `.xlsx` with all expense metadata |

---

### Module 5: Payments & Settlements

**Backend:** `routers/payments.js` | **Model:** `Payment.js`

- `POST /api/payments/` — Direct payment between two users
- `POST /api/payments/group` — Group-linked payment (references `group_id` + `expense_id`)
- `GET /api/payments/history` — Full transaction history, both sent and received
- Status enum: `pending | success | failed`

---

### Module 6: In-App Notifications

**Backend:** `routers/notifications.js` | **Frontend:** bell icon + panel

| Event | Trigger | Recipients |
|-------|---------|-----------|
| Member joined group | `POST /api/groups/join` | Group owner |
| Member removed | `POST /api/groups/:id/remove-member` | Removed user |
| Group deleted | `DELETE /api/groups/:id` | All active members |
| Payment received | `POST /api/payments/group` | Receiver |

- Unread badge on top-nav bell icon (auto-polled via SSE)
- Mark single or all as read / delete individual notifications

---

### Module 7: Settings & Personalization

| Setting | Details |
|---------|---------|
| **Profile** | Name, email, phone, avatar URL |
| **Password Change** | Requires current password verification |
| **Currency Preference** | Default display currency — live conversion applied everywhere |
| **Theme Toggle** | Light / Dark — saved to DB, applied on login |
| **Data Export** | Download all personal data as JSON backup |
| **Delete Account** | Permanent — cascades all related data |

---

### Module 8: Support Ticket System

**Backend:** `routers/contact.js` | **Frontend:** `contact.html`, `support-portal.html`

#### Overview
A complete professional support infrastructure with automated ticket management, role-based portals, and branded email workflows.

#### Contact Form → Ticket Pipeline
1. User submits contact form at `contact.html` (name, email, subject, message, category)
2. Backend checks for duplicate tickets (same email + similar subject within 24h)
3. New ticket generated with sequential ID `SW-101`, `SW-102`…
4. **User receives:** Branded confirmation email with ticket details
5. **Admin receives:** Instant notification email

#### Admin Portal (`admin-login.html` → `admin-dashboard.html`)
- Full ticket management — view, filter, assign, resolve, close
- Manage support agents — create tokens, reset passwords, view activity
- Dashboard analytics — open/resolved/total ticket counts
- Red/Crimson theme (`#c53030 → #744210`) — distinct from main site

#### Agent Portal (`support-login.html` → `agent-dashboard.html`)
- View and respond to assigned support tickets
- Internal team notes per ticket
- Multi-step login: Access Token + Password → OTP email reset flow
- Purple theme matching main site (`#667eea → #764ba2`)

#### Support Portal Landing (`support-portal.html`)
- Public-facing hub for admin/agent access selection
- Live stats (open tickets, active agents) via public API
- Scroll-reveal animations, overscroll-locked on mobile

#### Email Workflows
- Ticket confirmation email (sent to user)
- Duplicate ticket notification (redirects to existing ticket)
- Admin/agent resolution notification
- All emails use branded HTML templates via Nodemailer

---

## 9. Project Structure

```
smart-expense-manager/
│
├── backend/
│   ├── .env                        ← Secret config (not committed)
│   ├── .env.example                ← Template for setup
│   ├── package.json
│   └── src/
│       ├── server.js               ← Express app, CORS, route mounting, error handler
│       ├── middleware/
│       │   └── auth.js             ← issueJwt() + requireAuth middleware
│       ├── models/
│       │   ├── User.js             ← Schema: name, email, OAuth IDs, prefs
│       │   ├── Expense.js          ← Schema: user_id, title, amount, currency, category
│       │   ├── Group.js            ← Schema: name, owner_id, invite_code, members[]
│       │   ├── GroupExpense.js     ← Schema: group_id, split_method, split_data, paid_status
│       │   ├── Payment.js          ← Schema: sender_id, receiver_id, amount, status
│       │   ├── Notification.js     ← Schema: user_id, type, title, is_read
│       │   ├── OTP.js              ← Schema: email, code, expires_at (TTL index)
│       │   ├── SupportTicket.js    ← Schema: ticketId (SW-xxx), email, status, messages[]
│       │   └── SupportAgent.js     ← Schema: accessToken, name, email, role, passwordHash
│       ├── routers/
│       │   ├── auth.js             ← signup, verify-email, login, forgot/reset-password, profile
│       │   ├── oauth.js            ← Google OAuth + Facebook OAuth
│       │   ├── expenses.js         ← Personal expense CRUD + summary
│       │   ├── groups.js           ← Group CRUD + 4 split algorithms + balances
│       │   ├── reports.js          ← Chart data + PDF/CSV download
│       │   ├── payments.js         ← Direct + group payments + history
│       │   ├── notifications.js    ← Notification CRUD + createNotificationsForUsers()
│       │   ├── contact.js          ← Support ticket create + public stats
│       │   ├── support.js          ← Agent portal auth (login, OTP reset, profile setup)
│       │   ├── admin.js            ← Admin portal auth + agent management + ticket admin
│       │   ├── sse.js              ← Server-Sent Events for real-time updates
│       │   └── health.js           ← Server + DB status check
│       ├── utils/
│       │   ├── mailer.js           ← sendEmail() via SMTP or console fallback
│       │   ├── AppError.js         ← Custom error class for consistent error handling
│       │   ├── responses.js        ← createStandardResponse(success, data, message)
│       │   └── sseEmitter.js       ← SSE event emitter singleton
│       └── systems/
│           └── mongodb.js          ← connectDB() with event listeners
│
├── frontend/
│   ├── frontend.html               ← Public landing page
│   ├── login.html                  ← Login (email/password + Google/Facebook OAuth)
│   ├── signup.html                 ← Registration + OTP verification step
│   ├── oauth-callback.html         ← OAuth redirect handler
│   ├── index.html                  ← Dashboard (protected)
│   ├── expenses.html               ← Personal expense tracker (protected)
│   ├── groups.html                 ← Group management (protected)
│   ├── reports.html                ← Analytics & reports (protected)
│   ├── settings.html               ← User settings (protected)
│   ├── contact.html                ← Support ticket submission (public)
│   ├── support-portal.html         ← Support team portal landing (public)
│   ├── admin-login.html            ← Admin authentication (crimson theme)
│   ├── admin-dashboard.html        ← Admin ticket & agent management (protected)
│   ├── support-login.html          ← Agent multi-step authentication (purple theme)
│   ├── agent-dashboard.html        ← Agent ticket handling (protected)
│   ├── css/
│   │   ├── auth-split.css          ← Split-screen auth pages design system
│   │   ├── topnav.css              ← Top navigation bar styles
│   │   ├── design-system.css       ← Global CSS design tokens
│   │   ├── responsive.css          ← All media query breakpoints
│   │   ├── skeleton-loading.css    ← Shimmer loading animations
│   │   ├── notifications.css       ← Notification panel styles
│   │   └── performance.css         ← GPU compositing hints
│   └── js/
│       ├── topnav.js               ← Top nav builder & mobile drawer
│       ├── config.js               ← API_BASE_URL auto-detection
│       ├── auth-check.js           ← JWT guard + cross-tab logout
│       ├── groups-api.js           ← window.GroupsAPI — all group HTTP calls
│       ├── currency.js             ← Live exchange rates + formatting
│       ├── notifications-manager.js← Notification polling + badge
│       ├── notification-panel.js   ← Notification dropdown UI
│       ├── skeleton-loader.js      ← Page-specific skeleton renders
│       ├── sw-engine.js            ← Shared utility functions
│       ├── realtime.js             ← SSE client for live data updates
│       └── modal-scroll-lock.js    ← iOS-safe Bootstrap modal scroll lock
│
├── .gitignore
├── restart-both.bat                ← One-click Windows local start
├── restart-frontend.bat
└── README.md
```

---

## 10. Database Design

MongoDB Atlas (NoSQL) with 9 collections via Mongoose ODM.

### 10.1 Entity Relationship

```
User ──< Expense           (user_id FK)
User ──< Group             (owner_id FK)
User >──< Group            (members[] embedded array)
Group ──< GroupExpense     (group_id FK)
GroupExpense >──< User     (paid_by string, split_data map, paid_status map)
User ──< Payment           (sender_id, receiver_id FK)
Group ──< Payment          (group_id optional FK)
User ──< Notification      (user_id FK)
User ──< OTP               (email field, TTL auto-expires)
SupportTicket              (standalone — email as identifier)
SupportAgent               (standalone — accessToken as identifier)
```

### 10.2 Collection Schemas

#### `users`
```js
{
  name:               String   required, trimmed
  email:              String   required, unique, lowercase, indexed
  password_hash:      String   required (bcrypt 10 rounds)
  email_verified:     Boolean  default: false
  preferred_currency: String   enum: ['INR','USD','EUR','GBP','JPY','AUD'], default: 'INR'
  theme:              String   enum: ['light','dark'], default: 'light'
  phone:              String   default: null
  avatar:             String   URL, default: null
  google_id:          String   sparse indexed
  facebook_id:        String   sparse indexed
  password_history:   [{ hash, changed_at }]
  timestamps:         (createdAt, updatedAt)
}
```

#### `expenses`
```js
{
  user_id:   ObjectId → User    required
  title:     String             required, trimmed
  amount:    Number             required, min: 0
  currency:  String             enum currencies
  category:  String             required
  spent_at:  Date               required
  notes:     String             default: null
}
Compound Index: { user_id: 1, spent_at: -1 }
```

#### `groups`
```js
{
  name:        String       required, trimmed
  owner_id:    ObjectId     → User, required
  invite_code: String       required, unique, uppercase, indexed
  description: String       default: null
  members: [{
    user_id:    ObjectId    → User
    status:     String      enum: ['active','left','removed']
    joined_at:  Date        default: now
    left_at:    Date        default: null
    removed_at: Date        default: null
    removed_by: ObjectId    → User, default: null
  }]
}
```

#### `groupexpenses`
```js
{
  group_id:     ObjectId → Group   required
  description:  String             required, trimmed
  amount:       Number             required, min: 0
  currency:     String             enum currencies
  paid_by:      String             (user ID as string)
  date:         Date               required
  split_method: String             enum: ['equal','select','percent','manual']
  split_data:   Mixed              { userId: amount|percentage }
  paid_status:  Mixed              { userId: Boolean }
  created_by:   ObjectId → User    required
  notes:        String             default: null
}
Compound Index: { group_id: 1, date: -1 }
```

#### `supporttickets`
```js
{
  ticketId:    String       sequential, unique — e.g. "SW-101"
  name:        String       submitter name
  email:       String       submitter email
  subject:     String
  message:     String
  category:    String       enum: ['billing','technical','account','general','other']
  status:      String       enum: ['open','in-progress','resolved','closed']
  priority:    String       enum: ['low','medium','high','urgent']
  assignedTo:  ObjectId     → SupportAgent, optional
  replies:     [{ author, message, isInternal, createdAt }]
  timestamps:  (createdAt, updatedAt)
}
```

#### `supportagents`
```js
{
  accessToken:        String   unique, uppercase — e.g. "SW-9939"
  passwordHash:       String   bcrypt 10 rounds
  name:               String   set on first login
  email:              String   set on first login
  role:               String   enum: ['support_agent','senior_agent','team_lead']
  needsPasswordChange:Boolean  true on first login
  needsProfileSetup:  Boolean  true until profile completed
  isActive:           Boolean  default: true
  lastLogin:          Date
  timestamps:         (createdAt, updatedAt)
}
```

---

## 11. API Documentation

### Standard Response Format
```json
{ "success": true, "data": { ... } }
{ "success": false, "data": null, "message": "Error description" }
```

**Production Base URL:** `https://api.splitwise.space/api`
**Local Base URL:** `http://localhost:4000/api`
**Auth Header:** `Authorization: Bearer <JWT_TOKEN>`

### 11.1 Auth — `/api/auth`
| Method | Endpoint | Auth | Description |
|--------|----------|:----:|-------------|
| POST | `/signup` | ❌ | Register + send OTP email |
| POST | `/verify-email` | ❌ | Verify OTP → receive JWT |
| POST | `/resend-otp` | ❌ | Resend verification OTP |
| POST | `/login` | ❌ | Login → receive JWT (7-day) |
| POST | `/forgot-password` | ❌ | Send password reset OTP |
| POST | `/reset-password` | ❌ | Verify OTP → set new password |
| GET | `/profile` | ✅ | Get current user profile |
| PUT | `/profile` | ✅ | Update name, phone, avatar, currency, theme |
| PUT | `/change-password` | ✅ | Change password (verifies current) |
| DELETE | `/account` | ✅ | Delete account and all data |

### 11.2 OAuth — `/api/oauth`
| Method | Endpoint | Auth | Description |
|--------|----------|:----:|-------------|
| GET | `/google/url` | ❌ | Get Google OAuth redirect URL |
| POST | `/google/callback` | ❌ | Exchange Google code → JWT |
| GET | `/facebook/url` | ❌ | Get Facebook OAuth redirect URL |
| POST | `/facebook/callback` | ❌ | Exchange Facebook token → JWT |
| GET | `/verify` | ✅ | Verify JWT token validity |

### 11.3 Expenses — `/api/expenses`
| Method | Endpoint | Auth | Description |
|--------|----------|:----:|-------------|
| POST | `/` | ✅ | Create expense |
| GET | `/` | ✅ | List expenses (filters: category, date range, search, currency) |
| GET | `/summary` | ✅ | Aggregated stats (total, by-category, period) |
| GET | `/:id` | ✅ | Get single expense |
| PUT | `/:id` | ✅ | Update expense |
| DELETE | `/:id` | ✅ | Delete expense |

### 11.4 Groups — `/api/groups`
| Method | Endpoint | Auth | Description |
|--------|----------|:----:|-------------|
| POST | `/` | ✅ | Create group |
| GET | `/` | ✅ | List user's active groups |
| GET | `/previous` | ✅ | Groups user left/was removed from |
| GET | `/:id` | ✅ | Group detail + populated members |
| POST | `/join` | ✅ | Join via invite code |
| POST | `/send-invite` | ✅ | Email invite to join group |
| POST | `/:id/leave` | ✅ | Leave group |
| POST | `/:id/remove-member` | ✅ | Owner removes a member |
| DELETE | `/:id` | ✅ | Soft-delete group (owner) |
| GET | `/:id/expenses` | ✅ | List group expenses |
| POST | `/:id/expenses` | ✅ | Add group expense (runs split algorithm) |
| PUT | `/:id/expenses/:eid` | ✅ | Update group expense |
| DELETE | `/:id/expenses/:eid` | ✅ | Delete group expense |
| PATCH | `/:id/expenses/:eid/pay` | ✅ | Mark member's share as paid |
| GET | `/:id/balances` | ✅ | Net balance ledger |

### 11.5 Reports — `/api/reports`
| Method | Endpoint | Auth | Description |
|--------|----------|:----:|-------------|
| GET | `/charts` | ✅ | Category totals + monthly breakdown for Chart.js |
| GET | `/download/pdf` | ✅ | PDF file stream |
| GET | `/download/csv` | ✅ | CSV file stream |

### 11.6 Payments — `/api/payments`
| Method | Endpoint | Auth | Description |
|--------|----------|:----:|-------------|
| POST | `/` | ✅ | Record direct payment |
| POST | `/group` | ✅ | Record group-linked payment |
| GET | `/history` | ✅ | Payment transaction history |

### 11.7 Notifications — `/api/notifications`
| Method | Endpoint | Auth | Description |
|--------|----------|:----:|-------------|
| GET | `/` | ✅ | Paginated list |
| PATCH | `/:id/read` | ✅ | Mark one as read |
| PATCH | `/read-all` | ✅ | Mark all as read |
| DELETE | `/:id` | ✅ | Delete notification |

### 11.8 Contact / Support — `/api/contact`
| Method | Endpoint | Auth | Description |
|--------|----------|:----:|-------------|
| POST | `/` | ❌ | Submit support ticket |
| GET | `/public/stats` | ❌ | Open ticket count + active agent count |

### 11.9 Agent Auth — `/api/support/auth`
| Method | Endpoint | Auth | Description |
|--------|----------|:----:|-------------|
| POST | `/login` | ❌ | Agent login (access token + password) |
| POST | `/change-password` | Agent JWT | Set permanent password (first login) |
| POST | `/setup-profile` | Agent JWT | Set name, email, role (first login) |
| POST | `/request-otp` | ❌ | Request OTP for password reset |
| POST | `/verify-otp-reset` | ❌ | Verify OTP + set new password |

### 11.10 Health
| Method | Endpoint | Auth | Description |
|--------|----------|:----:|-------------|
| GET | `/api/health` | ❌ | Server + DB status check |

---

## 12. Security Implementation

| Measure | Implementation |
|---------|--------------|
| **Password Hashing** | `bcryptjs` — 10 salt rounds. Stored ONLY as hash. `bcrypt.compare()` for verification. |
| **JWT Auth** | `jsonwebtoken` — 7-day signed tokens. All protected routes pass through `requireAuth` middleware. |
| **OTP Expiry** | MongoDB TTL index on `expires_at` — OTPs auto-purged after 2 minutes. |
| **Input Validation** | Every route uses `zod` schema `.safeParse()`. Invalid payloads rejected with HTTP 400 before reaching DB. |
| **CORS Policy** | Allowlist: localhost ports + `splitwise.space`. Explicit `OPTIONS` preflight handler with 24hr cache. |
| **Resource Ownership** | All sensitive operations verify `req.user.id === resource.owner_id` before mutation. |
| **OAuth Verification** | Google ID tokens verified against Google's public keyserver. Never trusted blindly. |
| **Password History** | `password_history[]` stores last N hashes — prevents password reuse. |
| **Environment Secrets** | All secrets in `.env` (not committed). JWT_SECRET, DB URI, OAuth credentials, SMTP. |
| **Error Sanitization** | `AppError` class + global handler returns generic messages, never raw stack traces. |
| **Agent Token Auth** | Support agents authenticate via opaque access tokens (`SW-XXXX`) + bcrypt password. |
| **iOS Overscroll** | JS touchmove handlers prevent rubber-band data leakage through manipulated scroll gestures. |

---

## 13. Installation & Setup

### Prerequisites
- **Node.js** v18+ — [nodejs.org](https://nodejs.org/)
- **MongoDB** Community (local) or [Atlas](https://www.mongodb.com/atlas) cloud URI
- **npm** (bundled with Node.js)

### Step-by-Step

```bash
# 1. Navigate to project folder
cd smart-expense-manager

# 2. Install backend dependencies
cd backend
npm install

# 3. Configure environment variables
copy .env.example .env
# Edit .env with your values (see Section 14)

# 4. Start MongoDB (if using local)
net start MongoDB

# 5. Start backend (Terminal 1)
cd backend
npm run dev
# → API live at http://localhost:4000

# 6. Serve frontend (Terminal 2)
cd frontend
npx http-server -p 5500 -c-1
# → App live at http://localhost:5500
```

**Windows one-click:** Double-click `restart-both.bat`

---

## 14. Environment Variables

```env
# backend/.env

PORT=4000
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/splitwise
JWT_SECRET=your-very-strong-secret-change-this

# CORS
FRONTEND_URL=https://splitwise.space

# Email (SMTP) — leave blank to print OTPs in terminal
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your-email@gmail.com
MAIL_PASS=your-16-char-app-password
MAIL_FROM_NAME=SplitWise

# Google OAuth — https://console.cloud.google.com
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret

# Facebook OAuth — https://developers.facebook.com
FACEBOOK_APP_ID=your-app-id
FACEBOOK_APP_SECRET=your-app-secret
```

> **Dev Tip:** Without SMTP credentials, all OTPs print directly to the backend terminal — no email account needed for local testing.

---

## 15. Running the Application

### Local URLs

| URL | Page | Access |
|-----|------|--------|
| `http://localhost:5500/frontend.html` | Landing Page | Public |
| `http://localhost:5500/login.html` | Login | Public |
| `http://localhost:5500/signup.html` | Register | Public |
| `http://localhost:5500/index.html` | Dashboard | 🔒 Login Required |
| `http://localhost:5500/expenses.html` | Expenses | 🔒 Login Required |
| `http://localhost:5500/groups.html` | Groups | 🔒 Login Required |
| `http://localhost:5500/reports.html` | Reports & Analytics | 🔒 Login Required |
| `http://localhost:5500/settings.html` | Settings | 🔒 Login Required |
| `http://localhost:5500/contact.html` | Contact / Support | Public |
| `http://localhost:5500/support-portal.html` | Support Portal | Public |
| `http://localhost:5500/admin-login.html` | Admin Login | Admin Only |
| `http://localhost:5500/support-login.html` | Agent Login | Agents Only |

### Production URLs (Live)

| URL | Page |
|-----|------|
| `https://splitwise.space` | Landing Page |
| `https://splitwise.space/login.html` | Login |
| `https://splitwise.space/index.html` | Dashboard |
| `https://splitwise.space/support-portal.html` | Support Portal |
| `https://api.splitwise.space/api/health` | API Health Check |

---

## 16. Limitations

1. **No Real Payments** — Payment module records acknowledgements only; no actual money movement.
2. **Console OTP Fallback** — Without SMTP setup, OTPs print to terminal.
3. **Single Server** — No load balancing, containerization (Docker/Kubernetes), or horizontal scaling.
4. **No Recurring Expenses** — All expenses must be added manually; no scheduling automation.
5. **No Budget Enforcement** — No alerts when spending exceeds user-defined limits.
6. **Exchange Rate API Dependency** — Currency conversion fails if ExchangeRate API is unavailable.
7. **No Offline Support** — App requires internet; no Service Worker caching for offline use.
8. **SMS OTP — Console Only** — `sms.js` is a Twilio-ready stub; real SMS delivery not configured.
9. **OAuth Cold-Start** — On Render's free tier, the backend may take ~30s to warm up after inactivity; OAuth popup may occasionally fail on first click.

---

## 17. Future Scope

1. **📱 Cross-Platform Mobile App** — React Native or Flutter app consuming the existing REST API.
2. **🤖 AI Budget Intelligence** — ML model analyzing spending patterns → personalized budget recommendations.
3. **🔁 Recurring Expenses** — Cron-job scheduled auto-adding of rent, subscriptions, EMIs.
4. **💳 Payment Gateway** — Razorpay / Stripe / UPI integration for real in-app debt settlement.
5. **📸 Receipt OCR** — Tesseract.js or Google Vision API to parse physical receipts into expense entries.
6. **📊 Budget Limits & Alerts** — User-set monthly category budgets with push/email alerts.
7. **🌐 i18n / Multi-Language** — Hindi, Tamil, Regional Indian language support.
8. **🔔 Web Push Notifications** — Service Workers + Push API for real-time alerts when app is closed.
9. **🏦 Open Banking / Plaid** — Auto-import transactions from linked bank accounts and credit cards.
10. **🐳 Docker Containerization** — Dockerfile + docker-compose for reproducible local dev environments.

---

## 18. Conclusion

**SplitWise** successfully demonstrates the complete lifecycle of a modern, production-grade full-stack web application within an academic setting. The project is **live at [splitwise.space](https://splitwise.space)** and delivers:

- **Full-stack engineering:** Express.js REST API with 10+ routers, 9 MongoDB models, Mongoose ODM, JWT authentication, OAuth 2.0 social login
- **Algorithmic complexity:** Four distinct mathematical expense-splitting algorithms with real-time balance ledger computation
- **Security depth:** bcrypt hashing, JWT middleware, Zod schema validation, CORS policies, TTL-based OTP auto-expiry, password history
- **Premium UX:** Glassmorphic top navigation, CSS skeleton shimmer loading, micro-interaction animations, mobile-first responsive design with full iOS overscroll handling
- **Support Infrastructure:** Complete ticket management system with admin/agent role-based portals and branded email workflows
- **Production Deployment:** Cloudflare Pages + Render + MongoDB Atlas + custom domain

The system is architecturally scalable — the RESTful API backend is ready to serve React Native or Flutter mobile clients without modification. The modular codebase supports clear separation of concerns and straightforward feature addition. This project provided deep, practical experience in API design, database modeling, security implementation, OAuth integration, CSS animation engineering, deployment pipelines, and responsive UI development — all directly applicable to real-world software engineering roles.

---

## 19. References

1. Node.js — https://nodejs.org/en/docs/
2. Express.js — https://expressjs.com/en/4x/api.html
3. MongoDB Documentation — https://www.mongodb.com/docs/
4. Mongoose ODM — https://mongoosejs.com/docs/guide.html
5. JSON Web Tokens — https://jwt.io/introduction
6. bcryptjs — https://www.npmjs.com/package/bcryptjs
7. Zod Validation — https://zod.dev/
8. Bootstrap 5.3 — https://getbootstrap.com/docs/5.3/
9. Chart.js — https://www.chartjs.org/docs/latest/
10. jsPDF — https://artskydj.github.io/jsPDF/docs/
11. SheetJS — https://sheetjs.com/
12. Nodemailer — https://nodemailer.com/about/
13. Google OAuth 2.0 — https://developers.google.com/identity/protocols/oauth2
14. Facebook Login — https://developers.facebook.com/docs/facebook-login/
15. ExchangeRate API — https://www.exchangerate-api.com/docs/
16. Cloudflare Pages — https://developers.cloudflare.com/pages/
17. Render Deployment — https://render.com/docs

---

## 👨‍💻 Author

| | |
|---|---|
| **Name** | Ashish |
| **Role** | Full Stack Developer |
| **Project** | Major Project — SplitWise |
| **Academic Year** | 2025–2026 |
| **Live Site** | https://splitwise.space |
| **Contact** | support@splitwise.space |

---

<div align="center">

**Made with ❤️ by Ashish**

*SplitWise — Track smarter. Split easily. Stay on budget.*

[![Live Demo](https://img.shields.io/badge/🚀_Live_Demo-splitwise.space-667eea?style=for-the-badge)](https://splitwise.space)

</div>
