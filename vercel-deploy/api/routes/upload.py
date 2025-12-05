"""
Upload route - handles image uploads (model, top_fabric, bottom_fabric)
"""
from fastapi import APIRouter, File, UploadFile, Form, HTTPException
from api.core.cloudinary_utils import upload_file_to_cloudinary
from api.core.mongo import db
from datetime import datetime
import uuid
import os
import tempfile

router = APIRouter()


@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    project_id: str = Form(None),
    type: str = Form(...)
):
    """
    Upload an image file (model, top_fabric, or bottom_fabric)
    
    - **file**: Image file to upload
    - **project_id**: Optional project identifier
    - **type**: Type of upload - 'model', 'top_fabric', or 'bottom_fabric'
    """
    if type not in ["model", "top_fabric", "bottom_fabric"]:
        raise HTTPException(
            status_code=400,
            detail="type must be 'model', 'top_fabric', or 'bottom_fabric'"
        )
    
    # Validate file type
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Save to temporary file
    suffix = os.path.splitext(file.filename or "image")[1]
    tmp_path = os.path.join(tempfile.gettempdir(), f"{uuid.uuid4().hex}{suffix}")
    
    try:
        # Write uploaded file to temp location
        with open(tmp_path, "wb") as f:
            content = await file.read()
            f.write(content)
        
        # Upload to Cloudinary
        folder = f"{os.getenv('CLOUDINARY_FOLDER', 'styleweave')}/{type}"
        res = upload_file_to_cloudinary(tmp_path, folder=folder)
        
        # Create upload document
        doc = {
            "project_id": project_id,
            "type": type,
            "cloudinary": {
                "public_id": res["public_id"],
                "secure_url": res["secure_url"],
                "width": res.get("width"),
                "height": res.get("height"),
            },
            "meta": {
                "original_filename": file.filename,
                "content_type": file.content_type,
                "size": len(content)
            },
            "created_at": datetime.utcnow()
        }
        
        # Insert into MongoDB
        result = await db.uploads.insert_one(doc)
        doc["_id"] = str(result.inserted_id)
        
        return {"success": True, "upload": doc}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")
    
    finally:
        # Cleanup temp file
        try:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)
        except:
            pass

