from pypdf import PdfReader
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from typing import List
from fastapi.middleware.cors import CORSMiddleware  # Import CORSMiddleware
import io

class ReadFiles:
    def __init__(self):
        self.supported_file_types = [
            ".pdf", ".docx", ".txt", ".md", ".ts", ".csv", ".json", ".html",
            ".xml", ".yaml", ".yml", ".js", ".py", ".java", ".cpp", ".c", ".h",
            ".cs", ".php", ".rb", ".sh", ".bat", ".ps1", ".psm1", ".psd1",
            ".ps1xml", ".pssc"
        ]

    def extract_text_from_pdf(self, file: UploadFile):
        if not file.filename.lower().endswith(".pdf"):
            raise HTTPException(status_code=400, detail="Invalid file type. Only PDF files are supported.")

        try:
            # Ensure the file pointer is at the beginning
            file.file.seek(0)
            # Pass the file-like object directly to PdfReader
            reader = PdfReader(file.file)
            text = ""
            for page in reader.pages:
                extracted_text = page.extract_text()
                if extracted_text:
                    text += extracted_text
            return text
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error processing PDF file: {str(e)}")
        finally:
            # It's good practice to close the file after processing
            file.file.close()

app = FastAPI()
read_files = ReadFiles()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all HTTP methods
    allow_headers=["*"],  # Allows all headers
)

@app.post("/extract-pdf-text")
async def extract_pdf_text(file: UploadFile = File(...)):
    """
    Endpoint to upload a PDF file and extract its text.
    """
    try:
        text = read_files.extract_text_from_pdf(file)
        return JSONResponse(content={"text": text})
    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))