# 💰 SplitWise — Smart Expense Manager

> **Minor Project Report Documentation** | Full Stack Web Application
> *Intelligent personal finance tracking, group expense splitting & visual analytics*

![Node.js](https://img.shields.io/badge/Node.js-v18+-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-4.x-000000?logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-8.x-47A248?logo=mongodb&logoColor=white)
![Bootstrap](https://img.shields.io/badge/Bootstrap-5.x-7952B3?logo=bootstrap&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?logo=javascript&logoColor=black)
![License](https://img.shields.io/badge/License-Educational-blue)

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

**SplitWise** is a comprehensive, production-grade full-stack web application engineered as an academic **Minor Project**. It solves real-world problems in personal finance tracking and multi-user expense splitting by providing a unified digital platform accessible from any modern browser.

The application delivers a complete financial management ecosystem: secure JWT-based authentication with email OTP verification, multi-currency personal expense tracking, intelligent group expense splitting with four distinct algorithms, real-time balance ledgers, interactive visual analytics, exportable PDF/Excel reports, an in-app notification system, and a premium responsive UI built entirely with Vanilla HTML/CSS/JS.

### Project Identity

| Field | Details |
|-------|---------|
| **Project Name** | SplitWise |
| **Category** | Minor Project — Full Stack Web Application |
| **Domain** | Personal Finance / FinTech |
| **Developer** | Ashis |
| **Academic Year** | 2025–2026 |
| **Backend** | Node.js v18+ + Express.js 4.x + MongoDB 8.x |
| **Frontend** | HTML5 + CSS3 + Vanilla JavaScript ES6+ + Bootstrap 5 |
| **Contact** | smartexpensemanager7@gmail.com |

---

## 2. Problem Statement

People routinely share expenses — rent with roommates, bills at restaurants, costs on group trips — yet no simple, unified tool exists for students and everyday users to simultaneously track *personal* spending and *shared* bills in one place.

Traditional approaches (spreadsheets, paper notes, mental arithmetic) are:
- **Error-prone:** Manual calculation mistakes cause disputes.
- **Non-transparent:** No audit trail of who paid what and when.
- **Fragmented:** Personal expenses live separately from group tabs.
- **Inaccessible:** No real-time access or visual summary across devices.

**SplitWise solves all four problems** by providing a unified, secure, always-accessible web application with mathematical precision in all settlements.

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
| Responsive Design | Mobile, tablet, and desktop optimized |
| Top Navigation | Premium glassmorphic top nav replacing legacy sidebar |

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
┌──────────────────────────────────────────────────────────┐
│                  CLIENT LAYER (Browser)                   │
│  HTML5 Pages · CSS3 Animations · Vanilla ES6 JavaScript  │
│  Bootstrap 5 · Chart.js · jsPDF · SheetJS                │
│  Pages: Landing → Auth → Dashboard → Expenses →          │
│          Groups → Reports → Settings                      │
└─────────────────────────┬────────────────────────────────┘
                          │
                 HTTP/HTTPS REST API
                 JSON Request/Response
                 Bearer JWT in Headers
                          │
                          ▼
┌──────────────────────────────────────────────────────────┐
│              SERVER LAYER (Node.js + Express.js)          │
│  Port: 4000                                               │
│  ┌──────────────────────────────────────────────────┐    │
│  │  Middleware Stack                                 │    │
│  │  CORS · express.json · JWT Token Passthrough      │    │
│  │  requireAuth (JWT Verify) · Zod Validation        │    │
│  │  Global Error Handler                             │    │
│  └──────────────────────────────────────────────────┘    │
│  ┌──────────────────────────────────────────────────┐    │
│  │  REST API Routers                                 │    │
│  │  /api/auth · /api/oauth · /api/expenses           │    │
│  │  /api/groups · /api/reports · /api/payments       │    │
│  │  /api/notifications · /api/reminders · /api/health│    │
│  └──────────────────────────────────────────────────┘    │
└─────────────────────────┬────────────────────────────────┘
                          │
                  Mongoose ODM
                          │
                          ▼
┌──────────────────────────────────────────────────────────┐
│              DATA LAYER (MongoDB)                         │
│  Collections: users · expenses · groups                   │
│  groupexpenses · payments · notifications · otps          │
└──────────────────────────────────────────────────────────┘
```

### 5.2 Request Lifecycle

1. Browser calls `fetch()` → Express router receives request
2. CORS middleware validates origin
3. `requireAuth` middleware verifies JWT in `Authorization: Bearer` header
4. Zod schema validates `req.body` — rejects malformed input with HTTP 400
5. Business logic runs (splitting algorithm, query, etc.)
6. Mongoose writes/reads from MongoDB
7. `createStandardResponse()` formats: `{ success, data, message }`
8. Response sent → Frontend renders dynamically (no page reload)

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
| **MongoDB** | 8.x | NoSQL document database (flexible schemas, horizontal scale) |
| **Mongoose** | 8.x | ODM — schema definitions, validation, indexing, population |
| **jsonwebtoken** | Latest | JWT signing (`issueJwt`) and verification (`requireAuth`) with 7-day expiry |
| **bcryptjs** | Latest | Password hashing — 10 salt rounds, one-way irreversible |
| **zod** | Latest | TypeScript-first schema validation for every request body |
| **nodemailer** | Latest | SMTP email delivery for OTPs, welcome, and notification emails |
| **google-auth-library** | Latest | Google OAuth 2.0 ID token verification |
| **node-fetch** | Latest | Facebook OAuth token exchange HTTP calls |
| **cors** | Latest | Cross-Origin Resource Sharing — allows localhost + devtunnels |
| **dotenv** | Latest | `.env` environment variable loading |
| **csv-stringify** | Latest | Server-side CSV generation for report downloads |

### 6.2 Frontend

| Technology | Role |
|------------|------|
| **HTML5** | Semantic page structure — 9 HTML pages |
| **CSS3** | Custom animations, keyframes, gradients, transitions |
| **Vanilla JavaScript ES6+** | All client logic — `fetch()` API, DOM manipulation, modules |
| **Bootstrap 5** | Responsive grid, modals, form components |
| **Chart.js** | Interactive pie, bar, and line charts on Reports page |
| **jsPDF** | Client-side PDF report generation and download |
| **SheetJS (xlsx)** | Client-side Excel/CSV export |
| **ExchangeRate API** | Live currency conversion rates |

### 6.3 Custom CSS Modules

| File | Purpose |
|------|---------|
| `topnav.css` | Premium glassmorphic top navigation bar, animated accent line |
| `design-system.css` | Global CSS variables, color palette, typography tokens |
| `responsive.css` | Media queries for mobile/tablet/desktop breakpoints |
| `skeleton-loading.css` | Shimmer animation skeleton placeholders |
| `notifications.css` | Notification panel dropdown styles |
| `collapsible-sidebar.css` | Legacy sidebar animation (kept for compatibility) |
| `navigation.css` | Supplemental navigation styles |
| `performance.css` | `will-change`, `contain`, GPU-compositing hints |

### 6.4 Custom JavaScript Modules

| File | Purpose |
|------|---------|
| `topnav.js` | Dynamically builds top nav HTML, handles mobile drawer, active links |
| `config.js` | Auto-detects API base URL (`localhost:4000` or devtunnel) |
| `auth-check.js` | Route guard — redirects to login if JWT missing/expired |
| `currency.js` | Currency detection, live rate fetch, amount formatting |
| `groups-api.js` | All Groups API calls encapsulated as `window.GroupsAPI.*` |
| `notifications-manager.js` | Polls backend for notifications, updates badge count |
| `notification-panel.js` | Notification dropdown UI, mark-read, delete actions |
| `skeleton-loader.js` | Renders shimmer skeletons for every page's loading state |
| `navigation-init.js` | Mobile bottom nav builder, sidebar toggle coordination |
| `sw-engine.js` | Core SplitWise utility functions shared across pages |
| `sidebar-toggle.js` | Desktop sidebar collapse/expand with localStorage sync |
| `prevent-auto-scroll.js` | Prevents unwanted scroll-to-top on dynamic content changes |

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
| Text Primary | `#1a1233` | Headings (light mode) |
| Accent Gradient | `135deg, #6C63FF → #00D4AA` | Icons, brand elements |

### 7.3 Top Navigation Bar (`topnav.js` + `topnav.css`)

Replacing the legacy sidebar, the new top navigation delivers:
- **Full-width sticky header** with `backdrop-filter: blur` glassmorphic effect
- **Animated 3px rainbow accent line** across the top edge via CSS `@keyframes`
- **Gradient brand text** — "SplitWise" with `linear-gradient` clip
- **Active link states** — bottom underline accent + subtle glow on current page
- **Notification bell** — keyframe ring animation on click, unread badge count
- **Mobile drawer** — slides in from top with `translateY` animation + swipe-close gesture
- **Tablet view** — links hidden, only brand and notification bell visible

### 7.4 Skeleton Loading System (`skeleton-loading.css` + `skeleton-loader.js`)

Every page displays animated shimmer placeholders during API fetches:
- Structural skeleton shapes match exact final layout
- CSS `@keyframes shimmer` — gradient sweep left-to-right at 1.5s cycle
- Skeleton replaced seamlessly with real data on API response

### 7.5 Micro-Interactions & Animations

- **Button hover:** `translateY(-2px)` lift + deepened `box-shadow`
- **Cards:** Scale + shadow on hover (`transform: scale(1.02)`)
- **Page transitions:** `opacity` + `translateY` fade-in on content load
- **Chart.js:** Animated draw-in on Reports page load
- **Modal open/close:** Bootstrap + custom easing curves
- **Notification panel:** Slide-down with `opacity` and `translateY`

---

## 8. Features & Modules

### Module 1: Authentication & User Management

**Backend:** `routers/auth.js` (1,290 lines) + `middleware/auth.js`

| Feature | Implementation Detail |
|---------|----------------------|
| **Email Signup** | Zod validated (`name ≥ 2 chars`, valid email, `password ≥ 6 chars`). If email exists but unverified, account is updated (not duplicate-rejected). OTP auto-deleted before new one generated. |
| **Email OTP Verification** | 6-digit OTP, 2-min TTL, stored in `otps` collection via TTL index. On verify: JWT issued, welcome email dispatched asynchronously (non-blocking). |
| **JWT Login** | `bcrypt.compare()` validates password. JWT signed with `JWT_SECRET`, 7-day expiry. Stored in `localStorage`. Passed as `Authorization: Bearer <token>`. |
| **Resend OTP** | Deletes all old unused OTPs for email, generates fresh 6-digit code. |
| **Forgot Password** | OTP sent to registered email (returns 404 if email not found — no info leakage). |
| **Reset Password** | Verifies OTP → `bcrypt.hash(newPassword, 10)` → updates DB → appends to `password_history[]`. |
| **Password History** | Last N hashes stored in `user.password_history[]` to prevent reuse. |
| **Google OAuth 2.0** | `routers/oauth.js` — `google-auth-library` verifies Google ID token → finds/creates user → issues app JWT |
| **Facebook OAuth** | `node-fetch` exchanges Facebook access token for profile → finds/creates user → issues app JWT |
| **Profile Update** | PUT `/api/auth/profile` — name, phone, avatar URL, currency preference, theme |
| **Account Delete** | Cascades deletion of all user expenses, group memberships, notifications |
| **Cross-Tab Logout** | `localStorage` event listener in `auth-check.js` signs out all open tabs on logout |
| **Themed Emails** | 5 color themes (verification=indigo, welcome=green, warning=amber, danger=red, info=blue) built by `createEmailTemplate()` |

### Module 2: Personal Expense Management

**Backend:** `routers/expenses.js` | **Frontend:** `expenses.html`

- **Add Expense:** Title, amount, currency, category (7 options), date (`spent_at`), optional notes
- **Edit & Delete:** Full ownership-checked CRUD
- **Advanced Filters:** Keyword search, date range (`start_date`/`end_date`), category filter
- **Summary Endpoint:** `GET /api/expenses/summary` returns aggregated totals, top category, period stats
- **Compound Index:** `(user_id, spent_at DESC)` for fast sorted queries
- **Page Title Bar:** "Manage Expenses" heading + **Add Expense** button — visible in `.sw-page-titlebar` above the content grid

### Module 3: Group Expense Splitting

**Backend:** `routers/groups.js` (1,561 lines) — the most complex module

#### Group Lifecycle
| Action | Who | Behaviour |
|--------|-----|-----------|
| Create | Any user | Generates unique 8-char uppercase `invite_code` |
| Join | Any user | POST body: `{ code }` — validates code, adds member with `status: 'active'` |
| Invite by Email | Any member | Sends HTML email via Nodemailer with group invite link |
| Leave | Non-owner | Sets `status: 'left'`, records `left_at` timestamp |
| Remove Member | Owner only | Sets `status: 'removed'`, records `removed_at`, `removed_by`. Fires in-app notification to removed user. |
| Delete Group | Owner only | Marks ALL active members as `left` with same timestamp (soft-delete). Expenses preserved. |
| Previous Groups | Any user | Shows groups where `status ∈ ['left', 'removed']`. Includes expense history filtered by membership period. |

#### Four Split Algorithms
| Method | Key | How It Works |
|--------|-----|-------------|
| **Equal** | `'equal'` | `amount / activeMembers.length` — each member owes the same share |
| **Select** | `'select'` | Only chosen members participate — equal split among selected subset |
| **Percentage** | `'percent'` | Custom `%` per member stored in `split_data: { userId: pct }`. Must total 100% |
| **Manual** | `'manual'` | Exact fiat amount per member stored in `split_data: { userId: amount }` |

`split_data` and `paid_status` stored as `Mixed` type JSON objects in MongoDB for maximum flexibility.

#### Balance Ledger
`GET /api/groups/:id/balances` runs aggregation across all `GroupExpense` documents for the group → returns net "User A owes User B" map using a graph-reduction algorithm.

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
| **Page Title Bar** | "Reports & Analytics" heading + **Export PDF** + **Export Excel** buttons in `.sw-page-titlebar` |

### Module 5: Payments & Settlements

**Backend:** `routers/payments.js` | **Model:** `Payment.js`

- `POST /api/payments/` — Direct payment between two users
- `POST /api/payments/group` — Group-linked payment (references `group_id` + `expense_id`)
- `GET /api/payments/history` — Full transaction history, both sent and received
- Indexes: `(sender_id, created_at)` + `(receiver_id, created_at)` for fast bi-directional queries
- Status enum: `pending | success | failed`

### Module 6: In-App Notifications

**Backend:** `routers/notifications.js` | **Frontend:** `notifications-manager.js` + `notification-panel.js`

| Event | Trigger | Recipients |
|-------|---------|-----------|
| Member joined group | `POST /api/groups/join` | Group owner |
| Member removed | `POST /api/groups/:id/remove-member` | Removed user |
| Group deleted | `DELETE /api/groups/:id` | All active members |
| Payment received | `POST /api/payments/group` | Receiver |

- Unread badge on top-nav bell icon, auto-polled
- Mark single or all as read
- Delete individual notifications
- Email fallback via Nodemailer for critical events

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

## 9. Project Structure

```
smart-expense-manager/
│
├── backend/
│   ├── .env                      ← Secret config (PORT, MONGODB_URI, JWT_SECRET, etc.)
│   ├── .env.example              ← Template for setup
│   ├── package.json
│   └── src/
│       ├── server.js             ← Express app, CORS config, route mounting, error handler
│       ├── middleware/
│       │   └── auth.js           ← issueJwt() + requireAuth middleware
│       ├── models/
│       │   ├── User.js           ← Schema: name, email, password_hash, OAuth IDs, prefs
│       │   ├── Expense.js        ← Schema: user_id, title, amount, currency, category, spent_at
│       │   ├── Group.js          ← Schema: name, owner_id, invite_code, members[]
│       │   ├── GroupExpense.js   ← Schema: group_id, amount, split_method, split_data, paid_status
│       │   ├── Payment.js        ← Schema: sender_id, receiver_id, amount, status, group_id
│       │   ├── Notification.js   ← Schema: user_id, type, title, message, is_read
│       │   └── OTP.js            ← Schema: email, code, purpose, expires_at (TTL index)
│       ├── routers/
│       │   ├── auth.js           ← signup, verify-email, login, forgot/reset-password, profile
│       │   ├── oauth.js          ← Google OAuth + Facebook OAuth
│       │   ├── expenses.js       ← Personal expense CRUD + summary
│       │   ├── groups.js         ← Group CRUD + 4 split algorithms + balances
│       │   ├── reports.js        ← Chart data + PDF/CSV download
│       │   ├── payments.js       ← Direct + group payments + history
│       │   ├── notifications.js  ← Notification CRUD + createNotificationsForUsers()
│       │   └── reminders.js      ← Payment reminder scheduling
│       ├── utils/
│       │   ├── mailer.js         ← sendEmail() via SMTP or console fallback
│       │   ├── sms.js            ← sendSMS() — console mode (Twilio-ready stub)
│       │   └── responses.js      ← createStandardResponse(success, data, message)
│       └── systems/
│           ├── mongodb.js        ← connectDB() with event listeners
│           └── db.js             ← In-memory reminder store
│
├── frontend/
│   ├── frontend.html             ← Public landing page
│   ├── login.html                ← Login (email/password + OAuth buttons)
│   ├── signup.html               ← Registration + OTP verification step
│   ├── oauth-callback.html       ← OAuth redirect handler
│   ├── index.html                ← Dashboard (protected)
│   ├── expenses.html             ← Personal expense tracker (protected)
│   ├── groups.html               ← Group management (protected)
│   ├── reports.html              ← Analytics & reports (protected)
│   ├── settings.html             ← User settings (protected)
│   ├── css/
│   │   ├── topnav.css            ← Top navigation bar styles (NEW)
│   │   ├── design-system.css     ← Global CSS design tokens
│   │   ├── responsive.css        ← All media query breakpoints
│   │   ├── skeleton-loading.css  ← Shimmer loading animations
│   │   ├── notifications.css     ← Notification panel styles
│   │   ├── collapsible-sidebar.css (legacy)
│   │   ├── navigation.css
│   │   └── performance.css
│   └── js/
│       ├── topnav.js             ← Top nav builder & mobile drawer (NEW)
│       ├── config.js             ← API_BASE_URL auto-detection
│       ├── auth-check.js         ← JWT guard + cross-tab logout
│       ├── groups-api.js         ← window.GroupsAPI — all group HTTP calls
│       ├── currency.js           ← Live exchange rates + formatting
│       ├── notifications-manager.js ← Notification polling + badge
│       ├── notification-panel.js ← Notification dropdown UI
│       ├── skeleton-loader.js    ← Page-specific skeleton renders
│       ├── navigation-init.js    ← Mobile bottom nav + sidebar init
│       ├── sw-engine.js          ← Shared utility functions
│       ├── sidebar-toggle.js     ← Desktop sidebar collapse
│       └── prevent-auto-scroll.js
│
├── restart-both.bat              ← One-click Windows start
├── restart-frontend.bat
└── README.md
```

---

## 10. Database Design

MongoDB (NoSQL) with 7 collections via Mongoose ODM.

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
```

### 10.2 Collection Schemas (from source code)

#### `users`
```js
{
  name:               String   required, trimmed
  email:              String   required, unique, lowercase, indexed
  password_hash:      String   required (bcrypt 10 rounds)
  email_verified:     Boolean  default: false
  preferred_currency: String   enum: ['INR','USD','EUR','GBP','JPY','AUD'], default: 'INR'
  theme:              String   enum: ['light','dark'], default: 'light'
  sidebar_collapsed:  Boolean  default: false
  phone:              String   default: null
  avatar:             String   URL, default: null
  profile_picture:    String   URL (OAuth), default: null
  google_id:          String   sparse indexed (unique non-null only)
  facebook_id:        String   sparse indexed (unique non-null only)
  password_history:   [{ hash, changed_at }]
  created_at, updated_at       (Mongoose timestamps)
}
```

#### `expenses`
```js
{
  user_id:   ObjectId → User    required, index: (user_id, spent_at DESC)
  title:     String             required, trimmed
  amount:    Number             required, min: 0
  currency:  String             enum: ['INR','USD','EUR','GBP','JPY','AUD']
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
Indexes: invite_code, owner_id
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

#### `payments`
```js
{
  sender_id:   ObjectId → User    required
  receiver_id: ObjectId → User    required
  amount:      Number             required, min: 0
  status:      String             enum: ['pending','success','failed'], default: 'success'
  note:        String             default: null
  group_id:    ObjectId → Group   optional
  expense_id:  ObjectId → GroupExpense  optional
  currency:    String             enum currencies, default: 'INR'
  created_at:  Date               default: now
}
Indexes: (sender_id, created_at), (receiver_id, created_at), group_id
```

#### `notifications`
```js
{
  user_id:    ObjectId → User   required, indexed
  type:       String            e.g. 'member_removed','group_deleted','payment_received'
  title:      String
  message:    String
  group_id:   ObjectId          optional
  expense_id: ObjectId          optional
  metadata:   Object            extra context (groupName, removedBy, etc.)
  is_read:    Boolean           default: false
  createdAt:  Date              (Mongoose timestamps)
}
Compound Indexes: (user_id, createdAt), (user_id, is_read)
```

#### `otps`
```js
{
  email:      String   indexed
  code:       String   6-digit numeric
  purpose:    String   enum: ['email-verification','forgot-password','two-factor']
  expires_at: Date     TTL Index — MongoDB auto-deletes document after this date
  used:       Boolean  default: false
}
```

---

## 11. API Documentation

### Standard Response Format
```json
{ "success": true, "data": { ... } }
{ "success": false, "data": null, "message": "Error description" }
```

**Base URL:** `http://localhost:4000/api`  
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
| GET | `/` | ✅ | List expenses (filters: category, start_date, end_date, search, currency) |
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

### 11.8 Health
| Method | Endpoint | Auth | Description |
|--------|----------|:----:|-------------|
| GET | `/api/health` | ❌ | Server + DB status check |

---

## 12. Security Implementation

| Measure | Implementation |
|---------|---------------|
| **Password Hashing** | `bcryptjs` — 10 salt rounds. Passwords stored ONLY as hash. `bcrypt.compare()` for verification. |
| **JWT Auth** | `jsonwebtoken` — 7-day signed tokens. All protected routes pass through `requireAuth` middleware. Token revocable via localStorage clear. |
| **OTP Expiry** | MongoDB TTL index on `expires_at` — OTPs auto-purged by MongoDB daemon after 2 minutes. |
| **Input Validation** | Every route uses `zod` schema `.safeParse()`. Invalid/malformed payloads rejected with HTTP 400 before reaching DB. |
| **CORS Policy** | Allowlist: `localhost:5500`, `localhost:3000`, VS Code devtunnels. Explicit `OPTIONS` preflight handler. 24-hour preflight cache. |
| **Token in Query Param** | `?token=` query passthrough middleware supports file download streams while maintaining auth. |
| **Resource Ownership** | All sensitive operations verify `req.user.id === resource.owner_id` before allowing mutation. |
| **OAuth Verification** | Google ID tokens verified against Google's public keyserver (`google-auth-library`). Never trusted blindly. |
| **Password History** | `password_history[]` array stores last N hashes to prevent password reuse. |
| **Environment Secrets** | All secrets in `.env` — JWT_SECRET, MONGODB_URI, OAuth credentials. Never in source code. |
| **Error Sanitization** | Global Express error handler returns generic messages in production, never raw stack traces. |

---

## 13. Installation & Setup

### Prerequisites
- **Node.js** v18+ — [nodejs.org](https://nodejs.org/)
- **MongoDB** Community (local port 27017) or [Atlas](https://www.mongodb.com/atlas) cloud URI
- **npm** (bundled with Node.js)

### Step-by-Step

```bash
# 1. Navigate to project folder
cd smart-expense-manager

# 2. Install backend dependencies
cd backend
npm install

# 3. Install frontend dependencies
cd ../frontend
npm install

# 4. Configure environment variables
cd ../backend
copy .env.example .env
# Then edit .env with your values (see Section 14)

# 5. Start MongoDB (Windows service)
net start MongoDB

# 6. Start backend (Terminal 1)
cd backend
npm run dev
# → API live at http://localhost:4000

# 7. Start frontend (Terminal 2)
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
MONGODB_URI=mongodb://localhost:27017/smart-expense-manager
JWT_SECRET=your-very-strong-secret-change-this

# CORS
FRONTEND_URL=http://localhost:5500

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

### Page URLs

| URL | Page | Access |
|-----|------|--------|
| `http://localhost:5500/frontend.html` | Landing Page | Public |
| `http://localhost:5500/login.html` | Login | Public |
| `http://localhost:5500/signup.html` | Register | Public |
| `http://localhost:5500/index.html` | Dashboard | 🔒 Login Required |
| `http://localhost:5500/expenses.html` | Expenses | 🔒 Login Required |
| `http://localhost:5500/groups.html` | Groups | 🔒 Login Required |
| `http://localhost:5500/reports.html` | Reports | 🔒 Login Required |
| `http://localhost:5500/settings.html` | Settings | 🔒 Login Required |

---

## 16. Limitations

1. **No Real Payments** — Payment module records acknowledgements only; no actual money movement.
2. **Console OTP Fallback** — Without SMTP setup, OTPs print to terminal (unsuitable for production deployment).
3. **Single Server** — No load balancing, containerization (Docker/Kubernetes), or horizontal scaling.
4. **No Recurring Expenses** — All expenses must be added manually; no scheduling automation.
5. **No Budget Enforcement** — No alerts when spending exceeds user-defined limits.
6. **Exchange Rate API Dependency** — Currency conversion fails if ExchangeRate API is unavailable.
7. **No Offline Support** — App requires internet; no Service Worker caching for offline use.
8. **SMS OTP — Console Only** — `sms.js` is a Twilio-ready stub; real SMS delivery not configured.
9. **No CI/CD Pipeline** — No automated testing, linting enforcement, or deployment workflow.

---

## 17. Future Scope

1. **📱 Cross-Platform Mobile App** — React Native or Flutter app consuming the existing REST API.
2. **🤖 AI Budget Intelligence** — ML model analyzing spending patterns → personalized budget recommendations.
3. **🔁 Recurring Expenses** — Cron-job scheduled auto-adding of rent, subscriptions, EMIs.
4. **💳 Payment Gateway** — Razorpay / Stripe / UPI integration for real in-app debt settlement.
5. **📸 Receipt OCR** — Tesseract.js or Google Vision API to parse physical receipts into expense entries.
6. **📊 Budget Limits & Alerts** — User-set monthly category budgets with push/email alerts.
7. **🌐 i18n / Multi-Language** — Hindi, Tamil, Regional Indian language support.
8. **☁️ Cloud Deployment** — AWS EC2 / Railway backend + MongoDB Atlas + Vercel/Cloudflare frontend + CI/CD.
9. **🔔 Web Push Notifications** — Service Workers + Push API for real-time alerts when app is closed.
10. **🏦 Open Banking / Plaid** — Auto-import transactions from linked bank accounts and credit cards.

---

## 18. Conclusion

**SplitWise** successfully demonstrates the complete lifecycle of a modern, production-grade full-stack web application within an academic setting. The project delivers:

- **Full-stack engineering:** Express.js REST API with 8 routers, 7 MongoDB models, Mongoose ODM, JWT authentication, OAuth 2.0 social login
- **Algorithmic complexity:** Four distinct mathematical expense-splitting algorithms with real-time balance ledger computation
- **Security depth:** bcrypt hashing, JWT middleware, Zod schema validation, CORS policies, TTL-based OTP auto-expiry, password history
- **Premium UX:** Glassmorphic top navigation, CSS skeleton shimmer loading, micro-interaction animations, mobile-first responsive design
- **Data integrity:** Compound indexes for performance, soft-delete group lifecycle, cascaded notification system

The system is architecturally scalable — the RESTful API backend is ready to serve React Native or Flutter mobile clients without modification. The modular codebase supports clear separation of concerns and straightforward feature addition. This project provided deep, practical experience in API design, database modeling, security implementation, OAuth integration, CSS animation engineering, and responsive UI development — all directly applicable to real-world software engineering roles.

---

## 19. References

1. Node.js — https://nodejs.org/en/docs/
2. Express.js — https://expressjs.com/en/4x/api.html
3. MongoDB Documentation — https://www.mongodb.com/docs/
4. Mongoose ODM — https://mongoosejs.com/docs/guide.html
5. JSON Web Tokens — https://jwt.io/introduction
6. bcryptjs — https://www.npmjs.com/package/bcryptjs
7. Zod Validation — https://zod.dev/
8. Bootstrap 5 — https://getbootstrap.com/docs/5.3/
9. Chart.js — https://www.chartjs.org/docs/latest/
10. jsPDF — https://artskydj.github.io/jsPDF/docs/
11. SheetJS — https://sheetjs.com/
12. Nodemailer — https://nodemailer.com/about/
13. Google OAuth 2.0 — https://developers.google.com/identity/protocols/oauth2
14. Facebook Login — https://developers.facebook.com/docs/facebook-login/
15. ExchangeRate API — https://www.exchangerate-api.com/docs/

---

## 👨‍💻 Author

| | |
|---|---|
| **Name** | Ashis |
| **Role** | Full Stack Developer |
| **Project** | Minor Project — SplitWise |
| **Academic Year** | 2025–2026 |
| **Contact** | smartexpensemanager7@gmail.com |

---

<div align="center">

**Made with ❤️ for Minor Project Submission**

*SplitWise — Track smarter. Split easily. Stay on budget.*

</div>
