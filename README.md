# Fitstore — E-Commerce App (Backend + Frontend)

A full-stack e-commerce sample application with an Angular frontend and a Node.js + Express backend. The project includes product management, cart/checkout flows, order handling, inventory logging, image uploads, and basic authentication.

Key goals: clear separation between frontend and backend, easy local setup, and an example data seeder for development.

---

## Contents

- `backend/` — Node.js + Express API, MySQL integration, file uploads, and seed scripts.
- `frontend/` — Angular single-page app (UI for customers and owners).
- `uploads/` — Uploaded product images (backend).

---

## Quick Start

Prerequisites

- Node.js (v16+ recommended)
- npm
- MySQL (or compatible server)
- Angular CLI (optional, for local frontend development)

Backend (API)

1. Open a terminal and change to the backend folder:

```bash
cd backend
```

2. Install dependencies:

```bash
npm install
```

3. Configure database credentials in `db.js` or via environment variables (e.g. `DB_HOST`, `DB_USER`, `DB_PASS`, `DB_NAME`).

4. (Optional) Seed development data:

```bash
node seeder.js
```

5. Start the API server:

```bash
node server.js
# or with nodemon if installed:
nodemon server.js
```

By default the API listens on `http://localhost:3000` (or the port set in `server.js`).

Frontend (Angular)

1. Change to the frontend folder:

```bash
cd ../frontend
```

2. Install dependencies:

```bash
npm install
```

3. Run the development server:

```bash
ng serve --open
# or
npm run start
```

The frontend will open at `http://localhost:4200` by default. Configure the API base URL in the frontend config if needed.

---

## Environment & Configuration

- Backend environment variables (examples):
  - `PORT` — API port (default: 3000)
  - `DB_HOST`, `DB_USER`, `DB_PASS`, `DB_NAME` — MySQL connection
  - `UPLOAD_DIR` — path for uploaded images (default: `uploads/`)

Place environment variables in a `.env` file or directly in your process manager.

---

## Project Structure (high-level)

- `backend/`

  - `server.js` — Express server and routes
  - `db.js` — database connection
  - `seeder.js` — development data seeder
  - `uploads/` — image uploads

- `frontend/` — Angular app (components, services, pages)

---

## Useful Commands

- Install backend deps: `cd backend && npm install`
- Run backend: `node server.js` or `nodemon server.js`
- Seed dev data: `node seeder.js`
- Install frontend deps: `cd frontend && npm install`
- Run frontend dev server: `ng serve --open` or `npm run start`
- Build frontend for production: `ng build --configuration production`

---

## Testing & Linting

The frontend contains unit test specs (`*.spec.ts`) that can be run with the Angular testing setup. Run `npm test` inside `frontend/` if available.

---

## Notes & Recommendations

- Keep uploads out of version control; `uploads/` should be in `.gitignore`.
- For production, use a managed MySQL instance and a reverse proxy (NGINX) or hosting platform.
- Consider adding JWT-based authentication and HTTPS for production.

---

## Contributing

Contributions are welcome. Open an issue to discuss changes or submit a pull request with a clear description of the change and tests where appropriate.

---

## License

This project is provided under the MIT License.

---

