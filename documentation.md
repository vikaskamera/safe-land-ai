# SAFE-LAND-AI Documentation

## 1. Overview

SAFE-LAND-AI is an aviation intelligence platform for estimating crash-landing risk from aircraft telemetry. It is designed as a full-stack web application with a machine-learning-backed prediction engine and a real-time telemetry stream.

Primary goals:

- provide live telemetry visualization
- estimate crash-risk probability from flight parameters
- explain model feature importance
- maintain authenticated user history
- support local and containerized deployment

## 2. Technology Stack

### Backend

- FastAPI
- SQLAlchemy
- Pydantic / pydantic-settings
- JWT authentication
- SQLite
- scikit-learn

### Frontend

- React 18
- CRA build tooling
- native fetch/WebSocket APIs

### Infrastructure

- Docker
- Docker Compose

## 3. Architecture

The system is split into two main applications:

### Frontend application

Location:

- `apps/web`

Responsibilities:

- login and registration UI
- dashboard rendering
- live WebSocket telemetry display
- prediction preview editor
- reports and documentation pages
- profile editing

### Backend application

Location:

- project root and Python package folders

Responsibilities:

- authentication and authorization
- telemetry simulation and WebSocket streaming
- crash-risk prediction
- feature-importance response generation
- user and history persistence
- admin metrics endpoints

## 4. Core Backend Modules

### `main.py`

Application entrypoint.

Responsibilities:

- create FastAPI app
- register middleware
- register API routers
- initialize database and model on startup
- expose root route
- expose WebSocket endpoint

### `core/config.py`

Handles runtime settings from environment variables.

### `core/database.py`

Handles:

- SQLAlchemy engine
- session factory
- base model registration
- database initialization
- demo admin seeding
- basic SQLite schema patching for added profile fields

### `core/security.py`

Handles:

- password hashing and verification
- access token generation
- refresh token generation
- token decoding

### `services/auth_service.py`

Handles:

- registration
- login
- refresh token logic
- current-user lookup
- profile updates

### `services/prediction_service.py`

Handles:

- training fallback model if no model file exists
- loading the saved model
- single prediction inference
- risk classification
- recommendations
- feature importance output

### `services/telemetry_service.py`

Handles:

- active WebSocket connection management
- personal message delivery
- dead connection cleanup
- telemetry simulation

## 5. Data Model

### User

Fields include:

- username
- email
- password hash
- role
- full name
- designation
- organization
- phone
- location
- professional summary (`bio`)
- created timestamp
- last login

Roles:

- `admin`
- `pilot`
- `researcher`

### FlightRecord

Stores persisted prediction history linked to a user.

## 6. Authentication Flow

The system uses JWT authentication.

### Login flow

1. User submits username and password.
2. Backend validates credentials.
3. Backend returns:
   - access token
   - refresh token
4. Frontend stores tokens in local storage.
5. Frontend loads user profile using `/auth/me`.

### Authorization rules

- dashboard prediction access requires pilot or admin
- admin endpoints require admin

## 7. Prediction Flow

There are two prediction paths:

### `POST /api/predict`

Used for persisted prediction requests.

Behavior:

- runs model prediction
- saves a `FlightRecord`
- returns prediction response

### `POST /api/predict/preview`

Used for UI live preview.

Behavior:

- runs model prediction
- does not save history
- returns prediction response

This route exists so the dashboard editor can update continuously without filling the database with intermediate preview records.

## 8. Telemetry and WebSocket Flow

WebSocket endpoint:

- `/ws`

Behavior:

1. frontend connects to backend WebSocket
2. telemetry simulator produces a frame roughly every second
3. backend enriches frame with prediction output
4. frontend receives and renders live telemetry

The frontend also reconnects automatically when the socket closes.

## 9. Frontend Dashboard Behavior

### Live telemetry tab

Displays:

- crash probability gauge
- live flight parameters
- WebSocket connection state

### Prediction tab

Displays:

- telemetry editor
- live preview prediction result
- recommendation list

Behavior:

- input values are sanitized on the client
- preview requests are debounced
- preview failures from transient invalid states are reduced
- telemetry editor panel handles overflow independently
- result card stays static in its own column

### Sidebar

Supports:

- collapse/expand behavior
- icon-only collapsed mode
- icon plus title expanded mode
- live-status card
- compact risk indicator when collapsed

## 10. Profile Management

Logged-in users can update professional details through:

- `PATCH /auth/me`

Editable information:

- full name
- designation
- organization
- phone
- location
- professional summary

Frontend access:

- topbar `Profile` button

## 11. Environment Variables

Configured through `.env`.

Current supported values:

- `SECRET_KEY`
- `DEBUG`
- `ALGORITHM`
- `ACCESS_TOKEN_EXPIRE_MINUTES`
- `REFRESH_TOKEN_EXPIRE_DAYS`
- `DATABASE_URL`
- `CORS_ORIGINS`
- `MODEL_PATH`
- `LOG_PATH`

## 12. Running the Project

### Local

Backend:

```powershell
python -m pip install -r requirements.txt
python main.py
```

Frontend:

```powershell
cd apps\web
cmd /c npm install
cmd /c npm start
```

### Docker

```powershell
docker compose up --build
```

## 13. Deployment Notes

The current setup is appropriate for:

- local development
- demos
- internal testing

For production, recommended upgrades include:

- PostgreSQL instead of SQLite
- reverse proxy in front of backend/frontend
- HTTPS termination
- secret management outside `.env`
- proper migrations instead of ad-hoc SQLite column patching
- production-grade frontend static hosting
- container health checks

## 14. Observability

Current observability features:

- request logging middleware
- rotating app log output
- system metrics endpoint for admin users

Potential next improvements:

- structured JSON logging
- tracing
- Prometheus metrics
- audit event stream

## 15. Known Constraints

- SQLite is not ideal for concurrent production workloads
- frontend is contained in a single large `App.jsx`, which is workable but not ideal for long-term maintainability
- local storage token handling is acceptable for demo/internal workflows but should be reviewed for production security requirements
- schema updates are currently handled by startup patch logic instead of a migration system

## 16. Suggested Next Engineering Improvements

- split frontend into feature-based components
- add Alembic migrations
- add API tests and UI tests
- add healthchecks to Docker Compose
- add environment-specific frontend API configuration
- add stronger admin/user management flows

## 17. Quick Reference

### URLs

- frontend: `http://localhost:3000`
- backend: `http://127.0.0.1:8000`
- docs: `http://127.0.0.1:8000/docs`

### Demo credentials

- username: `admin`
- password: `admin123`

### Main routes

- `/auth/login`
- `/auth/me`
- `/api/predict`
- `/api/predict/preview`
- `/api/history`
- `/api/explain`
- `/ws`
