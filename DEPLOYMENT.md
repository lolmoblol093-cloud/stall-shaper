# Docker Deployment Guide

## Prerequisites
- Docker installed on your system
- Docker Compose (optional, but recommended)

## Local Development with Docker

**IMPORTANT:** Make sure your `.env` file exists with Supabase credentials before building!

The `.env` file should contain:
```
VITE_SUPABASE_URL=https://zemgjqfyqrwvpdnrsckg.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InplbWdqcWZ5cXJ3dnBkbnJzY2tnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4NjMyNDUsImV4cCI6MjA3NTQzOTI0NX0.HVLVs30LfbTI6AprrsgAmbzdODPE-VP8flFme4GksM4
VITE_SUPABASE_PROJECT_ID=zemgjqfyqrwvpdnrsckg
```

### Build the Docker image:
```bash
docker build -t property-management-app .
```

### Run the container:
```bash
docker run -p 80:80 property-management-app
```

### Or use Docker Compose:
```bash
docker-compose up -d
```

Your app will be available at `http://localhost`

### Troubleshooting empty page:
If you see an empty page, check:
1. Browser console for errors (F12)
2. Verify .env file was copied during build
3. Check container logs: `docker logs property-management-app`

## Production Deployment

### 1. Build for production:
```bash
docker build -t property-management-app:latest .
```

### 2. Deploy to Container Registry (e.g., Docker Hub):
```bash
# Tag the image
docker tag property-management-app:latest yourusername/property-management-app:latest

# Push to registry
docker push yourusername/property-management-app:latest
```

### 3. Deploy to Cloud Platforms:

#### AWS ECS/Fargate:
1. Push image to Amazon ECR
2. Create ECS task definition
3. Deploy to ECS cluster

#### Digital Ocean:
1. Push to DO Container Registry
2. Create App Platform app from container
3. Configure domain and environment

#### Google Cloud Run:
```bash
gcloud run deploy property-management-app \
  --image gcr.io/YOUR_PROJECT/property-management-app \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

#### Azure Container Instances:
```bash
az container create \
  --resource-group myResourceGroup \
  --name property-management-app \
  --image yourusername/property-management-app:latest \
  --dns-name-label property-app \
  --ports 80
```

## Environment Variables
Make sure to set your Supabase environment variables in your deployment platform:
- VITE_SUPABASE_URL
- VITE_SUPABASE_PUBLISHABLE_KEY
- VITE_SUPABASE_PROJECT_ID

## Useful Commands

### View logs:
```bash
docker logs property-management-app
```

### Stop container:
```bash
docker-compose down
```

### Rebuild and restart:
```bash
docker-compose up -d --build
```

## Notes
- The app uses nginx to serve static files and handle client-side routing
- Gzip compression is enabled for better performance
- Static assets are cached for 1 year
- Security headers are included
