

import cv2
import pytesseract
from PIL import Image
import numpy as np
import re
import google.generativeai as genai

genai.configure(api_key="AIzaSyD0j_PeFIMqwQopBep8xckTflzY5MyBCGo")


pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

# Set tesseract command path if needed (Windows users)
# pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

import cv2
import pytesseract
import re
import numpy as np

# Optional: Set Tesseract path on Windows
# pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

def preprocess_image(image_path):
    image = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
    image = cv2.resize(image, None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC)
    blurred = cv2.GaussianBlur(image, (3, 3), 0)
    thresh = cv2.adaptiveThreshold(
        blurred, 255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY, 31, 2
    )
    return thresh

def clean_text(text):
    replacements = {'@': '0', '|': '1', 'O': '0', '€': 'EUR', 'I': '1'}
    for wrong, right in replacements.items():
        text = text.replace(wrong, right)
    return text

def extract_info(text):
    lines = text.split('\n')
    lines = [line.strip() for line in lines if line.strip()]
    
    shop_name = ""
    item_list = []
    total_amount = ""

    # 1. Shop name (look at top 5 lines)
    for line in lines[:5]:
        if re.search(r'(lidl|aldi|tesco|supervalu)', line, re.I):
            shop_name = line
            break

    # 2. Items + prices (regex match line ending in a price)
    last_item_index = None

    for line in lines:
        line = line.strip()
        if not line:
            continue

        print("line: ", line)

        # Match a normal item line with a price (possibly ending in A/B/C)
        match_normal_item = re.match(r"(.+?)\s+(-?[\d]+[.,:]\d{2})\s?[A-Z]?$", line)
        # match_normal_item = re.match(r"(.+?)\s+[“\"']?(\d{2,4})\s?[A-Z]?$", line)
        
        if match_normal_item:
            item_name = match_normal_item.group(1).strip()
            # price_str = match_normal_item.group(2).replace(',', '.').replace(':', '.')
            raw_price = match_normal_item.group(2).strip()

            # Convert "099" → 0.99 or "1099" → 10.99
            if len(raw_price) == 3:
                price = float(raw_price) / 100
            elif len(raw_price) == 4:
                price = float(raw_price) / 100
            else:
                price = float(raw_price)

            # price = float(price_str)
            print("price: ", price)
            item_list.append((item_name, f"{price:.2f}"))
            last_item_index = len(item_list) - 1
        
        # Check if it's a discount line (contains number but does NOT end with a letter)
        if "plus" in line.lower() and "offer" in line.lower() or "plus" in line.lower() and "0ffer" in line.lower():
            # Try to extract the discount number
            match = re.search(r'(-?\d+[.,:]\d{2})', line)
            if match and last_item_index is not None:
                discount = float(match.group(1).replace(',', '.').replace(':', '.'))
                prev_name, prev_price = item_list[last_item_index]
                new_price = round(float(prev_price) - discount, 2)
                item_list[last_item_index] = (prev_name, f"{new_price:.2f}")
            continue


        # discount_match = re.match(r"^.*?(-?\d+[.,:]\d{2})(?!\s*[A-Za-z])$", line)
        # if discount_match:
        #     # This is a discount line
        #     discount = float(discount_match.group(1).replace(',', '.').replace(':', '.'))
        #     print("discount: ", discount)
        #     if last_item_index is not None:
        #         prev_name, prev_price = item_list[last_item_index]
        #         new_price = round(float(prev_price) + discount, 2)
        #         item_list[last_item_index] = (prev_name, f"{new_price:.2f}")


    # 3. Total amount (line with TOTAL or Total)
    for line in lines:
        if "TOTAL" in line.upper():
            match = re.search(r'([\d]+[\.:,]\d{2})', line)
            if match:
                total_amount = match.group(1).replace(',', '.')
                break

    return shop_name, item_list, total_amount

def main(image_path):
    preprocessed = preprocess_image(image_path)
    raw_text = pytesseract.image_to_string(preprocessed, config='--oem 3 --psm 6')
    text = clean_text(raw_text)

    shop, items, total = extract_info(text)

    print("\n=== Extracted Receipt Info ===")
    print(f"Shop Name: {shop}")
    print(f"Total Amount: €{total}")
    print("\nItems:")
    for name, price in items:
        print(f"- {name} : €{price}")

if __name__ == "__main__":
    main("digital_receipt.jpeg")  # Replace with your image file name

