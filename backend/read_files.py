#!/home/kavinjey/.virtualenvs/myvenv/bin/python
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pypdf import PdfReader
import docx
from bs4 import BeautifulSoup
import io  # Import io for BytesIO
from mangum import Mangum

app = FastAPI()
handler = Mangum(app)

# Configure CORS middleware (adjust origins as needed for production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change this in production!
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MAX_FILE_SIZE = 5 * 1024 * 1024

class ReadFiles:
    def __init__(self):
        self.supported_file_types = [
            ".pdf", ".docx", ".txt", ".md", ".ts", ".csv", ".json", ".html",
            ".xml", ".yaml", ".yml", ".js", ".py", ".java", ".cpp", ".c", ".h",
            ".cs", ".php", ".rb", ".sh", ".bat", ".ps1", ".psm1", ".psd1",
            ".ps1xml", ".pssc"
        ]
        # Map file extensions to their respective extraction methods
        self.extractors = {
            ".pdf": self.extract_text_from_pdf,
            ".docx": self.extract_text_from_docx,
            ".txt": self.extract_text_from_text,
            ".md": self.extract_text_from_text,
            ".ts": self.extract_text_from_text,
            ".csv": self.extract_text_from_text,
            ".json": self.extract_text_from_text,
            ".html": self.extract_text_from_html,
            ".xml": self.extract_text_from_text,
            ".yaml": self.extract_text_from_text,
            ".yml": self.extract_text_from_text,
            ".js": self.extract_text_from_text,
            ".py": self.extract_text_from_text,
            ".java": self.extract_text_from_text,
            ".cpp": self.extract_text_from_text,
            ".c": self.extract_text_from_text,
            ".h": self.extract_text_from_text,
            ".cs": self.extract_text_from_text,
            ".php": self.extract_text_from_text,
            ".rb": self.extract_text_from_text,
            ".sh": self.extract_text_from_text,
            ".bat": self.extract_text_from_text,
            ".ps1": self.extract_text_from_text,
            ".psm1": self.extract_text_from_text,
            ".psd1": self.extract_text_from_text,
            ".ps1xml": self.extract_text_from_text,
            ".pssc": self.extract_text_from_text,
        }

    def get_file_size(self, upload_file: UploadFile) -> int:
        current_pos = upload_file.file.tell()
        upload_file.file.seek(0, 2)   # Go to the end of the file
        size = upload_file.file.tell()
        upload_file.file.seek(current_pos)  # Go back to original position
        return size

    def extract_text_from_pdf(self, file: UploadFile):
        try:
            # file_size = self.get_file_size(file)
            # if file_size > MAX_FILE_SIZE:
            #     raise HTTPException(status_code=413, detail="File too large (max 5 MB).")
            file.file.seek(0)
            reader = PdfReader(file.file)
            text = ""
            for page in reader.pages:
                extracted_text = page.extract_text()
                if extracted_text:
                    text += extracted_text + "\n"
            return text
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error processing PDF file: {str(e)}")
        finally:
            file.file.close()

    def extract_text_from_docx(self, file: UploadFile):
        try:
            # if file.size() > MAX_FILE_SIZE:
            #     raise HTTPException(status_code=413, detail="File too large (max 5 MB).")
            # Read the entire file into bytes
            file.file.seek(0)
            data = file.file.read()

            # Use BytesIO to create a file-like object
            doc = docx.Document(io.BytesIO(data))

            # Extract text from paragraphs
            text = "\n".join([para.text for para in doc.paragraphs])
            return text
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error processing DOCX file: {str(e)}")
        finally:
            file.file.close()

    def extract_text_from_html(self, file: UploadFile):
        try:
            # if file.size() > MAX_FILE_SIZE:
            #     raise HTTPException(status_code=413, detail="File too large (max 5 MB).")
            file.file.seek(0)
            content = file.file.read().decode('utf-8', errors='ignore')
            soup = BeautifulSoup(content, "html.parser")
            text = soup.get_text(separator='\n')
            return text
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error processing HTML file: {str(e)}")
        finally:
            file.file.close()

    def extract_text_from_text(self, file: UploadFile):
        try:
            # if file.size() > MAX_FILE_SIZE:
            #     raise HTTPException(status_code=413, detail="File too large (max 5 MB).")
            file.file.seek(0)
            # Attempt to detect encoding; default to utf-8
            content = file.file.read().decode('utf-8', errors='ignore')
            print("HERE", content)
            return content
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error processing text file: {str(e)}")
        finally:
            file.file.close()

    def extract_text(self, file: UploadFile):
        # Identify the file extension
        # if file.size() > MAX_FILE_SIZE:
        #         raise HTTPException(status_code=413, detail="File too large (max 5 MB).")
        filename = file.filename.lower()
        matched_extension = None
        for ext in self.supported_file_types:
            if filename.endswith(ext):
                matched_extension = ext
                break

        if not matched_extension:
            raise HTTPException(status_code=400, detail="Unsupported file type.")

        extractor = self.extractors.get(matched_extension)
        if extractor:
            return extractor(file)
        else:
            raise HTTPException(status_code=400, detail=f"No extractor available for file type: {matched_extension}")

read_files = ReadFiles()

@app.post("/extract-pdf-text")
async def extract_text_endpoint(file: UploadFile = File(...)):
    """
    Endpoint to upload a file and extract its text based on the file type.
    """
    file_size = read_files.get_file_size(file)
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File too large (max 5 MB).")
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file uploaded.")

    try:
        text = read_files.extract_text(file)
        return JSONResponse(content={"text": text})
    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))