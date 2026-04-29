import io
from pypdf import PdfReader
import docx2txt

def extract_text_from_file(file_content: bytes, filename: str) -> str:
    text = ""
    if filename.endswith(".pdf"):
        reader = PdfReader(io.BytesIO(file_content))
        for page in reader.pages:
            text += page.extract_text()
    elif filename.endswith(".docx"):
        text = docx2txt.process(io.BytesIO(file_content))
    else:
        text = file_content.decode("utf-8", errors="ignore")
    return text