# FilmHub Online – Backend

This is the backend API for FilmHub Online. 
It provides REST endpoints for creating and retrieving film events and connects to Firebase Firestore. 
Built with Express.js and TypeScript, deployed on Render.

## Live API

https://events-backend-0oer.onrender.com

Example endpoints:

```
GET    /events          → List all events  
GET    /events/:id      → Get one event  
POST   /events          → Create new event (admin passcode required)
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
ADMIN_PASSCODE=launchpad2025!
ALLOW_ORIGINS=https://filmhubonline.netlify.app
FIREBASE_PROJECT_ID=<your_project_id>
FIREBASE_CLIENT_EMAIL=<your_service_account_email>
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n<your_key_here>\n-----END PRIVATE KEY-----\n"
```

## Development

```bash
npm install
npm run dev
```
Build for production:

```bash
npm run build
npm start
```

## Example API Requests

List events:

```bash
curl https://events-backend-0oer.onrender.com/events
```

Create an event:

```bash
curl -X POST https://events-backend-0oer.onrender.com/events   -H "Content-Type: application/json"   -d '{
        "passcode": "launchpad2025!",
        "title": "FilmHub Demo Screening",
        "date": "2025-10-20",
        "location": "Online",
        "description": "Example event for Launchpad review."
      }'
```

## Notes for Assessors

- Frontend: https://filmhubonline.netlify.app  
- Backend: https://events-backend-0oer.onrender.com  
- Admin passcode: launchpad2025!  
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
