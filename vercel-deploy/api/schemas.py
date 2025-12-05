"""
Pydantic schemas for request/response validation
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class UploadResponse(BaseModel):
    """Upload response schema"""
    success: bool
    upload: dict


class MaskGenerateRequest(BaseModel):
    """Mask generation request"""
    upload_id: str
    auto_refine: bool = True


class MaskResponse(BaseModel):
    """Mask generation response"""
    masks: List[dict]


class PreviewRequest(BaseModel):
    """Preview generation request"""
    project_id: str
    model_upload_id: str
    top_fabric_upload_id: Optional[str] = None
    bottom_fabric_upload_id: Optional[str] = None
    mask_top_id: Optional[str] = None
    mask_bottom_id: Optional[str] = None
    scale: float = 1.0


class HDGenerateRequest(BaseModel):
    """HD generation request"""
    project_id: str
    model_upload_id: str
    top_fabric_upload_id: Optional[str] = None
    bottom_fabric_upload_id: Optional[str] = None
    mask_top_id: Optional[str] = None
    mask_bottom_id: Optional[str] = None
    prompt: str = ""


class JobResponse(BaseModel):
    """Job status response"""
    _id: str
    project_id: str
    type: str
    status: str
    params: dict
    progress: int
    result: Optional[dict] = None
    error: Optional[str] = None
    created_at: datetime
    updated_at: datetime

