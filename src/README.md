# Frontend (src/)

React + TypeScript single-page application intended to run inside a Vite project. It renders the marketing site, handles smooth
scrolling between sections, and calls the backend for booking/contact actions via [`src/api.ts`](./api.ts).

## Prerequisites

- Node.js 18+
- npm 9+
- A Vite React + TypeScript scaffold (`npm create vite@latest szekeres-dental -- --template react-ts`)

## Installation

1. Ensure you are at the Vite project root (the directory that contains `package.json`, `vite.config.ts`, etc.).
2. Copy or replace the default `src/` folder with the contents of this directory.
3. Install dependencies (from the Vite root):

   ```bash
   npm install
   ```

## Available scripts (run from the Vite project root)

| Command        | Description |
| -------------- | ----------- |
| `npm run dev`  | Starts the Vite dev server on <http://localhost:5173>. |
| `npm run build`| Produces a production build in `dist/`. |
| `npm run preview` | Serves the production build locally. |

## Environment variables

The helper in [`api.ts`](./api.ts) reads the backend URL from the following (first non-empty wins):

1. `import.meta.env.VITE_API_BASE_URL` – prefer this in Vite.
2. `process.env.REACT_APP_API_BASE_URL` – useful if migrating from CRA.
3. Defaults to `http://localhost:4000`.

Create a `.env` file at the Vite project root and set:

```bash
VITE_API_BASE_URL=http://localhost:4000
```

## Running locally

1. Start the backend as described in [`server/README.md`](../server/README.md).
2. From the Vite root run `npm run dev` and open the logged URL.
3. Booking/contact forms will POST to the backend URL above.
