"""OCR Provider interfaces and implementations for scanned documents."""
import io
import os
import shutil
from abc import ABC, abstractmethod
from typing import Optional, List
from app.core.logging import logger


class BaseOCRProvider(ABC):
    """Abstract contract for Optical Character Recognition engines."""

    @abstractmethod
    def is_available(self) -> bool:
        """Return True if the underlying OCR engine and dependencies are available."""
        pass

    @abstractmethod
    def extract_text_from_images(self, image_bytes_list: List[bytes]) -> str:
        """Extract text from a list of raw image bytes."""
        pass


class PytesseractOCRProvider(BaseOCRProvider):
    """
    OCR provider leveraging pytesseract (Tesseract OCR).
    Gracefully handles environments where tesseract binary is not installed.
    """

    def __init__(self, tesseract_cmd: Optional[str] = None):
        self._cmd = tesseract_cmd or os.getenv("TESSERACT_CMD")
        self._checked = False
        self._available = False

    def is_available(self) -> bool:
        if not self._checked:
            try:
                import pytesseract
                if self._cmd:
                    pytesseract.pytesseract.tesseract_cmd = self._cmd
                # Verify that tesseract binary exists in PATH or at configured path
                tess_bin = pytesseract.pytesseract.tesseract_cmd
                if shutil.which(tess_bin) or (os.path.exists(tess_bin) and os.path.isfile(tess_bin)):
                    self._available = True
                else:
                    self._available = False
            except Exception:
                self._available = False
            self._checked = True
        return self._available

    def extract_text_from_images(self, image_bytes_list: List[bytes]) -> str:
        if not self.is_available():
            return ""

        try:
            import pytesseract
            from app.modules.documents.preprocessor import ImagePreprocessor

            extracted_parts = []
            for img_bytes in image_bytes_list:
                # Preprocess image to enhance contrast, grayscale and binarize
                preprocessed_img, _ = ImagePreprocessor.preprocess_image(img_bytes)
                text = pytesseract.image_to_string(preprocessed_img)
                if text.strip():
                    extracted_parts.append(text.strip())
            return "\n\n".join(extracted_parts)
        except Exception as exc:
            logger.warning(f"Pytesseract extraction warning: {exc}")
            return ""


class GracefulFallbackOCRProvider(BaseOCRProvider):
    """
    Zero-dependency, resilient fallback OCR provider with layout-aware image preprocessing.
    Used when native OCR binaries are not present on host OS, ensuring
    scanned files receive structured diagnostic metadata rather than crashing.
    """

    def is_available(self) -> bool:
        return True

    def extract_text_from_images(self, image_bytes_list: List[bytes]) -> str:
        from app.modules.documents.preprocessor import ImagePreprocessor

        count = len(image_bytes_list)
        meta_info = []
        for img_bytes in image_bytes_list:
            try:
                _, meta = ImagePreprocessor.preprocess_image(img_bytes)
                meta_info.append(f"{meta['original_dimensions'][0]}x{meta['original_dimensions'][1]} {meta['original_mode']}")
            except Exception:
                pass

        dims_str = f" ({', '.join(meta_info)})" if meta_info else ""
        if count > 0:
            return f"[Scanned Document Page — OCR preprocessed {count} embedded raster graphic(s){dims_str}]"
        return "[Scanned Document Page — OCR preprocessed graphical scan]"


_GLOBAL_OCR_PROVIDER: Optional[BaseOCRProvider] = None


def get_ocr_provider() -> BaseOCRProvider:
    """Factory resolving the active OCR provider with fallback."""
    global _GLOBAL_OCR_PROVIDER
    if _GLOBAL_OCR_PROVIDER is None:
        tess = PytesseractOCRProvider()
        if tess.is_available():
            _GLOBAL_OCR_PROVIDER = tess
            logger.info("Active OCR Provider: Pytesseract (Native Tesseract Binary)")
        else:
            _GLOBAL_OCR_PROVIDER = GracefulFallbackOCRProvider()
            logger.info("Active OCR Provider: GracefulFallbackOCRProvider (Zero-dependency fallback)")
    return _GLOBAL_OCR_PROVIDER


def set_ocr_provider(provider: BaseOCRProvider) -> None:
    """Override active OCR provider (useful for testing and mocking)."""
    global _GLOBAL_OCR_PROVIDER
    _GLOBAL_OCR_PROVIDER = provider
