# Szekeres Dental

A marketing site and lightweight appointment API for the Szekeres Dental practice. The repository is intentionally split into two folders:

- `src/` – The React (Vite) single-page application that renders the marketing website and lets patients submit booking/contact requests.
- `server/` – A TypeScript Express server that exposes the booking/contact REST API and forwards submissions to the clinic via e-mail.

## Prerequisites

- Node.js 18+ (matches both the Vite dev server and the TypeScript backend requirements)
- npm 9+ (or another Node package manager)

## Local development

### 1. Start the backend

1. `cd server`
2. `npm install`
3. Copy `.env.example` to `.env` (or create a new file) and configure the SMTP credentials listed in [server/README.md](server/README.md).
4. `npm run dev` – starts the Express API on <http://localhost:4000>.

### 2. Start the frontend

The repository root now contains the complete Vite React + TypeScript project. All frontend commands should be executed from this directory (the one that contains `package.json` and `vite.config.ts`).

1. `npm install`
2. Copy `.env.example.frontend` to `.env` (or create `.env`) and set `VITE_API_BASE_URL` if your backend is not running on `http://localhost:4000`.
3. `npm run dev`
4. Open the Vite dev server URL (by default <http://localhost:5173>). Requests to `/api/*` are proxied automatically to `http://localhost:4000`.

> If you are using a different port for the backend, set `VITE_API_BASE_URL` in your frontend `.env` file (see [src/README.md](src/README.md)).

## Project structure

```
.
├── README.md               # High-level overview (this file)
├── src/                    # React single-page application (Vite)
└── server/                 # Express + TypeScript API used by the frontend
```

For more detailed, per-folder instructions (scripts, environment variables, API endpoints) read the dedicated README inside each directory.
