import json
import read_image_with_gemini

def generate_item_price():
    # Original data
    data = read_image_with_gemini.extract_text()
    print(type(data))
    print("RAW DATA:", repr(data))
    data = json.loads(data)
    # print(data)

    # Build actual price dictionary
    item_price = {}

    # Add base prices
    for item in data["items"]:
        item_price[item["name"]] = float(item["price"])

    # Apply discounts
    for offer in data["offers"]:
        name = offer["name"]
        discount = float(offer["discount"])
        if name in item_price:
            item_price[name] = round(item_price[name] + discount, 2)  # Add negative discount (i.e., subtract)

    # Final result structure
    result = {
        "shop": data["shop"],
        "item_price": {name: f"{price:.2f}" for name, price in item_price.items()},
        "total": data["total"]
    }

    # Export result
    return json.dumps(result, indent=2)
