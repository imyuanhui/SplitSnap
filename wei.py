import cv2
import pytesseract
from PIL import Image
import numpy as np

# 讀取圖片並轉為灰階
image = cv2.imread('digital_receipt.jpeg')
gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

# 1. 提高對比度 + 二值化
gray = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1]

# 2. 可選：膨脹/侵蝕，強化字體
# kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (1, 1))
# gray = cv2.dilate(gray, kernel, iterations=1)

# 儲存並轉成 PIL 格式給 pytesseract
temp_file = "processed.png"
cv2.imwrite(temp_file, gray)
image = Image.open(temp_file)

# OCR 辨識
custom_config = r'--oem 3 --psm 6'
text = pytesseract.image_to_string(image, config=custom_config)
print(text)
