import prisma from "../src/lib/prisma";

async function fix() {
    const existing = await prisma.voucherCounter.findUnique({ where: { id: "global" } });
    if (!existing) {
        await prisma.voucherCounter.create({ data: { id: "global", lastIssue: 0, lastReceipt: 0 } });
        console.log("VoucherCounter created ✅");
    } else {
        console.log("VoucherCounter already exists:", existing);
    }
    await prisma.$disconnect();
}
fix();
