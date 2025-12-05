# GlobalMarket
Repositorio del Proyecto Globalmarket de BD2
# 📊 GlobalMarket Analytics & Search Engine

**Proyecto: Sistemas de Bases de Datos II - MongoDB**  
**Universidad Nacional Experimental de Guayana**  
**Profesora: Clinia Cordero**  
**Fecha de Entrega: 05-12-2025**  
**Valor: 15%**

---

## 🎯 Objetivo del Proyecto

Migrar y optimizar el catálogo de productos y registro de ventas de "GlobalMarket" a MongoDB Atlas, implementando un motor de búsqueda eficiente y un dashboard de análisis de ventas en tiempo real.

## 👥 Equipo

 Jhoanny Maita, 30.694.732 
Carlos Zorrilla, 28.783.889 
Joldred Loaiza, 25.083.377

## 🚀 Tecnologías Utilizadas

- **MongoDB Atlas** (Cluster M0 Free Tier)
- **MongoDB Compass** (GUI para administración)
- **MongoDB Aggregation Framework**
- **Atlas Search** (Motor de búsqueda)
- **MongoDB Charts** (Dashboard visual)
- **JSON Schema Validation**

## 📊 Dataset

**Nombre:** Amazon Products Dataset  
**Volumen:** 1,465 documentos en `Products_clean`, [X] documentos en `ventas`  
**Estructura:** Productos de e-commerce con reseñas, ratings, precios y categorías

### Colecciones Principales:

1. **`Products_clean`** - Catálogo de productos
   - `product_id` (String): Identificador único
   - `product_name` (String): Nombre del producto
   - `category_clean` (String): Categoría limpia
   - `price` (Double): Precio actual
   - `rating` (Double): Calificación promedio
   - `rating_count_clean` (Int): Número de reseñas

2. **`ventas`** - Registro de transacciones
   - `product_id` (String): Referencia al producto
   - `date` (Date): Fecha de venta
   - `total_amount` (Double): Monto total

## 🏗️ Modelado de Datos

### Decisiones de Diseño:

1. **Embedding vs Referencing:**
   - **Referencing:** Se utilizó referencia (`product_id`) entre `ventas` y `Products_clean`
   - **Justificación:** Las ventas pueden crecer independientemente, evitando documentos muy grandes


2. **Validaciones Implementadas:**

**Products_clean:**
```json
{
  "$jsonSchema": {
    "bsonType": "object",
    "required": ["product_id", "product_name"],
    "properties": {
      "product_id": { "bsonType": "string" },
      "product_name": { "bsonType": "string" },
      "price": { "bsonType": ["double", "int"], "minimum": 0 },
      "category_clean": { "bsonType": "string" },
      "rating": { "bsonType": "double", "minimum": 0, "maximum": 5 },
      "rating_count_clean": { "bsonType": "int", "minimum": 0 }
    }
  }
}

Ventas:

{
  "$jsonSchema": {
    "bsonType": "object",
    "required": ["product_id", "date", "total_amount"],
    "properties": {
      "product_id": { "bsonType": "string" },
      "date": { "bsonType": "date" },
      "total_amount": { "bsonType": ["double", "int"], "minimum": 0 }
    }
  }
}
🔍 Aggregation Pipelines
1. 📈 Ventas por Categoría y Mes
[
  {
    "$lookup": {
      "from": "Products_clean",
      "localField": "product_id",
      "foreignField": "product_id",
      "as": "product_info"
    }
  },
  { "$unwind": "$product_info" },
  {
    "$group": {
      "_id": {
        "category": "$product_info.category_clean",
        "month": { "$month": "$date" }
      },
      "totalSales": { "$sum": "$total_amount" },
      "count": { "$sum": 1 }
    }
  },
  {
    "$project": {
      "category": "$_id.category",
      "month": "$_id.month",
      "totalSales": 1,
      "count": 1,
      "_id": 0
    }
  },
  { "$sort": { "month": 1, "totalSales": -1 } }
]
2. ⭐ Top Productos por Rating (>50 reseñas)
[
  {
    "$match": {
      "rating": { "$ne": null },
      "rating_count_clean": { "$gt": 50 }
    }
  },
  { "$sort": { "rating": -1 } },
  {
    "$project": {
      "product_id": 1,
      "product_name": 1,
      "rating": 1,
      "rating_count_clean": 1,
      "category_clean": 1
    }
  },
  { "$limit": 10 }
]
3.  Productos por Rango de Precio (Bucket Pattern)

[
  {
    "$match": { "price": { "$ne": null, "$gt": 0 } }
  },
  {
    "$bucket": {
      "groupBy": "$price",
      "boundaries": [0, 100, 500, 1000, 5000, 10000],
      "default": "Above 10000",
      "output": {
        "count": { "$sum": 1 },
        "avg_price": { "$avg": "$price" },
        "avg_rating": { "$avg": "$rating" }
      }
    }
  },
  {
    "$project": {
      "price_range": {
        "$switch": {
          "branches": [
            { "case": { "$lt": ["$_id", 100] }, "then": "Muy Bajo (0-99)" },
            { "case": { "$lt": ["$_id", 500] }, "then": "Bajo (100-499)" },
            { "case": { "$lt": ["$_id", 1000] }, "then": "Medio (500-999)" },
            { "case": { "$lt": ["$_id", 5000] }, "then": "Alto (1000-4999)" },
            { "case": { "$lt": ["$_id", 10000] }, "then": "Muy Alto (5000-9999)" }
          ],
          "default": "Premium (10000+)"
        }
      },
      "count": 1,
      "avg_price": { "$round": ["$avg_price", 2] },
      "avg_rating": { "$round": ["$avg_rating", 2] }
    }
  },
  { "$sort": { "avg_price": 1 } }
]
🔎 Atlas Search
Configuración:
•	Índice: products_search_index
•	Colección: Products_clean
•	Campos Indexados:
o	product_name (text, fuzzy search)
o	about_product (text, fuzzy search)
o	category_clean (string, exact match)
Ejemplo de Búsqueda Difusa:
// Encontrar productos con errores tipográficos
db.Products_clean.aggregate([
  {
    $search: {
      text: {
        query: "charger",  // Encontrará "charger", "chargers", "charging"
        path: "product_name",
        fuzzy: { maxEdits: 2 }
      }
    }
  }
])
⚡ Índices de Rendimiento
Índices Creados:
Products_clean:
// Para consultas de rating
db.Products_clean.createIndex({ "rating": -1, "rating_count_clean": -1 })

// Para consultas de precio
db.Products_clean.createIndex({ "price": 1 })

// Para filtros por categoría
db.Products_clean.createIndex({ "category_clean": 1 })

// Para búsqueda de texto
db.Products_clean.createIndex({ 
  "product_name": "text", 
  "about_product": "text" 
})
ventas:
// Para agrupación por fecha
db.ventas.createIndex({ "date": 1 })

// Para join con Products_clean
db.ventas.createIndex({ "product_id": 1 })

// Para consultas combinadas
db.ventas.createIndex({ "product_id": 1, "date": 1 })

📊 MongoDB Charts Dashboard

https://charts.mongodb.com/charts-project-0-vbxdmfm/public/dashboards/c89fdd42-6576-4d45-9766-b0ebac872958

Gráficos Implementados:
1.	📈 Ventas Mensuales Totales
o	Tipo: Línea temporal
o	Fuente: ventas
o	Métrica: Suma de total_amount por mes
2.	⭐ Top 10 Productos por Rating
o	Tipo: Tabla interactiva
o	Fuente: Products_clean
o	Filtro: rating_count_clean > 50
o	Orden: rating descendente
3.	🔄 Distribución por Categoría
o	Tipo: Gráfico de torta
o	Fuente: Products_clean
o	Métrica: Conteo de productos por category_clean
🛠️ Instalación y Configuración
# Importar productos
mongoimport --uri "mongodb+srv://usuario:password@cluster.mongodb.net/GlobalMarket" \
  --collection Products_clean \
  --file data/products.json \
  --jsonArray

# Importar ventas
mongoimport --uri "mongodb+srv://usuario:password@cluster.mongodb.net/GlobalMarket" \
  --collection ventas \
  --file data/sales.json \
  --jsonArray
# Conectar a MongoDB
mongosh "mongodb+srv://usuario:password@cluster.mongodb.net/GlobalMarket"

# Ejecutar validaciones
load('scripts/validations.js')

# Ejecutar creación de índices
load('scripts/indexes.js')

# Ejecutar pipelines de agregación (opcional)
load('scripts/aggregations.js')
