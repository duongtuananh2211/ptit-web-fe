# Running HorusVis Locally

## Prerequisites

- Docker Desktop with Docker Compose
- Node.js and `npm`

## Start the backend

From the repository root, start the backend stack:

```powershell
cd HorusVis\backend
docker compose up --build
```

Compose starts PostgreSQL, runs the database migrations, and then starts the
API. The API is available at `http://localhost:5049`.

Keep this terminal open while using the app. To run the stack in the
background, use `docker compose up --build -d` instead.

## Start the frontend

Open a second terminal from the repository root:

```powershell
cd HorusVis\frontend\horusvis-react
npm install
npm run dev
```

Open the local URL printed by Vite (by default, `http://localhost:5173`).
The frontend is configured to call the API at `http://localhost:5049`.

## Stop the backend

From `HorusVis\backend`, stop and remove the Compose containers with:

```powershell
docker compose down
```

The PostgreSQL data is stored in the `horusvis-pgdata` Docker volume and is
preserved when the containers are stopped. To remove the database data too,
run `docker compose down --volumes`.
