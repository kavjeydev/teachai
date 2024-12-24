import openai
import os
import constants
from pypdf import PdfReader



def read_pdf(filename):
    reader = PdfReader(filename)
    page = reader.pages[0]

    return page.extract_text()


def main():
    supported_file_types = [".pdf", ".docx", ".txt", ".md", ".ts", ".csv", ".json", ".html", ".xml", ".yaml", ".yml", ".js", ".py",
                            ".java", ".cpp", ".c", ".h", ".cs", ".php", ".rb", ".sh", ".bat", ".ps1", ".psm1", ".psd1", ".ps1xml", ".pssc"]
    openai.api_key = constants.OPENAI_API_KEY


    if not openai.api_key:
        print("Error: The OpenAI API key is not set.")
        print("Please set the OPENAI_API_KEY environment variable.")
        return

    prompt = read_pdf("test.pdf")



    response = openai.chat.completions.create(
        model="gpt-4o",  # You can also use other models like "gpt-3.5-turbo"
        messages=[
            {"role": "system", "content": """From the given input file, extract any entities and relationships you deem important \
             Your output should look like this: \
             {
                "entities": [
                    {id: 1 generated, attr1: "entity1", attr11: "something else", ...},
                    {id: 2 generated, attr2: "entity2", attr22: "something else", ...},
                    ...
                ],
                "relationships: [
                    "id1|RELATIONSHIP|id2",
             ]

             }
             You get to decide the number of attributes and what the attributes are and what the relationships are, \
             please make wise decisions based on the file read. \

             After making those attributes, generate queries to insert them into a neo4j database with proper syntax.\
             Respond with only the queries.\

             Relationship queries should be in this format:\
                MATCH (a:TYPE {id: any}), (b:TYPE {id: any}) CREATE (a)-[:RELATIONSHIP]->(b)

             """},
            {"role": "user", "content": prompt},
        ],
        max_tokens=8192,      # Adjust the response length
        temperature=0,     # Adjust creativity: 0 (less creative) to 1 (more creative)
        n=1,                 # Number of responses to generate
        stop=None            # Define stopping criteria if needed
    )

    # Extract and print the assistant's reply
    assistant_reply = response.choices[0].message.content

    def filter(arr):
        return [x for x in arr if x]

    as_array = filter(assistant_reply.split("\n"))
    print(as_array)
    print("done")



if __name__ == "__main__":
    main()