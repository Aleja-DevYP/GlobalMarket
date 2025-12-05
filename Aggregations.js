// ============================================
// AGREGACIONES COMPLEJAS - GLOBALMARKET ANALYTICS
// ============================================

use GlobalMarket;

print("🚀 EJECUTANDO PIPELINES DE AGREGACIÓN COMPLEJOS");

// ============================================
// 1. PIPELINE: VENTAS POR CATEGORÍA Y MES
// ============================================
print("\n📊 1. Ejecutando: Ventas por Categoría y Mes");

try {
  const ventasPorCategoria = db.ventas.aggregate([
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
        _id: {
          category: "$product_info.category_clean",
          month: { $month: "$date" },
          year: { $year: "$date" }
        },
        totalSales: { $sum: "$total_amount" },
        countTransactions: { $sum: 1 },
        avgTransactionValue: { $avg: "$total_amount" }
      }
    },
    {
      $project: {
        category: "$_id.category",
        month: "$_id.month",
        year: "$_id.year",
        totalSales: { $round: ["$totalSales", 2] },
        countTransactions: 1,
        avgTransactionValue: { $round: ["$avgTransactionValue", 2] },
        _id: 0
      }
    },
    { $sort: { year: 1, month: 1, totalSales: -1 } }
  ]);

  // Guardar resultados en nueva colección
  const ventasCollection = db.ventas_analytics;
  ventasCollection.drop();
  
  let count = 0;
  ventasPorCategoria.forEach(doc => {
    ventasCollection.insertOne(doc);
    count++;
  });
  
  print(`✅ Pipeline 1 completado: ${count} documentos en 'ventas_analytics'`);
  print("📋 Muestra de resultados:");
  db.ventas_analytics.find().limit(3).forEach(printjson);
  
} catch (e) {
  print("❌ Error en Pipeline 1: " + e.message);
}

// ============================================
// 2. PIPELINE: TOP PRODUCTOS POR RATING (>50 reseñas)
// ============================================
print("\n⭐ 2. Ejecutando: Top Productos por Rating");

try {
  const topProductos = db.Products_clean.aggregate([
    {
      $match: {
        rating: { $ne: null },
        rating_count_clean: { $gt: 50 }
      }
    },
    {
      $addFields: {
        // Limpiar rating si es string
        clean_rating: {
          $cond: {
            if: { $eq: [{ $type: "$rating" }, "string"] },
            then: { $toDouble: { $replaceAll: { input: "$rating", find: ",", replacement: "" } } },
            else: { $toDouble: "$rating" }
          }
        },
        // Limpiar conteo si es string
        clean_count: {
          $cond: {
            if: { $eq: [{ $type: "$rating_count_clean" }, "string"] },
            then: { $toInt: { $replaceAll: { input: "$rating_count_clean", find: ",", replacement: "" } } },
            else: { $toInt: "$rating_count_clean" }
          }
        }
      }
    },
    {
      $match: {
        clean_rating: { $gte: 0, $lte: 5 }
      }
    },
    {
      $addFields: {
        weighted_score: {
          $multiply: [
            "$clean_rating",
            { $log10: { $add: ["$clean_count", 1] } }
          ]
        }
      }
    },
    {
      $sort: { weighted_score: -1, clean_rating: -1 }
    },
    {
      $project: {
        product_id: 1,
        product_name: 1,
        rating: { $round: ["$clean_rating", 2] },
        rating_count_clean: "$clean_count",
        weighted_score: { $round: ["$weighted_score", 2] },
        category_clean: 1,
        price: 1,
        performance: {
          $switch: {
            branches: [
              { case: { $gte: ["$clean_rating", 4.5] }, then: "Excelente" },
              { case: { $gte: ["$clean_rating", 4.0] }, then: "Bueno" },
              { case: { $gte: ["$clean_rating", 3.0] }, then: "Regular" },
              { case: { $lt: ["$clean_rating", 3.0] }, then: "Mejorar" }
            ],
            default: "Sin calificación"
          }
        }
      }
    },
    { $limit: 15 }
  ]);

  // Guardar resultados
  const topCollection = db.top_productos;
  topCollection.drop();
  
  let topCount = 0;
  topProductos.forEach(doc => {
    topCollection.insertOne(doc);
    topCount++;
  });
  
  print(`✅ Pipeline 2 completado: ${topCount} documentos en 'top_productos'`);
  print("📋 Top 5 productos:");
  db.top_productos.find().limit(5).forEach(printjson);
  
} catch (e) {
  print("❌ Error en Pipeline 2: " + e.message);
}

// ============================================
// 3. PIPELINE: BUCKET PATTERN - RANGOS DE PRECIO
// ============================================
print("\n💰 3. Ejecutando: Bucket Pattern - Rangos de Precio");

try {
  const bucketPrecios = db.Products_clean.aggregate([
    {
      $match: {
        price: { $exists: true, $ne: null }
      }
    },
    {
      $addFields: {
        clean_price: {
          $cond: {
            if: { $eq: [{ $type: "$price" }, "string"] },
            then: { $toDouble: "$price" },
            else: { $toDouble: "$price" }
          }
        }
      }
    },
    {
      $match: {
        clean_price: { $gt: 0 }
      }
    },
    {
      $bucket: {
        groupBy: "$clean_price",
        boundaries: [0, 100, 500, 1000, 5000, 10000],
        default: "Above 10000",
        output: {
          count: { $sum: 1 },
          avg_price: { $avg: "$clean_price" },
          avg_rating: { $avg: "$rating" },
          min_price: { $min: "$clean_price" },
          max_price: { $max: "$clean_price" },
          products: {
            $push: {
              name: "$product_name",
              price: "$clean_price",
              rating: "$rating",
              category: "$category_clean"
            }
          }
        }
      }
    },
    {
      $project: {
        price_range: {
          $switch: {
            branches: [
              { case: { $lt: ["$_id", 100] }, then: "Muy Bajo (0-99)" },
              { case: { $lt: ["$_id", 500] }, then: "Bajo (100-499)" },
              { case: { $lt: ["$_id", 1000] }, then: "Medio (500-999)" },
              { case: { $lt: ["$_id", 5000] }, then: "Alto (1000-4999)" },
              { case: { $lt: ["$_id", 10000] }, then: "Muy Alto (5000-9999)" }
            ],
            default: "Premium (10000+)"
          }
        },
        count: 1,
        avg_price: { $round: ["$avg_price", 2] },
        avg_rating: { $round: ["$avg_rating", 2] },
        min_price: { $round: ["$min_price", 2] },
        max_price: { $round: ["$max_price", 2] },
        sample_products: { $slice: ["$products", 3] }
      }
    },
    { $sort: { "avg_price": 1 } }
  ]);

  // Guardar resultados
  const bucketCollection = db.bucket_precios;
  bucketCollection.drop();
  
  let bucketCount = 0;
  bucketPrecios.forEach(doc => {
    bucketCollection.insertOne(doc);
    bucketCount++;
  });
  
  print(`✅ Pipeline 3 completado: ${bucketCount} documentos en 'bucket_precios'`);
  print("📋 Distribución por precio:");
  db.bucket_precios.find().forEach(printjson);
  
} catch (e) {
  print("❌ Error en Pipeline 3: " + e.message);
}

// ============================================
// RESUMEN FINAL
// ============================================
print("\n" + "=".repeat(60));
print("📊 RESUMEN DE AGREGACIONES EJECUTADAS");
print("=".repeat(60));

print("\n📈 Colecciones creadas:");
print(`1. ventas_analytics: ${db.ventas_analytics.countDocuments()} documentos`);
print(`2. top_productos: ${db.top_productos.countDocuments()} documentos`);
print(`3. bucket_precios: ${db.bucket_precios.countDocuments()} documentos`);

print("\n🎯 Insights obtenidos:");
const totalVentas = db.ventas_analytics.aggregate([
  { $group: { _id: null, total: { $sum: "$totalSales" } } }
]).next();
print(`• Total ventas analizadas: $${totalVentas ? totalVentas.total.toFixed(2) : "0.00"}`);

const topCategoria = db.ventas_analytics.findOne({}, { sort: { totalSales: -1 } });
print(`• Categoría más vendida: ${topCategoria ? topCategoria.category : "N/A"}`);

const priceDist = db.bucket_precios.find().sort({ count: -1 }).limit(1).next();
print(`• Rango de precio con más productos: ${priceDist ? priceDist.price_range : "N/A"}`);

print("\n🚀 Todos los pipelines ejecutados exitosamente!");
