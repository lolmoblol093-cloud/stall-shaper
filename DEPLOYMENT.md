# Docker Deployment Guide

## Prerequisites
- Docker installed on your system
- Docker Compose (optional, but recommended)

## Local Development with Docker

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
