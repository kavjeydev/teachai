import requests # pip install requests
from typing import Any

def call_query_ai(question: str, chatid: str) -> Any:
    url = 'https://www.trainlyai.com/api/queryai'
    api_key = '41a694143a155b21f8173fd7d7ce363b5be707cc3ad6a23f1c6affb2b54ae4d8'  # Replace with your actual API key

    payload = {
        "question": question,
        "chatId": chatid,
    }

    headers = {
        'Content-Type': 'application/json',
        'x-api-key': api_key,
    }

    try:
        response = requests.post(url, json=payload, headers=headers)
        data = response.json()
        return data
    except requests.exceptions.RequestException as e:
        print(f'API call failed: {e}')
        raise

# Example usage:
response = call_query_ai("What is the capital of France?", "j57fvy6mbgs4tzj5fmapveqm79787zj4")
print(response)