
## 📂 **ARCHIVOS ADICIONALES QUE DEBES CREAR:**

### **1. `scripts/validations.js`:**
```javascript
// Validaciones JSON Schema para Products_clean
db.runCommand({
  collMod: "Products_clean",
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["product_id", "product_name"],
      properties: {
        product_id: { bsonType: "string" },
        product_name: { bsonType: "string" },
        price: { bsonType: ["double", "int"], minimum: 0 },
        category_clean: { bsonType: "string" },
        rating: { bsonType: "double", minimum: 0, maximum: 5 },
        rating_count_clean: { bsonType: "int", minimum: 0 }
      }
    }
  }
});

// Validaciones JSON Schema para ventas
db.runCommand({
  collMod: "ventas",
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["product_id", "date", "total_amount"],
      properties: {
        product_id: { bsonType: "string" },
        date: { bsonType: "date" },
        total_amount: { bsonType: ["double", "int"], minimum: 0 }
      }
    }
  }
});

print("✅ Validaciones JSON Schema aplicadas exitosamente");
