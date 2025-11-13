package main

import (
"database/sql"
"fmt"
"log"

_ "github.com/lib/pq"
)

func main() {
connStr := "postgres://postgres:postgres@localhost:5432/yeelo_homeopathy?sslmode=disable"
db, err := sql.Open("postgres", connStr)
if err \!= nil {
l := `
ame,
ame, '') as category,
ame, '') as brand,
cy,
ame, '') as form
 categories c ON p.category_id = c.id
 brands b ON p.brand_id = b.id
 potencies pot ON p.potency_id = pot.id
 forms f ON p.form_id = f.id
ame, category, brand, potency, form string
err = db.QueryRow(sql, "471c5af2-ca1b-48e4-a31f-0c7f098d1d01").Scan(
ame, &category, &brand, &potency, &form,
)

if err \!= nil {
 error:", err)
}

fmt.Printf("ID: %s\n", id)
fmt.Printf("SKU: %s\n", sku)
fmt.Printf("Name: %s\n", name)
fmt.Printf("Category: %s\n", category)
fmt.Printf("Brand: %s\n", brand)
fmt.Printf("Potency: %s\n", potency)
fmt.Printf("Form: %s\n", form)
}
