"""
Stable Diffusion inpainting for HD fabric application

This module uses diffusers to run Stable Diffusion inpainting on GPU.
The pipeline is cached globally for performance.

Model: runwayml/stable-diffusion-inpainting (default)
You can swap to other models by changing MODEL_ID.

For better fabric conditioning, consider:
1. DreamBooth fine-tuning with fabric images
2. Custom embeddings
3. ControlNet for more precise control
"""
import torch
from diffusers import StableDiffusionInpaintPipeline
from PIL import Image
import numpy as np
import os
import uuid

# Model configuration
MODEL_ID = os.getenv("SD_MODEL_ID", "runwayml/stable-diffusion-inpainting")
# Alternative models:
# - "stabilityai/stable-diffusion-2-inpainting"
# - "runwayml/stable-diffusion-inpainting" (default)

# Device configuration
_device = "cuda" if torch.cuda.is_available() else "cpu"
_dtype = torch.float16 if _device == "cuda" else torch.float32

# Global pipeline cache
PIPELINE = None


def get_pipeline():
    """
    Get or create the inpainting pipeline (cached globally)
    
    The pipeline is loaded once and reused for all requests.
    """
    global PIPELINE
    
    if PIPELINE is None:
        print(f"Loading Stable Diffusion inpainting model: {MODEL_ID}")
        print(f"Device: {_device}, Dtype: {_dtype}")
        
        PIPELINE = StableDiffusionInpaintPipeline.from_pretrained(
            MODEL_ID,
            torch_dtype=_dtype
        ).to(_device)
        
        # Enable attention slicing for memory efficiency
        PIPELINE.enable_attention_slicing()
        
        # Enable memory efficient attention if available
        if hasattr(PIPELINE, "enable_xformers_memory_efficient_attention"):
            try:
                PIPELINE.enable_xformers_memory_efficient_attention()
            except:
                pass
        
        print("Pipeline loaded successfully")
    
    return PIPELINE


def run_inpainting(
    model_img_path: str,
    top_fabric_path: str = None,
    bottom_fabric_path: str = None,
    mask_top_path: str = None,
    mask_bottom_path: str = None,
    prompt: str = "Realistic clothing fabric matching reference",
    guidance_scale: float = 7.5,
    steps: int = 30,
    strength: float = 0.8
):
    """
    Run Stable Diffusion inpainting to apply fabric to masked regions
    
    Args:
        model_img_path: Path to model image
        top_fabric_path: Path to top fabric image (optional)
        bottom_fabric_path: Path to bottom fabric image (optional)
        mask_top_path: Path to top mask
        mask_bottom_path: Path to bottom mask
        prompt: Text prompt for inpainting
        guidance_scale: Guidance scale (higher = more adherence to prompt)
        steps: Number of inference steps
        strength: Inpainting strength (0-1)
    
    Returns:
        Path to output image
    """
    pipe = get_pipeline()
    
    # Load model image
    model_img = Image.open(model_img_path).convert("RGB")
    
    # For simplicity, we'll do sequential inpainting if both top and bottom are provided
    # Alternatively, you can merge masks and do a single pass
    
    current_img = model_img
    
    # Apply top fabric if provided
    if top_fabric_path and mask_top_path:
        mask_top = Image.open(mask_top_path).convert("L")
        
        # Enhance prompt with fabric description
        top_prompt = f"{prompt}, top fabric texture"
        
        print(f"Inpainting top region with prompt: {top_prompt}")
        
        current_img = pipe(
            prompt=top_prompt,
            image=current_img,
            mask_image=mask_top,
            guidance_scale=guidance_scale,
            num_inference_steps=steps,
            strength=strength
        ).images[0]
    
    # Apply bottom fabric if provided
    if bottom_fabric_path and mask_bottom_path:
        mask_bottom = Image.open(mask_bottom_path).convert("L")
        
        # Enhance prompt with fabric description
        bottom_prompt = f"{prompt}, bottom fabric texture"
        
        print(f"Inpainting bottom region with prompt: {bottom_prompt}")
        
        current_img = pipe(
            prompt=bottom_prompt,
            image=current_img,
            mask_image=mask_bottom,
            guidance_scale=guidance_scale,
            num_inference_steps=steps,
            strength=strength
        ).images[0]
    
    # Save output
    out_path = os.path.join("/tmp", f"inpaint_{os.getpid()}_{uuid.uuid4().hex}.png")
    current_img.save(out_path)
    
    return out_path


# Advanced: Fabric conditioning via image embedding (future enhancement)
"""
To condition inpainting on a specific fabric image more precisely:

1. Use ControlNet for inpainting (requires custom model)
2. Use image embeddings (CLIP) to guide the generation
3. Fine-tune SD with DreamBooth on fabric images

Example with image embedding:
    from transformers import CLIPProcessor, CLIPModel
    clip_model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
    fabric_embedding = clip_model.get_image_features(fabric_image)
    # Use embedding to condition generation
"""

