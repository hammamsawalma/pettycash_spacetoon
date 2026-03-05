import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    if (process.env.NODE_ENV === 'production') {
        console.error('⚠️  DANGER: Seeding disabled in production!');
        process.exit(1);
    }

    console.log('🧹 Clearing old data...');
    // Delete in dependency order
    await prisma.custodyReturn.deleteMany();
    await prisma.custodyConfirmation.deleteMany();
    await prisma.outOfPocketDebt.deleteMany();
    await prisma.invoiceItem.deleteMany();
    await prisma.invoice.deleteMany();
    await prisma.employeeCustody.deleteMany();
    await prisma.purchase.deleteMany();
    await prisma.message.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.projectMember.deleteMany();
    await prisma.project.deleteMany();
    await prisma.financeRequest.deleteMany();
    await prisma.autoApprovalRule.deleteMany();
    await prisma.walletEntry.deleteMany();
    await prisma.companyWallet.deleteMany();
    await prisma.deposit.deleteMany();
    await prisma.category.deleteMany();
    await prisma.user.deleteMany();

    console.log('✅ Old data cleared.');
    console.log('🌱 Seeding fresh data...\n');

    // ─── HASH PASSWORD ─────────────────────────────────────────────
    const hashed = await bcrypt.hash('123456', 10);

    // ─── USERS ─────────────────────────────────────────────────────
    console.log('👤 Creating users...');

    const admin = await prisma.user.create({
        data: {
            name: 'حمام صوالمة',
            email: 'admin@pocket.com',
            phone: '0500000001',
            password: hashed,
            role: 'ADMIN',
            jobTitle: 'مدير النظام',
            salary: 20000,
        },
    });

    const accountant = await prisma.user.create({
        data: {
            name: 'أحمد العلي',
            email: 'accountant@pocket.com',
            phone: '0500000002',
            password: hashed,
            role: 'GLOBAL_ACCOUNTANT',
            jobTitle: 'محاسب أول',
            salary: 9000,
        },
    });

    const coordinator = await prisma.user.create({
        data: {
            name: 'خالد يوسف',
            email: 'coordinator@pocket.com',
            phone: '0500000003',
            password: hashed,
            role: 'USER',
            jobTitle: 'منسق مشاريع',
            salary: 8000,
        },
    });

    const emp1 = await prisma.user.create({
        data: {
            name: 'محمد طارق',
            email: 'emp1@pocket.com',
            phone: '0500000004',
            password: hashed,
            role: 'USER',
            jobTitle: 'مطور برمجيات',
            salary: 6500,
        },
    });

    const emp2 = await prisma.user.create({
        data: {
            name: 'سارة أحمد',
            email: 'emp2@pocket.com',
            phone: '0500000005',
            password: hashed,
            role: 'USER',
            jobTitle: 'مصممة جرافيك',
            salary: 6000,
        },
    });

    const emp3 = await prisma.user.create({
        data: {
            name: 'فيصل ناصر',
            email: 'emp3@pocket.com',
            phone: '0500000006',
            password: hashed,
            role: 'USER',
            jobTitle: 'مدير موقع',
            salary: 5500,
        },
    });

    const gm = await prisma.user.create({
        data: {
            name: 'المدير العام',
            email: 'gm@pocket.com',
            phone: '0500000007',
            password: hashed,
            role: 'GENERAL_MANAGER',
            jobTitle: 'المدير العام',
            salary: 30000,
        },
    });

    console.log('✔ Users created: admin, accountant, coordinator, emp1, emp2, emp3, gm\n');

    // ─── COMPANY WALLET ────────────────────────────────────────────
    console.log('💰 Setting up company wallet...');
    const wallet = await prisma.companyWallet.create({
        data: { balance: 285000, totalIn: 300000, totalOut: 15000 },
    });

    await prisma.walletEntry.create({
        data: {
            walletId: wallet.id,
            type: 'DEPOSIT',
            amount: 300000,
            note: 'إيداع رأس المال الابتدائي للشركة',
            createdBy: admin.id,
        },
    });

    await prisma.walletEntry.create({
        data: {
            walletId: wallet.id,
            type: 'WITHDRAW',
            amount: 15000,
            note: 'مصاريف تشغيلية — استضافة وخوادم',
            createdBy: admin.id,
        },
    });

    console.log('✔ Wallet: 285,000 QAR balance\n');

    // ─── CATEGORIES ────────────────────────────────────────────────
    const catTravel = await prisma.category.create({ data: { name: 'تنقل ومواصلات', icon: '🚗' } });
    const catSupplies = await prisma.category.create({ data: { name: 'مستلزمات وأدوات', icon: '🧰' } });
    const catFood = await prisma.category.create({ data: { name: 'طعام وضيافة', icon: '🍽️' } });
    const catOther = await prisma.category.create({ data: { name: 'أخرى', icon: '📁' } });

    console.log('✔ Categories created\n');

    // ─── AUTO APPROVAL RULE ────────────────────────────────────────
    await prisma.autoApprovalRule.create({
        data: { maxAmount: 500, requiresManager: false, isActive: true },
    });
    console.log('✔ AutoApprovalRule: فواتير أقل من 500 ر.ق تُعتمد تلقائياً\n');

    // ─── PROJECT 1: IN_PROGRESS (نظام عقاري) ──────────────────────
    console.log('🏗️  Creating Project 1: نظام عقاري...');
    const proj1 = await prisma.project.create({
        data: {
            name: 'نظام إدارة عقارات',
            description: 'تطوير منصة إلكترونية شاملة لإدارة العقارات والإيجارات والعقود، مع لوحة تحكم للمالك وتطبيق جوال للمستأجرين.',
            status: 'IN_PROGRESS',
            startDate: new Date('2026-01-10'),
            endDate: new Date('2026-06-30'),
            managerId: admin.id,
            budgetAllocated: 80000,
            custodyIssued: 12000,
            custodyReturned: 2000,
        },
    });

    // تخصيص ميزانية من الخزنة
    await prisma.walletEntry.create({
        data: {
            walletId: wallet.id,
            type: 'ALLOCATE_TO_PROJECT',
            amount: 80000,
            note: `تخصيص ميزانية لمشروع: ${proj1.name}`,
            createdBy: admin.id,
        },
    });
    await prisma.companyWallet.update({ where: { id: wallet.id }, data: { balance: { decrement: 80000 }, totalOut: { increment: 80000 } } });

    // أعضاء المشروع 1
    const mem1_p1 = await prisma.projectMember.create({
        data: { projectId: proj1.id, userId: coordinator.id, projectRoles: 'COORDINATOR', custodyBalance: 0 },
    });
    const mem2_p1 = await prisma.projectMember.create({
        data: { projectId: proj1.id, userId: emp1.id, projectRoles: 'EMPLOYEE', custodyBalance: 7000 },
    });
    const mem3_p1 = await prisma.projectMember.create({
        data: { projectId: proj1.id, userId: emp2.id, projectRoles: 'EMPLOYEE', custodyBalance: 3000 },
    });

    // عهدة موظف 1 (مؤكدة)
    const cust1 = await prisma.employeeCustody.create({
        data: {
            projectId: proj1.id,
            employeeId: emp1.id,
            memberId: mem2_p1.id,
            amount: 9000,
            balance: 7000,
            method: 'CASH',
            isConfirmed: true,
            confirmedAt: new Date('2026-01-15'),
            note: 'عهدة للمصاريف الميدانية — المرحلة الأولى',
        },
    });
    await prisma.custodyConfirmation.create({
        data: { custodyId: cust1.id, signature: `CONF-${Date.now()}-EMP1` },
    });
    // إرجاع جزئي
    await prisma.custodyReturn.create({
        data: { custodyId: cust1.id, amount: 2000, returnedBy: emp1.id, recordedBy: admin.id, note: 'إرجاع المبلغ المتبقي من الأسبوع الماضي' },
    });

    // عهدة موظف 2 (غير مؤكدة)
    await prisma.employeeCustody.create({
        data: {
            projectId: proj1.id,
            employeeId: emp2.id,
            memberId: mem3_p1.id,
            amount: 3000,
            balance: 3000,
            method: 'BANK',
            isConfirmed: false,
            note: 'عهدة بنكية لشراء المستلزمات',
        },
    });

    // فواتير المشروع 1
    const inv1 = await prisma.invoice.create({
        data: {
            reference: 'INV-2026-001',
            type: 'مصروف ميداني',
            amount: 850,
            status: 'APPROVED',
            date: new Date('2026-01-20'),
            notes: 'تنقل لموقع العميل والعودة',
            projectId: proj1.id,
            creatorId: emp1.id,
            custodyId: cust1.id,
            paymentSource: 'CUSTODY',
            categoryId: catTravel.id,
            approvedBy: accountant.id,
        },
    });
    await prisma.invoiceItem.create({ data: { invoiceId: inv1.id, name: 'تكسي ذهاب وإياب', quantity: 2, unitPrice: 425, totalPrice: 850 } });

    const inv2 = await prisma.invoice.create({
        data: {
            reference: 'INV-2026-002',
            type: 'مستلزمات',
            amount: 1150,
            status: 'APPROVED',
            date: new Date('2026-01-25'),
            notes: 'شراء أدوات للموقع',
            projectId: proj1.id,
            creatorId: emp1.id,
            custodyId: cust1.id,
            paymentSource: 'CUSTODY',
            categoryId: catSupplies.id,
            approvedBy: accountant.id,
        },
    });
    await prisma.invoiceItem.create({ data: { invoiceId: inv2.id, name: 'أدوات تركيب', quantity: 5, unitPrice: 230, totalPrice: 1150 } });

    const inv3 = await prisma.invoice.create({
        data: {
            reference: 'INV-2026-003',
            type: 'طعام',
            amount: 320,
            status: 'PENDING',
            date: new Date('2026-02-01'),
            notes: 'وجبات فريق العمل في الموقع',
            projectId: proj1.id,
            creatorId: emp2.id,
            paymentSource: 'PERSONAL',
            categoryId: catFood.id,
        },
    });
    // دين شخصي من الفاتورة PERSONAL
    await prisma.outOfPocketDebt.create({
        data: { invoiceId: inv3.id, employeeId: emp2.id, amount: 320 },
    });

    const inv4 = await prisma.invoice.create({
        data: {
            reference: 'INV-2026-004',
            type: 'مصروف عام',
            amount: 670,
            status: 'REJECTED',
            date: new Date('2026-02-05'),
            notes: 'مصروف غير موثق بإيصال',
            rejectionReason: 'يرجى إرفاق الإيصال الأصلي أو صورة منه',
            projectId: proj1.id,
            creatorId: emp1.id,
            paymentSource: 'CUSTODY',
            categoryId: catOther.id,
            rejectedBy: accountant.id,
        },
    });
    // inv4 is created purely for UI demo, no further usage needed

    console.log('✔ Project 1 done\n');

    // ─── PROJECT 2: IN_PROGRESS (حملة تسويقية) ────────────────────
    console.log('🏗️  Creating Project 2: حملة تسويقية...');
    const proj2 = await prisma.project.create({
        data: {
            name: 'حملة تسويق رمضان 2026',
            description: 'إطلاق حملة إعلانية متكاملة عبر وسائل التواصل الاجتماعي خلال شهر رمضان المبارك 2026.',
            status: 'IN_PROGRESS',
            startDate: new Date('2026-02-15'),
            endDate: new Date('2026-04-15'),
            managerId: admin.id,
            budgetAllocated: 45000,
            custodyIssued: 8500,
            custodyReturned: 0,
        },
    });

    await prisma.walletEntry.create({
        data: {
            walletId: wallet.id,
            type: 'ALLOCATE_TO_PROJECT',
            amount: 45000,
            note: `تخصيص ميزانية لمشروع: ${proj2.name}`,
            createdBy: admin.id,
        },
    });
    await prisma.companyWallet.update({ where: { id: wallet.id }, data: { balance: { decrement: 45000 }, totalOut: { increment: 45000 } } });

    // أعضاء المشروع 2
    await prisma.projectMember.create({
        data: { projectId: proj2.id, userId: coordinator.id, projectRoles: 'COORDINATOR', custodyBalance: 0 },
    });
    const mem2_p2 = await prisma.projectMember.create({
        data: { projectId: proj2.id, userId: emp3.id, projectRoles: 'EMPLOYEE', custodyBalance: 8500 },
    });
    await prisma.projectMember.create({
        data: { projectId: proj2.id, userId: emp2.id, projectRoles: 'EMPLOYEE', custodyBalance: 0 },
    });

    // عهدة موظف 3 (مؤكدة، لا تزال مفتوحة)
    const cust2 = await prisma.employeeCustody.create({
        data: {
            projectId: proj2.id,
            employeeId: emp3.id,
            memberId: mem2_p2.id,
            amount: 8500,
            balance: 8500,
            method: 'CASH',
            isConfirmed: true,
            confirmedAt: new Date('2026-02-18'),
            note: 'ميزانية التصوير والإنتاج',
        },
    });
    await prisma.custodyConfirmation.create({
        data: { custodyId: cust2.id, signature: `CONF-${Date.now() + 1}-EMP3` },
    });

    // فاتورة معلقة للمشروع 2
    await prisma.invoice.create({
        data: {
            reference: 'INV-2026-005',
            type: 'تصوير وإنتاج',
            amount: 3200,
            status: 'PENDING',
            date: new Date('2026-02-22'),
            notes: 'جلسة تصوير منتجات الحملة',
            projectId: proj2.id,
            creatorId: emp3.id,
            custodyId: cust2.id,
            paymentSource: 'CUSTODY',
            categoryId: catSupplies.id,
        },
    });

    // طلب شراء
    await prisma.purchase.create({
        data: {
            orderNumber: 'PO-2026-001',
            description: 'شراء لوازم الديكور للتصوير',
            amount: 1800,
            status: 'REQUESTED',
            projectId: proj2.id,
            creatorId: coordinator.id,
            notes: 'يرجى شراء الديكورات من متجر الإبداع في العليا',
        },
    });

    await prisma.purchase.create({
        data: {
            orderNumber: 'PO-2026-002',
            description: 'طباعة بنرات ترويجية (10 قطع)',
            amount: 2500,
            status: 'IN_PROGRESS',
            projectId: proj2.id,
            creatorId: coordinator.id,
            purchasedBy: emp3.id,
            notes: 'يجب أن تكون جاهزة قبل بداية رمضان',
        },
    });

    console.log('✔ Project 2 done\n');

    // ─── PROJECT 3: PENDING (كلاود — لم يبدأ) ────────────────────
    console.log('🏗️  Creating Project 3: مشروع سحابي (PENDING)...');
    const proj3 = await prisma.project.create({
        data: {
            name: 'منصة تعليم إلكتروني',
            description: 'بناء منصة تعليمية سحابية تدعم الكورسات المباشرة والمسجلة مع نظام اختبارات وشهادات إلكترونية.',
            status: 'PENDING',
            startDate: new Date('2026-04-01'),
            endDate: new Date('2026-10-01'),
            managerId: admin.id,
            budgetAllocated: 0,
            custodyIssued: 0,
        },
    });
    await prisma.projectMember.create({
        data: { projectId: proj3.id, userId: emp1.id, projectRoles: 'EMPLOYEE', custodyBalance: 0 },
    });
    await prisma.projectMember.create({
        data: { projectId: proj3.id, userId: emp2.id, projectRoles: 'EMPLOYEE', custodyBalance: 0 },
    });
    console.log('✔ Project 3 done (no budget yet)\n');

    // ─── PROJECT 4: COMPLETED (مؤرشف) ─────────────────────────────
    console.log('🏗️  Creating Project 4: COMPLETED for archives...');
    const proj4 = await prisma.project.create({
        data: {
            name: 'موقع متجر إلكتروني',
            description: 'إطلاق متجر إلكتروني لبيع المنتجات الرياضية مع بوابة دفع إلكترونية وتتبع الطلبات.',
            status: 'COMPLETED',
            startDate: new Date('2025-06-01'),
            endDate: new Date('2025-12-31'),
            closedAt: new Date('2025-12-31'),
            managerId: admin.id,
            budgetAllocated: 60000,
            custodyIssued: 60000,
            custodyReturned: 60000,
        },
    });
    await prisma.projectMember.create({
        data: { projectId: proj4.id, userId: emp1.id, projectRoles: 'EMPLOYEE', custodyBalance: 0 },
    });
    console.log('✔ Project 4 done (archived)\n');

    // ─── FINANCE REQUEST ───────────────────────────────────────────
    await prisma.financeRequest.create({
        data: {
            type: 'SETTLE_DEBT',
            requestedBy: accountant.id,
            status: 'PENDING',
            amount: 320,
            note: 'تسوية الدين الشخصي لسارة أحمد عن فاتورة الطعام INV-2026-003',
        },
    });

    await prisma.financeRequest.create({
        data: {
            type: 'ALLOCATE_BUDGET',
            requestedBy: accountant.id,
            status: 'APPROVED',
            approvedBy: admin.id,
            amount: 45000,
            targetId: proj2.id,
            note: 'تخصيص ميزانية الحملة التسويقية',
        },
    });

    console.log('✔ Finance requests created\n');

    // ─── MESSAGES / CHAT ───────────────────────────────────────────
    await prisma.message.create({
        data: {
            content: 'السلام عليكم فريق العمل 👋 — يرجى رفع الإيصالات خلال 24 ساعة من صرف أي مبلغ.',
            isProjectChat: true,
            senderId: coordinator.id,
            projectId: proj1.id,
        },
    });
    await prisma.message.create({
        data: {
            content: 'تمام يا مهندس، سأرفع إيصال التنقل الآن فوراً.',
            isProjectChat: true,
            senderId: emp1.id,
            projectId: proj1.id,
        },
    });
    await prisma.message.create({
        data: {
            content: 'تم رفع الفاتورة، هل تحتاج أي تفاصيل إضافية؟',
            isProjectChat: true,
            senderId: emp2.id,
            projectId: proj2.id,
        },
    });
    await prisma.message.create({
        data: {
            content: 'أحمد، هل يمكنك مراجعة الفاتورة المعلقة INV-2026-003؟',
            senderId: admin.id,
            receiverId: accountant.id,
        },
    });
    console.log('✔ Messages created\n');

    // ─── NOTIFICATIONS ─────────────────────────────────────────────
    await prisma.notification.create({
        data: {
            title: 'مرحباً بكم في النظام الجديد 🎉',
            content: 'تم الانتهاء من تطوير نظام إدارة المشاريع والعهدات. يرجى الاطلاع على دليل الاستخدام.',
            targetRole: 'ALL',
        },
    });
    await prisma.notification.create({
        data: {
            title: 'فاتورة تنتظر المراجعة',
            content: 'يوجد 2 فاتورة معلقة تنتظر اعتمادك يا أحمد.',
            targetUserId: accountant.id,
        },
    });
    await prisma.notification.create({
        data: {
            title: 'تذكير: تأكيد استلام العهدة',
            content: 'لم تؤكد استلام العهدة بعد. يرجى المراجعة والتأكيد.',
            targetUserId: emp2.id,
        },
    });
    await prisma.notification.create({
        data: {
            title: 'تحديث مشروع نظام العقارات',
            content: 'تم رفع فاتورة جديدة من محمد طارق وتنتظر المراجعة.',
            targetProjectId: proj1.id,
        },
    });
    console.log('✔ Notifications created\n');

    // ─── SUMMARY ───────────────────────────────────────────────────
    console.log('═══════════════════════════════════════════');
    console.log('✅ Seeding complete! Here\'s your test data:\n');
    console.log('🔐 Login credentials (all use password: 123456)');
    console.log('─────────────────────────');
    console.log(`  مدير عام      : gm@pocket.com`);
    console.log(`  مدير النظام     : admin@pocket.com`);
    console.log(`  محاسب           : accountant@pocket.com`);
    console.log(`  منسق مشاريع     : coordinator@pocket.com`);
    console.log(`  موظف 1 (محمد)   : emp1@pocket.com`);
    console.log(`  موظف 2 (سارة)   : emp2@pocket.com`);
    console.log(`  موظف 3 (فيصل)   : emp3@pocket.com`);
    console.log('─────────────────────────');
    console.log('📁 Projects:');
    console.log('  1. نظام إدارة عقارات    — IN_PROGRESS  (ميزانية 80,000 ر.ق)');
    console.log('  2. حملة تسويق رمضان     — IN_PROGRESS  (ميزانية 45,000 ر.ق)');
    console.log('  3. منصة تعليم إلكتروني  — PENDING      (لا ميزانية بعد)');
    console.log('  4. موقع متجر إلكتروني   — COMPLETED    (في الأرشيف)');
    console.log('─────────────────────────');
    console.log('💰 Wallet balance: 160,000 QAR');
    console.log('📄 Invoices: 4 (2 APPROVED, 1 PENDING, 1 REJECTED)');
    console.log('═══════════════════════════════════════════\n');
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
