import requests # pip install requests
from typing import Any

def call_query_ai(question: str, chatid: str) -> Any:
    url = 'https://www.trainlyai.com/api/queryai'
    api_key = '6bf4ce72261efeed5fea61cd1a4ddf9b267c02dce96d8c5e1c042d52c9234ea2'  # Replace with your actual API key

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
response = call_query_ai("Tell me about the python file", "j574f4bxgvvgc3hj9ev480r7ys78639d")
print(response)