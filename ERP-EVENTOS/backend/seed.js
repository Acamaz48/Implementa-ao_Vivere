const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ==========================================
// 1. MASSAS DE DADOS BRUTAS (Sanitizadas internamente)
// ==========================================

const rawInventory = [
  // Q30
  { category: "Q30", material: "TRELIÇA 10CM", qty: "21" },
  { category: "Q30", material: "TRELIÇA 20CM", qty: "94" },
  { category: "Q30", material: "TRELIÇA 30CM", qty: "82" },
  { category: "Q30", material: "TRELIÇA 40CM", qty: "67" },
  { category: "Q30", material: "TRELIÇA 50CM", qty: "71" },
  { category: "Q30", material: "TRELIÇA 60CM", qty: "16" },
  { category: "Q30", material: "TRELIÇA 1M", qty: "113" },
  { category: "Q30", material: "TRELIÇA 1.35M", qty: "5" },
  { category: "Q30", material: "TRELIÇA 1.5M", qty: "133" },
  { category: "Q30", material: "TRELIÇA 1.60M", qty: "17" },
  { category: "Q30", material: "TRELIÇA 2M", qty: "220" },
  { category: "Q30", material: "TRELIÇA 2.5M", qty: "13" },
  { category: "Q30", material: "TRELIÇA 2.90M", qty: "11" },
  { category: "Q30", material: "TRELIÇA 3M", qty: "248" },
  { category: "Q30", material: "TRELIÇA 4M", qty: "224" },
  { category: "Q30", material: "TRELIÇA 5M", qty: "300" },
  { category: "Q30", material: "TRELIÇA 6M", qty: "18" },
  { category: "Q30", material: "CUBO Q30", qty: "412" },
  { category: "Q30", material: "SLEEVE Q30", qty: "88" },
  { category: "Q30", material: "BASE 130", qty: "93" },
  { category: "Q30", material: "ÂNGULO Q30", qty: "137" },
  { category: "Q30", material: "CUMIEIRA Q30", qty: "80" },
  { category: "Q30", material: "PAU DE CARGA Q30", qty: "93" },
  // Q15, Q25, Q50
  { category: "Q15", material: "TRELIÇA 1M", qty: "8" },
  { category: "Q25", material: "TRELIÇA 2M", qty: "15" },
  { category: "Q50", material: "TRELIÇA 3M", qty: "22" },
  // Pisos e Estruturas
  { category: "PISO", material: "TABLADO", qty: "965" },
  { category: "PISO", material: "PRATICÁVEL", qty: "141" },
  { category: "PISO", material: "ESTRUTURADO", qty: "1506" },
  { category: "PISO QUADRO", material: "REGULAD. ALTURA", qty: "210" }, // 🔥 Correção da quebra de linha da planilha
  { category: "PISO ESTRUTURADO", material: "GUARDACORPO 1.25", qty: "" }, // 🔥 Tratamento de valor vazio
  { category: "PISO ESTRUTURADO", material: "PE DE 20CM", qty: "90" },
  { category: "PISO ESTRUTURADO", material: "PE DE 40CM", qty: "82" },
  { category: "PISO ESTRUTURADO", material: "PE DE 70CM", qty: "78" },
  { category: "PISO ESTRUTURADO", material: "PE DE 1.35M", qty: "295" },
  // Lonas com a expressão matemática original
  { category: "LONAS", material: "LONA 3X3", qty: "33" },
  { category: "LONAS", material: "LONA GALPÃO 10X5", qty: "14 + 9" }, // 🔥 String complexa detetada
  // Outros
  { category: "OUTROS", material: "CACHORRO CANTO", qty: "200" },
  { category: "OUTROS", material: "ESTRELA", qty: "64" },
  { category: "OUTROS", material: "TALHA", qty: "84" },
  { category: "OUTROS", material: "CINTA CARGA", qty: "94" },
  { category: "OUTROS", material: "PARAFUSO Q30", qty: "5300" }
];

// Estruturas de Kits (Ex: Tendas e Palcos compostos)
const rawStructures = [
  {
    type: "Tendas",
    structureName: "TENDA 3X3",
    components: [
      { materialName: "CACHORRO CANTO 3x3", qty: 4 }, // Precisa de de-para para "CACHORRO CANTO"
      { materialName: "ESTRELA 3x3", qty: 1 },        // Precisa de de-para para "ESTRELA"
      { materialName: "LONA 3X3", qty: 1 },
      { materialName: "PARAFUSO Q30", qty: 20 }
    ]
  },
  {
    type: "Galpões",
    structureName: "GALPÃO 10X10 COM 3 ALTURA",
    components: [
      { materialName: "TRELIÇA 5M", qty: 10 },
      { materialName: "CUMIEIRA Q30", qty: 3 },
      { materialName: "LONA GALPÃO 10X5", qty: 2 }
    ]
  }
];

// ==========================================
// 2. DICIONÁRIO DE EQUIVALÊNCIA (DE-PARA)
// Resolve a incompatibilidade de nomes sem mexer no banco
// ==========================================
const materialNameMapping = {
  "CACHORRO CANTO 3X3": "CACHORRO CANTO",
  "ESTRELA 3X3": "ESTRELA",
  "TRELIÇA 5M ALTURA": "TRELIÇA 5M",
  "TRELIÇA 30 CENTÍMENTROS": "TRELIÇA 30CM",
  "TRELIÇA 40 CENTÍMENTROS": "TRELIÇA 40CM",
  "CUBO": "CUBO Q30",
  "SLEEVE": "SLEEVE Q30",
  "BASE": "BASE 130",
  "PAU DE CARGA": "PAU DE CARGA Q30",
  "CINTA DE CARGA": "CINTA CARGA",
  "PARAFUSO": "PARAFUSO Q30"
};

// ==========================================
// 3. FUNÇÕES AUXILIARES DE PARSING DEFENSIVO
// ==========================================
function parseQuantity(qtyString) {
  if (!qtyString || qtyString.trim() === "") return 0;
  
  // Trata expressões matemáticas como "14 + 9"
  if (qtyString.includes("+")) {
    return qtyString.split("+")
      .map(part => parseInt(part.trim(), 10))
      .reduce((acc, curr) => acc + (isNaN(curr) ? 0 : curr), 0);
  }
  
  const parsed = parseInt(qtyString.trim(), 10);
  return isNaN(parsed) ? 0 : parsed;
}

function normalizeName(name) {
  const upper = name.trim().toUpperCase();
  return materialNameMapping[upper] || upper;
}

// ==========================================
// 4. FLUXO PRINCIPAL DE EXECUÇÃO (MAIN LOGIC)
// ==========================================
async function main() {
  console.log("🚀 Iniciando carga de dados para homologação (Vivere SCOS)...");

  // Mapeadores em memória para evitar queries repetidas dentro de loops (Anti-pattern de performance)
  const categoryMap = new Map();
  const materialMap = new Map();

  // STAGE 1: Carga de Categorias e Materiais (Inventário Geral)
  console.log("📦 Inserindo categorias e catálogo de materiais...");
  
  for (const item of rawInventory) {
    const normalizedCatName = item.category.trim().toUpperCase();
    const normalizedMatName = normalizeName(item.material);
    const sanitizedQty = parseQuantity(item.qty);

    // Garante a Categoria (Upsert para evitar erros de constraint única)
    if (!categoryMap.has(normalizedCatName)) {
      const categoryObj = await prisma.materialCategory.upsert({
        where: { name: normalizedCatName },
        update: {},
        create: { name: normalizedCatName }
      });
      categoryMap.set(normalizedCatName, categoryObj.id);
    }

    const categoryId = categoryMap.get(normalizedCatName);

    // Garante o Material vinculado à categoria
    const materialObj = await prisma.material.upsert({
      where: {
        name_categoryId: {
          name: normalizedMatName,
          categoryId: categoryId
        }
      },
      update: {
        stock: sanitizedQty // Atualiza o estoque com a massa sanitizada
      },
      create: {
        name: normalizedMatName,
        categoryId: categoryId,
        stock: sanitizedQty
      }
    });

    // Registra no mapa global para uso no mapeamento de estruturas abaixo
    materialMap.set(normalizedMatName, materialObj.id);
  }
  console.log(`✅ ${rawInventory.length} Materiais processados/sincronizados com sucesso.`);

  // STAGE 2: Carga de Engenharia de Estruturas (Kits / Composição)
  console.log("🏗️ Processando definições de Estruturas e Templates de Kits...");

  for (const struct of rawStructures) {
    // 2.1 Garante o Tipo de Estrutura (Ex: Tendas)
    const structTypeObj = await prisma.structureType.upsert({
      where: { name: struct.type.toUpperCase() },
      update: {},
      create: { name: struct.type.toUpperCase() }
    });

    // 2.2 Cria a Estrutura Base
    // Nota: Como não há índice único direto para nome no schema fornecido, usamos findFirst ou create puro.
    let structureObj = await prisma.structure.findFirst({
      where: { name: struct.structureName, structureTypeId: structTypeObj.id }
    });

    if (!structureObj) {
      structureObj = await prisma.structure.create({
        data: {
          name: struct.structureName,
          structureTypeId: structTypeObj.id
        }
      });
    }

    // 2.3 Vincula os itens à estrutura (StructureMaterialTemplate)
    for (const comp of struct.components) {
      const targetMaterialName = normalizeName(comp.materialName);
      const materialId = materialMap.get(targetMaterialName);

      if (!materialId) {
        console.warn(`⚠️ [LOGÍSTICA] Material referenciado no kit não encontrado no inventário: "${comp.materialName}" (Normalizado como: "${targetMaterialName}"). Pulando relacionamento.`);
        continue;
      }

      await prisma.structureMaterialTemplate.upsert({
        where: {
          structureId_materialId: {
            structureId: structureObj.id,
            materialId: materialId
          }
        },
        update: {
          quantity: comp.qty
        },
        create: {
          structureId: structureObj.id,
          materialId: materialId,
          quantity: comp.qty
        }
      });
    }
  }

  console.log("🎉 Massa de dados carregada com sucesso. Pronto para execução de testes de picking/separação!");
}

main()
  .catch((e) => {
    console.error("🚨 Erro crítico catastrófico na pipeline de seed:");
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });