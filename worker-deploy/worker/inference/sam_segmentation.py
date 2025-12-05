"""
SAM (Segment Anything Model) segmentation for generating top/bottom masks

This module uses segment-anything or SlimSAM to generate segmentation masks.
Place your SAM checkpoint at /weights/sam_vit_h.pth or update MODEL_CHECKPOINT path.

For SlimSAM, adapt the model loading code accordingly.
"""
import numpy as np
import cv2
import requests
import os
import uuid
from PIL import Image

# Model configuration
# Update these paths to match your SAM checkpoint location
MODEL_CHECKPOINT = os.getenv("SAM_CHECKPOINT", "/weights/sam_vit_h.pth")
MODEL_TYPE = os.getenv("SAM_MODEL_TYPE", "vit_h")  # Options: vit_h, vit_l, vit_b

# Global model cache
_sam_model = None
_predictor = None


def download_file(url: str, dest: str):
    """Download a file from URL to local path"""
    response = requests.get(url, stream=True)
    response.raise_for_status()
    os.makedirs(os.path.dirname(dest) if os.path.dirname(dest) else ".", exist_ok=True)
    with open(dest, "wb") as f:
        for chunk in response.iter_content(chunk_size=8192):
            f.write(chunk)


def load_sam_model():
    """
    Load SAM model (lazy loading, cached)
    
    To use SlimSAM instead:
    1. Install: pip install slimsam
    2. Replace segment_anything import with slimsam
    3. Update model loading code
    """
    global _sam_model, _predictor
    
    if _predictor is not None:
        return _predictor
    
    try:
        from segment_anything import sam_model_registry, SamPredictor
        
        # Check if checkpoint exists
        if not os.path.exists(MODEL_CHECKPOINT):
            raise FileNotFoundError(
                f"SAM checkpoint not found at {MODEL_CHECKPOINT}. "
                "Please download SAM checkpoint and place it in the weights directory."
            )
        
        # Load model
        _sam_model = sam_model_registry[MODEL_TYPE](checkpoint=MODEL_CHECKPOINT)
        _predictor = SamPredictor(_sam_model)
        
        return _predictor
    
    except ImportError:
        raise ImportError(
            "segment-anything not installed. Install with: "
            "pip install git+https://github.com/facebookresearch/segment-anything.git"
        )


def run_sam_on_image_from_url(img_url: str, auto_refine: bool = True):
    """
    Run SAM segmentation on an image from URL
    
    Args:
        img_url: URL of the model image
        auto_refine: Whether to apply auto-refinement (future enhancement)
    
    Returns:
        dict with "top" and "bottom" keys pointing to local mask file paths
    """
    # Create temporary directory
    tmp_dir = os.path.join("/tmp", uuid.uuid4().hex)
    os.makedirs(tmp_dir, exist_ok=True)
    
    try:
        # Download image
        img_path = os.path.join(tmp_dir, "model.jpg")
        download_file(img_url, img_path)
        
        # Load image (BGR -> RGB for SAM)
        img_bgr = cv2.imread(img_path)
        if img_bgr is None:
            raise ValueError(f"Failed to load image from {img_url}")
        
        img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
        
        # Load SAM model
        predictor = load_sam_model()
        predictor.set_image(img_rgb)
        
        # Generate masks
        # Using automatic mask generation - you can also provide bounding boxes
        # For better results, consider using pose detection to guide mask selection
        masks, scores, logits = predictor.predict(
            point_coords=None,
            point_labels=None,
            box=None,
            multimask_output=True
        )
        
        # Heuristic to select top and bottom masks
        # This is a simple approach - for production, use pose keypoints
        # to identify which masks correspond to top/bottom regions
        
        if len(masks) == 0:
            # No masks found, return empty masks
            h, w = img_rgb.shape[:2]
            top_mask = np.zeros((h, w), dtype=np.uint8)
            bottom_mask = np.zeros((h, w), dtype=np.uint8)
        else:
            # Sort masks by centroid Y coordinate
            centroids = []
            for i, mask in enumerate(masks):
                ys, xs = np.where(mask)
                if len(xs) == 0:
                    centroids.append((9999, mask, scores[i]))
                    continue
                cy = ys.mean()
                centroids.append((cy, mask, scores[i]))
            
            # Sort by Y coordinate (top to bottom)
            centroids.sort(key=lambda x: x[0])
            
            # Select top and bottom masks
            # Upper half of image -> top, lower half -> bottom
            img_height = img_rgb.shape[0]
            top_masks = [m for cy, m, s in centroids if cy < img_height * 0.5]
            bottom_masks = [m for cy, m, s in centroids if cy >= img_height * 0.5]
            
            # Combine masks (use highest scoring if multiple)
            if top_masks:
                top_mask = top_masks[0].astype(np.uint8) * 255
            else:
                top_mask = np.zeros((img_rgb.shape[0], img_rgb.shape[1]), dtype=np.uint8)
            
            if bottom_masks:
                bottom_mask = bottom_masks[0].astype(np.uint8) * 255
            else:
                bottom_mask = np.zeros((img_rgb.shape[0], img_rgb.shape[1]), dtype=np.uint8)
        
        # Save masks
        top_mask_path = os.path.join(tmp_dir, "mask_top.png")
        bottom_mask_path = os.path.join(tmp_dir, "mask_bottom.png")
        
        cv2.imwrite(top_mask_path, top_mask)
        cv2.imwrite(bottom_mask_path, bottom_mask)
        
        return {
            "top": top_mask_path,
            "bottom": bottom_mask_path
        }
    
    except Exception as e:
        # Cleanup on error
        try:
            if os.path.exists(tmp_dir):
                import shutil
                shutil.rmtree(tmp_dir)
        except:
            pass
        raise Exception(f"SAM segmentation failed: {str(e)}")


# Alternative: SlimSAM implementation (commented out - uncomment and adapt if using SlimSAM)
"""
def load_slimsam_model():
    from slimsam import build_slimsam
    model = build_slimsam("slimsam-77")
    model.eval()
    return model

def run_slimsam_on_image_from_url(img_url: str, auto_refine: bool = True):
    # SlimSAM implementation
    # See your notebook for exact usage
    pass
"""

