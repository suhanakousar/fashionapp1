"""
Job status route - check status of background jobs
"""
from fastapi import APIRouter, HTTPException
from core.mongo import db
from bson import ObjectId
from typing import Optional

router = APIRouter()


@router.get("/job/{job_id}")
async def get_job(job_id: str):
    """
    Get job status and result
    
    - **job_id**: Job identifier
    """
    try:
        job = await db.jobs.find_one({"_id": ObjectId(job_id)})
    except:
        raise HTTPException(status_code=400, detail="Invalid job_id format")
    
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Convert ObjectId to string for JSON serialization
    job["_id"] = str(job["_id"])
    
    return job


@router.get("/jobs")
async def list_jobs(
    project_id: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 50
):
    """
    List jobs with optional filtering
    
    - **project_id**: Filter by project ID
    - **status**: Filter by status (queued, running, done, failed)
    - **limit**: Maximum number of results
    """
    query = {}
    
    if project_id:
        query["project_id"] = project_id
    
    if status:
        query["status"] = status
    
    cursor = db.jobs.find(query).sort("created_at", -1).limit(limit)
    jobs = await cursor.to_list(length=limit)
    
    # Convert ObjectIds to strings
    for job in jobs:
        job["_id"] = str(job["_id"])
    
    return {"jobs": jobs, "count": len(jobs)}

