# StyleWeave Backend - Deployment Guide

## Production Deployment Checklist

### 1. Environment Configuration

- [ ] Set strong `SECRET_KEY` (use `openssl rand -hex 32`)
- [ ] Configure `CORS_ORIGINS` with specific domains
- [ ] Set up MongoDB authentication
- [ ] Use Redis with password authentication
- [ ] Configure Cloudinary with production credentials
- [ ] Set `ACCESS_TOKEN_EXPIRE_MINUTES` appropriately

### 2. Security Hardening

**API Security:**
```python
# In api/app.py, update CORS:
allow_origins=["https://yourdomain.com"]  # Specific domains only
```

**MongoDB:**
- Enable authentication
- Use connection string: `mongodb://user:pass@host:27017/styleweave?authSource=admin`

**Redis:**
- Set password in redis.conf
- Use connection string: `redis://:password@host:6379/0`

**Cloudinary:**
- Use signed URLs for private images
- Set up upload presets with size/format limits
- Enable CDN for faster delivery

### 3. Docker Production Build

**Build images:**
```bash
docker build -f docker/Dockerfile.api -t styleweave-api:latest .
docker build -f docker/Dockerfile.worker -t styleweave-worker:latest .
```

**Tag for registry:**
```bash
docker tag styleweave-api:latest your-registry/styleweave-api:latest
docker tag styleweave-worker:latest your-registry/styleweave-worker:latest
```

**Push to registry:**
```bash
docker push your-registry/styleweave-api:latest
docker push your-registry/styleweave-worker:latest
```

### 4. Kubernetes Deployment (Optional)

**API Deployment:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: styleweave-api
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: api
        image: your-registry/styleweave-api:latest
        env:
        - name: MONGO_URI
          valueFrom:
            secretKeyRef:
              name: styleweave-secrets
              key: mongo-uri
        # ... other env vars from secrets
```

**Worker Deployment:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: styleweave-worker
spec:
  replicas: 2
  template:
    spec:
      containers:
      - name: worker
        image: your-registry/styleweave-worker:latest
        resources:
          requests:
            nvidia.com/gpu: 1
          limits:
            nvidia.com/gpu: 1
```

### 5. Scaling Considerations

**API Scaling:**
- Use Gunicorn with multiple workers
- Add load balancer (nginx, AWS ALB)
- Scale horizontally based on CPU/memory

**Worker Scaling:**
- Scale based on queue length
- Monitor GPU utilization
- Use auto-scaling based on queue depth

**Database:**
- Use MongoDB replica sets
- Enable sharding for large datasets
- Regular backups

### 6. Monitoring

**Metrics to Track:**
- API response times
- Job queue length
- GPU utilization
- Error rates
- Cloudinary bandwidth usage

**Tools:**
- Prometheus + Grafana
- Sentry for error tracking
- CloudWatch / Datadog

### 7. Cost Optimization

**Preview Mode:**
- Free tier (CPU-only)
- Fast response times
- No GPU costs

**HD Renders:**
- Charge per render
- Use credits system
- Rate limiting

**Cloudinary:**
- Use transformations for previews (cheaper)
- Optimize image sizes
- Set up CDN caching

### 8. Backup Strategy

**MongoDB:**
```bash
# Daily backups
mongodump --uri="mongodb://..." --out=/backups/$(date +%Y%m%d)
```

**Cloudinary:**
- Enable automatic backups
- Export important images periodically

### 9. Health Checks

**API Health:**
```bash
curl https://api.styleweave.ai/health
```

**Worker Health:**
- Monitor Celery worker status
- Check queue processing rate
- Alert on stuck jobs

### 10. Rollback Plan

**Version Tags:**
```bash
docker tag styleweave-api:latest styleweave-api:v1.0.0
```

**Quick Rollback:**
```bash
docker-compose down
docker-compose up -d --no-deps api  # Rollback API only
```

## Cloud Provider Specific

### AWS

**ECS Deployment:**
- Use ECS Fargate for API
- Use ECS with EC2 (GPU instances) for workers
- RDS for MongoDB (or DocumentDB)
- ElastiCache for Redis

**Lambda Alternative:**
- API Gateway + Lambda for API
- Batch for GPU workers

### Google Cloud

**GKE Deployment:**
- Use GKE with GPU nodes
- Cloud SQL for MongoDB (or Atlas)
- Memorystore for Redis
- Cloud Storage for model checkpoints

### Azure

**AKS Deployment:**
- AKS with GPU node pools
- Cosmos DB (MongoDB API)
- Azure Cache for Redis
- Azure Blob Storage for models

## Environment Variables Reference

```bash
# Required
MONGO_URI=mongodb://user:pass@host:27017/styleweave
REDIS_URL=redis://:pass@host:6379/0
CLOUDINARY_CLOUD_NAME=your_cloud
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret
SECRET_KEY=your-secret-key

# Optional
CLOUDINARY_FOLDER=styleweave
CORS_ORIGINS=https://app.styleweave.ai
ACCESS_TOKEN_EXPIRE_MINUTES=60
CUDA_VISIBLE_DEVICES=0
SAM_CHECKPOINT=/weights/sam_vit_h.pth
SD_MODEL_ID=runwayml/stable-diffusion-inpainting
```

## Troubleshooting Production Issues

### High Memory Usage
- Reduce Celery concurrency
- Enable model unloading between jobs
- Use smaller SAM model (vit_b instead of vit_h)

### Slow Job Processing
- Check GPU availability
- Monitor queue length
- Scale workers horizontally
- Optimize SD inference steps

### API Timeouts
- Increase timeout limits
- Use async endpoints
- Add request queuing
- Scale API instances

### Database Connection Issues
- Check connection pool size
- Verify MongoDB replica set health
- Monitor connection count

