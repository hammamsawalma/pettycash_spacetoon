/**
 * Edge Case Data Check — Custody Role Fix
 * 
 * Checks for:
 * 1. Custodies issued to PROJECT_MANAGER-only members (no PROJECT_EMPLOYEE role)
 * 2. Wallet balance cross-check
 * 3. Orphaned custodies
 * 
 * Run: npx tsx scripts/check-custody-edge-cases.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkCustodyEdgeCases() {
    console.log('═══════════════════════════════════════════════════');
    console.log('  Custody Role Fix — Edge Case Data Check');
    console.log('═══════════════════════════════════════════════════\n');

    // 1. Find custodies issued to coordinator-only members
    console.log('── Check 1: Custodies to coordinator-only members ──');
    const allCustodies = await prisma.employeeCustody.findMany({
        include: {
            employee: { select: { id: true, name: true, email: true } },
            project: { select: { id: true, name: true } },
        }
    });

    let coordinatorOnlyCustodies = 0;
    let coordinatorOnlyTotal = 0;
    let coordinatorOnlyBalance = 0;

    for (const custody of allCustodies) {
        // Skip external custodies
        if ((custody as any).isExternal) continue;

        const membership = await prisma.projectMember.findUnique({
            where: {
                projectId_userId: {
                    projectId: custody.projectId,
                    userId: custody.employeeId
                }
            }
        });

        if (membership) {
            const roles = (membership.projectRoles || "PROJECT_EMPLOYEE").split(",");
            const isEmployeeInProject = roles.includes("PROJECT_EMPLOYEE");

            if (!isEmployeeInProject) {
                coordinatorOnlyCustodies++;
                coordinatorOnlyTotal += custody.amount;
                coordinatorOnlyBalance += custody.balance;
                console.log(`  🔴 Custody ${custody.id.substring(0, 8)}...`);
                console.log(`     Employee: ${custody.employee.name} (${custody.employee.email})`);
                console.log(`     Project:  ${custody.project.name}`);
                console.log(`     Amount:   ${custody.amount.toLocaleString()} | Balance: ${custody.balance.toLocaleString()}`);
                console.log(`     Roles:    ${membership.projectRoles}`);
                console.log('');
            }
        } else {
            // Member no longer in the project but has custody
            console.log(`  ⚠️  Custody ${custody.id.substring(0, 8)}... — employee ${custody.employee.name} is NO LONGER a member of ${custody.project.name}`);
            console.log(`     Amount: ${custody.amount.toLocaleString()} | Balance: ${custody.balance.toLocaleString()}`);
            console.log('');
        }
    }

    if (coordinatorOnlyCustodies === 0) {
        console.log('  ✅ No custodies issued to coordinator-only members.\n');
    } else {
        console.log(`  🔴 Found ${coordinatorOnlyCustodies} custodies to coordinator-only members`);
        console.log(`     Total amount: ${coordinatorOnlyTotal.toLocaleString()}`);
        console.log(`     Total remaining balance: ${coordinatorOnlyBalance.toLocaleString()}\n`);
    }

    // 2. Summary stats
    console.log('── Check 2: Custody Stats ──');
    const totalCustodies = allCustodies.length;
    const openCustodies = allCustodies.filter(c => c.balance > 0 && !c.isClosed);
    const totalIssued = allCustodies.reduce((s, c) => s + c.amount, 0);
    const totalBalance = allCustodies.reduce((s, c) => s + c.balance, 0);

    console.log(`  Total custodies:     ${totalCustodies}`);
    console.log(`  Open (balance > 0):  ${openCustodies.length}`);
    console.log(`  Total issued:        ${totalIssued.toLocaleString()}`);
    console.log(`  Total balance:       ${totalBalance.toLocaleString()}\n`);

    // 3. Cross-check project custody tracking
    console.log('── Check 3: Project Custody Tracking ──');
    const projects = await prisma.project.findMany({
        where: { isDeleted: false },
        select: { id: true, name: true, custodyIssued: true, custodyReturned: true }
    });

    for (const project of projects) {
        const projectCustodies = allCustodies.filter(c => c.projectId === project.id);
        const actualIssued = projectCustodies.reduce((s, c) => s + c.amount, 0);

        if (Math.abs(actualIssued - (project.custodyIssued ?? 0)) > 0.01) {
            console.log(`  ⚠️  ${project.name}: custodyIssued mismatch`);
            console.log(`     Stored: ${project.custodyIssued}  |  Actual: ${actualIssued}`);
        }
    }
    console.log('  ✅ Project tracking check complete.\n');

    console.log('═══════════════════════════════════════════════════');
    await prisma.$disconnect();
}

checkCustodyEdgeCases().catch(console.error);
