# 計算每人應付給付款人的金額 / Compute how much each person owes the payer
def compute_balances(payer, items):
    balances = {}
    for item in items:
        price = float(item['price'])
        shared_by = item['shared_by']
        share = price / len(shared_by)
        for person in shared_by:
            if person != payer:
                balances[person] = balances.get(person, 0) + share
    return {k: round(v, 2) for k, v in balances.items()}