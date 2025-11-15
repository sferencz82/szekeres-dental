# Backend (server/)

Express + TypeScript service that backs the public website. It exposes three REST endpoints under `/api`:

| Method | Endpoint              | Description                                |
| ------ | --------------------- | ------------------------------------------ |
| POST   | `/api/contact`        | Sends contact form submissions via e-mail. |
| POST   | `/api/appointments`   | Stores + e-mails booking requests.         |
| GET    | `/api/availability`   | Returns open slots for a given date.       |

## Prerequisites

- Node.js 18+
- npm 9+

## Installation

```bash
cd server
npm install
```

## Environment variables

Create a `.env` file (or copy [`server/.env.example`](./.env.example)) with:

| Variable           | Required | Description |
| ------------------ | -------- | ----------- |
| `PORT`             | No       | Port for the Express server (defaults to `4000`). |
| `CONTACT_TO_EMAIL` | Yes      | Where contact + booking messages are sent. |
| `SMTP_HOST`        | Yes      | SMTP host used by Nodemailer. |
| `SMTP_PORT`        | Yes      | SMTP port (`465` for SSL, otherwise STARTTLS). |
| `SMTP_USER`        | Yes      | SMTP username or API key. |
| `SMTP_PASS`        | Yes      | SMTP password / secret. |

## Available scripts

| Command        | Description |
| -------------- | ----------- |
| `npm run dev`  | Runs `ts-node` with live reload for development. |
| `npm run build`| Compiles TypeScript into `dist/`. |
| `npm start`    | Executes the compiled JavaScript from `dist/`. |

## Running locally

1. `npm run dev` to start the API at <http://localhost:4000>.
2. Update the frontend `.env` so `VITE_API_BASE_URL=http://localhost:4000` if you are not using the default.

Logs are printed to stdout; unhandled errors return JSON `{ success: false, error: string }`.
