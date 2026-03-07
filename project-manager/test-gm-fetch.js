const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  const isUnrestricted = true; // GM
  const session_id = "gm-id"; // We don't even need it if unrestricted

  console.log("Fetching purchases...");
  const purchases = await prisma.purchase.findMany({
      where: {
          isDeleted: false,
          ...(!isUnrestricted
              ? { project: { OR: [{ managerId: session_id }, { members: { some: { userId: session_id } } }] } }
              : {})
      },
  });
  console.log(`Purchases found: ${purchases.length}`);

  console.log("Fetching invoices...");
  const invoices = await prisma.invoice.findMany({
      where: {
          isDeleted: false,
          ...(!isUnrestricted
              ? { project: { OR: [{ managerId: session_id }, { members: { some: { userId: session_id } } }] } }
              : {})
      },
  });
  console.log(`Invoices found: ${invoices.length}`);
}

test().catch(console.error).finally(() => prisma.$disconnect());
