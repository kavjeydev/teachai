#!/home/kavinjey/.virtualenvs/myvenv/bin/python
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pypdf import PdfReader
import docx
from bs4 import BeautifulSoup
import io  # Import io for BytesIO
from mangum import Mangum
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List
import openai
import numpy as np
from neo4j import GraphDatabase
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
import os

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


# Load environment variables
load_dotenv()

app = FastAPI()
openai.api_key = os.getenv("OPENAI_API_KEY")
neo4j_uri = os.getenv("NEO4J_URI")
neo4j_user = os.getenv("NEO4J_USER")
neo4j_password = os.getenv("NEO4J_PASSWORD")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Data Models
class ChunkScore(BaseModel):
    chunk_id: str
    chunk_text: str
    score: float

class AnswerWithContext(BaseModel):
    answer: str = ""
    context: List[ChunkScore] = []

class QuestionRequest(BaseModel):
    question: str
    chat_id: str

class CreateNodesAndEmbeddingsRequest(BaseModel):
    pdf_text: str
    pdf_id: str
    chat_id: str
    filename: str

# Helper Functions
def sanitize_for_neo4j(text: str) -> str:
    safe_text = text
    safe_text = safe_text.replace('\\', '\\\\')
    safe_text = safe_text.replace('"', '\\"')
    safe_text = safe_text.replace("'", "\\'")
    safe_text = safe_text.replace('\n', '\\n')
    safe_text = safe_text.replace('\r', '\\r')
    return safe_text

def chunk_text(full_text: str, max_chars: int = 500) -> List[str]:
    chunks = []
    start = 0
    while start < len(full_text):
        end = start + max_chars
        if end > len(full_text):
            chunks.append(full_text[start:])
            break
        chunks.append(full_text[start:end])
        start = end
    return chunks

def get_embedding(text: str) -> List[float]:
    response = openai.embeddings.create(
        model="text-embedding-3-small",
        input=text
    )
    return response.data[0].embedding

def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

# FastAPI Routes
@app.post("/create_nodes_and_embeddings")
async def create_nodes_and_embeddings(payload: CreateNodesAndEmbeddingsRequest):
    pdf_text = payload.pdf_text
    pdf_id = payload.pdf_id
    chat_id = payload.chat_id
    filename = payload.filename
    try:
        with GraphDatabase.driver(neo4j_uri, auth=(neo4j_user, neo4j_password)) as driver:
            with driver.session() as session:
                # Create Document node
                query = f"""
                MERGE (d:Document {{id: '{pdf_id}'}})
                SET d.chatId = '{chat_id}'
                RETURN d
                """
                session.run(query)

                # Create chunks and embeddings
                chunks = chunk_text(pdf_text)
                for i, chunk in enumerate(chunks):
                    safe_text = sanitize_for_neo4j(chunk)
                    embedding = get_embedding(chunk)
                    embedding_string = f"[{','.join(map(str, embedding))}]"

                    query = f"""
                    MATCH (d:Document {{id: '{pdf_id}'}})
                    CREATE (c:Chunk {{
                        id: "{pdf_id}-{i}",
                        text: "{safe_text}",
                        embedding: {embedding_string},
                        chatId: '{chat_id}'
                    }})
                    CREATE (d)-[:HAS_CHUNK {{order: {i}}}]->(c)
                    """
                    session.run(query)

                # Link chunks
                for i in range(len(chunks) - 1):
                    query = f"""
                    MATCH (c1:Chunk {{id: "{pdf_id}-{i}"}}),
                          (c2:Chunk {{id: "{pdf_id}-{i + 1}"}})
                    CREATE (c1)-[:NEXT]->(c2)
                    """
                    session.run(query)

        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/answer_question", response_model=AnswerWithContext)
async def answer_question(payload: QuestionRequest):
    try:
        # Generate question embedding
        question = payload.question
        chat_id = payload.chat_id
        question_embedding = get_embedding(question)

        # Fetch chunks from Neo4j
        with GraphDatabase.driver(neo4j_uri, auth=(neo4j_user, neo4j_password)) as driver:
            with driver.session() as session:
                query = f"""
                MATCH (c:Chunk)
                WHERE c.chatId = '{chat_id}'
                RETURN c.id AS id, c.text AS text, c.embedding AS embedding
                """
                results = session.run(query)

                # Calculate similarities
                chunk_scores = []
                for record in results:
                    print(record, 'record')
                    chunk_id = record["id"]
                    chunk_text = record["text"]
                    chunk_embedding = record["embedding"]
                    # chunk_embedding = np.array([float(x) for x in embedding_string[1:-1].split(",")])

                    score = cosine_similarity(np.array(question_embedding), chunk_embedding)
                    chunk_scores.append(ChunkScore(
                        chunk_id=chunk_id,
                        chunk_text=chunk_text,
                        score=float(score)
                    ))

                # Sort and get top chunks
                print("here 2")
                chunk_scores.sort(key=lambda x: x.score, reverse=True)
                top_k = 50
                top_chunks = chunk_scores[:top_k]

                # Generate answer using GPT-4
                context = "\n\n---\n\n".join([chunk.chunk_text for chunk in top_chunks])
                system_prompt = f"""
                You are a helpful assistant. You have the following context:

                {context}

                Answer the user's question based on the context.
                If the question is not answerable with the given context, use any external knowledge you have.

                RESPOND IN MARKDOWN FORMAT
                """.strip()

                print("here 3")

                completion = openai.chat.completions.create(
                    model="gpt-4o",
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": question}
                    ],
                    temperature=0
                )

                answer = completion.choices[0].message.content.strip()
                return AnswerWithContext(answer=answer, context=top_chunks)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/remove_context/{file_id}")
async def remove_context(file_id: str): # TODO: add auth to this endpoint
    try:
        with GraphDatabase.driver(neo4j_uri, auth=(neo4j_user, neo4j_password)) as driver:
            with driver.session() as session:
                # Delete Document and its Chunks
                query = """
                MATCH (d:Document {id: $file_id})-[r:HAS_CHUNK]->(c:Chunk)
                DETACH DELETE d, c
                """
                result = session.run(query, file_id=file_id)

                # Check if anything was deleted
                summary = result.consume()
                if summary.counters.nodes_deleted == 0:
                    print(f"No nodes found for file_id: {file_id}")
                    raise HTTPException(
                        status_code=404,
                        detail=f"No document found with id: {file_id}"
                    )

                return {
                    "status": "success",
                    "message": f"Document {file_id} and its chunks deleted",
                    "nodes_deleted": summary.counters.nodes_deleted
                }

    except Exception as e:
        print(f"Failed to delete document: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete Document node in Neo4j: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)