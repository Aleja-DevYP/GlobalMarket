# 🔍 CONFIGURACIÓN DE ATLAS SEARCH - GLOBALMARKET

## 📋 Información del Proyecto

**Cluster:** cluster0.hqctzjb.mongodb.net  
**Base de datos:** GlobalMarket  
**Colección:** Products_clean  
**Índice de búsqueda:** globalmarket_search_index  

## 🚀 Pasos para Configurar Atlas Search

### 1. Acceso a la Interfaz
1. **Iniciar sesión** en [MongoDB Atlas](https://cloud.mongodb.com)
2. **Seleccionar proyecto** → **Cluster** → **Search tab**
3. **Hacer clic** en "Create Search Index"

### 2. Configuración Básica
```json
{
  "database": "GlobalMarket",
  "collection": "Products_clean",
  "indexName": "globalmarket_search_index",
  "mappings": {
    "dynamic": false,
    "fields": {
      "product_name": {
        "type": "string",
        "analyzer": "lucene.standard",
        "searchAnalyzer": "lucene.standard"
      },
      "about_product": {
        "type": "string",
        "analyzer": "lucene.standard",
        "searchAnalyzer": "lucene.standard"
      },
      "category_clean": {
        "type": "string",
        "analyzer": "keyword"
      },
      "price": {
        "type": "number"
      },
      "rating": {
        "type": "number"
      }
    }
  },
  "synonyms": []
}
