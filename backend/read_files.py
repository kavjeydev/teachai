from pypdf import PdfReader
from fastapi import FastAPI


class ReadFiles:
    def __init__(self):
        self.supported_file_types = [".pdf", ".docx", ".txt", ".md", ".ts", ".csv", ".json", ".html", ".xml", ".yaml", ".yml", ".js", ".py",
                            ".java", ".cpp", ".c", ".h", ".cs", ".php", ".rb", ".sh", ".bat", ".ps1", ".psm1", ".psd1", ".ps1xml", ".pssc"]

        self.app = FastAPI()

    def extract_text_from_pdf(self, file_path):
        text = ""
        with open(file_path, 'rb') as f:
            reader = PdfReader(f)
            for page in reader.pages:
                text += page.extract_text()
        return text



def main():
    read_files = ReadFiles()
    text = read_files.extract_text_from_pdf("test.pdf")
    print(text)
    print("done")

if __name__ == "__main__":
    main()

app = FastAPI()
@app.get("/pdf")
def send_file_content():
    read_files = ReadFiles()
    text = read_files.extract_text_from_pdf("test.pdf")
    return text