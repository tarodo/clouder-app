# Clouder App

This project consists of a FastAPI backend and a React frontend. Docker images are built and pushed to GitHub Container Registry using a GitHub Actions workflow. Deployment to the server happens via SSH.

## Environment Variables

The backend requires several environment variables:

- `SPOTIFY_CLIENT_ID`
- `SPOTIFY_CLIENT_SECRET`
- `SPOTIFY_REDIRECT_URI`
- `MONGO_URL`
- `MONGO_DB`
- `FRONTEND_URL` (optional)
- `CORS_ALLOWED_ORIGINS` (optional)

In production you do not need to commit a `.env` file. The workflow creates `backend/.env` on the server using repository secrets. Define these variables under **Settings → Secrets and variables → Actions** in your repository.

## Deployment

Pushing to the `main` branch triggers the `Deploy to Production` workflow. It builds Docker images, pushes them to GHCR and connects to your server via SSH. After pulling the latest code it recreates the containers using `docker-compose.prod.yml`.
