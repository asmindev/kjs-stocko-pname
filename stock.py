perlu di perhatikan: 10001313

FILENAME = 'cindy.json'

FILE = open(FILENAME, 'r').read()
FILE_JSON = eval(FILE)

CINDY_ID = 80
CINDY_PRODUCTS = []
for entry in FILE_JSON:
    if entry["userId"] == CINDY_ID:
        CINDY_PRODUCTS.append(entry)

# save to cindy_products.json
CINDY_FILE = open('cindy_products.json', 'w')
CINDY_FILE.write(str(CINDY_PRODUCTS))
CINDY_FILE.close()
print("Total products found for Cindy:", len(CINDY_PRODUCTS))

# model Product {
#     id            Int      @id @default(autoincrement())
#     product_id    Int? // ID dari Odoo
#     barcode       String
#     name          String?
#     created_at    DateTime @default(now())
#     quantity      Float    @default(1)
#     uom_id        Int? // Unit of Measure ID
#     uom_name      String? // Unit of Measure Name (backup)
#     location_id   Int? // ID lokasi inventori dari Odoo
#     location_name String? // Nama lokasi inventori dari Odoo

#     state ProductState @default(DRAFT)

#     // Foreign key to session
#     session_id Int?
#     userId     Int?

#     // Relationship
#     session     Session?  @relation(fields: [session_id], references: [id])
#     User        User?     @relation(fields: [userId], references: [id])
#     uom         Uom?      @relation(fields: [uom_id], references: [id])
#     Document    Document? @relation(fields: [document_id], references: [id])
#     document_id Int?
# }

# mari kita generate raw query untuk field
# "barcode": "2414312904176",
# "name": "TEHEL 50X50 ERTO WHITE UNO _F",
# "product_id": 27637,
# "uom_id": 61,
# "uom_name": "Dus",
# "quantity": 2,
# "session_id": 6,
# "userId": 80,
# "location_id": 544,
# "location_name": "TKJS/Stock/FLOOR TEHEL/50X50 UNO /ALL BRAND/FTHL01"

# gunakan for loop untuk generate insert query
INSERT_QUERY = 'INSERT INTO "Product" (barcode, name, product_id, uom_id, uom_name, quantity, session_id, "userId", location_id, location_name) VALUES \n'
for product in CINDY_PRODUCTS:
    product_name = product['name'].replace("'", "''") if product['name'] else ''
    uom_name = product['uom_name'].replace("'", "''") if product ['uom_name'] else ''
    location_name = product['location_name'].replace("'", "''") if product['location_name'] else ''
    INSERT_QUERY += f"('{product['barcode']}', '{product_name}', {product['product_id']}, {product['uom_id']}, '{uom_name}', {product['quantity']}, 73, {product['userId']}, {product['location_id']}, '{location_name}'), \n"



INSERT_QUERY = INSERT_QUERY[:-2]

# save to cindy_products.sql
CINDY_FILE = open('cindy_products.sql', 'w')
CINDY_FILE.write(INSERT_QUERY)
CINDY_FILE.close()
