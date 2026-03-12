const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const custodies = await prisma.employeeCustody.findMany({
    where: { isExternal: true },
    select: { externalName: true }
  });
  console.log("External Custodies:");
  console.table(custodies);
}

main().finally(() => prisma.$disconnect());
