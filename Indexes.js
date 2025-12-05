// ============================================
// CREACIÓN DE ÍNDICES - OPTIMIZACIÓN DE RENDIMIENTO
// ============================================

use GlobalMarket;

print("🚀 CREANDO ÍNDICES PARA OPTIMIZACIÓN");

// ============================================
// 1. ÍNDICES PARA PRODUCTS_CLEAN
// ============================================
print("\n📦 1. Creando índices para Products_clean...");

// Índice compuesto para rating
try {
  db.Products_clean.createIndex(
    { "rating": -1, "rating_count_clean": -1 },
    { 
      name: "idx_rating_count",
      background: true,
      partialFilterExpression: {
        rating: { $exists: true },
        rating_count_clean: { $exists: true }
      }
    }
  );
  print("✅ Índice creado: idx_rating_count (rating, rating_count_clean)");
} catch (e) {
  print("⚠️  Error creando idx_rating_count: " + e.message);
}

// Índice para precio
try {
  db.Products_clean.createIndex(
    { "price": 1 },
    { 
      name: "idx_price",
      background: true,
      partialFilterExpression: {
        price: { $exists: true, $gt: 0 }
      }
    }
  );
  print("✅ Índice creado: idx_price (price)");
} catch (e) {
  print("⚠️  Error creando idx_price: " + e.message);
}

// Índice para categoría
try {
  db.Products_clean.createIndex(
    { "category_clean": 1 },
    { 
      name: "idx_category",
      background: true,
      partialFilterExpression: {
        category_clean: { $exists: true }
      }
    }
  );
  print("✅ Índice creado: idx_category (category_clean)");
} catch (e) {
  print("⚠️  Error creando idx_category: " + e.message);
}

// Índice compuesto para búsquedas frecuentes
try {
  db.Products_clean.createIndex(
    { "category_clean": 1, "price": 1 },
    { 
      name: "idx_category_price",
      background: true
    }
  );
  print("✅ Índice creado: idx_category_price (category_clean, price)");
} catch (e) {
  print("⚠️  Error creando idx_category_price: " + e.message);
}

// ============================================
// 2. ÍNDICES PARA VENTAS
// ============================================
print("\n💸 2. Creando índices para ventas...");

// Índice para fecha
try {
  db.ventas.createIndex(
    { "date": 1 },
    { 
      name: "idx_date",
      background: true,
      expireAfterSeconds: 31536000 // Opcional: expiración después de 1 año
    }
  );
  print("✅ Índice creado: idx_date (date)");
} catch (e) {
  print("⚠️  Error creando idx_date: " + e.message);
}

// Índice para product_id
try {
  db.ventas.createIndex(
    { "product_id": 1 },
    { 
      name: "idx_product_id",
      background: true
    }
  );
  print("✅ Índice creado: idx_product_id (product_id)");
} catch (e) {
  print("⚠️  Error creando idx_product_id: " + e.message);
}

// Índice compuesto para consultas frecuentes
try {
  db.ventas.createIndex(
    { "product_id": 1, "date": 1 },
    { 
      name: "idx_product_date",
      background: true
    }
  );
  print("✅ Índice creado: idx_product_date (product_id, date)");
} catch (e) {
  print("⚠️  Error creando idx_product_date: " + e.message);
}

// Índice para total_amount (para análisis de ventas altas)
try {
  db.ventas.createIndex(
    { "total_amount": -1 },
    { 
      name: "idx_total_amount",
      background: true,
      partialFilterExpression: {
        total_amount: { $gt: 1000 }
      }
    }
  );
  print("✅ Índice creado: idx_total_amount (total_amount)");
} catch (e) {
  print("⚠️  Error creando idx_total_amount: " + e.message);
}

// ============================================
// 3. ÍNDICES DE TEXTO PARA BÚSQUEDA
// ============================================
print("\n🔍 3. Creando índices de texto para búsqueda...");

// Índice de texto para Atlas Search (versión básica)
try {
  db.Products_clean.createIndex(
    { 
      "product_name": "text",
      "about_product": "text"
    },
    {
      name: "text_search_index",
      weights: {
        "product_name": 10,
        "about_product": 5
      },
      default_language: "spanish",
      background: true
    }
  );
  print("✅ Índice de texto creado: text_search_index");
} catch (e) {
  print("⚠️  Error creando índice de texto: " + e.message);
  print("ℹ️  Nota: Atlas Search requiere configuración adicional en la web");
}

// ============================================
// 4. VERIFICACIÓN DE ÍNDICES
// ============================================
print("\n📋 4. Verificando índices creados...");

print("\n📊 Products_clean - Índices existentes:");
const productsIndexes = db.Products_clean.getIndexes();
productsIndexes.forEach((idx, i) => {
  print(`   ${i+1}. ${idx.name}: ${JSON.stringify(idx.key)}`);
});

print("\n📊 ventas - Índices existentes:");
const ventasIndexes = db.ventas.getIndexes();
ventasIndexes.forEach((idx, i) => {
  print(`   ${i+1}. ${idx.name}: ${JSON.stringify(idx.key)}`);
});

// ============================================
// 5. EXPLAIN PLAN - ANÁLISIS DE RENDIMIENTO
// ============================================
print("\n⚡ 5. Ejecutando Explain Plan para análisis...");

// Test de rendimiento para agregación compleja
try {
  const explainResult = db.ventas.explain("executionStats").aggregate([
    {
      $lookup: {
        from: "Products_clean",
        localField: "product_id",
        foreignField: "product_id",
        as: "product_info"
      }
    },
    { $unwind: "$product_info" },
    {
      $group: {
        _id: "$product_info.category_clean",
        totalSales: { $sum: "$total_amount" }
      }
    },
    { $limit: 5 }
  ]);

  const stats = explainResult[0].executionStats;
  print("\n📈 Métricas de rendimiento:");
  print(`   • Tiempo ejecución: ${stats.executionTimeMillis} ms`);
  print(`   • Documentos examinados: ${stats.totalDocsExamined}`);
  print(`   • Etapas de ejecución: ${stats.executionStages.stage}`);
  
  // Verificar si usa índices
  const usesIndex = stats.executionStages.inputStage && 
                   stats.executionStages.inputStage.stage === "IXSCAN";
  print(`   • Usa índices: ${usesIndex ? "✅ Sí" : "❌ No"}`);
  
} catch (e) {
  print("⚠️  Error en Explain Plan: " + e.message);
}

// ============================================
// RESUMEN FINAL
// ============================================
print("\n" + "=".repeat(60));
print("🎯 RESUMEN DE ÍNDICES CREADOS");
print("=".repeat(60));

const totalProductsIndexes = productsIndexes.length;
const totalVentasIndexes = ventasIndexes.length;

print(`\n📦 Products_clean: ${totalProductsIndexes} índices`);
print(`💸 ventas: ${totalVentasIndexes} índices`);
print(`🔍 Total: ${totalProductsIndexes + totalVentasIndexes} índices creados`);

print("\n🏆 Índices más importantes:");
print("   1. idx_rating_count - Para consultas de productos mejor calificados");
print("   2. idx_product_date - Para análisis temporal de ventas por producto");
print("   3. text_search_index - Para búsquedas de texto en nombres y descripciones");

print("\n💡 Recomendaciones:");
print("   • Monitorear el uso de índices con db.currentOp()");
print("   • Considerar índices compuestos para consultas específicas");
print("   • Revisar índices no utilizados periódicamente");

print("\n🚀 Optimización de rendimiento completada!");
