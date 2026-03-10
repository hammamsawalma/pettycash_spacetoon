/**
 * Migration Script: Link existing production data to Qatar branch
 * Run ONCE after deploying the schema changes.
 * 
 * Usage: npx tsx prisma/migrate-branches.ts
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function migrateBranches() {
    console.log('🌍 Starting branch migration...\n');

    // 1. Create all branches
    const branches = [
        { name: 'قطر', code: 'QA', currency: 'QAR', country: 'Qatar', flag: '🇶🇦' },
        { name: 'الإمارات', code: 'AE', currency: 'AED', country: 'UAE', flag: '🇦🇪' },
        { name: 'السعودية', code: 'SA', currency: 'SAR', country: 'Saudi Arabia', flag: '🇸🇦' },
        { name: 'البحرين', code: 'BH', currency: 'BHD', country: 'Bahrain', flag: '🇧🇭' },
        { name: 'سوريا', code: 'SY', currency: 'SYP', country: 'Syria', flag: '🇸🇾' },
        { name: 'تركيا', code: 'TR', currency: 'TRY', country: 'Turkey', flag: '🇹🇷' },
    ];

    for (const b of branches) {
        const existing = await prisma.branch.findUnique({ where: { code: b.code } });
        if (!existing) {
            await prisma.branch.create({ data: b });
            console.log(`  ✅ Created branch: ${b.flag} ${b.name}`);
        } else {
            console.log(`  ⏭️  Branch already exists: ${b.flag} ${b.name}`);
        }
    }

    // 2. Get Qatar branch ID
    const qaBranch = await prisma.branch.findUnique({ where: { code: 'QA' } });
    if (!qaBranch) throw new Error('Qatar branch not found!');
    console.log(`\n📌 Default branch: ${qaBranch.flag} ${qaBranch.name} (${qaBranch.id})\n`);

    // 3. Link all users without branchId to Qatar (except ROOT)
    const usersUpdated = await prisma.user.updateMany({
        where: { branchId: null, role: { not: 'ROOT' } },
        data: { branchId: qaBranch.id },
    });
    console.log(`  👤 ${usersUpdated.count} users linked to Qatar`);

    // 4. Link all projects without branchId to Qatar
    const projectsUpdated = await prisma.project.updateMany({
        where: { branchId: null },
        data: { branchId: qaBranch.id },
    });
    console.log(`  🏗️  ${projectsUpdated.count} projects linked to Qatar`);

    // 5. Link all wallets without branchId to Qatar
    const walletsUpdated = await prisma.companyWallet.updateMany({
        where: { branchId: null },
        data: { branchId: qaBranch.id },
    });
    console.log(`  💰 ${walletsUpdated.count} wallets linked to Qatar`);

    // 6. Create ROOT user if not exists
    const rootExists = await prisma.user.findFirst({ where: { role: 'ROOT' } });
    if (!rootExists) {
        const hashed = await bcrypt.hash('root@spacetoon2026', 10);
        await prisma.user.create({
            data: {
                name: 'IT',
                email: 'root@pocket.com',
                phone: '0500000000',
                password: hashed,
                role: 'ROOT',
                jobTitle: 'IT',
            },
        });
        console.log(`  🔑 ROOT user created (root@pocket.com)`);
    } else {
        console.log(`  ⏭️  ROOT user already exists`);
    }

    console.log('\n✅ Migration complete!\n');
}

migrateBranches()
    .catch((e) => {
        console.error('❌ Migration failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
