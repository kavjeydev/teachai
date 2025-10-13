from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List
import openai
import numpy as np
from neo4j import GraphDatabase
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
import os

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
                SET d.chatId = '{chat_id}', d.filename = '{filename}'
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
                    print(record, 'record')
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
                print("here 2")
                chunk_scores.sort(key=lambda x: x.score, reverse=True)
                top_k = 50
                top_chunks = chunk_scores[:top_k]

                # Generate answer using GPT-4 with enhanced context prioritization
                context = "\n\n---\n\n".join([chunk.chunk_text for chunk in top_chunks])
                system_prompt = f"""
                You are a helpful assistant. You have the following context:

                {context}

                IMPORTANT INSTRUCTIONS:
                1. ALWAYS prioritize using the provided context to answer the user's question
                2. If the context contains relevant information, you MUST use it
                3. Only use external knowledge if the context is completely irrelevant to the question, and clearly state when you're using external knowledge
                4. If the question asks about a specific document or file, carefully check if the context contains information from that document

                Answer the user's question based on the context.

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

@app.delete("/delete_chat_nodes/{chat_id}")
async def delete_chat_nodes(chat_id: str): # TODO: add auth to this endpoint
    """Delete all nodes associated with a chat by chatId.
    This is used for cleanup when permanently deleting a chat."""
    try:
        with GraphDatabase.driver(neo4j_uri, auth=(neo4j_user, neo4j_password)) as driver:
            with driver.session() as session:
                # Delete all nodes with this chatId
                query = """
                MATCH (n)
                WHERE n.chatId = $chat_id
                DETACH DELETE n
                """
                result = session.run(query, chat_id=chat_id)

                summary = result.consume()
                nodes_deleted = summary.counters.nodes_deleted
                relationships_deleted = summary.counters.relationships_deleted

                print(f"Deleted {nodes_deleted} nodes and {relationships_deleted} relationships for chat {chat_id}")

                return {
                    "status": "success",
                    "message": f"All nodes for chat {chat_id} deleted",
                    "nodes_deleted": nodes_deleted,
                    "relationships_deleted": relationships_deleted
                }

    except Exception as e:
        print(f"Failed to delete chat nodes: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete chat nodes in Neo4j: {str(e)}"
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)