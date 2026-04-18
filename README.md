# Compliance Wizard

Compliance Wizard is a full-stack compliance intelligence platform that helps companies map internal policies to regulations, monitor incoming regulatory changes, run AI-assisted gap analysis, and track remediation work in a dashboard.

The project combines:

- a React + Vite frontend for onboarding, document upload, and dashboard workflows
- a Node.js + Express backend for orchestration and API handling
- MongoDB with Mongoose for persistence
- Google Gemini for document classification and compliance gap analysis
- Slack notifications for optional regulatory alerts

## What It Does

Compliance Wizard is built around a practical compliance workflow:

1. a company registers and creates its compliance profile
2. the company uploads internal policies and standards
3. the backend classifies those documents against the most relevant regulation
4. regulatory feeds are matched to impacted companies and documents
5. AI generates a structured gap analysis and suggested policy updates
6. action items are saved and surfaced in the dashboard for follow-up

## Core Features

- Company registration with operational and risk metadata
- Company login using generated `company_id` and password
- Internal document upload via `.doc`, `.docx`, `.txt`, or pasted text
- AI-based regulation mapping for uploaded policies
- Regulatory feed impact analysis by industry and regulation
- AI-generated compliance audit report with executive summary, compliance score, critical gaps, and action items
- Persistent action center for remediation tracking
- Dashboard visualizations for document coverage and risk posture
- Optional Slack alerting for impacted companies

## Tech Stack

### Frontend

- React 19
- Vite
- React Router
- Axios
- Framer Motion
- Recharts
- Tailwind CSS 4
- Lucide React

### Backend

- Node.js
- Express
- Mongoose
- Multer
- bcryptjs
- jsonwebtoken
- WordExtractor
- `@google/genai`

### Database and Integrations

- MongoDB
- Google Gemini
- Slack Web API

## Project Structure

```text
codeWizard/
|-- frontend/
|   |-- src/
|   |   |-- components/
|   |   |   |-- Dashboard.jsx
|   |   |   |-- Login.jsx
|   |   |   |-- MyDocuments.jsx
|   |   |   |-- RegisterCompany.jsx
|   |   |-- App.jsx
|   |   |-- main.jsx
|-- model/
|   |-- company.js
|   |-- internal_document.js
|   |-- regulatory.js
|-- aiAgentRouter.js
|-- architecture.md
|-- db.js
|-- feedToCompany.js
|-- index.js
|-- seedDashboardDemo.js
|-- package.json
```

## Architecture Overview

At a high level, the system has four layers:

- Frontend SPA for registration, login, document ingestion, dashboard views, and AI audit display
- Backend API for auth, document extraction, AI orchestration, feed processing, and action-item persistence
- Database for companies, internal documents, regulatory feeds, and pending action items
- External services for Gemini-based analysis and optional Slack notifications

For a more detailed system write-up, see [architecture.md](./architecture.md).

## Main Domain Models

### Company

Represents a customer organization and its compliance profile.

Important fields:

- `company_id`
- `password`
- `name`
- `industry`
- `region`
- `company_size`
- `services`
- `handles_user_data`
- `kyc_required`
- `transaction_volume`
- `documents_implemented`
- `pending_action_items`

### InternalDocument

Represents an uploaded internal policy, standard, guideline, or procedure.

Important fields:

- `doc_id`
- `title`
- `type`
- `related_regulation`
- `content`
- `owner`
- `status`
- `company_ids`

### RegulatoryFeed

Represents an incoming regulatory update that may affect one or more companies.

Important fields:

- `feed_id`
- `title`
- `related_regulation`
- `summary`
- `source`
- `region`
- `applicable_industries`
- `key_changes`
- `impact_level`
- `published_date`
- `isDone`

## Key Workflows

### 1. Company Onboarding

- User registers through the frontend
- Backend generates a `company_id`
- Company profile is stored in MongoDB

### 2. Authentication

- User logs in with `company_id` and password
- Backend returns a JWT and company data
- Frontend stores session info in `localStorage`

### 3. Document Ingestion

- User uploads a file or pastes document text
- Backend extracts raw text
- Gemini identifies the most relevant regulation
- Document is saved and linked to the company

### 4. Regulatory Feed Matching

- Backend loads pending feeds
- Companies are matched by `industry`
- Documents are matched by `related_regulation`
- Dashboard shows impacted feeds and assets

### 5. AI Gap Analysis

- User selects a regulatory feed from the dashboard
- Backend sends the feed and matching internal documents to Gemini
- Gemini returns a structured JSON audit report
- Frontend displays the report and persists action items

### 6. Remediation Tracking

- Action items are stored in the company record
- Dashboard Action Center displays them
- Users can mark items as resolved

## API Overview

### Auth and Company

- `POST /registerCompany`
- `POST /login`

### Documents

- `POST /api/documents/upload`
- `GET /api/documents/:company_id`
- `POST /addDocumentToCompany`

### Regulatory Feeds and AI

- `GET /feed/getFeeds`
- `POST /api/analyze-gap`
- `POST /feed/analyze`

### Action Items

- `GET /api/action-items/:company_id`
- `POST /api/action-items/:company_id`
- `DELETE /api/action-items/:company_id/:item_id`

## Local Setup

### Prerequisites

- Node.js 18+ recommended
- npm
- MongoDB database
- Google Gemini API key

### 1. Install backend dependencies

```bash
npm install
```

### 2. Install frontend dependencies

```bash
cd frontend
npm install
```

### 3. Configure environment variables

Create a root `.env` file with at least:

```env
MONGO_URI=your_mongodb_connection_string
GEMINI_API_KEY=your_gemini_api_key
JWT_SECRET=your_jwt_secret
SLACK_TOKEN=your_optional_slack_token
DNS_SERVERS=8.8.8.8,1.1.1.1
PORT=5000
```

Notes:

- `SLACK_TOKEN` is optional
- `JWT_SECRET` falls back to a hardcoded value if omitted, but you should set your own in development and production
- `DNS_SERVERS` is optional and defaults to `8.8.8.8,1.1.1.1`

### 4. Start the backend

```bash
node index.js
```

The backend runs on `http://localhost:5000`.

### 5. Start the frontend

```bash
cd frontend
npm run dev
```

The frontend runs on the Vite dev server, typically `http://localhost:5173`.

## Demo Seed Data

This project includes a demo seed script for populating a realistic dashboard state.

Run:

```bash
npm run seed:dashboard-demo
```

This script creates:

- a demo company
- multiple internal documents
- a pending regulatory feed
- preloaded action items

Demo login credentials created by the script:

- `company_id`: `COMP-DEMO1`
- `password`: `Demo@123`

## Frontend Notes

The frontend stores `token` and `company_id` in browser `localStorage`.

Protected routing exists in the React app, but backend route-level JWT enforcement is currently limited in the codebase. That is worth addressing before treating the project as production-ready.

## AI Usage

Gemini is used in two main places:

- document upload, where it classifies an internal document to the most likely regulation
- gap analysis, where it compares a regulatory feed with a company's internal documents and returns strict JSON for UI rendering

The backend expects the gap analysis response to follow this shape:

```json
{
  "executive_summary": "Overview of compliance impact.",
  "compliance_score": 50,
  "critical_gaps": [
    {
      "section": "Section name",
      "issue": "What is missing",
      "severity": "High"
    }
  ],
  "action_items": [
    {
      "document_title": "Title to update",
      "exact_change_instructions": "Exact text to add."
    }
  ]
}
```

## Current Limitations

- AI requests are synchronous and can increase API response times
- action items are embedded inside the company document rather than modeled as a separate workflow entity
- regulatory feed ingestion is not yet exposed as a dedicated admin UI
- backend authorization middleware is not fully enforced across all endpoints
- there is no test suite configured yet

## Scripts

### Root

- `npm run seed:dashboard-demo`

### Frontend

- `npm run dev`
- `npm run build`
- `npm run preview`
- `npm run lint`

## Suggested Next Improvements

- add backend auth middleware and route protection
- move action items into a dedicated collection with workflow states
- add background jobs for AI analysis and Slack notifications
- add admin tooling for regulatory feed ingestion
- normalize regulation taxonomy to reduce AI label mismatch
- add automated tests for API and UI workflows

## License

No license has been defined in the repository yet.
