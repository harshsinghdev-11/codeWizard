# Compliance Wizard Architecture

## 1. Purpose

Compliance Wizard is a full-stack compliance intelligence platform for companies that need to:

- register their organization and define a compliance profile
- upload internal policy documents
- ingest new regulatory feeds
- map regulations to impacted companies and documents
- run AI-assisted gap analysis between new regulations and existing internal policies
- persist remediation actions for follow-up inside a dashboard

At a high level, the system combines:

- a React frontend for user interaction
- an Express API backend for orchestration
- MongoDB for persistent storage
- Google Gemini for document classification and compliance gap analysis
- Slack as an optional outbound notification channel for regulatory alerts

This architecture is designed around one core loop:

1. regulatory updates enter the system
2. impacted companies and documents are identified
3. AI compares the new regulation against current internal documents
4. actionable remediation tasks are generated and saved
5. the dashboard surfaces the risk, impacted assets, and next steps

---

## 2. High-Level System Architecture

### 2.1 Primary Layers

The project is organized into four main layers:

1. Presentation Layer
   - React application in `frontend/`
   - handles authentication UI, dashboard views, document upload flows, and AI report display

2. Application/API Layer
   - Express server in `index.js`
   - exposes REST endpoints for auth, document ingestion, feed processing, gap analysis, and action-item management

3. Domain/Data Layer
   - Mongoose models in `model/`
   - stores companies, internal documents, regulatory feeds, and embedded action items

4. External Intelligence/Notification Layer
   - Google Gemini via `@google/genai`
   - Slack API for alert delivery

### 2.2 Architectural Style

The current implementation follows a simple monolithic service architecture:

- one backend process owns API routing, business logic, AI orchestration, and database access
- one frontend SPA consumes backend endpoints directly over HTTP
- MongoDB is the single source of truth
- AI is invoked synchronously from API requests

This is best described as:

- frontend SPA + backend monolith + document database + third-party AI services

---

## 3. Main Runtime Components

### 3.1 Frontend Client

Location:

- `frontend/src/App.jsx`
- `frontend/src/components/`

Responsibilities:

- route users between login, registration, dashboard, and document upload screens
- store auth token and `company_id` in browser `localStorage`
- call backend APIs with Axios
- visualize:
  - pending regulatory feeds
  - uploaded documents
  - AI-generated compliance reports
  - persistent action items
  - high-level document distribution charts

Important screens:

- `Login.jsx`
  - authenticates a company using `company_id` + password
  - stores returned JWT and company identifier in local storage

- `RegisterCompany.jsx`
  - creates a new company profile with industry, region, risk, and operational metadata
  - receives an auto-generated `company_id`

- `Dashboard.jsx`
  - fetches regulatory feeds, documents, and action items
  - displays compliance posture and impacted assets
  - triggers AI gap analysis for a selected regulation
  - persists AI-generated action items back to the backend

- `MyDocuments.jsx`
  - uploads `.doc`, `.docx`, `.txt`, or pasted text
  - sends content for AI regulation mapping
  - displays the detected regulation after upload

### 3.2 Backend API Server

Location:

- `index.js`
- `feedToCompany.js`
- `aiAgentRouter.js` (alternate/older analysis route module)

Responsibilities:

- accept and validate frontend requests
- hash passwords and issue JWTs
- parse uploaded documents with Multer and WordExtractor
- classify documents against likely regulations using Gemini
- compare new regulatory feeds against company documents using Gemini
- persist action items and document links in MongoDB
- determine impacted companies/documents for pending regulatory feeds
- optionally notify Slack channels when a company is impacted

### 3.3 Database Layer

Location:

- `db.js`
- `model/company.js`
- `model/internal_document.js`
- `model/regulatory.js`

Responsibilities:

- connect to MongoDB with Mongoose
- model entity relationships
- persist:
  - company identity and compliance profile
  - internal document metadata and content
  - regulatory feed metadata
  - pending remediation action items

### 3.4 External Services

Google Gemini:

- used in `/api/documents/upload`
- used in `/api/analyze-gap`
- prompts are crafted to enforce structured outputs for downstream UI rendering

Slack:

- used in `/feed/getFeeds`
- sends a formatted alert when a feed impacts a company and `SLACK_TOKEN` is configured

---

## 4. Domain Model

### 4.1 Company

Source: `model/company.js`

Represents a customer organization and its compliance posture baseline.

Key fields:

- `company_id`: public login identifier, generated in app layer
- `password`: bcrypt-hashed password
- `name`
- `industry`
- `region`
- `company_size`
- `services`: array of business services
- `handles_user_data`
- `kyc_required`
- `transaction_volume`
- `documents_implemented`: array of references to `InternalDocument`
- `pending_action_items`: embedded remediation tasks
- `last_compliance_check`

Architectural role:

- anchor entity for authentication, document ownership, and compliance workflows

### 4.2 InternalDocument

Source: `model/internal_document.js`

Represents an internal policy, procedure, guideline, or standard uploaded by a company.

Key fields:

- `doc_id`
- `title`
- `type`
- `related_regulation`
- `content`
- `last_updated`
- `owner`
- `status`
- `company_ids`: array of references back to companies
- `review_frequency`
- `risk_notes`

Architectural role:

- knowledge asset used by AI during regulation-to-policy gap analysis

### 4.3 RegulatoryFeed

Source: `model/regulatory.js`

Represents a new or pending regulatory change that may impact one or more companies.

Key fields:

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

Architectural role:

- event trigger for impact analysis and compliance review

### 4.4 Embedded Action Item

Stored inside `Company.pending_action_items`

Key fields:

- `document_title`
- `exact_change_instructions`
- `related_regulation`
- `created_at`

Architectural role:

- lightweight task queue for policy remediation surfaced directly on the dashboard

---

## 5. Core Relationships

The main entity relationships are:

- one `Company` can reference many `InternalDocument` records
- one `InternalDocument` can be linked to many `Company` records
- one `RegulatoryFeed` can affect many companies
- one `RegulatoryFeed` can affect many documents through `related_regulation`
- one `Company` can contain many embedded `pending_action_items`

Conceptually:

- `Company <-> InternalDocument` is many-to-many
- `RegulatoryFeed -> Company` is derived through `industry`
- `RegulatoryFeed -> InternalDocument` is derived through `related_regulation`
- `AI gap analysis = RegulatoryFeed + Company + matching InternalDocuments`

---

## 6. End-to-End Business Workflows

### 6.1 Company Registration Flow

Goal:

- onboard a new company and capture enough metadata to later determine regulatory impact

Flow:

1. User fills out company profile in `RegisterCompany.jsx`
2. Frontend calls `POST /registerCompany`
3. Backend validates payload and hashes password with bcrypt
4. Backend generates `company_id`
5. Backend creates a `Company` document in MongoDB
6. Backend returns the generated `company_id`
7. Frontend shows the identifier for later login

Outputs:

- persisted company profile
- login-ready `company_id`

### 6.2 Authentication Flow

Goal:

- allow a registered company to access protected dashboard routes

Flow:

1. User enters `company_id` and password in `Login.jsx`
2. Frontend calls `POST /login`
3. Backend loads company by `company_id`
4. Backend compares password using bcrypt
5. Backend signs a JWT containing company identity
6. Frontend stores `token` and `company_id` in `localStorage`
7. React router unlocks protected routes

Outputs:

- authenticated browser session
- company context available for later API calls

### 6.3 Document Ingestion and Auto-Tagging Flow

Goal:

- ingest internal documentation and automatically map it to the most relevant regulation

Flow:

1. User uploads a file or pastes raw document text in `MyDocuments.jsx`
2. Frontend sends multipart form data to `POST /api/documents/upload`
3. Backend validates `company_id`, title, type, and owner
4. Backend extracts text:
   - `.doc` / `.docx` via WordExtractor
   - `.txt` via direct buffer decoding
   - pasted content directly from request body
5. Backend constructs an AI prompt asking Gemini to identify the single most relevant regulation
6. Gemini returns a regulation label such as `GDPR`, `HIPAA`, or `PCI-DSS`
7. Backend creates an `InternalDocument` record with:
   - raw content
   - mapped regulation
   - ownership metadata
8. Backend links the document to the company
9. Frontend shows the detected regulation and document ID

Outputs:

- stored internal document
- AI-generated regulation mapping
- updated company-to-document relationship

### 6.4 Regulatory Feed Processing Flow

Goal:

- identify which companies and documents are likely impacted by pending regulatory updates

Flow:

1. Dashboard requests `GET /feed/getFeeds`
2. Backend loads all pending `RegulatoryFeed` items where `isDone = false`
3. For each feed:
   - impacted companies are derived by matching `feed.applicable_industries` against `company.industry`
   - impacted documents are derived by matching `feed.related_regulation` against `document.related_regulation`
4. For each impacted company:
   - linked documents are filtered again to show regulation-specific matches
   - Slack notification is sent if Slack is configured
5. Backend returns:
   - all pending feeds
   - latest feed
   - impacted companies
   - impacted documents
   - per-feed insights
   - aggregate summary metrics
6. Dashboard renders feed cards, metrics, and document risk indicators

Outputs:

- real-time impact map for new regulations
- optional Slack alerts
- dashboard-ready summary data

### 6.5 AI Gap Analysis Flow

Goal:

- compare a new regulatory feed against a company’s existing internal policies and generate structured remediation guidance

Flow:

1. User clicks a feed card in `Dashboard.jsx`
2. Frontend calls `POST /api/analyze-gap` with `feed_id` and `company_id`
3. Backend loads:
   - the selected `RegulatoryFeed`
   - the selected `Company`
   - populated `documents_implemented`
4. Backend filters the company’s documents to those whose `related_regulation` matches the feed
5. Backend builds a prompt that includes:
   - feed title
   - feed summary
   - feed key changes
   - matching internal document content, truncated for prompt size control
6. Gemini is instructed to return strict JSON with:
   - `executive_summary`
   - `compliance_score`
   - `critical_gaps`
   - `action_items`
7. Backend parses the AI response into JSON
8. Frontend displays the report inside the AI modal
9. Frontend persists `action_items` via `POST /api/action-items/:company_id`
10. Dashboard updates the Action Center immediately

Outputs:

- structured AI audit report
- stored remediation tasks
- visible compliance score and gap list

### 6.6 Action Item Resolution Flow

Goal:

- allow teams to clear completed remediation work from the dashboard

Flow:

1. User clicks resolve on an action item
2. Frontend calls `DELETE /api/action-items/:company_id/:item_id`
3. Backend removes the embedded action item from the company document
4. Updated action-item list is returned
5. Frontend refreshes the Action Center

Outputs:

- reduced pending remediation queue

---

## 7. API Surface

### 7.1 Authentication and Company Management

- `POST /registerCompany`
  - creates a company profile

- `POST /login`
  - authenticates a company and returns JWT + company data

### 7.2 Document Management

- `POST /api/documents/upload`
  - ingests a document, extracts content, classifies regulation, stores document, links to company

- `GET /api/documents/:company_id`
  - returns documents linked to a company

- `POST /addDocumentToCompany`
  - manually links an existing document to a company

### 7.3 Regulatory Feed and AI Analysis

- `GET /feed/getFeeds`
  - returns pending feeds plus impact analysis summary

- `POST /api/analyze-gap`
  - performs structured AI gap analysis

- `POST /feed/analyze`
  - similar analysis endpoint from `aiAgentRouter.js`; appears to be an alternate route module rather than the primary path

### 7.4 Action Item Management

- `GET /api/action-items/:company_id`
  - fetches saved remediation actions

- `POST /api/action-items/:company_id`
  - saves AI-generated remediation actions

- `DELETE /api/action-items/:company_id/:item_id`
  - resolves/removes a remediation action

---

## 8. Data Flow by Concern

### 8.1 Frontend to Backend

Communication style:

- REST over HTTP
- JSON for most endpoints
- multipart form data for document upload

The frontend depends on:

- `company_id` from `localStorage`
- JWT token stored in `localStorage`

Important note:

- the current frontend stores the token but the backend routes shown do not enforce JWT middleware on protected endpoints yet

### 8.2 Backend to Database

Communication style:

- Mongoose ODM over MongoDB connection

Patterns used:

- direct `findOne`, `find`, `save`
- relationship hydration with `.populate('documents_implemented')`
- embedded arrays for action items

### 8.3 Backend to AI Service

Communication style:

- synchronous request/response prompt execution with Gemini

AI use cases:

- classify uploaded document into one regulation category
- produce structured JSON for compliance gap analysis

### 8.4 Backend to Slack

Communication style:

- HTTP POST to Slack `chat.postMessage`

Purpose:

- send proactive impact alerts for newly processed regulatory feeds

---

## 9. Important Architectural Decisions

### 9.1 Regulation-Centric Matching

The architecture uses `related_regulation` as the shared key across:

- regulatory feeds
- uploaded documents
- AI-generated action items

This makes the system easy to reason about:

- if a feed and a document share the same regulation label, the document is considered relevant for analysis

### 9.2 Industry-Based Company Impact Detection

Company impact is determined through:

- `RegulatoryFeed.applicable_industries`
- `Company.industry`

This creates a lightweight targeting model for deciding who should be alerted about a feed.

### 9.3 AI as an Orchestration Step, Not a Source of Record

AI outputs are used to:

- classify
- summarize
- score
- recommend actions

But the persistent source of truth remains MongoDB records for:

- companies
- documents
- feeds
- action items

### 9.4 Embedded Action Items

Action items are stored inside the `Company` document rather than a separate collection.

Benefits:

- simple retrieval for dashboard rendering
- low complexity for small-to-medium volumes

Tradeoff:

- limited scalability if action history becomes large or needs richer workflow states

---

## 10. Current Strengths of the Architecture

- simple full-stack setup that is easy to run and demo
- clear core domain around company, document, feed, and action item
- AI integration directly supports product value rather than being cosmetic
- document ingestion and regulatory intelligence are tightly connected
- dashboard reflects real operational workflow instead of static reporting
- Slack notifications extend the system beyond passive dashboards

---

## 11. Current Constraints and Risks

These are important to reflect in any architecture diagram or future planning:

- authentication is only partially enforced
  - JWT is issued, but route protection on the backend is not visible in the current code

- AI calls are synchronous
  - slow or failed model responses will directly affect API latency

- no explicit queueing or background job layer
  - feed processing, Slack notifications, and AI work occur inline

- regulation mapping depends on AI-generated labels
  - inconsistent labels could reduce matching quality

- action items are embedded in company documents
  - workable now, but not ideal for advanced workflow tracking

- no explicit admin ingestion service for regulatory feeds
  - feed creation appears to rely on seed or helper scripts rather than a formal pipeline

- secrets and integration dependencies are environment-driven
  - missing `MONGO_URI`, `GEMINI_API_KEY`, `JWT_SECRET`, or `SLACK_TOKEN` affect key capabilities

---

## 12. Suggested Diagram Blocks for Figma

If you want to turn this into a workflow or system diagram, use these blocks:

### 12.1 User Actors

- Compliance Manager
- Company Admin
- Internal Policy Owner

### 12.2 Frontend Blocks

- Login / Registration UI
- Dashboard / Command Center
- Document Upload / Ingestion UI
- AI Audit Modal
- Action Center

### 12.3 Backend Blocks

- Express API Gateway
- Authentication Service
- Document Ingestion Service
- Feed Impact Analyzer
- AI Gap Analysis Orchestrator
- Action Item Manager
- Notification Service

### 12.4 Data Blocks

- Company Collection
- Internal Document Collection
- Regulatory Feed Collection
- Embedded Action Items

### 12.5 External Systems

- Google Gemini API
- Slack API
- MongoDB

---

## 13. Recommended Figma Workflow Diagram Narrative

Use this exact narrative when creating the visual workflow:

1. A company admin registers the organization and creates a compliance profile.
2. The company logs in and enters the dashboard.
3. The company uploads internal policy documents.
4. The backend extracts document text and sends it to Gemini for regulation classification.
5. The classified document is stored in MongoDB and linked back to the company profile.
6. New regulatory feeds are loaded from the database.
7. The backend matches each feed to impacted industries and then to impacted companies.
8. The backend identifies potentially affected internal documents by matching regulation labels.
9. The dashboard displays feeds, risk metrics, impacted documents, and pending actions.
10. When the user selects a feed, the backend sends the feed plus related internal documents to Gemini for structured gap analysis.
11. Gemini returns a JSON report with executive summary, compliance score, critical gaps, and recommended policy updates.
12. The frontend displays the report in an AI audit modal.
13. The recommended action items are saved to the company record and shown in the Action Center.
14. The user resolves action items as policy updates are completed.
15. Optionally, Slack notifications are sent when a regulatory feed impacts a company.

---

## 14. Figma Prompt-Ready Summary

Use the following as a direct prompt for generating a workflow or architecture diagram:

Create a professional system architecture and workflow diagram for a product called "Compliance Wizard". The product is a compliance intelligence platform with a React frontend, Express/Node.js backend, MongoDB database, Google Gemini AI integration, and optional Slack notifications. Show these major modules: user authentication, company registration, document upload and text extraction, AI-based regulation mapping, regulatory feed ingestion, impact analysis by industry and regulation, AI gap analysis, action item persistence, and dashboard visualization. Represent the main entities as Company, Internal Document, Regulatory Feed, and Pending Action Items. Show the key data flows: users interact with the React dashboard, the frontend sends requests to the Express API, the API reads and writes MongoDB, the API calls Gemini for document classification and structured compliance gap analysis, and the API optionally sends alerts to Slack. Include end-to-end workflow arrows from company onboarding, to document ingestion, to regulatory feed matching, to AI audit, to remediation tracking. The style should feel like a modern SaaS architecture diagram with clear swimlanes for Frontend, Backend Services, Database, and External Integrations.

---

## 15. Suggested Visual Layout for the Diagram

A strong Figma layout for this project would be:

- left lane: Users
- second lane: Frontend SPA
- third lane: Backend Services
- fourth lane: MongoDB Data Store
- fifth lane: External Services

Suggested top-to-bottom order:

1. Onboarding and Authentication
2. Document Ingestion and Classification
3. Regulatory Feed Processing
4. AI Gap Analysis
5. Action Tracking and Notifications

This arrangement will make the workflow readable both as:

- a system architecture diagram
- a user journey workflow diagram
- an operational data flow diagram

---

## 16. Implementation References

Core files that define the current architecture:

- `index.js`
- `feedToCompany.js`
- `aiAgentRouter.js`
- `db.js`
- `model/company.js`
- `model/internal_document.js`
- `model/regulatory.js`
- `frontend/src/App.jsx`
- `frontend/src/components/Login.jsx`
- `frontend/src/components/RegisterCompany.jsx`
- `frontend/src/components/MyDocuments.jsx`
- `frontend/src/components/Dashboard.jsx`
