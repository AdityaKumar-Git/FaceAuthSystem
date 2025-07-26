from PIL import Image
import io
import tempfile
import os

def preprocess_image(image_file, max_size=512, quality=85):
    """
    Preprocess image for faster DeepFace processing:
    - Resize to max_size (maintains aspect ratio)
    - Convert to RGB if needed
    - Optimize quality
    - Save as JPEG
    """
    try:
        # Open image
        img = Image.open(image_file)
        
        # Convert to RGB if needed (DeepFace works better with RGB)
        if img.mode != 'RGB':
            img = img.convert('RGB')
        
        # Resize if image is too large (maintain aspect ratio)
        if max(img.size) > max_size:
            ratio = max_size / max(img.size)
            new_size = tuple(int(dim * ratio) for dim in img.size)
            img = img.resize(new_size, Image.Resampling.LANCZOS)
        
        # Save optimized image to temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as tmp:
            img.save(tmp.name, 'JPEG', quality=quality, optimize=True)
            return tmp.name
            
    except Exception as e:
        raise ValueError(f"Image preprocessing failed: {str(e)}")

def get_image_info(image_path):
    """Get basic image information for debugging"""
    with Image.open(image_path) as img:
        return {
            'size': img.size,
            'mode': img.mode,
            'format': img.format,
            'file_size_kb': os.path.getsize(image_path) / 1024
        } 