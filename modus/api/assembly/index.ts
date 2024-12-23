import { fetch } from "@hypermode/modus-sdk-as/assembly/http";
import { models } from "@hypermode/modus-sdk-as"
import {
  OpenAIChatModel,
  ResponseFormat,
  SystemMessage,
  UserMessage,
} from "@hypermode/modus-sdk-as/models/openai/chat"
import { http } from "@hypermode/modus-sdk-as"
import { neo4j } from "@hypermode/modus-sdk-as"
import { Variables } from "@hypermode/modus-sdk-as/assembly/graphql";



export function sayHello(name: string | null = null): string {
  return `Hello, ${name || "World"}!`;
}



// this model name should match the one defined in the modus.json manifest file
const modelName: string = "text-generator"


function interpretFile(): string[] { //TODO add parameters for file depending on API architecture

  // TODO: change to actual URL to production URL
  // Change URL in modus.json as well

  const response = http.fetch("http://0.0.0.0:8000/pdf");
  const data: string = response.json<string>();

  const instruction = `From the given input file, extract any entities and relationships you deem important \
             Your output should look like this: \
             {
                "entities": [
                    {id: uuidv4 generated, "entity1", attr11: "something else", ...},
                    {id: uuidv4 generated, "entity2", attr22: "something else", ...},
                    ...
                ],
                "relationships: [
                    "id1|RELATIONSHIP|id2",
             ]

             }
             You get to decide the number of attributes and what the attributes are and what the relationships are, \
             please make wise decisions based on the file read.

             After making those attributes, generate queries to insert them into a neo4j database with proper syntax.\
             Respond with only the queries.\

              Relationship queries should be in this format:\
                MATCH (a:TYPE {id: any}), (b:TYPE {id: any}) CREATE (a)-[:RELATIONSHIP]->(b)
             `
  const prompt = data
  const model = models.getModel<OpenAIChatModel>(modelName)
  const input = model.createInput([
    new SystemMessage(instruction),
    new UserMessage(prompt),
  ])

  // this is one of many optional parameters available for the OpenAI chat interface
  input.temperature = 0.7

  const output = model.invoke(input)

  const queries = output.choices[0].message.content.trim();

  const filteredQueries = filterQuery(queries);

  return filteredQueries;
}

function filterQuery(query: string): string[] {
  const queryArray = query.split("\n")
  const filteredQuery = queryArray.filter((line) => {
    return line !== ""
  })

  return filteredQuery.slice(1, -1);

}

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

export function createNodesWithFile(): string[] {
  const queriesToExecute = interpretFile();

  const hostName: string = "my-neo4j"
  for (let i = 0; i < queriesToExecute.length; i++) {
    const result = neo4j.executeQuery(hostName, queriesToExecute[i])
    if (!result) {
      throw new Error("Failed to create nodes")
    }
  }

  return queriesToExecute
}