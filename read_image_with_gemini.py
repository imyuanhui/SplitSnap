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
Extract the following information from this receipt image:
- Shop name
- A list of purchased items with their names and prices
- Total amount paid
- if there is a Lidl Plus offer, list the item name and the amount of discount

Please return the result in JSON format with fields: shop, items (array of name + price), offers (array of name + discount) and total.
"""

# Send image + prompt
response = model.generate_content([prompt, image])

# Print the response
print(response.text)