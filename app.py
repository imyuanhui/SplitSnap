from flask import Flask, request, render_template, redirect, url_for, session
import os
from werkzeug.utils import secure_filename
import pytesseract
from PIL import Image
import re
import compute_balances, generate_item_price_list

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
    raw_spliters = request.form.get('spliters')  # 這是字串，例如 'Alice,Bob'
    spliters = [s.strip() for s in raw_spliters.split(',')]  # 分割成 list


    # dummy_items = {
    #     "White Floury Bap": 0.49,
    #     "Kids Toilet Tissue": 0.89,
    #     "Cherries": 2.68,
    #     "Pain Au Chocolat": 1.99,
    #     "Brioche Pasquier": 1.99,
    #     "Medium Egg Noodles": 0.85,
    #     "3x Mixed Bean & Corn": 0.79,
    #     "Lactose Free Milk": 1.59,
    #     "MSC Seafood Sticks": 1.99,
    #     "LF Cheezy Singles": 1.59,
    #     "Clementine 2kg 1000g": 3.49,
    #     "Tuna in brine": 1.98
    # }

    # items = [{'name': k, 'price': v} for k, v in dummy_items.items()]

    # 儲存到 session / Store in session
    session['payer'] = payer
    session['payer'] = "Ella"
    session['spliters'] = ["Juster","YuWei"]
    session['shop'] = generate_item_price_list()['shop']
    session['total'] = generate_item_price_list()['total']


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
        item['shared_by'] = shared_by
        final_items.append(item)

    result = compute_balances(payer, final_items)
    return render_template('result.html', result=result, payer=payer)


# 啟動伺服器 / Run Flask app
if __name__ == '__main__':
    app.run(debug=True)
