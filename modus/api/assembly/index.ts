import { models } from "@hypermode/modus-sdk-as";
import {
  OpenAIChatModel,
  SystemMessage,
  UserMessage,
} from "@hypermode/modus-sdk-as/models/openai/chat";
import {
  OpenAIEmbeddingsModel,
} from "@hypermode/modus-sdk-as/models/openai/embeddings";
import { neo4j } from "@hypermode/modus-sdk-as";
import { JSON } from "json-as";

@json
class PersonInput {
  name: string;
  age: i32;
  friends: string[];

  constructor(name: string, age: i32, friends: string[]) {
    this.name = name;
    this.age = age;
    this.friends = friends;
  }
}

@json
class ChunkScore {
  chunkId: string;
  chunkText: string;
  score: f64;

  constructor(chunkId: string, chunkText: string, score: f64) {
    this.chunkId = chunkId;
    this.chunkText = chunkText;
    this.score = score;
  }
}

@json
class OpenAIStatus {
  embeddings: boolean;
  chat: boolean;
  error: string;

  constructor() {
    this.embeddings = false;
    this.chat = false;
    this.error = "";
  }
}

@json
class HealthCheckStatus {
  openai: OpenAIStatus;
  neo4j: boolean;
  error: string;

  constructor() {
    this.openai = new OpenAIStatus();
    this.neo4j = false;
    this.error = "";
  }
}

@json
class AnswerWithContext {
  answer: string = "";
  context: ChunkScore[] = [];
}

// ----------------------
// HELPER FUNCTIONS
// ----------------------

// A robust sanitization function for storing text in Neo4j as a string property
/**
 * Escapes special characters for Neo4j queries.
 * @param original The original string to sanitize.
 * @returns The sanitized string safe for Neo4j.
 */
/**
 * Sanitizes a string for safe use in Neo4j queries by escaping special characters.
 * @param original The original string to sanitize.
 * @returns The sanitized string safe for Neo4j.
 */
function sanitizeForNeo4j(original: string): string {
  let safeText = original;

  // Escape backslashes first to avoid double-escaping other characters
  safeText = safeText.split('\\').join('\\\\');

  // Escape double quotes
  safeText = safeText.split('"').join('\\"');

  // Escape single quotes
  safeText = safeText.split("'").join("\\'");

  // Escape newlines
  safeText = safeText.split('\n').join('\\n');

  // Escape carriage returns
  safeText = safeText.split('\r').join('\\r');

  return safeText;
}



export function sayHello(name: string | null = null): string {
  return `Hello, ${name || "World"}!`;
}

// Model names must match what's in modus.json
const modelNameChat: string = "text-generator";
const modelNameEmbeddings: string = "openai-embeddings";

/**
 * Splits a large text into an array of smaller chunks for embedding.
 * Customize chunk sizes as needed.
 */
function chunkText(fullText: string, maxChars: i32 = 500): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < fullText.length) {
    const end = start + maxChars;
    if (end > fullText.length) {
      chunks.push(fullText.substring(start, fullText.length));
      break;
    } else {
      chunks.push(fullText.substring(start, end));
    }
    start = end;
  }
  return chunks;
}

/**
 * Generates an embedding (f32[][]) for a given piece of text using the OpenAI Embedding Model.
 * Typically you'll get one embedding per input text, but the result is still an array.
 */
function getEmbedding(inputText: string): f32[][] {
  const embeddingModel = models.getModel<OpenAIEmbeddingsModel>(modelNameEmbeddings);

  const embInput = embeddingModel.createInput(inputText);

  const embOutput = embeddingModel.invoke(embInput);

  return [[1]];

  if (embOutput.data.length === 0) {
    throw new Error("No embeddings returned");
  }

  // Each element of embOutput.data is something like { embedding: f32[] }
  return embOutput.data.map<f32[]>((d) => d.embedding);
}

/**
 * Helper to convert a f32[] to a Float64Array
 * so we can use it in our cosineSimilarity function.
 */
function f32ArrayToF64Array(arr: f32[]): Float64Array {
  const result = new Float64Array(arr.length);
  for (let i = 0; i < arr.length; i++) {
    result[i] = arr[i];
  }
  return result;
}

/**
 * Create Cypher queries (list of strings) from the AI output (for entities & relationships).
 */
function interpretFile(data: string): string[] {
  const instruction = `
From the given input file, extract any entities and relationships you deem important.
Your output should look like this:
{
  "entities": [
      {id: 1, "name": "someName", ...},
      {id: 2, "name": "someName2", ...}
  ],
  "relationships": [
      "1|RELATIONSHIP|2"
  ]
}
You get to decide the number of attributes and what the attributes are and what the relationships are, based on the file read.

Create a name attribute for every entity.
DO NOT leave any node without a relationship.

After making those attributes, generate queries to insert them into a neo4j database with proper syntax.
Respond with only the queries.

ONLY USE SINGLE QUOTES FOR STRINGS.

Relationship queries should be STRICTLY in this format:
  MATCH (a:TYPE {id: any}), (b:TYPE {id: any}) CREATE (a)-[:RELATIONSHIP]->(b)
`.trim();

  const model = models.getModel<OpenAIChatModel>(modelNameChat);
  const input = model.createInput([
    new SystemMessage(instruction),
    new UserMessage(data),
  ]);
  input.temperature = 0; // be deterministic

  const output = model.invoke(input);
  const queries = output.choices[0].message.content.trim();
  const filteredQueries = filterQuery(queries);

  return filteredQueries;
}

/**
 * Splits query strings by newline, filtering out empty lines.
 */
function filterQuery(query: string): string[] {
  const queryArray = query.split("\n");
  const filteredQuery = queryArray.filter((line) => {
    return line.trim() !== "";
  });
  return filteredQuery;
}

/**
 * Cosine similarity between two Float64Arrays.
 */
function cosineSimilarity(a: Float64Array, b: Float64Array): f64 {
  let dot: f64 = 0.0;
  let magA: f64 = 0.0;
  let magB: f64 = 0.0;

  // We assume a and b have the same length
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }

  if (magA === 0.0 || magB === 0.0) return 0.0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

// -----------------------
// MAIN EXPORTS
// -----------------------

/**
 * Also returns the queries that were executed.
 */
export function createNodesWithFile(data: string): string[] {
  const queriesToExecute = interpretFile(data);

  const hostName: string = "my-neo4j";
  // We'll run each query except the first & last or some custom logic?
  for (let i = 1; i < queriesToExecute.length - 1; i++) {
    const query = queriesToExecute[i];

    const result = neo4j.executeQuery(hostName, query);
    if (!result) {
      throw new Error("Failed to create nodes");
    }
  }

  return queriesToExecute;
}

/**
 * This version creates chunk embeddings and also
 * links them to a Document node (via `HAS_CHUNK`)
 * and links them in a chain (via `NEXT`).
 */
function createChunkEmbeddingsInNeo4j(
  hostName: string,
  pdfId: string,
  filename: string,
  pdfText: string,
  chatId: string,
): void {
  // 1) Create the Document node (if it doesn't exist, or you can skip if it does)
  let query = `
    MERGE (d:Document {id: '${pdfId}'})
    SET d.chatId = '${chatId}'
    RETURN d
  `;
  let result = neo4j.executeQuery(hostName, query);
  if (!result) {
    throw new Error("Failed to create Document node in Neo4j");
  }

  // 2) Chunk the text
  const chunks: string[] = chunkText(pdfText);

  // 3) For each chunk, create the Chunk node + relationship to Document
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    // Sanitize the chunk text before building the query
    const safeText = sanitizeForNeo4j(chunk);
    // returns f32[][], so we take the first item
    const embeddingF32 = getEmbedding(chunk)[0];

    // Convert that single f32[] into a string for DB
    const embeddingString = "[" + embeddingF32.join(",") + "]";


    query = `
      MATCH (d:Document {id: '${pdfId}'})
      CREATE (c:Chunk {
        id: "${pdfId}-${i}",
        text: "${safeText}",
        embedding: ${embeddingString},
        chatId: '${chatId}',
        filename: '${filename}'
      })
      CREATE (d)-[:HAS_CHUNK {order: ${i}}]->(c)
    `;
    result = neo4j.executeQuery(hostName, query);
    if (!result) {
      throw new Error("Failed to create chunk embedding in Neo4j");
    }
  }

  for (let i = 0; i < chunks.length - 1; i++) {
    query = `
      MATCH (c1:Chunk {id: "${pdfId}-${i}"}), (c2:Chunk {id: "${pdfId}-${i + 1}"})
      CREATE (c1)-[:NEXT]->(c2)
    `;
    result = neo4j.executeQuery(hostName, query);
    if (!result) {
      throw new Error("Failed to create NEXT relationship between chunks");
    }
  }
}

/**
 * Creates nodes from interpretFile() + also creates :Document/:Chunk nodes with embeddings & relationships.
 */
export function createNodesAndEmbeddings(pdfText: string, pdfId: string, chatId: string, filename: string): void {
  createChunkEmbeddingsInNeo4j("my-neo4j", pdfId, filename, pdfText, chatId);
}

export function removeContext(fileId: string): void {
  const hostName: string = "my-neo4j";

  let query = `
    MATCH (d:Document {id: '${fileId}'})-[r:HAS_CHUNK]->(c:Chunk)
    DETACH DELETE d, c
  `;

  let result = neo4j.executeQuery(hostName, query);
  if (!result) {
    throw new Error("Failed to delete Document node in Neo4j");
  }
}

/**
 * Given a user question, do an embedding-based semantic search over :Chunk nodes.
 * Then feed the top chunks as context to your Chat model.
 */
export function answerQuestion(question: string, chatId: string): AnswerWithContext {
  // 1) Generate embedding for the question
  const response = new AnswerWithContext();
  const questionEmbeddingF32 = getEmbedding(question)[0];
  const questionEmbedding = f32ArrayToF64Array(questionEmbeddingF32);

  response.answer = "Not implemented";
  return response;


  // 2) Fetch all Chunk nodes
  const hostName: string = "my-neo4j";
  const query = `
    MATCH (c:Chunk)
    WHERE c.chatId = '${chatId}'
    RETURN c.id AS id, c.text AS text, c.embedding AS embedding
  `;
  const results = neo4j.executeQuery(hostName, query);

  // 3) Calculate similarity
  const chunkScores = new Array<ChunkScore>();
  for (let i = 0; i < results.Records.length; i++) {
    const row = results.Records[i];

    const chunkId = row.get("id") as string;
    const chunkText = row.get("text") as string;
    const embeddingString = row.get("embedding") as string;

    // Convert the embedding string back to a Float64Array
    const cleaned = embeddingString.replace("[", "").replace("]", "").split(",");
    const chunkEmbedding = new Float64Array(cleaned.length);
    for (let j = 0; j < cleaned.length; j++) {
      chunkEmbedding[j] = parseFloat(cleaned[j]);
    }

    // Compare similarity
    const score = cosineSimilarity(questionEmbedding, chunkEmbedding);

    chunkScores.push(new ChunkScore(chunkId, chunkText, score));
  }

  // 4) Sort by descending similarity
  chunkScores.sort((a: ChunkScore, b: ChunkScore) => {
    return b.score - a.score as i32;
  });

  const topK = 50;
  const topChunks = chunkScores.slice(0, topK);

  // 6) Build system prompt using those chunks
  const systemPrompt = `
You are a helpful assistant. You have the following context:

${topChunks.map<string>((chunk) => chunk.chunkText).join("\n\n---\n\n")}

Answer the user's question based on the context.
If the question is not answerable with the given context, use any external knowledge you have.

RESPOND IN MARKDOWN FORMAT
`.trim();

  // 7) Invoke Chat model
  const chatModel = models.getModel<OpenAIChatModel>(modelNameChat);
  const input = chatModel.createInput([
    new SystemMessage(systemPrompt),
    new UserMessage(question),
  ]);
  input.temperature = 0;

  const output = chatModel.invoke(input);
  const finalAnswer = output.choices[0].message.content.trim();

  // 8) Return both the answer and the chunk data
  response.answer = finalAnswer;
  response.context = topChunks;
  return response;
}

export function healthCheck(): string {
  const status = new HealthCheckStatus();
  status.openai = new OpenAIStatus();
  status.openai.embeddings = false;
  status.openai.chat = false;
  status.openai.error = "";
  status.neo4j = false;
  status.error = "";

  // Check OpenAI Embeddings
  const embeddingModel = models.getModel<OpenAIEmbeddingsModel>(modelNameEmbeddings);
  if (!embeddingModel) {
    status.openai.error += "Embedding model not found. ";
  } else {
    status.openai.embeddings = true;
  }

  // Check OpenAI Chat
  const chatModel = models.getModel<OpenAIChatModel>(modelNameChat);
  if (!chatModel) {
    status.openai.error += "Chat model not found. ";
  } else {
    status.openai.chat = true;
  }

  // Check Neo4j
  const neo4jResult = neo4j.executeQuery("my-neo4j", "RETURN 1");
  status.neo4j = !!neo4jResult;

  return JSON.stringify(status);
}