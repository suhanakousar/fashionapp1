"""
StyleWeave API - Main FastAPI application
"""
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes import upload, mask, outfit, jobs

app = FastAPI(
    title="StyleWeave API",
    description="Fashion fabric application API",
    version="1.0.0"
)

# CORS middleware - adjust for production
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "*").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(upload.router, prefix="/v1", tags=["upload"])
app.include_router(mask.router, prefix="/v1", tags=["mask"])
app.include_router(outfit.router, prefix="/v1", tags=["outfit"])
app.include_router(jobs.router, prefix="/v1", tags=["jobs"])


@app.get("/")
async def root():
    return {
        "message": "StyleWeave API",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health")
async def health():
    return {"status": "healthy"}

