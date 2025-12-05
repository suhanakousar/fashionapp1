"""
Cloudinary utilities for image upload and URL generation
"""
import cloudinary
import cloudinary.uploader
import os

# Configure Cloudinary
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
    secure=True
)


def upload_file_to_cloudinary(
    file_path: str,
    folder: str = "styleweave/uploads",
    public_id: str = None,
    overwrite: bool = True
):
    """
    Upload a file to Cloudinary
    
    Args:
        file_path: Local path to the file
        folder: Cloudinary folder path
        public_id: Optional custom public ID
        overwrite: Whether to overwrite existing files
    
    Returns:
        Cloudinary upload response dict
    """
    try:
        res = cloudinary.uploader.upload(
            file_path,
            folder=folder,
            public_id=public_id,
            overwrite=overwrite,
            resource_type="image",
            use_filename=True,
            unique_filename=True
        )
        return res
    except Exception as e:
        raise Exception(f"Cloudinary upload failed: {str(e)}")


def build_cloudinary_url(
    public_id: str,
    width: int = None,
    height: int = None,
    crop: str = "fit",
    quality: str = "auto",
    format: str = "jpg",
    extra_transforms: list = None
):
    """
    Build a Cloudinary URL with transformations
    
    Args:
        public_id: Cloudinary public ID
        width: Target width
        height: Target height
        crop: Crop mode
        quality: Quality setting
        format: Output format
        extra_transforms: Additional transformations
    
    Returns:
        Transformed Cloudinary URL
    """
    transformation = {"crop": crop, "quality": quality}
    
    if width:
        transformation["width"] = width
    if height:
        transformation["height"] = height
    
    transforms = [transformation]
    if extra_transforms:
        transforms = extra_transforms + transforms
    
    return cloudinary.CloudinaryImage(public_id).build_url(
        transformation=transforms,
        format=format
    )

