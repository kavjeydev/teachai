import { fetch as httpFetch } from "@hypermode/modus-sdk-as/assembly/http";
import { models } from "@hypermode/modus-sdk-as";
import {
  OpenAIChatModel,
  SystemMessage,
  UserMessage,
} from "@hypermode/modus-sdk-as/models/openai/chat";
import {
  OpenAIEmbeddingsModel,
  TypedEmbeddingsInput,
} from "@hypermode/modus-sdk-as/models/openai/embeddings";
import { http } from "@hypermode/modus-sdk-as";
import { neo4j } from "@hypermode/modus-sdk-as";
import { Variables } from "@hypermode/modus-sdk-as/assembly/graphql";

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

// ----------------------
// HELPER FUNCTIONS
// ----------------------

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

  // Typically embOutput.data is an array. We'll assume a single input => single embedding.
  if (embOutput.data.length === 0) {
    throw new Error("No embeddings returned");
  }

  // Each element of embOutput.data is something like { embedding: f32[] }
  // We map over all of them (usually 1) to get f32[] arrays.
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
  // Read raw text from an endpoint
  // const response = http.fetch("http://0.0.0.0:8000/extract-pdf-text");
  // const data: string = response.json<string>();

  // Instruction to the AI
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

Relationship queries should be STRICTLY in this format:
  MATCH (a:TYPE {id: any}), (b:TYPE {id: any}) CREATE (a)-[:RELATIONSHIP]->(b)
`.trim();

  // Pass to Chat
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
 * Generate and store embeddings for the entire PDF text, by chunking it.
 * We'll store them in the database as :Chunk nodes (id, text, embedding).
 */
function createChunkEmbeddingsInNeo4j(hostName: string, pdfText: string): void {
  // 1. Chunk the text
  const chunks: string[] = chunkText(pdfText);

  // 2. For each chunk, generate an embedding and store it in Neo4j
  for (let i = 0; i < chunks.length; i++) {
    // returns f32[][], so we take the first item
    const embeddingF32 = getEmbedding(chunks[i])[0];

    // Convert that single f32[] into a string for DB
    const embeddingString = "[" + embeddingF32.join(",") + "]";

    let safeText = chunks[i].replace('"', '\\"');
    // To replace all occurrences:
    while (safeText.includes('"')) {
      safeText = safeText.replace('"', '\\"');
    }

    const query = `
      CREATE (c:Chunk {
        id: ${i},
        text: "${safeText}",
        embedding: ${embeddingString}
      })
    `;

    const result = neo4j.executeQuery(hostName, query);
    if (!result) {
      throw new Error("Failed to store chunk embedding in Neo4j");
    }
  }
}

/**
 * Cosine similarity between two Float64Arrays.
 * For demonstration only; not optimized for large-scale usage.
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

  // avoid dividing by zero
  if (magA === 0.0 || magB === 0.0) return 0.0;

  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

// -----------------------------------------------------
// ChunkScore CLASS for storing chunk+score objects
// -----------------------------------------------------
class ChunkScore {
  chunkText: string;
  score: f64;

  constructor(chunkText: string, score: f64) {
    this.chunkText = chunkText;
    this.score = score;
  }
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
  for (let i = 1; i < queriesToExecute.length - 1; i++) {
    const query = queriesToExecute[i];
    console.log("START " + query);

    const result = neo4j.executeQuery(hostName, query);
    if (!result) {
      throw new Error("Failed to create nodes");
    }
  }

  return queriesToExecute;
}

/**
 * Creates nodes from interpretFile() + also creates :Chunk nodes with embeddings.
 */
export function createNodesAndEmbeddings(pdfText: string): void {
  console.log("Creating nodes and embeddings...");
  console.log(pdfText)
  // 1. Create the graph nodes/relationships from interpretFile.
  createNodesWithFile(pdfText);

  // 2. Also store embeddings as :Chunk nodes for semantic search
  // const response = http.fetch("http://0.0.0.0:8000/extract-pdf-text");
  // const pdfText: string = response.json<string>();

  createChunkEmbeddingsInNeo4j("my-neo4j", pdfText);
}

/**
 * Given a user question, do an embedding-based semantic search over :Chunk nodes.
 * Then feed the top chunks as context to your Chat model.
 */
export function answerQuestion(question: string): string {
  // 1. Generate embedding for the question
  //    (f32[][] => take first => f32[] => convert to Float64Array)
  const questionEmbeddingF32 = getEmbedding(question)[0];
  const questionEmbedding = f32ArrayToF64Array(questionEmbeddingF32);

  // 2. Fetch all Chunk nodes from Neo4j
  const hostName: string = "my-neo4j";
  const query = `MATCH (c:Chunk) RETURN c.id AS id, c.text AS text, c.embedding AS embedding`;
  const results = neo4j.executeQuery(hostName, query);

  // 3. Calculate similarity with each chunk
  // Instead of inline object type, use the ChunkScore class
  const chunkScores = new Array<ChunkScore>();

  for (let i = 0; i < results.Records.length; i++) {
    const row = results.Records[i];

    // row["embedding"] might come back as a string "[0.0123, 0.456, ...]"
    // parse it into a Float64Array
    const embeddingString = row.get("embedding") as string;
    const cleaned = embeddingString.replace("[", "").replace("]", "").split(",");

    const chunkEmbedding = new Float64Array(cleaned.length);
    for (let j = 0; j < cleaned.length; j++) {
      chunkEmbedding[j] = parseFloat(cleaned[j]);
    }

    const score = cosineSimilarity(questionEmbedding, chunkEmbedding);

    const chunkText = row.get("text") as string;
    chunkScores.push(new ChunkScore(chunkText, score));
  }

  // 4. Sort by descending similarity
  chunkScores.sort((a: ChunkScore, b: ChunkScore) => {
    if (b.score > a.score) return 1;
    else if (b.score < a.score) return -1;
    return 0;
  });

  // 5. Take top 3 chunks as "context"
  const topK = 3;
  const topChunks = new Array<string>();
  for (let i = 0; i < chunkScores.length && i < topK; i++) {
    topChunks.push(chunkScores[i].chunkText);
  }

  // 6. Provide those top chunks as context to the language model
  const systemPrompt = `
You are a helpful assistant. You have the following context from the PDF:

${topChunks.join("\n\n---\n\n")}

Answer the user's question based on the context. If it's unclear, say "I don't know."
`.trim();

  const chatModel = models.getModel<OpenAIChatModel>(modelNameChat);
  const input = chatModel.createInput([
    new SystemMessage(systemPrompt),
    new UserMessage(question),
  ]);
  input.temperature = 0.7; // or whatever you prefer

  const output = chatModel.invoke(input);
  const answer = output.choices[0].message.content.trim();

  return answer;
}