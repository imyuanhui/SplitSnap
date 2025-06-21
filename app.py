from flask import Flask, request, render_template, redirect, url_for, session
import os
from werkzeug.utils import secure_filename
import pytesseract
from PIL import Image
import re
import compute_balances, generate_item_price_list
import json

# 建立 Flask app / Create Flask app
app = Flask(__name__)
app.secret_key = 'devJTS'  # session 加密用 / For securing session data

# 設定上傳資料夾與允許格式 / Set upload folder and file types
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# 檢查檔案格式 / Check allowed extension
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# 首頁：上傳收據 + 輸入資料 / Upload receipt and fill payer info
@app.route('/', methods=['GET'])
def index():
    return render_template('index.html')

# 上傳並處理 OCR / Upload file and process OCR
@app.route('/process_upload', methods=['POST'])
def process_upload():
    payer = request.form.get('payer')
    raw_spliters_list = request.form.getlist('spliters')  
    spliters = [s.strip() for s in raw_spliters_list if s.strip()]

    # ✅ 只呼叫一次避免不一致
    generated = json.loads(generate_item_price_list.generate_item_price())
    print(generated)
    print("generated: ", type(generated))
    session['payer'] = payer
    session['spliters'] = spliters
    session['items'] = [{'name': k, 'price': v} for k, v in generated['item_price'].items()]
    session['shop'] = generated['shop']
    session['total'] = generated['total']

    return redirect(url_for('split_items'))

# 顯示每個品項與勾選人 / Show each item and allow selecting spliters
@app.route('/split_items', methods=['GET'])
def split_items():

    payer = session.get('payer')
    spliters = session.get('spliters')
    items = session.get('items')
    return render_template('split_items.html', payer=payer, spliters=spliters, items=items)

# 計算分帳金額 / Calculate split result
@app.route('/calculate_split', methods=['POST'])
def calculate_split():
    payer = session.get('payer')
    items = session.get('items')
    final_items = []

    for i, item in enumerate(items):
        shared_by = request.form.getlist(f'item_{i}')
        item['shared_by'] = shared_by or []  # 確保有 key
        final_items.append(item)

    # 防呆計算
    result = {}
    for item in final_items:
        price = item['price']
        shared_by = item.get('shared_by', [])
        if not shared_by:
            continue  # 沒人分就跳過
        share = float(price) / len(shared_by)
        for person in shared_by:
            if person != payer:
                result[person] = result.get(person, 0) + share

    # 四捨五入
    result = {person: round(amount, 2) for person, amount in result.items()}
    return render_template('result.html', result=result, payer=payer)


# 啟動伺服器 / Run Flask app
if __name__ == '__main__':
    app.run(debug=True)
