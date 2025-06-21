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
        share = price / len(shared_by)
        for person in shared_by:
            if person != payer:
                result[person] = result.get(person, 0) + share

    # 四捨五入
    result = {person: round(amount, 2) for person, amount in result.items()}
    return render_template('result.html', result=result, payer=payer)
