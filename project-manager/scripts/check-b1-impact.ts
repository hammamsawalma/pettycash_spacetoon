/**
 * Data Integrity Check Script — B-1 Bug Impact
 * 
 * B-1: Finance requests with type SETTLE_DEBT that were APPROVED
 * before the fix did NOT deduct from the company wallet.
 * 
 * This script finds such records and calculates the total missing deductions.
 * 
 * Run: npx ts-node --compiler-options '{"module":"commonjs"}' scripts/check-b1-impact.ts
 * Or:  npx tsx scripts/check-b1-impact.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkB1Impact() {
    console.log('═══════════════════════════════════════════════════');
    console.log('  B-1 Bug Impact Analysis');
    console.log('═══════════════════════════════════════════════════');

    // Step 1: Find all approved SETTLE_DEBT finance requests
    const settleDebtRequests = await prisma.financeRequest.findMany({
        where: {
            type: 'SETTLE_DEBT',
            status: 'APPROVED',
        },
        include: {
            requester: { select: { name: true } },
        },
        orderBy: { resolvedAt: 'asc' },
    });

    if (settleDebtRequests.length === 0) {
        console.log('\n✅ No SETTLE_DEBT finance requests found. No B-1 impact.');
        await prisma.$disconnect();
        return;
    }

    console.log(`\nFound ${settleDebtRequests.length} approved SETTLE_DEBT finance requests.\n`);

    let totalMissingDeductions = 0;
    const missingEntries: { requestId: string; debtId: string; amount: number; date: string }[] = [];

    for (const req of settleDebtRequests) {
        if (!req.targetId) continue;

        // Check if corresponding wallet entry exists
        const walletEntry = await prisma.walletEntry.findFirst({
            where: {
                type: 'SETTLE_DEBT',
                note: { contains: 'طلب مالي' },
                createdAt: {
                    gte: new Date((req.resolvedAt || req.createdAt).getTime() - 60000), // 1 min tolerance
                    lte: new Date((req.resolvedAt || req.createdAt).getTime() + 60000),
                },
            },
        });

        if (!walletEntry) {
            // Also check for direct settleDebt wallet entry (without "طلب مالي")
            const directEntry = await prisma.walletEntry.findFirst({
                where: {
                    type: 'SETTLE_DEBT',
                    createdAt: {
                        gte: new Date((req.resolvedAt || req.createdAt).getTime() - 60000),
                        lte: new Date((req.resolvedAt || req.createdAt).getTime() + 60000),
                    },
                },
            });

            if (!directEntry) {
                // This was affected by B-1
                const debt = await prisma.outOfPocketDebt.findUnique({
                    where: { id: req.targetId },
                });
                if (debt) {
                    totalMissingDeductions += debt.amount;
                    missingEntries.push({
                        requestId: req.id,
                        debtId: req.targetId,
                        amount: debt.amount,
                        date: (req.resolvedAt || req.createdAt).toISOString().split('T')[0],
                    });
                    console.log(`  🔴 Request ${req.id.substring(0, 8)} — Debt ${debt.amount.toLocaleString()} — ${(req.resolvedAt || req.createdAt).toISOString().split('T')[0]}`);
                }
            }
        }
    }

    console.log('\n═══════════════════════════════════════════════════');
    if (missingEntries.length === 0) {
        console.log('✅ No missing wallet deductions found. Data is clean.');
    } else {
        console.log(`🔴 Found ${missingEntries.length} missing wallet deductions`);
        console.log(`   Total missing: ${totalMissingDeductions.toLocaleString()} SAR`);
        console.log('\n   To repair, the wallet balance should be decremented by this amount.');
        console.log('   Run the repair script after confirming these numbers.');
    }

    // Step 2: Cross-check wallet balance
    const wallet = await prisma.companyWallet.findFirst();
    if (wallet) {
        const entries = await prisma.walletEntry.findMany();
        let calculatedBalance = 0;
        for (const entry of entries) {
            if (['DEPOSIT', 'RETURN_FROM_PROJECT', 'RETURN'].includes(entry.type)) {
                calculatedBalance += entry.amount;
            } else {
                calculatedBalance -= entry.amount;
            }
        }
        console.log(`\n── Wallet Balance Cross-Check ──`);
        console.log(`   Stored balance:     ${wallet.balance.toLocaleString()}`);
        console.log(`   Calculated balance: ${calculatedBalance.toLocaleString()}`);
        console.log(`   Difference:         ${(wallet.balance - calculatedBalance).toLocaleString()}`);
        if (Math.abs(wallet.balance - calculatedBalance) > 0.01) {
            console.log(`   ⚠️  Balance mismatch detected!`);
        } else {
            console.log(`   ✅ Balances match.`);
        }
    }

    console.log('═══════════════════════════════════════════════════');
    await prisma.$disconnect();
}

checkB1Impact().catch(console.error);
