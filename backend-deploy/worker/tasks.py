"""
Celery tasks for background job processing
"""
import os
import uuid
import requests
from celery import Celery
from pymongo import MongoClient
from datetime import datetime
import shutil

# Import cloudinary utils (create a lightweight version for worker)
import cloudinary
import cloudinary.uploader

# Configure Cloudinary in worker
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
    secure=True
)

# Celery configuration
REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")
celery = Celery("worker", broker=REDIS_URL, backend=REDIS_URL)

# MongoDB connection (using pymongo for worker)
MONGO_URI = os.getenv("MONGO_URI", "mongodb://mongo:27017/styleweave")
mongo = MongoClient(MONGO_URI)
db = mongo.styleweave


def download_file(url: str, dest: str):
    """Download a file from URL to local path"""
    response = requests.get(url, stream=True)
    response.raise_for_status()
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    with open(dest, "wb") as f:
        for chunk in response.iter_content(chunk_size=8192):
            f.write(chunk)


def upload_file_to_cloudinary(file_path: str, folder: str = "styleweave/results"):
    """Upload file to Cloudinary"""
    try:
        res = cloudinary.uploader.upload(
            file_path,
            folder=folder,
            resource_type="image",
            use_filename=True,
            unique_filename=True
        )
        return res
    except Exception as e:
        raise Exception(f"Cloudinary upload failed: {str(e)}")


@celery.task(bind=True, max_retries=3)
def generate_hd_task(self, job_id: str):
    """
    Generate HD render using Stable Diffusion inpainting
    
    This task:
    1. Loads job from MongoDB
    2. Downloads model, fabric(s), mask(s) from Cloudinary
    3. Runs inpainting via diffusers
    4. Uploads result to Cloudinary
    5. Updates job status
    """
    try:
        from bson import ObjectId
        import sys
        sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        from worker.inference.inpaint_sd import run_inpainting
        
        # Load job
        job = db.jobs.find_one({"_id": ObjectId(job_id)})
        if not job:
            raise Exception(f"Job {job_id} not found")
        
        # Update status to running
        db.jobs.update_one(
            {"_id": ObjectId(job_id)},
            {"$set": {"status": "running", "progress": 10, "updated_at": datetime.utcnow()}}
        )
        
        params = job["params"]
        tmp_dir = os.path.join("/tmp", uuid.uuid4().hex)
        os.makedirs(tmp_dir, exist_ok=True)
        
        try:
            # Download model image
            model_doc = db.uploads.find_one({"_id": ObjectId(params["model_upload_id"])})
            if not model_doc:
                raise Exception("Model upload not found")
            
            model_path = os.path.join(tmp_dir, "model.jpg")
            download_file(model_doc["cloudinary"]["secure_url"], model_path)
            
            # Download top fabric if provided
            top_path = None
            if params.get("top_fabric_upload_id"):
                top_doc = db.uploads.find_one({"_id": ObjectId(params["top_fabric_upload_id"])})
                if top_doc:
                    top_path = os.path.join(tmp_dir, "top.jpg")
                    download_file(top_doc["cloudinary"]["secure_url"], top_path)
            
            # Download bottom fabric if provided
            bottom_path = None
            if params.get("bottom_fabric_upload_id"):
                bottom_doc = db.uploads.find_one({"_id": ObjectId(params["bottom_fabric_upload_id"])})
                if bottom_doc:
                    bottom_path = os.path.join(tmp_dir, "bottom.jpg")
                    download_file(bottom_doc["cloudinary"]["secure_url"], bottom_path)
            
            # Download masks
            mask_top_path = None
            if params.get("mask_top_id"):
                mask_top_doc = db.uploads.find_one({"_id": ObjectId(params["mask_top_id"])})
                if mask_top_doc:
                    mask_top_path = os.path.join(tmp_dir, "mask_top.png")
                    download_file(mask_top_doc["cloudinary"]["secure_url"], mask_top_path)
            
            mask_bottom_path = None
            if params.get("mask_bottom_id"):
                mask_bottom_doc = db.uploads.find_one({"_id": ObjectId(params["mask_bottom_id"])})
                if mask_bottom_doc:
                    mask_bottom_path = os.path.join(tmp_dir, "mask_bottom.png")
                    download_file(mask_bottom_doc["cloudinary"]["secure_url"], mask_bottom_path)
            
            # Update progress
            db.jobs.update_one(
                {"_id": ObjectId(job_id)},
                {"$set": {"progress": 30, "updated_at": datetime.utcnow()}}
            )
            
            # Run inpainting (GPU)
            prompt = params.get("prompt", "Realistic clothing fabric matching reference")
            out_path = run_inpainting(
                model_img_path=model_path,
                top_fabric_path=top_path,
                bottom_fabric_path=bottom_path,
                mask_top_path=mask_top_path,
                mask_bottom_path=mask_bottom_path,
                prompt=prompt
            )
            
            # Update progress
            db.jobs.update_one(
                {"_id": ObjectId(job_id)},
                {"$set": {"progress": 80, "updated_at": datetime.utcnow()}}
            )
            
            # Upload result to Cloudinary
            folder = f"{os.getenv('CLOUDINARY_FOLDER', 'styleweave')}/results/{job.get('project_id', 'default')}"
            res = upload_file_to_cloudinary(out_path, folder=folder)
            
            # Update job as done
            db.jobs.update_one(
                {"_id": ObjectId(job_id)},
                {
                    "$set": {
                        "status": "done",
                        "progress": 100,
                        "result": {
                            "cloudinary": {
                                "public_id": res["public_id"],
                                "secure_url": res["secure_url"],
                                "width": res.get("width"),
                                "height": res.get("height")
                            }
                        },
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            
            return {"result": res}
        
        finally:
            # Cleanup temporary files
            try:
                if os.path.exists(tmp_dir):
                    shutil.rmtree(tmp_dir)
            except:
                pass
    
    except Exception as e:
        # Update job as failed
        db.jobs.update_one(
            {"_id": ObjectId(job_id)},
            {
                "$set": {
                    "status": "failed",
                    "error": str(e),
                    "updated_at": datetime.utcnow()
                }
            }
        )
        raise

