"""
Classical texture application using OpenCV (fast preview, no GPU required)

This uses texture tiling and seamless cloning for fast, deterministic results.
Perfect for preview mode before running expensive GPU-based inpainting.
"""
import cv2
import numpy as np
import os
from PIL import Image


def tile_image_to_bbox(texture: np.ndarray, bbox_w: int, bbox_h: int):
    """
    Tile a texture image to fill a bounding box
    
    Args:
        texture: Texture image array
        bbox_w: Target width
        bbox_h: Target height
    
    Returns:
        Tiled texture array
    """
    th, tw = texture.shape[:2]
    
    # Calculate repetitions needed
    reps_x = int(np.ceil(bbox_w / tw))
    reps_y = int(np.ceil(bbox_h / th))
    
    # Tile the texture
    tiled = np.tile(texture, (reps_y, reps_x, 1))
    
    # Crop to exact size
    tiled = tiled[:bbox_h, :bbox_w]
    
    return tiled


def apply_texture_preview(
    model_path: str,
    fabric_path: str,
    mask_path: str,
    scale: float = 1.0
):
    """
    Apply fabric texture to model image using classical OpenCV methods
    
    This is a fast, deterministic method using:
    1. Texture tiling to fill the masked region
    2. Seamless cloning for natural blending
    
    Args:
        model_path: Path to model image
        fabric_path: Path to fabric texture image
        mask_path: Path to mask image (white = region to apply fabric)
        scale: Scale factor for texture (1.0 = original size)
    
    Returns:
        Path to output image
    """
    # Load images
    model = cv2.imread(model_path)
    if model is None:
        raise ValueError(f"Failed to load model image: {model_path}")
    
    h, w = model.shape[:2]
    
    if fabric_path is None or mask_path is None:
        # No fabric/mask provided, return original
        return model_path
    
    fabric = cv2.imread(fabric_path)
    if fabric is None:
        raise ValueError(f"Failed to load fabric image: {fabric_path}")
    
    mask = cv2.imread(mask_path, cv2.IMREAD_GRAYSCALE)
    if mask is None:
        raise ValueError(f"Failed to load mask image: {mask_path}")
    
    # Resize mask to match model if needed
    if mask.shape[:2] != (h, w):
        mask = cv2.resize(mask, (w, h))
    
    # Find bounding box of mask
    ys, xs = np.where(mask > 127)
    if len(xs) == 0:
        # Empty mask, return original
        return model_path
    
    minx, maxx = xs.min(), xs.max()
    miny, maxy = ys.min(), ys.max()
    bbox_w = maxx - minx + 1
    bbox_h = maxy - miny + 1
    
    # Tile fabric to bounding box size
    tiled = tile_image_to_bbox(fabric, bbox_w, bbox_h)
    
    # Apply scale if needed
    if scale != 1.0:
        new_w = int(bbox_w * scale)
        new_h = int(bbox_h * scale)
        tiled = cv2.resize(tiled, (new_w, new_h), interpolation=cv2.INTER_LINEAR)
        bbox_w, bbox_h = new_w, new_h
    
    # Create canvas with tiled fabric placed at bbox position
    canvas = model.copy()
    
    # Ensure we don't go out of bounds
    end_x = min(minx + bbox_w, w)
    end_y = min(miny + bbox_h, h)
    actual_w = end_x - minx
    actual_h = end_y - miny
    
    # Place tiled fabric on canvas
    canvas[miny:end_y, minx:end_x] = tiled[:actual_h, :actual_w]
    
    # Create mask for seamless cloning (only the bbox region)
    mask_crop = np.zeros((h, w), dtype=np.uint8)
    mask_crop[miny:end_y, minx:end_x] = 255
    
    # Calculate center point for seamless cloning
    center = (minx + actual_w // 2, miny + actual_h // 2)
    
    # Apply seamless cloning for natural blending
    output = cv2.seamlessClone(
        canvas,
        model,
        mask_crop,
        center,
        cv2.NORMAL_CLONE
    )
    
    # Save output
    out_path = os.path.join("/tmp", f"preview_{os.getpid()}_{uuid.uuid4().hex}.jpg")
    cv2.imwrite(out_path, output)
    
    return out_path

