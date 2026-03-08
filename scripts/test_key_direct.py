import requests
import json

api_key = "AIzaSyAjDFBxd2Z1NyBoUACsmgAWxn_mp2iVbpg"
url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key={api_key}"

payload = {
    "content": {
        "parts": [
            {
                "text": "Testing embeddings"
            }
        ]
    }
}

headers = {
    "Content-Type": "application/json"
}

try:
    response = requests.post(url, headers=headers, data=json.dumps(payload))
    print(f"Status Code: {response.status_code}")
    print("Response:")
    print(json.dumps(response.json(), indent=2))
except Exception as e:
    print(f"Error: {e}")
