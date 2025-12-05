"""
Outfit routes - preview and HD generation
"""
from fastapi import APIRouter, HTTPException, Body
from api.core.mongo import db
from api.core.cloudinary_utils import upload_file_to_cloudinary
from datetime import datetime
from bson import ObjectId
import os
import sys
import uuid
import requests
from typing import Optional

# Add worker directory to path for imports
_project_root = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
_worker_path = os.path.join(_project_root, "worker")
if _worker_path not in sys.path:
    sys.path.insert(0, _worker_path)

from worker.tasks import generate_hd_task
from worker.inference.texture_apply import apply_texture_preview

router = APIRouter()


def download_file(url: str, dest_path: str):
    """Download a file from URL to local path"""
    response = requests.get(url, stream=True)
    response.raise_for_status()
    os.makedirs(os.path.dirname(dest_path), exist_ok=True)
    with open(dest_path, "wb") as f:
        for chunk in response.iter_content(chunk_size=8192):
            f.write(chunk)


@router.post("/outfit/apply_preview")
async def apply_preview(
    project_id: str = Body(...),
    model_upload_id: str = Body(...),
    top_fabric_upload_id: Optional[str] = Body(None),
    bottom_fabric_upload_id: Optional[str] = Body(None),
    mask_top_id: Optional[str] = Body(None),
    mask_bottom_id: Optional[str] = Body(None),
    scale: float = Body(1.0)
):
    """
    Apply fabric textures to model image using classical OpenCV methods (fast preview)
    
    This uses texture tiling and seamless cloning - no GPU required, fast results.
    """
    # Fetch model upload
    try:
        model = await db.uploads.find_one({"_id": ObjectId(model_upload_id)})
    except:
        raise HTTPException(status_code=400, detail="Invalid model_upload_id")
    
    if not model:
        raise HTTPException(status_code=404, detail="Model upload not found")
    
    # Create temporary directory for processing
    tmp_dir = os.path.join("/tmp", uuid.uuid4().hex)
    os.makedirs(tmp_dir, exist_ok=True)
    
    try:
        # Download model image
        model_path = os.path.join(tmp_dir, "model.jpg")
        download_file(model["cloudinary"]["secure_url"], model_path)
        
        # Download top fabric if provided
        top_path = None
        if top_fabric_upload_id:
            try:
                top = await db.uploads.find_one({"_id": ObjectId(top_fabric_upload_id)})
                if not top:
                    raise HTTPException(status_code=404, detail="Top fabric upload not found")
                top_path = os.path.join(tmp_dir, "top.jpg")
                download_file(top["cloudinary"]["secure_url"], top_path)
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid top_fabric_upload_id")
        
        # Download bottom fabric if provided
        bottom_path = None
        if bottom_fabric_upload_id:
            try:
                bottom = await db.uploads.find_one({"_id": ObjectId(bottom_fabric_upload_id)})
                if not bottom:
                    raise HTTPException(status_code=404, detail="Bottom fabric upload not found")
                bottom_path = os.path.join(tmp_dir, "bottom.jpg")
                download_file(bottom["cloudinary"]["secure_url"], bottom_path)
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid bottom_fabric_upload_id")
        
        # Download masks if provided
        mask_top_path = None
        if mask_top_id:
            try:
                mask_top = await db.uploads.find_one({"_id": ObjectId(mask_top_id)})
                if not mask_top:
                    raise HTTPException(status_code=404, detail="Top mask not found")
                mask_top_path = os.path.join(tmp_dir, "mask_top.png")
                download_file(mask_top["cloudinary"]["secure_url"], mask_top_path)
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid mask_top_id")
        
        mask_bottom_path = None
        if mask_bottom_id:
            try:
                mask_bottom = await db.uploads.find_one({"_id": ObjectId(mask_bottom_id)})
                if not mask_bottom:
                    raise HTTPException(status_code=404, detail="Bottom mask not found")
                mask_bottom_path = os.path.join(tmp_dir, "mask_bottom.png")
                download_file(mask_bottom["cloudinary"]["secure_url"], mask_bottom_path)
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid mask_bottom_id")
        
        # Apply texture preview (classical OpenCV method)
        # For now, apply top fabric if available
        if top_path and mask_top_path:
            out_local = apply_texture_preview(
                model_path, top_path, mask_top_path, scale=scale
            )
        elif bottom_path and mask_bottom_path:
            out_local = apply_texture_preview(
                model_path, bottom_path, mask_bottom_path, scale=scale
            )
        else:
            # No fabric/mask combination available, return original
            out_local = model_path
        
        # Upload result to Cloudinary
        folder = f"{os.getenv('CLOUDINARY_FOLDER', 'styleweave')}/previews"
        res = upload_file_to_cloudinary(out_local, folder=folder)
        
        # Create job document for preview
        job_doc = {
            "project_id": project_id,
            "type": "preview",
            "status": "done",
            "params": {
                "model_upload_id": model_upload_id,
                "top_fabric_upload_id": top_fabric_upload_id,
                "bottom_fabric_upload_id": bottom_fabric_upload_id,
                "mask_top_id": mask_top_id,
                "mask_bottom_id": mask_bottom_id,
                "scale": scale
            },
            "result": {
                "cloudinary": {
                    "public_id": res["public_id"],
                    "secure_url": res["secure_url"]
                }
            },
            "progress": 100,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        job_result = await db.jobs.insert_one(job_doc)
        job_doc["_id"] = str(job_result.inserted_id)
        
        return {
            "preview": {
                "cloudinary": res,
                "job_id": str(job_result.inserted_id)
            }
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Preview generation failed: {str(e)}")
    
    finally:
        # Cleanup temporary files
        try:
            import shutil
            if os.path.exists(tmp_dir):
                shutil.rmtree(tmp_dir)
        except:
            pass


@router.post("/outfit/generate_hd")
async def generate_hd(
    project_id: str = Body(...),
    model_upload_id: str = Body(...),
    top_fabric_upload_id: Optional[str] = Body(None),
    bottom_fabric_upload_id: Optional[str] = Body(None),
    mask_top_id: Optional[str] = Body(None),
    mask_bottom_id: Optional[str] = Body(None),
    prompt: str = Body("")
):
    """
    Queue an HD render job using Stable Diffusion inpainting
    
    This creates a background job that will process the request asynchronously.
    Use GET /v1/job/{job_id} to check status.
    """
    # Validate that at least one fabric and mask are provided
    if not (top_fabric_upload_id or bottom_fabric_upload_id):
        raise HTTPException(
            status_code=400,
            detail="At least one fabric upload must be provided"
        )
    
    if not (mask_top_id or mask_bottom_id):
        raise HTTPException(
            status_code=400,
            detail="At least one mask must be provided"
        )
    
    # Create job document
    doc = {
        "project_id": project_id,
        "type": "hd_render",
        "status": "queued",
        "params": {
            "model_upload_id": model_upload_id,
            "top_fabric_upload_id": top_fabric_upload_id,
            "bottom_fabric_upload_id": bottom_fabric_upload_id,
            "mask_top_id": mask_top_id,
            "mask_bottom_id": mask_bottom_id,
            "prompt": prompt
        },
        "progress": 0,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    try:
        result = await db.jobs.insert_one(doc)
        job_id = str(result.inserted_id)
        
        # Enqueue Celery task
        generate_hd_task.delay(job_id)
        
        return {"job_id": job_id, "status": "queued"}
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to queue job: {str(e)}"
        )

