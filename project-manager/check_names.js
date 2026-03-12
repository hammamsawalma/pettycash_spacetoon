const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: { name: true, jobTitle: true, email: true }
  });
  console.table(users);
}

main().finally(() => prisma.$disconnect());
