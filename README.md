# SAFE-LAND-AI

SAFE-LAND-AI is a full-stack aviation risk assessment platform that combines:

- FastAPI backend
- React frontend
- SQLite persistence
- WebSocket telemetry streaming
- Random Forest crash-risk prediction

This file is the quick-start guide for installing and running the project.

## Prerequisites

Install these on your machine first:

- Python 3.11+
- Node.js 18+
- npm
- Docker Desktop, if you want containerized execution

Verify:

```powershell
python --version
node --version
cmd /c npm --version
docker --version
docker compose version
```

## Project Layout

```text
safe-land-ai/
├── apps/web/            # React frontend
├── core/                # config, database, security, logger
├── middleware/          # auth and request middleware
├── models/              # SQLAlchemy models
├── routes/              # FastAPI route modules
├── schemas/             # Pydantic request/response schemas
├── services/            # auth, telemetry, prediction services
├── ml_models/           # trained model artifacts
├── logs/                # runtime log output
├── .env.example
├── Dockerfile
├── docker-compose.yml
├── requirements.txt
└── main.py
```

## Step 1: Configure Environment

From the project root:

```powershell
cd c:\Users\VICKY\Downloads\files\safe-land-ai
Copy-Item .env.example .env
```

Default environment values:

```env
SECRET_KEY=your-256-bit-random-secret-key
DEBUG=false
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
DATABASE_URL=sqlite:///./safe_land.db
CORS_ORIGINS=["http://localhost:3000","http://localhost:3001"]
MODEL_PATH=ml_models/crash_detector_model.pkl
LOG_PATH=logs/app.log
```

Before production use, update at minimum:

- `SECRET_KEY`

## Step 2: Install Backend Dependencies

```powershell
cd c:\Users\VICKY\Downloads\files\safe-land-ai
python -m pip install -r requirements.txt
```

## Step 3: Install Frontend Dependencies

```powershell
cd c:\Users\VICKY\Downloads\files\safe-land-ai\apps\web
cmd /c npm install
```

If PowerShell blocks npm scripts, always run npm through:

```powershell
cmd /c npm <command>
```

## Step 4: Run the Project Locally

Open two terminals.

### Terminal A: Start backend

```powershell
cd c:\Users\VICKY\Downloads\files\safe-land-ai
python main.py
```

Backend endpoints:

- API root: `http://127.0.0.1:8000`
- Swagger UI: `http://127.0.0.1:8000/docs`

### Terminal B: Start frontend

```powershell
cd c:\Users\VICKY\Downloads\files\safe-land-ai\apps\web
cmd /c npm start
```

Frontend:

- `http://localhost:3000`

## Step 5: Login

The application seeds a demo admin account automatically on startup.

- Username: `admin`
- Password: `admin123`

## Docker Run

This project is already configured so both frontend and backend start with a single Docker Compose command.

Files used:

- backend image: `Dockerfile`
- frontend image: `apps/web/Dockerfile`
- multi-service runner: `docker-compose.yml`

### Docker setup steps

1. Open Docker Desktop and wait until it is fully running.

2. Open PowerShell and go to the project:

```powershell
cd c:\Users\VICKY\Downloads\files\safe-land-ai
```

3. Create `.env` if it does not already exist:

```powershell
Copy-Item .env.example .env
```

4. Build and start the full stack:

```powershell
docker compose up --build
```

That single command starts:

- `safe-land-ai-backend`
- `safe-land-ai-web`

The frontend waits for the backend health check before starting.

### Application URLs

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`
- Swagger UI: `http://localhost:8000/docs`

### Run in background

```powershell
docker compose up -d --build
```

### Stop everything

```powershell
docker compose down
```

### Rebuild after changes

```powershell
docker compose up --build
```

### View logs

```powershell
docker compose logs -f
```

Or per service:

```powershell
docker compose logs -f backend
docker compose logs -f web
```

### Check running containers

```powershell
docker compose ps
```

## Main Features

- JWT-based authentication
- Demo admin seeding
- Live telemetry over WebSocket
- Manual telemetry prediction preview without history writes
- Persisted prediction history
- Feature-importance endpoint
- Profile editing for logged-in users
- Responsive dashboard with collapsible sidebar

## Main API Routes

### Authentication

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/logout`
- `POST /auth/refresh`
- `GET /auth/me`
- `PATCH /auth/me`

### Prediction

- `GET /api/health`
- `POST /api/predict`
- `POST /api/predict/preview`
- `POST /api/predict/batch`
- `GET /api/history`
- `GET /api/explain`

### Admin

- `GET /admin/users`
- `DELETE /admin/user/{id}`
- `GET /admin/system-metrics`

## Troubleshooting

### Frontend login shows `Failed to fetch`

Make sure the backend is running:

```powershell
cd c:\Users\VICKY\Downloads\files\safe-land-ai
python main.py
```

Then confirm:

- `http://127.0.0.1:8000`

### Preview prediction fails while editing telemetry

Refresh the frontend and confirm the latest UI build is loaded. The current client sanitizes values before calling `/api/predict/preview`.

### npm commands fail in PowerShell

Use:

```powershell
cmd /c npm install
cmd /c npm start
```

### Ports 3000 or 8000 are already in use

Stop the existing process on that port and restart the app.

## Additional Documentation

For a fuller project document covering architecture, components, data flow, API behavior, deployment notes, and maintenance guidance, see [documentation.md](c:/Users/VICKY/Downloads/files/safe-land-ai/documentation.md).
