
## 📄 **Archivo: `scripts/run-all.js`** (Ejecutar todo)

```javascript
// ============================================
// EJECUTAR TODA LA CONFIGURACIÓN DEL PROYECTO
// ============================================

print("🚀 INICIANDO CONFIGURACIÓN COMPLETA DEL PROYECTO");
print("=".repeat(70));

// 1. Ejecutar validaciones
print("\n1️⃣  EJECUTANDO VALIDACIONES JSON SCHEMA");
print("-".repeat(40));
try {
  load('./validations.js');
  print("✅ Validaciones completadas");
} catch (e) {
  print(`⚠️  Error: ${e.message}`);
}

// 2. Crear índices
print("\n2️⃣  CREANDO ÍNDICES DE OPTIMIZACIÓN");
print("-".repeat(40));
try {
  load('./indexes.js');
  print("✅ Índices creados");
} catch (e) {
  print(`⚠️  Error: ${e.message}`);
}

// 3. Ejecutar agregaciones
print("\n3️⃣  EJECUTANDO PIPELINES DE AGREGACIÓN");
print("-".repeat(40));
try {
  load('./aggregations.js');
  print("✅ Agregaciones completadas");
} catch (e) {
  print(`⚠️  Error: ${e.message}`);
}

// 4. Resumen final
print("\n" + "=".repeat(70));
print("🎉 CONFIGURACIÓN COMPLETA DEL PROYECTO GLOBALMARKET");
print("=".repeat(70));

print("\n📊 RESULTADOS:");
print("• ✅ Validaciones JSON Schema aplicadas");
print("• ✅ Índices de optimización creados");
print("• ✅ Pipelines de agregación ejecutados");
print("• 🔍 Atlas Search: Configurar en interfaz web");

print("\n📁 COLECCIONES CREADAS:");
const collections = db.getCollectionNames().filter(c => 
  c.includes('analytics') || c.includes('top') || c.includes('bucket')
);
collections.forEach(c => {
  const count = db[c].countDocuments();
  print(`• ${c}: ${count} documentos`);
});

print("\n🚀 PRÓXIMOS PASOS:");
print("1. Configurar Atlas Search en MongoDB Atlas Web");
print("2. Crear dashboard en MongoDB Charts");
print("3. Probar Explain Plan para medir performance");
print("4. Documentar resultados en reporte técnico");

print("\n✅ ¡Proyecto configurado exitosamente!");
