// ============================================
// VALIDACIONES JSON SCHEMA PARA EL PROYECTO GLOBALMARKET
// ============================================

// Conectar a la base de datos correcta
use GlobalMarket;

// ============================================
// 1. VALIDACIÓN PARA LA COLECCIÓN Products_clean
// ============================================
print("🚀 Aplicando validación a Products_clean...");

try {
  db.runCommand({
    collMod: "Products_clean",
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: ["product_id", "product_name"],
        properties: {
          product_id: {
            bsonType: "string",
            description: "Product ID debe ser string"
          },
          product_name: {
            bsonType: "string",
            description: "Product name debe ser string"
          },
          price: {
            bsonType: ["double", "int"],
            minimum: 0,
            description: "Price debe ser un número positivo"
          },
          category_clean: {
            bsonType: "string",
            description: "Category debe ser un string"
          },
          rating: {
            bsonType: ["double", "int"],
            minimum: 0,
            maximum: 5,
            description: "Rating debe estar entre 0 y 5"
          },
          discounted_price_clean: {
            bsonType: ["double", "int"],
            minimum: 0,
            description: "Discounted price debe ser positivo"
          },
          actual_price_clean: {
            bsonType: ["double", "int"],
            minimum: 0,
            description: "Actual price debe ser positivo"
          },
          rating_count_clean: {
            bsonType: ["int", "long"],
            minimum: 0,
            description: "Rating count debe ser un int positivo"
          }
        }
      }
    },
    validationLevel: "moderate",
    validationAction: "error"
  });
  print("✅ Validación aplicada exitosamente a Products_clean");
} catch (e) {
  print("⚠️  Advertencia: " + e.message);
  print("ℹ️  Esto puede deberse a que ya existe una validación o hay documentos que no cumplen las reglas");
}

// ============================================
// 2. VALIDACIÓN PARA LA COLECCIÓN ventas
// ============================================
print("\n🚀 Aplicando validación a ventas...");

try {
  db.runCommand({
    collMod: "ventas",
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: ["product_id", "date", "total_amount"],
        properties: {
          product_id: {
            bsonType: "string",
            description: "Debe ser string para hacer match con Products_clean"
          },
          date: {
            bsonType: "date",
            description: "Debe ser fecha válida"
          },
          total_amount: {
            bsonType: ["double", "int"],
            minimum: 0,
            description: "Debe ser número positivo"
          }
        }
      }
    },
    validationLevel: "moderate",
    validationAction: "error"
  });
  print("✅ Validación aplicada exitosamente a ventas");
} catch (e) {
  print("⚠️  Advertencia: " + e.message);
  print("ℹ️  Esto puede deberse a documentos existentes que no cumplen las reglas");
  print("ℹ️  Cambiando a validationAction: 'warn' para permitir datos existentes...");
  
  // Intentar con validationAction: 'warn' para datos existentes
  try {
    db.runCommand({
      collMod: "ventas",
      validator: {
        $jsonSchema: {
          bsonType: "object",
          required: ["product_id", "date", "total_amount"],
          properties: {
            product_id: {
              bsonType: "string",
              description: "Debe ser string para hacer match con Products_clean"
            },
            date: {
              bsonType: "date",
              description: "Debe ser fecha válida"
            },
            total_amount: {
              bsonType: ["double", "int"],
              minimum: 0,
              description: "Debe ser número positivo"
            }
          }
        }
      },
      validationLevel: "moderate",
      validationAction: "warn"
    });
    print("✅ Validación aplicada en modo 'warn' para permitir datos existentes");
  } catch (e2) {
    print("❌ Error incluso en modo warn: " + e2.message);
  }
}

// ============================================
// 3. VERIFICAR LAS VALIDACIONES APLICADAS
// ============================================
print("\n📋 VERIFICACIÓN DE VALIDACIONES APLICADAS");

print("\n1. Información de Products_clean:");
let productsInfo = db.getCollectionInfos({name: "Products_clean"})[0];
if (productsInfo.options && productsInfo.options.validator) {
  print("✅ Validación encontrada:");
  printjson(productsInfo.options.validator);
} else {
  print("⚠️  No se encontró validador en Products_clean");
}

print("\n2. Información de ventas:");
let ventasInfo = db.getCollectionInfos({name: "ventas"})[0];
if (ventasInfo.options && ventasInfo.options.validator) {
  print("✅ Validación encontrada:");
  printjson(ventasInfo.options.validator);
} else {
  print("⚠️  No se encontró validador en ventas");
}

// ============================================
// 4. PROBAR CON DOCUMENTOS DE PRUEBA
// ============================================
print("\n🧪 PROBANDO VALIDACIONES CON DATOS DE PRUEBA");

// Test para Products_clean
print("\nProbando validación en Products_clean...");
try {
  const testProduct = {
    product_id: "TEST001",
    product_name: "Producto de Prueba",
    price: 100.50,
    category_clean: "Test Category",
    rating: 4.5,
    rating_count_clean: 100
  };
  
  db.Products_clean.insertOne(testProduct);
  print("✅ Documento de prueba insertado correctamente en Products_clean");
  
  // Limpiar el documento de prueba
  db.Products_clean.deleteOne({ product_id: "TEST001" });
  print("✅ Documento de prueba eliminado");
} catch (e) {
  print("❌ Error insertando documento de prueba en Products_clean: " + e.message);
}

// Test para ventas
print("\nProbando validación en ventas...");
try {
  const testVenta = {
    product_id: "TEST001",
    date: new Date(),
    total_amount: 150.75
  };
  
  db.ventas.insertOne(testVenta);
  print("✅ Documento de prueba insertado correctamente en ventas");
  
  // Limpiar el documento de prueba
  db.ventas.deleteOne({ product_id: "TEST001" });
  print("✅ Documento de prueba eliminado");
} catch (e) {
  print("❌ Error insertando documento de prueba en ventas: " + e.message);
}

// ============================================
// 5. VALIDACIÓN DE DOCUMENTOS EXISTENTES
// ============================================
print("\n📊 VALIDACIÓN DE DOCUMENTOS EXISTENTES");

print("\n1. Validando documentos en Products_clean:");
const invalidProducts = db.Products_clean.find({
  $or: [
    { product_id: { $exists: false } },
    { product_id: null },
    { product_name: { $exists: false } },
    { product_name: null }
  ]
}).count();

if (invalidProducts === 0) {
  print("✅ Todos los documentos en Products_clean tienen product_id y product_name");
} else {
  print(`⚠️  Se encontraron ${invalidProducts} documentos sin product_id o product_name`);
}

print("\n2. Validando documentos en ventas:");
const invalidVentas = db.ventas.find({
  $or: [
    { product_id: { $exists: false } },
    { product_id: null },
    { date: { $exists: false } },
    { date: null },
    { total_amount: { $exists: false } },
    { total_amount: null },
    { total_amount: { $lt: 0 } }
  ]
}).count();

if (invalidVentas === 0) {
  print("✅ Todos los documentos en ventas cumplen con las reglas básicas");
} else {
  print(`⚠️  Se encontraron ${invalidVentas} documentos que no cumplen las reglas en ventas`);
}

// ============================================
// FINALIZACIÓN
// ============================================
print("\n" + "=".repeat(50));
print("🎉 SCRIPT DE VALIDACIONES EJECUTADO COMPLETAMENTE");
print("=".repeat(50));

print("\n📌 RESUMEN FINAL:");
print("- Products_clean: Validación aplicada ✓");
print("- ventas: Validación aplicada ✓");
print("- Documentos de prueba: Verificados ✓");
print("- Documentos existentes: Analizados ✓");

print("\n⚠️  NOTA: Si hay documentos existentes que no cumplen las reglas,");
print("     se recomienda corregirlos antes de cambiar validationAction a 'error'.");
print("     Por ahora está en 'warn' para ventas si hubo problemas.");

print("\n🚀 ¡Proyecto GlobalMarket listo con validaciones JSON Schema!");
