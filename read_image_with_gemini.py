from PIL import Image
import google.generativeai as genai
import json
from dotenv import load_dotenv
import os

def extract_text(image_path = "digital_receipt.jpeg"):

    # Load environment variables from .env
    load_dotenv()

    # Get API key
    api_key = os.getenv("GOOGLE_API_KEY")

    # print(api_key)

    # Load image
    image = Image.open(image_path)

    # Authenticate
    genai.configure(api_key=api_key)

    # Create the vision model
    model = genai.GenerativeModel("models/gemini-1.5-flash")

    # Build the prompt
    prompt = """
    You are given an image of a shopping receipt. Your task is to extract the following information:

    1. Shop name
    2. A list of purchased items, each with its name and price
    3. Total amount paid
    4. Any discounts labeled as "Lidl Plus Offer" — for each, return the associated item name and the discount amount

    Return the result in JSON format with the following structure:
    {
    "shop": "<shop name>",
    "items": [
        {"name": "<item name>", "price": "<price>"}
    ],
    "offers": [
        {"name": "<item name>", "discount": "<discount amount>"}
    ],
    "total": "<total amount>"
    }

    Notes:
    - Exclude headers, footers, and non-item lines unless they clearly relate to purchases or discounts.
    - Prices and discounts should be numeric strings (e.g., "0.99", "-0.25").
    """


    # Send image + prompt
    response = model.generate_content([prompt, image])
    raw_text = response.text.strip().strip("`").replace("json\n", "", 1)
    # print(raw_text)

    return raw_text

    # raw_text = response.text.strip()

    # # Parse JSON safely
    # try:
    #     data = json.loads(raw_text)
    #     print(data)
    #     return data
    # except json.JSONDecodeError as e:
    #     print("Failed to parse response as JSON:", e)
    #     print("Raw response was:\n", raw_text)
    #     return None

extract_text()