import json

# Nama file JSON
INPUT_FILE = "productUoms.json"
OUTPUT_FILE = "insert_uoms.sql"

def main():
    with open(INPUT_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    values = []
    for item in data:
        values.append(
            f"({item['id']}, '{item['name']}', {item['category_id'][0]}, "
            f"'{item['uom_type']}', {item['factor_inv']}, {item['factor']})"
        )

    sql = "INSERT INTO uoms (id, name, category_id, uom_type, factor_inv, factor) VALUES\n"
    sql += ",\n".join(values) + ";"

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        f.write(sql)

    print(f"✅ SQL berhasil dibuat di {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
