"""
Mask generation route - generates segmentation masks using SAM/SlimSAM
"""
from fastapi import APIRouter, HTTPException, Body
from core.mongo import db
from core.cloudinary_utils import upload_file_to_cloudinary
from bson import ObjectId
from datetime import datetime
import os
import sys
from typing import Optional

# Add worker directory to path for imports
_project_root = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
_worker_path = os.path.join(_project_root, "worker-deploy")
if _worker_path not in sys.path:
    sys.path.insert(0, _worker_path)

from worker.inference.sam_segmentation import run_sam_on_image_from_url

router = APIRouter()


@router.post("/mask/generate")
async def generate_mask(
    upload_id: str = Body(..., embed=True),
    auto_refine: bool = Body(True, embed=True)
):
    """
    Generate segmentation masks for top and bottom regions from a model image
    
    - **upload_id**: ID of the model image upload
    - **auto_refine**: Whether to apply auto-refinement to masks
    """
    # Fetch upload document
    try:
        upload_doc = await db.uploads.find_one({"_id": ObjectId(upload_id)})
    except:
        raise HTTPException(status_code=400, detail="Invalid upload_id format")
    
    if not upload_doc:
        raise HTTPException(status_code=404, detail="Upload not found")
    
    if upload_doc["type"] != "model":
        raise HTTPException(
            status_code=400,
            detail="Upload must be of type 'model'"
        )
    
    img_url = upload_doc["cloudinary"]["secure_url"]
    
    try:
        # Run segmentation (downloads image inside function)
        # Returns: {"top": "/tmp/top_mask.png", "bottom": "/tmp/bottom_mask.png"}
        masks = run_sam_on_image_from_url(img_url, auto_refine=auto_refine)
        
        responses = []
        
        # Upload each mask to Cloudinary and create upload documents
        for name, local_path in masks.items():
            if not os.path.exists(local_path):
                continue
            
            # Upload mask to Cloudinary
            folder = f"{os.getenv('CLOUDINARY_FOLDER', 'styleweave')}/masks"
            res = upload_file_to_cloudinary(local_path, folder=folder)
            
            # Create mask upload document
            doc = {
                "project_id": upload_doc.get("project_id"),
                "type": f"mask_{name}",
                "cloudinary": {
                    "public_id": res["public_id"],
                    "secure_url": res["secure_url"],
                    "width": res.get("width"),
                    "height": res.get("height"),
                },
                "meta": {
                    "source_upload": upload_id,
                    "auto_refine": auto_refine
                },
                "created_at": datetime.utcnow()
            }
            
            result = await db.uploads.insert_one(doc)
            responses.append({
                "id": str(result.inserted_id),
                "type": name,
                "cloudinary": doc["cloudinary"]
            })
            
            # Cleanup local mask file
            try:
                os.remove(local_path)
            except:
                pass
        
        if not responses:
            raise HTTPException(
                status_code=500,
                detail="Failed to generate masks"
            )
        
        return {"masks": responses}
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Mask generation failed: {str(e)}"
        )

