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
        model="gpt-4",  # You can also use other models like "gpt-3.5-turbo"
        messages=[
            {"role": "system", "content": "You convert your inputs into schemas that can be used for neo4j"},
            {"role": "user", "content": prompt},
        ],
        max_tokens=150,      # Adjust the response length
        temperature=0.7,     # Adjust creativity: 0 (less creative) to 1 (more creative)
        n=1,                 # Number of responses to generate
        stop=None            # Define stopping criteria if needed
    )

    # Extract and print the assistant's reply
    assistant_reply = response.choices[0].message.content
    print("Assistant's Response:")
    print(assistant_reply)



if __name__ == "__main__":
    main()