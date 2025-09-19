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

openai.api_key = os.getenv("OPENAI_API_KEY")
neo4j_uri = os.getenv("NEO4J_URI")
neo4j_user = os.getenv("NEO4J_USER")
neo4j_password = os.getenv("NEO4J_PASSWORD")

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

def analyze_chunk_relationships(chunks: List[str]) -> List[dict]:
    """Use AI to analyze relationships between chunks and determine logical connections"""
    if len(chunks) < 2:
        return []

    # Prepare chunks for analysis
    chunk_summaries = []
    for i, chunk in enumerate(chunks):
        # Create a brief summary of each chunk
        summary_prompt = f"Summarize this text in 1-2 sentences, focusing on the main concept or topic:\n\n{chunk}"

        try:
            response = openai.chat.completions.create(
                model="gpt-4o-mini",  # Use cheaper model for summaries
                messages=[{"role": "user", "content": summary_prompt}],
                max_tokens=100,
                temperature=0
            )
            summary = response.choices[0].message.content.strip()
            chunk_summaries.append({"index": i, "text": chunk[:200], "summary": summary})
        except Exception as e:
            print(f"Error creating summary for chunk {i}: {e}")
            chunk_summaries.append({"index": i, "text": chunk[:200], "summary": chunk[:100]})

    # Analyze relationships between all chunk pairs
    relationships = []

    # Create a more focused analysis prompt
    analysis_prompt = f"""Analyze these text chunks and find logical relationships. Return only valid JSON.

Chunks:
{chr(10).join([f"{item['index']}: {item['summary']}" for item in chunk_summaries])}

Find relationships like:
- EXPLAINS: One chunk explains concepts in another
- SUPPORTS: One chunk provides evidence for another
- ELABORATES: One chunk adds details to another
- INTRODUCES: One chunk introduces topics discussed in another
- CONCLUDES: One chunk concludes ideas from another

Return JSON with this exact format:
{{"relationships": [{{"source": 0, "target": 2, "type": "EXPLAINS", "confidence": 0.8}}]}}"""

    try:
        response = openai.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are an expert at analyzing text relationships. Always respond with valid JSON only."},
                {"role": "user", "content": analysis_prompt}
            ],
            max_tokens=2000,
            temperature=0.3
        )

        ai_response = response.choices[0].message.content.strip()
        print(f"AI Response: {ai_response[:200]}...")  # Debug print

        # Clean up the response - sometimes AI adds markdown formatting
        if ai_response.startswith("```json"):
            ai_response = ai_response.replace("```json", "").replace("```", "").strip()
        elif ai_response.startswith("```"):
            ai_response = ai_response.replace("```", "").strip()

        import json
        result = json.loads(ai_response)
        ai_relationships = result.get("relationships", [])

        print(f"AI identified {len(ai_relationships)} potential semantic relationships")

        # Filter and validate AI relationships
        valid_relationships = []
        for rel in ai_relationships:
            if (rel.get("confidence", 0) > 0.6 and
                "source" in rel and "target" in rel and "type" in rel and
                0 <= rel["source"] < len(chunks) and 0 <= rel["target"] < len(chunks)):
                valid_relationships.append(rel)

        print(f"Validated {len(valid_relationships)} semantic relationships")

        # Only add NEXT relationships if we have no semantic relationships
        if len(valid_relationships) == 0:
            print("No semantic relationships found, falling back to sequential NEXT relationships")
            for i in range(len(chunks) - 1):
                valid_relationships.append({
                    "source": i,
                    "target": i + 1,
                    "type": "NEXT",
                    "description": "Sequential order in document",
                    "confidence": 1.0
                })
        else:
            print(f"Using {len(valid_relationships)} AI-generated semantic relationships")

        return valid_relationships

    except json.JSONDecodeError as json_error:
        print(f"JSON parsing error: {json_error}")
        print(f"Raw AI response: {ai_response}")
        # Fallback to simple sequential relationships
        return [{"source": i, "target": i + 1, "type": "NEXT", "description": "Sequential order", "confidence": 1.0}
                for i in range(len(chunks) - 1)]
    except Exception as e:
        print(f"Error analyzing relationships with AI: {e}")
        # Fallback to simple sequential relationships
        return [{"source": i, "target": i + 1, "type": "NEXT", "description": "Sequential order", "confidence": 1.0}
                for i in range(len(chunks) - 1)]

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
                query = """
                MERGE (d:Document {id: $pdf_id})
                SET d.chatId = $chat_id, d.filename = $filename
                RETURN d
                """
                result = session.run(query, pdf_id=pdf_id, chat_id=chat_id, filename=filename)
                print(f"Created document node: {result.single()}")

                # Create chunks and embeddings
                chunks = chunk_text(pdf_text)
                print(f"Creating {len(chunks)} chunks for document {pdf_id}")

                # First, create all chunks
                chunk_ids = []
                for i, chunk in enumerate(chunks):
                    embedding = get_embedding(chunk)
                    chunk_id = f"{pdf_id}-{i}"
                    chunk_ids.append(chunk_id)

                    query = """
                    MATCH (d:Document {id: $pdf_id})
                    CREATE (c:Chunk {
                        id: $chunk_id,
                        text: $text,
                        embedding: $embedding,
                        chatId: $chat_id
                    })
                    CREATE (d)-[:HAS_CHUNK {order: $order}]->(c)
                    RETURN c
                    """

                    result = session.run(query,
                                       pdf_id=pdf_id,
                                       chunk_id=chunk_id,
                                       text=chunk,
                                       embedding=embedding,
                                       chat_id=chat_id,
                                       order=i)

                    chunk_result = result.single()
                    if chunk_result:
                        print(f"Created chunk {i}: {chunk_result['c']['id']}")
                    else:
                        print(f"Failed to create chunk {i}")
                        raise Exception(f"Failed to create chunk {i}")

                # Analyze content and create intelligent relationships
                if len(chunks) > 1:
                    print(f"🧠 Analyzing content for intelligent relationships...")

                    # Use AI to determine logical relationships
                    ai_relationships = analyze_chunk_relationships(chunks)

                    print(f"Creating {len(ai_relationships)} intelligent relationships...")
                    successful_links = 0

                    for rel in ai_relationships:
                        try:
                            source_idx = rel["source"]
                            target_idx = rel["target"]
                            rel_type = rel["type"]
                            description = rel.get("description", "")
                            confidence = rel.get("confidence", 0.0)

                            # Verify both chunks exist
                            check_query = """
                            MATCH (c1:Chunk {id: $chunk1_id})
                            MATCH (c2:Chunk {id: $chunk2_id})
                            RETURN c1.id as id1, c2.id as id2
                            """

                            check_result = session.run(check_query,
                                                     chunk1_id=f"{pdf_id}-{source_idx}",
                                                     chunk2_id=f"{pdf_id}-{target_idx}")

                            if check_result.single():
                                # Both chunks exist, create the intelligent relationship
                                link_query = f"""
                                MATCH (c1:Chunk {{id: $chunk1_id}})
                                MATCH (c2:Chunk {{id: $chunk2_id}})
                                CREATE (c1)-[:{rel_type} {{
                                    description: $description,
                                    confidence: $confidence,
                                    ai_generated: true
                                }}]->(c2)
                                RETURN c1.id as source, c2.id as target
                                """

                                link_result = session.run(link_query,
                                                         chunk1_id=f"{pdf_id}-{source_idx}",
                                                         chunk2_id=f"{pdf_id}-{target_idx}",
                                                         description=description,
                                                         confidence=confidence)

                                if link_result.single():
                                    print(f"✅ Created {rel_type} relationship: {source_idx} -> {target_idx} (confidence: {confidence:.2f})")
                                    successful_links += 1
                                else:
                                    print(f"❌ Failed to create {rel_type} relationship: {source_idx} -> {target_idx}")
                            else:
                                print(f"❌ One or both chunks missing for relationship {source_idx} -> {target_idx}")

                        except Exception as link_error:
                            print(f"❌ Error creating relationship {rel.get('type', 'UNKNOWN')} {source_idx} -> {target_idx}: {link_error}")

                    print(f"Successfully created {successful_links} out of {len(ai_relationships)} intelligent relationships")
                else:
                    print("Only one chunk, no relationships needed")

        # Final verification - count what we created
        with GraphDatabase.driver(neo4j_uri, auth=(neo4j_user, neo4j_password)) as driver:
            with driver.session() as session:
                count_query = """
                MATCH (d:Document {chatId: $chat_id})
                OPTIONAL MATCH (d)-[:HAS_CHUNK]->(c:Chunk)
                OPTIONAL MATCH (c1:Chunk)-[:NEXT]->(c2:Chunk)
                WHERE c1.chatId = $chat_id AND c2.chatId = $chat_id
                RETURN count(DISTINCT d) as docs, count(DISTINCT c) as chunks, count(DISTINCT c1) as linked_chunks
                """
                result = session.run(count_query, chat_id=chat_id)
                counts = result.single()
                print(f"Final counts - Documents: {counts['docs']}, Chunks: {counts['chunks']}, Linked chunks: {counts['linked_chunks']}")

        return {"status": "success", "message": f"Created {len(chunks)} chunks with relationships"}
    except Exception as e:
        print(f"Error in create_nodes_and_embeddings: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/answer_question", response_model=AnswerWithContext)
async def answer_question(payload: QuestionRequest):
    try:
        # Generate question embedding
        question = payload.question
        chat_id = payload.chat_id
        question_embedding = get_embedding(question)

        # Fetch chunks from Neo4j with document metadata for filename-based queries
        with GraphDatabase.driver(neo4j_uri, auth=(neo4j_user, neo4j_password)) as driver:
            with driver.session() as session:
                # Enhanced query to include document filename for better context matching
                query = f"""
                MATCH (d:Document)-[:HAS_CHUNK]->(c:Chunk)
                WHERE c.chatId = '{chat_id}'
                RETURN c.id AS id, c.text AS text, c.embedding AS embedding, d.filename AS filename
                """
                results = session.run(query)


                # Calculate similarities with filename boost
                chunk_scores = []
                question_lower = question.lower()

                for record in results:
                    chunk_id = record["id"]
                    chunk_text = record["text"]
                    chunk_embedding = record["embedding"]
                    filename = record["filename"] or ""

                    # Calculate semantic similarity
                    semantic_score = cosine_similarity(np.array(question_embedding), chunk_embedding)

                    # Add filename relevance boost
                    filename_boost = 0.0
                    if filename:
                        filename_lower = filename.lower()
                        # Remove file extension for better matching
                        filename_base = filename_lower.replace('.pdf', '').replace('.docx', '').replace('.txt', '')

                        # Check for filename mentions in question
                        filename_words = filename_base.replace('_', ' ').replace('-', ' ').split()
                        question_words = question_lower.replace('_', ' ').replace('-', ' ').split()

                        # Boost score if filename words appear in question
                        for fname_word in filename_words:
                            if len(fname_word) > 2:  # Skip very short words
                                for q_word in question_words:
                                    if fname_word in q_word or q_word in fname_word:
                                        filename_boost += 0.1

                        # Additional boost for exact filename matches
                        if any(fname_word in question_lower for fname_word in filename_words if len(fname_word) > 3):
                            filename_boost += 0.2

                    # Combine semantic similarity with filename relevance
                    final_score = semantic_score + filename_boost

                    chunk_scores.append(ChunkScore(
                        chunk_id=chunk_id,
                        chunk_text=chunk_text,
                        score=float(final_score)
                    ))

                # Sort and get top chunks
                chunk_scores.sort(key=lambda x: x.score, reverse=True)
                top_k = 50
                top_chunks = chunk_scores[:top_k]

                # Generate answer using GPT-4 with citations
                # Limit to top 10 chunks for cleaner citations
                top_chunks_for_citations = top_chunks[:10]

                # Get document information for each chunk to provide better context
                chunk_document_info = {}
                for chunk in top_chunks_for_citations:
                    doc_query = f"""
                    MATCH (d:Document)-[:HAS_CHUNK]->(c:Chunk {{id: '{chunk.chunk_id}'}})
                    RETURN d.filename AS filename
                    """
                    doc_result = session.run(doc_query)
                    doc_record = doc_result.single()
                    if doc_record:
                        chunk_document_info[chunk.chunk_id] = doc_record['filename']

                context_with_ids = "\n\n---\n\n".join([
                    f"[CHUNK_{i}] (from document: {chunk_document_info.get(chunk.chunk_id, 'Unknown')}) {chunk.chunk_text}"
                    for i, chunk in enumerate(top_chunks_for_citations)
                ])

                # Enhanced system prompt to prioritize using available context
                system_prompt = f"""
                You are a helpful assistant. You have the following context with chunk IDs (0-{len(top_chunks_for_citations)-1}):

                {context_with_ids}

                IMPORTANT INSTRUCTIONS:
                1. ALWAYS prioritize using the provided context to answer the user's question
                2. If the context contains relevant information, you MUST use it and cite it properly
                3. Pay attention to the document names shown in parentheses - if the user asks about a specific document by name, use the content from that document
                4. When you reference information from the context, add a citation using this format: [^{{i}}] where {{i}} is the chunk number (0-{len(top_chunks_for_citations)-1})
                5. Only use citations [^0] through [^{len(top_chunks_for_citations)-1}]. Do not use citation numbers higher than {len(top_chunks_for_citations)-1}
                6. If the user asks about a document by name (like "grant assignment", "ecology report", etc.), and you see content from a document with a similar name in the context, you MUST use that content
                7. Only use external knowledge if the context is completely irrelevant to the question, and clearly state when you're using external knowledge

                For example:
                - "According to the Grant Assignment document [^0], ecology research involves..."
                - "The document shows [^2] that species interactions..."

                RESPOND IN MARKDOWN FORMAT WITH CITATIONS
                """.strip()


                completion = openai.chat.completions.create(
                    model="gpt-4o",
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": question}
                    ],
                    temperature=0
                )

                answer = completion.choices[0].message.content.strip()
                return AnswerWithContext(answer=answer, context=top_chunks_for_citations)

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

# Graph API endpoints for interactive graph interface
@app.get("/graph_data/{chat_id}")
async def get_graph_data(chat_id: str):
    """Get all nodes and relationships for a specific chat to display in graph interface"""
    try:
        with GraphDatabase.driver(neo4j_uri, auth=(neo4j_user, neo4j_password)) as driver:
            with driver.session() as session:
                # Get all nodes for this chat
                nodes_query = """
                MATCH (n)
                WHERE n.chatId = $chat_id
                RETURN
                    id(n) as node_id,
                    labels(n) as labels,
                    properties(n) as properties
                """

                # Get all relationships for this chat
                relationships_query = """
                MATCH (n)-[r]->(m)
                WHERE n.chatId = $chat_id AND m.chatId = $chat_id
                RETURN
                    id(r) as rel_id,
                    id(startNode(r)) as source,
                    id(endNode(r)) as target,
                    type(r) as type,
                    properties(r) as properties
                """

                nodes_result = session.run(nodes_query, chat_id=chat_id)
                relationships_result = session.run(relationships_query, chat_id=chat_id)

                nodes = []
                for record in nodes_result:
                    node_data = {
                        "id": str(record["node_id"]),
                        "labels": record["labels"],
                        "properties": dict(record["properties"])
                    }
                    nodes.append(node_data)

                relationships = []
                for record in relationships_result:
                    rel_data = {
                        "id": str(record["rel_id"]),
                        "source": str(record["source"]),
                        "target": str(record["target"]),
                        "type": record["type"],
                        "properties": dict(record["properties"])
                    }
                    relationships.append(rel_data)

                return {
                    "nodes": nodes,
                    "relationships": relationships
                }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/node_details/{node_id}")
async def get_node_details(node_id: str):
    """Get detailed information about a specific node"""
    try:
        with GraphDatabase.driver(neo4j_uri, auth=(neo4j_user, neo4j_password)) as driver:
            with driver.session() as session:
                query = """
                MATCH (n)
                WHERE id(n) = $node_id
                RETURN
                    id(n) as node_id,
                    labels(n) as labels,
                    properties(n) as properties
                """

                result = session.run(query, node_id=int(node_id))
                record = result.single()

                if not record:
                    raise HTTPException(status_code=404, detail="Node not found")

                return {
                    "id": str(record["node_id"]),
                    "labels": record["labels"],
                    "properties": dict(record["properties"])
                }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/update_node/{node_id}")
async def update_node(node_id: str, properties: dict):
    """Update properties of a specific node"""
    try:
        with GraphDatabase.driver(neo4j_uri, auth=(neo4j_user, neo4j_password)) as driver:
            with driver.session() as session:
                # Build SET clause for properties
                set_clauses = []
                params = {"node_id": int(node_id)}

                for key, value in properties.items():
                    if key != "id":  # Don't update id
                        param_key = f"prop_{key}"
                        set_clauses.append(f"n.{key} = ${param_key}")
                        params[param_key] = value

                if not set_clauses:
                    raise HTTPException(status_code=400, detail="No valid properties to update")

                query = f"""
                MATCH (n)
                WHERE id(n) = $node_id
                SET {', '.join(set_clauses)}
                RETURN
                    id(n) as node_id,
                    labels(n) as labels,
                    properties(n) as properties
                """

                result = session.run(query, **params)
                record = result.single()

                if not record:
                    raise HTTPException(status_code=404, detail="Node not found")

                return {
                    "id": str(record["node_id"]),
                    "labels": record["labels"],
                    "properties": dict(record["properties"])
                }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/delete_node/{node_id}")
async def delete_node(node_id: str):
    """Delete a specific node and its relationships"""
    try:
        with GraphDatabase.driver(neo4j_uri, auth=(neo4j_user, neo4j_password)) as driver:
            with driver.session() as session:
                query = """
                MATCH (n)
                WHERE id(n) = $node_id
                DETACH DELETE n
                """

                result = session.run(query, node_id=int(node_id))
                summary = result.consume()

                if summary.counters.nodes_deleted == 0:
                    raise HTTPException(status_code=404, detail="Node not found")

                return {
                    "status": "success",
                    "message": f"Node {node_id} deleted successfully",
                    "nodes_deleted": summary.counters.nodes_deleted,
                    "relationships_deleted": summary.counters.relationships_deleted
                }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/create_relationship")
async def create_relationship(source_id: str, target_id: str, relationship_type: str, properties: dict = {}):
    """Create a new relationship between two nodes"""
    try:
        with GraphDatabase.driver(neo4j_uri, auth=(neo4j_user, neo4j_password)) as driver:
            with driver.session() as session:
                # Build SET clause for relationship properties
                set_clause = ""
                params = {
                    "source_id": int(source_id),
                    "target_id": int(target_id),
                    "rel_type": relationship_type
                }

                if properties:
                    prop_assignments = []
                    for key, value in properties.items():
                        param_key = f"prop_{key}"
                        prop_assignments.append(f"r.{key} = ${param_key}")
                        params[param_key] = value
                    set_clause = f"SET {', '.join(prop_assignments)}"

                query = f"""
                MATCH (source), (target)
                WHERE id(source) = $source_id AND id(target) = $target_id
                CREATE (source)-[r:{relationship_type}]->(target)
                {set_clause}
                RETURN
                    id(r) as rel_id,
                    id(startNode(r)) as source,
                    id(endNode(r)) as target,
                    type(r) as type,
                    properties(r) as properties
                """

                result = session.run(query, **params)
                record = result.single()

                if not record:
                    raise HTTPException(status_code=404, detail="Source or target node not found")

                return {
                    "id": str(record["rel_id"]),
                    "source": str(record["source"]),
                    "target": str(record["target"]),
                    "type": record["type"],
                    "properties": dict(record["properties"])
                }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/update_relationship/{relationship_id}")
async def update_relationship(relationship_id: str, properties: dict):
    """Update properties of a specific relationship"""
    try:
        with GraphDatabase.driver(neo4j_uri, auth=(neo4j_user, neo4j_password)) as driver:
            with driver.session() as session:
                # Build SET clause for properties
                set_clauses = []
                params = {"rel_id": int(relationship_id)}

                for key, value in properties.items():
                    if key not in ["id", "type"]:  # Don't update id or type
                        param_key = f"prop_{key}"
                        set_clauses.append(f"r.{key} = ${param_key}")
                        params[param_key] = value

                if not set_clauses:
                    raise HTTPException(status_code=400, detail="No valid properties to update")

                query = f"""
                MATCH ()-[r]-()
                WHERE id(r) = $rel_id
                SET {', '.join(set_clauses)}
                RETURN
                    id(r) as rel_id,
                    id(startNode(r)) as source,
                    id(endNode(r)) as target,
                    type(r) as type,
                    properties(r) as properties
                """

                result = session.run(query, **params)
                record = result.single()

                if not record:
                    raise HTTPException(status_code=404, detail="Relationship not found")

                return {
                    "id": str(record["rel_id"]),
                    "source": str(record["source"]),
                    "target": str(record["target"]),
                    "type": record["type"],
                    "properties": dict(record["properties"])
                }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/delete_relationship/{relationship_id}")
async def delete_relationship(relationship_id: str):
    """Delete a specific relationship"""
    try:
        with GraphDatabase.driver(neo4j_uri, auth=(neo4j_user, neo4j_password)) as driver:
            with driver.session() as session:
                query = """
                MATCH ()-[r]-()
                WHERE id(r) = $rel_id
                DELETE r
                """

                result = session.run(query, rel_id=int(relationship_id))
                summary = result.consume()

                if summary.counters.relationships_deleted == 0:
                    raise HTTPException(status_code=404, detail="Relationship not found")

                return {
                    "status": "success",
                    "message": f"Relationship {relationship_id} deleted successfully",
                    "relationships_deleted": summary.counters.relationships_deleted
                }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Test endpoint to create simple test nodes and relationships
@app.post("/test_relationships/{chat_id}")
async def test_relationships(chat_id: str):
    """Create test nodes and relationships to debug the issue"""
    try:
        with GraphDatabase.driver(neo4j_uri, auth=(neo4j_user, neo4j_password)) as driver:
            with driver.session() as session:
                # Create test nodes
                session.run("""
                CREATE (n1:TestNode {id: 'test-1', chatId: $chat_id, text: 'First test node'})
                CREATE (n2:TestNode {id: 'test-2', chatId: $chat_id, text: 'Second test node'})
                """, chat_id=chat_id)

                # Create test relationship
                result = session.run("""
                MATCH (n1:TestNode {id: 'test-1', chatId: $chat_id})
                MATCH (n2:TestNode {id: 'test-2', chatId: $chat_id})
                CREATE (n1)-[:TEST_LINK]->(n2)
                RETURN n1, n2
                """, chat_id=chat_id)

                if result.single():
                    return {"status": "success", "message": "Test nodes and relationship created"}
                else:
                    return {"status": "error", "message": "Failed to create test relationship"}

    except Exception as e:
        return {"status": "error", "message": str(e)}

# Debug endpoint to check database contents
@app.get("/debug_database/{chat_id}")
async def debug_database(chat_id: str):
    """Debug endpoint to check what's in the database for a specific chat"""
    try:
        with GraphDatabase.driver(neo4j_uri, auth=(neo4j_user, neo4j_password)) as driver:
            with driver.session() as session:
                # Check all nodes for this chat
                nodes_query = """
                MATCH (n)
                WHERE n.chatId = $chat_id
                RETURN labels(n) as labels, properties(n) as props, count(*) as count
                """

                # Check all relationships for this chat
                rels_query = """
                MATCH (n)-[r]->(m)
                WHERE n.chatId = $chat_id AND m.chatId = $chat_id
                RETURN type(r) as rel_type, properties(r) as props, count(*) as count
                """

                nodes_result = session.run(nodes_query, chat_id=chat_id)
                rels_result = session.run(rels_query, chat_id=chat_id)

                nodes_data = [dict(record) for record in nodes_result]
                rels_data = [dict(record) for record in rels_result]

                return {
                    "chat_id": chat_id,
                    "nodes": nodes_data,
                    "relationships": rels_data
                }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)