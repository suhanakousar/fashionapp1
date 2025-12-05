# 🚀 StyleWeave Backend - Start Here!

## ✅ Setup Complete!

Your backend is ready! Here's what's been set up:

### ✓ Installed
- ✅ API dependencies (FastAPI, MongoDB, Cloudinary, etc.)
- ✅ Project structure with all routes and workers
- ✅ Docker configuration files

### ⚠️ Next Steps

1. **Create `.env` file:**
   ```bash
   copy .env.example .env
   ```
   Then edit `.env` with your:
   - Cloudinary credentials (get from https://cloudinary.com)
   - MongoDB URI (default: `mongodb://localhost:27017/styleweave`)
   - Redis URL (default: `redis://localhost:6379/0`)

2. **Start MongoDB & Redis:**
   ```bash
   # Option 1: Using Docker (easiest)
   docker run -d -p 27017:27017 --name styleweave_mongo mongo:6
   docker run -d -p 6379:6379 --name styleweave_redis redis:7-alpine
   
   # Option 2: Using Docker Compose
   cd docker
   docker-compose -f docker-compose.cpu.yml up -d
   ```

3. **Start the API:**
   ```bash
   cd vercel-deploy/api
   uvicorn app:app --reload --port 8000
   ```

4. **Test it:**
   - Open: http://localhost:8000/docs
   - Health check: http://localhost:8000/health

## 📚 Documentation

- **Quick Start**: See [QUICK_START.md](QUICK_START.md)
- **Full Setup**: See [SETUP.md](SETUP.md)
- **API Docs**: http://localhost:8000/docs (after starting server)
- **Deployment**: See [DEPLOYMENT.md](DEPLOYMENT.md)

## 🎯 Quick Test

Once the API is running, test with:

```bash
# Health check
curl http://localhost:8000/health

# Upload an image (replace with your image path)
curl -X POST "http://localhost:8000/v1/upload" \
  -F "file=@your_image.jpg" \
  -F "type=model" \
  -F "project_id=test"
```

## 💡 Notes

- **Preview mode** (fast, CPU-only) works immediately
- **HD rendering** requires GPU and SAM checkpoint (see README.md)
- **Worker dependencies** can be installed later when needed

## 🆘 Need Help?

- Check [README.md](README.md) for full documentation
- See [QUICK_START.md](QUICK_START.md) for step-by-step guide
- API documentation at `/docs` endpoint when server is running

---

**Ready to go!** Start the API and visit http://localhost:8000/docs 🎉

