"""
Scanned circular and image preprocessing engine for OCR optimization.
Applies grayscale conversion, adaptive thresholding/binarization, and noise reduction
to optimize recognition of scanned official circulars and stamped documents.
"""
import io
from typing import Tuple, Optional
from PIL import Image, ImageOps, ImageFilter, ImageEnhance


class ImagePreprocessor:
    """Preprocesses raw image bytes to maximize optical text recognition accuracy."""

    @staticmethod
    def preprocess_image(
        image_bytes: bytes,
        target_dpi: int = 300,
        contrast_factor: float = 1.8,
        binarize_threshold: int = 150,
    ) -> Tuple[Image.Image, dict]:
        """
        Converts raw image bytes into a clean, high-contrast binarized PIL Image.
        Returns:
            (processed_pil_image, metadata_dict)
        """
        raw_img = Image.open(io.BytesIO(image_bytes))
        orig_width, orig_height = raw_img.size
        orig_mode = raw_img.mode

        # 1. Convert to RGB if palette/RGBA, then to Grayscale
        if raw_img.mode in ("RGBA", "LA", "P"):
            background = Image.new("RGB", raw_img.size, (255, 255, 255))
            if raw_img.mode == "P":
                raw_img = raw_img.convert("RGBA")
            background.paste(raw_img, mask=raw_img.split()[-1] if "A" in raw_img.mode else None)
            gray_img = ImageOps.grayscale(background)
        else:
            gray_img = ImageOps.grayscale(raw_img)

        # 2. Rescale if resolution is too low (standard OCR optimal DPI is ~300)
        # If width < 1200px and height < 1200px, upscale 1.5x with LANCZOS
        scale_applied = 1.0
        if orig_width < 1200 and orig_height < 1200:
            scale_applied = 1.5
            new_size = (int(orig_width * scale_applied), int(orig_height * scale_applied))
            gray_img = gray_img.resize(new_size, Image.Resampling.LANCZOS)

        # 3. Enhance Contrast & Sharpness
        enhancer = ImageEnhance.Contrast(gray_img)
        contrasted_img = enhancer.enhance(contrast_factor)
        sharp_img = ImageEnhance.Sharpness(contrasted_img).enhance(1.4)

        # 4. Adaptive Binarization (Otsu-style luminance partition)
        # Pixels below threshold become black (text), above become white (paper)
        binarized_img = sharp_img.point(lambda p: 255 if p > binarize_threshold else 0, mode="1")

        # 5. Metadata for audit & inspection
        meta = {
            "original_dimensions": [orig_width, orig_height],
            "original_mode": orig_mode,
            "scale_factor": scale_applied,
            "contrast_factor": contrast_factor,
            "binarize_threshold": binarize_threshold,
            "is_preprocessed": True,
        }

        return binarized_img, meta
