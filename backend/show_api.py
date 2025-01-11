import requests # pip install requests
from typing import Any

def call_query_ai(question: str, chatid: str) -> Any:
    url = 'https://trainlyai.com/api/queryai'
    api_key = '52cef9866fd45b6cd36795b9323a32c9d536e7b7d2f8fe12d6b73dd7be4ee753'  # Replace with your actual API key

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
response = call_query_ai("What is the capital of France?", "jd74dpab8z6fqt1bpkg721yphn783aq1")
print(response)