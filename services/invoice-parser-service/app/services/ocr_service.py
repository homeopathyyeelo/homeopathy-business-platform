"""
OCR Service - P0 Implementation
Extract text from scanned PDFs using Tesseract
"""

import pytesseract
from pdf2image import convert_from_bytes
from PIL import Image
import io

class OCRService:
    """OCR service for scanned invoices"""
    
    def __init__(self):
        self.lang = 'eng'
        self.config = '--psm 6'  # Assume uniform block of text
    
    async def extract_text(self, pdf_content: bytes) -> str:
        """
        Extract text from scanned PDF using OCR
        P0: Basic Tesseract OCR
        """
        try:
            # Convert PDF to images
            images = convert_from_bytes(pdf_content, dpi=300)
            
            # Extract text from each page
            full_text = ""
            for image in images:
                text = pytesseract.image_to_string(
                    image,
                    lang=self.lang,
                    config=self.config
                )
                full_text += text + "\n"
            
            return full_text
            
        except Exception as e:
            print(f"OCR error: {str(e)}")
            return ""
    
    async def extract_with_confidence(self, pdf_content: bytes) -> dict:
        """Extract text with confidence scores"""
        try:
            images = convert_from_bytes(pdf_content, dpi=300)
            
            results = []
            for idx, image in enumerate(images):
                data = pytesseract.image_to_data(
                    image,
                    lang=self.lang,
                    output_type=pytesseract.Output.DICT
                )
                
                # Calculate average confidence
                confidences = [int(c) for c in data['conf'] if int(c) > 0]
                avg_conf = sum(confidences) / len(confidences) if confidences else 0
                
                results.append({
                    'page': idx + 1,
                    'text': ' '.join(data['text']),
                    'confidence': avg_conf / 100.0
                })
            
            return {
                'pages': results,
                'full_text': '\n'.join(r['text'] for r in results),
                'avg_confidence': sum(r['confidence'] for r in results) / len(results)
            }
            
        except Exception as e:
            print(f"OCR with confidence error: {str(e)}")
            return {'pages': [], 'full_text': '', 'avg_confidence': 0.0}
