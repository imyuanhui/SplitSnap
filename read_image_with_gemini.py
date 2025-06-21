from PIL import Image
import google.generativeai as genai

# Load image
image_path = "digital_receipt.jpeg"
image = Image.open(image_path)

# Authenticate
genai.configure(api_key="AIzaSyD0j_PeFIMqwQopBep8xckTflzY5MyBCGo")

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

# Print the response
print(response.text)