from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List
import openai
import numpy as np
from neo4j import GraphDatabase
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
import os

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)