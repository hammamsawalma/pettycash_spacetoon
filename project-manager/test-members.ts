import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const proj = await prisma.project.findFirst({
    where: { name: 'E2E Test Project - V2 Expenses' },
    include: { members: { include: { user: true } } }
  });
  console.log(JSON.stringify(proj, null, 2));
}
main();
