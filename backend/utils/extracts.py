import pdfplumber
from pptx import Presentation
import fitz
from PIL import Image
import pytesseract
import io
import os

def extract_text_from_pdf(path: str) -> str:
    text_parts = []
    with pdfplumber.open(path) as pdf:
        for page in pdf.pages:
            txt = page.extract_text()
            if txt:
                text_parts.append(txt)

    # OCR fallback for images inside PDF
    pdf_doc = fitz.open(path)
    for page in pdf_doc:
        for img in page.get_images(full=True):
            base_image = pdf_doc.extract_image(img[0])
            image = Image.open(io.BytesIO(base_image["image"]))
            ocr_text = pytesseract.image_to_string(image)
            if ocr_text.strip():
                text_parts.append(ocr_text)
    return "\n".join(text_parts)


def extract_text_from_pptx(path: str) -> str:
    prs = Presentation(path)
    text_parts = []

    for slide in prs.slides:
        for shape in slide.shapes:
            if hasattr(shape, "text") and shape.text:
                text_parts.append(shape.text)

    # OCR for images
    for slide in prs.slides:
        for shape in slide.shapes:
            if shape.shape_type == 13:  # picture
                img_bytes = shape.image.blob
                image = Image.open(io.BytesIO(img_bytes))
                ocr_text = pytesseract.image_to_string(image)
                if ocr_text.strip():
                    text_parts.append(ocr_text)

    return "\n".join(text_parts)


def extract_text(path: str) -> str:
    ext = os.path.splitext(path)[1].lower()
    if ext == ".pdf":
        return extract_text_from_pdf(path)
    elif ext == ".pptx":
        return extract_text_from_pptx(path)
    else:
        raise ValueError("Unsupported file type")
