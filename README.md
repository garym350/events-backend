# FilmHub Online - Backend

This is the backend API for FilmHub Online. 
It provides REST endpoints for creating and retrieving film events and connects to Firebase Firestore. 
Built with Express.js and TypeScript, deployed on Render.

## Live API

https://events-backend-0oer.onrender.com

Example endpoints:

```
GET    /events          → List all events  
GET    /events/:id      → Get one event  
POST   /admin/login     → Create an admin session token
POST   /events          → Create new event (admin bearer token required)
PUT    /events/:id      → Update event (admin bearer token required)
DELETE /events/:id      → Delete event (admin bearer token required)
```

## Tech Stack

- Node.js / Express
- TypeScript
- Firebase Firestore
- CORS / Helmet / Rate limiting
- Render hosting

## Environment Variables

Create a `.env` file in the project root:

```bash
PORT=8080
ALLOW_ORIGINS=http://localhost:3000
FRONTEND_URL=http://localhost:3000
ADMIN_PASSCODE_HASH=<sha256_hash_of_admin_passcode>
ADMIN_SESSION_SECRET=<long_random_session_secret>
FIREBASE_SERVICE_ACCOUNT_B64=<base64_encoded_firebase_service_account_json>
TMDB_API_KEY=<tmdb_api_key>
STRIPE_SECRET_KEY=<stripe_secret_key_if_checkout_is_enabled>
STRIPE_PRICE_ID=<stripe_price_id_if_checkout_is_enabled>
```

`ADMIN_PASSCODE_HASH` is a SHA-256 hash of the admin passcode. `ADMIN_SESSION_SECRET` signs the short-lived admin session token returned by `/admin/login`. Do not put raw admin passcodes, Firebase credentials, TMDb keys, Stripe keys, or generated session secrets in committed files.

The frontend only needs:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:10000
```

## Development

Install dependencies and start the backend:

```bash
npm install
npm run dev
```

The backend listens on `PORT` or `10000` by default. Start the frontend separately from the frontend package root:

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build
npm start
```

## Admin Session Flow

1. The admin enters a passcode in the frontend login page.
2. The frontend sends it to `POST /admin/login`.
3. The backend hashes the submitted passcode and compares it with `ADMIN_PASSCODE_HASH`.
4. On success, the backend returns a signed session token using `ADMIN_SESSION_SECRET`.
5. Admin write requests use `Authorization: Bearer <admin token>`.

Example login:

```bash
curl -X POST http://localhost:10000/admin/login \
  -H "Content-Type: application/json" \
  -d '{"passcode":"<admin_passcode>"}'
```

Create an event after login:

```bash
curl -X POST http://localhost:10000/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin_token>" \
  -d '{
        "title": "FilmHub Demo Screening",
        "date": "2025-10-20",
        "location": "Online",
        "description": "Example event for review."
      }'
```

## Environment Variables Reference

```bash
PORT=10000
ALLOW_ORIGINS=https://filmhubonline.netlify.app
FRONTEND_URL=https://filmhubonline.netlify.app
ADMIN_PASSCODE_HASH=<sha256_hash_of_admin_passcode>
ADMIN_SESSION_SECRET=<long_random_session_secret>
ADMIN_SESSION_TTL_MS=3600000
FIREBASE_SERVICE_ACCOUNT_B64=<base64_encoded_firebase_service_account_json>
TMDB_API_KEY=<tmdb_api_key>
STRIPE_SECRET_KEY=<stripe_secret_key_if_checkout_is_enabled>
STRIPE_PRICE_ID=<stripe_price_id_if_checkout_is_enabled>
```

## Example API Requests

List events:

```bash
curl https://events-backend-0oer.onrender.com/events
```

## Notes for Assessors

- Frontend: https://filmhubonline.netlify.app  
- Backend: https://events-backend-0oer.onrender.com  
- Invoice ID: INV-20251009-001  
- PO Number: 1842  
- Submission date: 9 October 2025  
- Both repositories are public and ready for review.

## Review Notes

- CORS limited to Netlify frontend origin
- JSON error handling
- Environment variables set for Render deployment
- Logging disabled in production

© 2025 Gary Morris – Project submitted to Northcoders Launchpad
