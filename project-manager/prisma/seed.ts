import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {

    console.log('🧹 Clearing old data...');
    await prisma.pushSubscription.deleteMany();
    await prisma.voucherCounter.deleteMany();
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
    await prisma.branch.deleteMany();
    console.log('✅ Old data cleared.\n');

    const hashed = await bcrypt.hash('123456', 10);

    // ─── BRANCHES ────────────────────────────────────────────────────────
    console.log('🌍 Creating branches...');

    const branchQA = await prisma.branch.create({ data: { name: 'قطر', code: 'QA', currency: 'QAR', country: 'Qatar', flag: '🇶🇦' } });
    const branchAE = await prisma.branch.create({ data: { name: 'الإمارات', code: 'AE', currency: 'AED', country: 'UAE', flag: '🇦🇪' } });
    const branchSA = await prisma.branch.create({ data: { name: 'السعودية', code: 'SA', currency: 'SAR', country: 'Saudi Arabia', flag: '🇸🇦' } });
    const branchBH = await prisma.branch.create({ data: { name: 'البحرين', code: 'BH', currency: 'BHD', country: 'Bahrain', flag: '🇧🇭' } });
    const branchSY = await prisma.branch.create({ data: { name: 'سوريا', code: 'SY', currency: 'SYP', country: 'Syria', flag: '🇸🇾' } });
    const branchTR = await prisma.branch.create({ data: { name: 'تركيا', code: 'TR', currency: 'TRY', country: 'Turkey', flag: '🇹🇷' } });

    console.log(`✅ Created ${6} branches (default: ${branchQA.name})\n`);

    // ─── ROOT USER ───────────────────────────────────────────────────────
    console.log('🔑 Creating ROOT user...');
    await prisma.user.create({
        data: {
            name: 'IT',
            email: 'root@pocket.com',
            phone: '0500000000',
            password: hashed,
            role: 'ROOT',
            jobTitle: 'IT',
            // ROOT has no branchId — controls all branches
        },
    });
    console.log('✅ ROOT user created (root@pocket.com / 123456)\n');

    // ─── USERS ───────────────────────────────────────────────────────────
    // v8 Roles: ROOT, ADMIN, GENERAL_MANAGER, GLOBAL_ACCOUNTANT, USER
    // All existing users belong to Qatar branch
    console.log('👤 Creating users...');

    const admin = await prisma.user.create({
        data: {
            name: 'حمام صوالمة',
            email: 'admin@pocket.com',
            phone: '0500000001',
            password: hashed,
            role: 'ADMIN',
            jobTitle: 'مدير النظام',
            branchId: branchQA.id,
        },
    });

    const gm = await prisma.user.create({
        data: {
            name: 'سلطان الريس',
            email: 'gm@pocket.com',
            phone: '0500000002',
            password: hashed,
            role: 'GENERAL_MANAGER',
            jobTitle: 'المدير العام',
            // GM has no branchId — views all branches
        },
    });

    const accountant = await prisma.user.create({
        data: {
            name: 'أحمد العلي',
            email: 'accountant@pocket.com',
            phone: '0500000003',
            password: hashed,
            role: 'GLOBAL_ACCOUNTANT',
            jobTitle: 'المحاسب العام',
            branchId: branchQA.id,
        },
    });

    // منسق (USER + PROJECT_MANAGER في المشاريع)
    const coordinator = await prisma.user.create({
        data: {
            name: 'خالد يوسف',
            email: 'coordinator@pocket.com',
            phone: '0500000004',
            password: hashed,
            role: 'USER',
            jobTitle: 'منسق مشاريع',
            branchId: branchQA.id,
        },
    });

    const emp1 = await prisma.user.create({
        data: {
            name: 'محمد طارق',
            email: 'emp1@pocket.com',
            phone: '0500000005',
            password: hashed,
            role: 'USER',
            jobTitle: 'مطور برمجيات',
            branchId: branchQA.id,
        },
    });

    const emp2 = await prisma.user.create({
        data: {
            name: 'سارة أحمد',
            email: 'emp2@pocket.com',
            phone: '0500000006',
            password: hashed,
            role: 'USER',
            jobTitle: 'مصممة جرافيك',
            branchId: branchQA.id,
        },
    });

    const emp3 = await prisma.user.create({
        data: {
            name: 'فيصل ناصر',
            email: 'emp3@pocket.com',
            phone: '0500000007',
            password: hashed,
            role: 'USER',
            jobTitle: 'مدير موقع ميداني',
            branchId: branchQA.id,
        },
    });

    console.log('✔ 7 users created\n');

    // ─── COMPANY WALLET ────────────────────────────────────────────────
    console.log('💰 Setting up company wallet...');
    const wallet = await prisma.companyWallet.create({
        data: { balance: 350000, totalIn: 500000, totalOut: 150000, branchId: branchQA.id },
    });
    await prisma.walletEntry.create({
        data: { walletId: wallet.id, type: 'DEPOSIT', amount: 500000, note: 'إيداع رأس المال الابتدائي — الربع الأول 2026', createdBy: admin.id },
    });
    await prisma.walletEntry.create({
        data: { walletId: wallet.id, type: 'WITHDRAW', amount: 150000, note: 'تخصيصات مشاريع + مصاريف شركة', createdBy: admin.id },
    });
    console.log('✔ Wallet: 350,000 QAR\n');

    // ─── CATEGORIES ────────────────────────────────────────────────────
    console.log('📂 Creating categories...');
    const catTravel = await prisma.category.create({ data: { name: 'تنقل ومواصلات', icon: '🚗', scope: 'BOTH' } });
    const catSupplies = await prisma.category.create({ data: { name: 'مستلزمات وأدوات', icon: '🧰', scope: 'PROJECT' } });
    const catFood = await prisma.category.create({ data: { name: 'طعام وضيافة', icon: '🍽️', scope: 'BOTH' } });
    const catPrint = await prisma.category.create({ data: { name: 'طباعة وتصميم', icon: '🖨️', scope: 'PROJECT' } });
    const catOther = await prisma.category.create({ data: { name: 'أخرى', icon: '📁', scope: 'BOTH' } });
    const catRent = await prisma.category.create({ data: { name: 'إيجار ومرافق', icon: '🏢', scope: 'COMPANY' } });
    const catLegal = await prisma.category.create({ data: { name: 'قانونية وتراخيص', icon: '⚖️', scope: 'COMPANY' } });
    const catIT = await prisma.category.create({ data: { name: 'بنية تحتية وتقنية', icon: '💻', scope: 'COMPANY' } });
    console.log('✔ 8 categories created (PROJECT / COMPANY / BOTH)\n');

    // ─── AUTO APPROVAL RULE ────────────────────────────────────────────
    await prisma.autoApprovalRule.create({
        data: { maxAmount: 500, requiresManager: false, isActive: true },
    });
    console.log('✔ AutoApprovalRule: فواتير < 500 ر.ق تُعتمد تلقائياً\n');

    // ═══════════════════════════════════════════════════════════════════
    // PROJECT 1: IN_PROGRESS — نظام إدارة عقارات
    // يختبر: عهدة مؤكدة + غير مؤكدة، فواتير بكل الحالات، عهدة خارجية
    // ═══════════════════════════════════════════════════════════════════
    console.log('🏗️  Project 1: نظام إدارة عقارات...');
    const proj1 = await prisma.project.create({
        data: {
            name: 'نظام إدارة عقارات',
            description: 'تطوير منصة إلكترونية لإدارة العقارات والإيجارات مع لوحة تحكم للمالك وتطبيق جوال للمستأجرين.',
            status: 'IN_PROGRESS',
            startDate: new Date('2026-01-10'),
            endDate: new Date('2026-07-30'),
            managerId: admin.id,
            branchId: branchQA.id,
            budgetAllocated: 90000,
            custodyIssued: 18000,
            custodyReturned: 2000,
        },
    });
    await prisma.walletEntry.create({ data: { walletId: wallet.id, type: 'ALLOCATE_TO_PROJECT', amount: 90000, note: `ميزانية: ${proj1.name}`, createdBy: admin.id } });

    // الأعضاء
    const mem_coord_p1 = await prisma.projectMember.create({
        data: { projectId: proj1.id, userId: coordinator.id, projectRoles: 'PROJECT_MANAGER', custodyBalance: 0 },
    });
    const mem_emp1_p1 = await prisma.projectMember.create({
        data: { projectId: proj1.id, userId: emp1.id, projectRoles: 'PROJECT_EMPLOYEE', custodyBalance: 8500 },
    });
    const mem_emp2_p1 = await prisma.projectMember.create({
        data: { projectId: proj1.id, userId: emp2.id, projectRoles: 'PROJECT_EMPLOYEE', custodyBalance: 5000 },
    });

    // عهدة 1 — محمد طارق (مؤكدة بتوقيع + إرجاع جزئي)
    const cust1 = await prisma.employeeCustody.create({
        data: {
            projectId: proj1.id, employeeId: emp1.id, memberId: mem_emp1_p1.id,
            amount: 10000, balance: 8500, method: 'CASH', isConfirmed: true,
            confirmedAt: new Date('2026-01-16'),
            note: 'عهدة المرحلة الثانية — مصاريف الموقع الميداني',
        },
    });
    await prisma.custodyConfirmation.create({ data: { custodyId: cust1.id, signatureFile: null } });
    await prisma.custodyReturn.create({ data: { custodyId: cust1.id, amount: 1500, returnedBy: emp1.id, recordedBy: accountant.id, note: 'إرجاع فائض الأسبوع الماضي' } });

    // عهدة 2 — سارة أحمد (غير مؤكدة — تنتظر التوقيع)
    const cust2 = await prisma.employeeCustody.create({
        data: {
            projectId: proj1.id, employeeId: emp2.id, memberId: mem_emp2_p1.id,
            amount: 5000, balance: 5000, method: 'BANK', isConfirmed: false,
            note: 'عهدة بنكية لمستلزمات التصميم — لم تؤكد الاستلام بعد',
        },
    });

    // عهدة 3 — خارجية (مقاول كهربائي)
    await prisma.employeeCustody.create({
        data: {
            projectId: proj1.id, employeeId: admin.id, memberId: mem_coord_p1.id,
            amount: 3000, balance: 3000, method: 'CASH', isConfirmed: true,
            confirmedAt: new Date('2026-02-01'),
            isExternal: true,
            externalName: 'مؤسسة التقنية للكهرباء',
            externalPhone: '0551234567',
            externalPurpose: 'أعمال كهربائية للموقع — تسليم جزئي',
            note: 'عهدة خارجية لمقاول كهرباء',
        },
    });

    // فواتير المشروع 1
    // ✅ معتمدة (< 500 — auto-approved) مع حقول المحاسب
    const inv1 = await prisma.invoice.create({
        data: {
            reference: 'INV-001', type: 'تنقل', amount: 340, status: 'APPROVED',
            date: new Date('2026-01-18'), notes: 'تكسي للقاء العميل — ذهاب وإياب',
            projectId: proj1.id, creatorId: emp1.id, custodyId: cust1.id,
            paymentSource: 'CUSTODY', categoryId: catTravel.id,
            externalNumber: 'EXT-2026-001', spendDate: new Date('2026-01-18'),
            approvedBy: accountant.id, approvedAt: new Date('2026-01-18'),
            expenseScope: 'PROJECT',
        },
    });
    await prisma.invoiceItem.create({ data: { invoiceId: inv1.id, name: 'تكسي ذهاب وإياب', quantity: 2, unitPrice: 170, totalPrice: 340 } });

    // ✅ معتمدة (> 500 — manual)
    const inv2 = await prisma.invoice.create({
        data: {
            reference: 'INV-002', type: 'مستلزمات', amount: 1200, status: 'APPROVED',
            date: new Date('2026-01-22'), notes: 'أدوات ومعدات الموقع',
            projectId: proj1.id, creatorId: emp1.id, custodyId: cust1.id,
            paymentSource: 'CUSTODY', categoryId: catSupplies.id,
            externalNumber: 'EXT-2026-002', spendDate: new Date('2026-01-22'),
            approvedBy: accountant.id, approvedAt: new Date('2026-01-23'),
            expenseScope: 'PROJECT',
        },
    });
    await prisma.invoiceItem.createMany({
        data: [
            { invoiceId: inv2.id, name: 'كابلات شبكة', quantity: 10, unitPrice: 60, totalPrice: 600 },
            { invoiceId: inv2.id, name: 'أدوات تركيب', quantity: 4, unitPrice: 150, totalPrice: 600 },
        ]
    });

    // ⏳ معلقة — من الجيب الشخصي (تنتظر اعتماد المحاسب)
    const inv3 = await prisma.invoice.create({
        data: {
            reference: 'INV-003', type: 'طعام', amount: 480, status: 'PENDING',
            date: new Date('2026-02-02'), notes: 'وجبات فريق العمل في الموقع — دفع شخصي',
            projectId: proj1.id, creatorId: emp2.id,
            paymentSource: 'PERSONAL', categoryId: catFood.id,
            expenseScope: 'PROJECT',
        },
    });
    await prisma.outOfPocketDebt.create({ data: { invoiceId: inv3.id, employeeId: emp2.id, amount: 480 } });

    // ❌ مرفوضة
    await prisma.invoice.create({
        data: {
            reference: 'INV-004', type: 'مصروف عام', amount: 890, status: 'REJECTED',
            date: new Date('2026-02-05'), notes: 'مصروف بدون إيصال',
            rejectionReason: 'يرجى إرفاق الإيصال الأصلي — لا يمكن اعتماد فاتورة بلا مستند',
            projectId: proj1.id, creatorId: emp1.id,
            paymentSource: 'CUSTODY', categoryId: catOther.id,
            rejectedBy: accountant.id, rejectedAt: new Date('2026-02-06'),
            expenseScope: 'PROJECT',
        },
    });

    // ⏳ معلقة (دفع مختلط — SPLIT)
    const inv5 = await prisma.invoice.create({
        data: {
            reference: 'INV-005', type: 'مستلزمات', amount: 750, status: 'PENDING',
            date: new Date('2026-02-10'), notes: 'مواد مكتبية — 400 من العهدة + 350 من الجيب',
            projectId: proj1.id, creatorId: emp2.id,
            paymentSource: 'SPLIT', custodyAmount: 400, pocketAmount: 350,
            categoryId: catSupplies.id,
            expenseScope: 'PROJECT',
        },
    });
    await prisma.outOfPocketDebt.create({ data: { invoiceId: inv5.id, employeeId: emp2.id, amount: 350 } });

    // طلبات شراء
    await prisma.purchase.create({
        data: { orderNumber: 'PO-001', description: 'شراء سيرفر للاستضافة المحلية', amount: 8500, status: 'REQUESTED', projectId: proj1.id, creatorId: coordinator.id, priority: 'HIGH', notes: 'يرجى مقارنة 3 عروض أسعار' },
    });
    await prisma.purchase.create({
        data: { orderNumber: 'PO-002', description: 'كاميرا مراقبة للمشروع (4 قطع)', amount: 2400, status: 'IN_PROGRESS', projectId: proj1.id, creatorId: coordinator.id, purchasedBy: emp1.id, priority: 'NORMAL', notes: 'محمد بالطريق لشرائها' },
    });

    console.log('✔ Project 1 done (عهد + خارجية + فواتير + مشتريات)\n');

    // ═══════════════════════════════════════════════════════════════════
    // PROJECT 2: IN_PROGRESS — حملة تسويق رمضان
    // يختبر: ميزانية كافية، فواتير متنوعة، مشتريات بكل الحالات
    // ═══════════════════════════════════════════════════════════════════
    console.log('🏗️  Project 2: حملة تسويق رمضان...');
    const proj2 = await prisma.project.create({
        data: {
            name: 'حملة تسويق رمضان 2026',
            description: 'حملة إعلانية متكاملة عبر وسائل التواصل الاجتماعي وقنوات البث خلال شهر رمضان المبارك.',
            status: 'IN_PROGRESS',
            startDate: new Date('2026-02-15'),
            endDate: new Date('2026-04-20'),
            managerId: admin.id,
            branchId: branchQA.id,
            budgetAllocated: 50000,
            custodyIssued: 11000,
            custodyReturned: 0,
        },
    });
    await prisma.walletEntry.create({ data: { walletId: wallet.id, type: 'ALLOCATE_TO_PROJECT', amount: 50000, note: `ميزانية: ${proj2.name}`, createdBy: admin.id } });

    const mem_coord_p2 = await prisma.projectMember.create({
        data: { projectId: proj2.id, userId: coordinator.id, projectRoles: 'PROJECT_MANAGER', custodyBalance: 0 },
    });
    const mem_emp3_p2 = await prisma.projectMember.create({
        data: { projectId: proj2.id, userId: emp3.id, projectRoles: 'PROJECT_EMPLOYEE', custodyBalance: 11000 },
    });
    await prisma.projectMember.create({
        data: { projectId: proj2.id, userId: emp2.id, projectRoles: 'PROJECT_EMPLOYEE', custodyBalance: 0 },
    });

    const cust3 = await prisma.employeeCustody.create({
        data: {
            projectId: proj2.id, employeeId: emp3.id, memberId: mem_emp3_p2.id,
            amount: 11000, balance: 11000, method: 'CASH', isConfirmed: true,
            confirmedAt: new Date('2026-02-19'), note: 'ميزانية التصوير والإنتاج الرمضاني',
        },
    });
    await prisma.custodyConfirmation.create({ data: { custodyId: cust3.id, signatureFile: null } });

    const inv6 = await prisma.invoice.create({
        data: {
            reference: 'INV-006', type: 'طباعة وتصميم', amount: 3500, status: 'APPROVED',
            date: new Date('2026-02-22'), notes: 'طباعة بنرات الحملة',
            projectId: proj2.id, creatorId: emp3.id, custodyId: cust3.id,
            paymentSource: 'CUSTODY', categoryId: catPrint.id,
            externalNumber: 'EXT-2026-003', spendDate: new Date('2026-02-22'),
            approvedBy: accountant.id, approvedAt: new Date('2026-02-23'),
            expenseScope: 'PROJECT',
        },
    });
    await prisma.invoiceItem.createMany({
        data: [
            { invoiceId: inv6.id, name: 'بنر خارجي 3×6', quantity: 2, unitPrice: 1200, totalPrice: 2400 },
            { invoiceId: inv6.id, name: 'ملصقات داخلية', quantity: 50, unitPrice: 22, totalPrice: 1100 },
        ]
    });

    // فاتورة معلقة
    await prisma.invoice.create({
        data: {
            reference: 'INV-007', type: 'تصوير', amount: 4200, status: 'PENDING',
            date: new Date('2026-03-01'), notes: 'جلسة تصوير المنتجات الرمضانية — تنتظر الاعتماد',
            projectId: proj2.id, creatorId: emp3.id, custodyId: cust3.id,
            paymentSource: 'CUSTODY', categoryId: catPrint.id,
            expenseScope: 'PROJECT',
        },
    });

    // مشتريات بكل الحالات
    await prisma.purchase.create({ data: { orderNumber: 'PO-003', description: 'شراء ديكورات تصوير رمضانية', amount: 1800, status: 'PURCHASED', projectId: proj2.id, creatorId: coordinator.id, purchasedBy: emp3.id, priority: 'NORMAL', notes: 'تم الشراء بنجاح' } });
    await prisma.purchase.create({ data: { orderNumber: 'PO-004', description: 'إيجار معدات إضاءة المحترف', amount: 2200, status: 'IN_PROGRESS', projectId: proj2.id, creatorId: coordinator.id, purchasedBy: emp3.id, priority: 'HIGH', notes: 'مع استوديو النخبة' } });
    await prisma.purchase.create({ data: { orderNumber: 'PO-005', description: 'شراء هدايا ترويجية (50 قطعة)', amount: 3000, status: 'REQUESTED', projectId: proj2.id, creatorId: coordinator.id, priority: 'URGENT', notes: 'يجب التسليم قبل 15 مارس' } });
    await prisma.purchase.create({ data: { orderNumber: 'PO-006', description: 'محتوى فيديو إضافي', amount: 1500, status: 'CANCELLED', projectId: proj2.id, creatorId: coordinator.id, priority: 'NORMAL', notes: 'ألغي بسبب تغيير الخطة' } });

    console.log('✔ Project 2 done\n');

    // ═══════════════════════════════════════════════════════════════════
    // PROJECT 3: PENDING — بدون ميزانية
    // ═══════════════════════════════════════════════════════════════════
    console.log('🏗️  Project 3: منصة تعليم (PENDING)...');
    await prisma.project.create({
        data: {
            name: 'منصة تعليم إلكتروني',
            description: 'بناء منصة تعليمية سحابية تدعم الكورسات المباشرة والمسجلة مع نظام اختبارات وشهادات إلكترونية.',
            status: 'PENDING',
            startDate: new Date('2026-05-01'),
            endDate: new Date('2026-11-01'),
            managerId: admin.id,
            branchId: branchQA.id,
            budgetAllocated: 0,
            custodyIssued: 0,
        },
    });
    console.log('✔ Project 3 done (PENDING — no budget)\n');

    // ═══════════════════════════════════════════════════════════════════
    // PROJECT 4: COMPLETED — أرشيف
    // ═══════════════════════════════════════════════════════════════════
    console.log('🏗️  Project 4: متجر إلكتروني (COMPLETED)...');
    const proj4 = await prisma.project.create({
        data: {
            name: 'موقع متجر إلكتروني',
            description: 'متجر لبيع المنتجات الرياضية مع بوابة دفع إلكترونية وتتبع الطلبات — تم تسليمه.',
            status: 'COMPLETED',
            startDate: new Date('2025-06-01'),
            endDate: new Date('2025-12-31'),
            closedAt: new Date('2025-12-31'),
            managerId: admin.id,
            branchId: branchQA.id,
            budgetAllocated: 65000,
            custodyIssued: 65000,
            custodyReturned: 65000,
        },
    });
    await prisma.projectMember.create({ data: { projectId: proj4.id, userId: emp1.id, projectRoles: 'PROJECT_EMPLOYEE', custodyBalance: 0 } });
    const inv_arch = await prisma.invoice.create({
        data: {
            reference: 'INV-ARCH-01', type: 'تطوير', amount: 12000, status: 'APPROVED',
            date: new Date('2025-11-15'), notes: 'دفعة تطوير المرحلة الأخيرة',
            projectId: proj4.id, creatorId: emp1.id,
            paymentSource: 'CUSTODY', categoryId: catOther.id,
            externalNumber: 'EXT-2025-099', spendDate: new Date('2025-11-15'),
            approvedBy: accountant.id, approvedAt: new Date('2025-11-16'),
            expenseScope: 'PROJECT',
        },
    });
    await prisma.invoiceItem.create({ data: { invoiceId: inv_arch.id, name: 'تطوير واجهة المتجر النهائية', quantity: 1, unitPrice: 12000, totalPrice: 12000 } });
    console.log('✔ Project 4 done (COMPLETED)\n');

    // ═══════════════════════════════════════════════════════════════════
    // COMPANY EXPENSES — مصاريف شركة (بلا مشروع)
    // يختبر: expenseScope=COMPANY, paymentSource=COMPANY_DIRECT
    // ═══════════════════════════════════════════════════════════════════
    console.log('🏢 Creating company expenses...');
    const compInv1 = await prisma.invoice.create({
        data: {
            reference: 'COMP-001', type: 'إيجار', amount: 8500, status: 'APPROVED',
            date: new Date('2026-01-05'), notes: 'إيجار المكتب الرئيسي — يناير 2026',
            creatorId: accountant.id,
            paymentSource: 'COMPANY_DIRECT', categoryId: catRent.id,
            externalNumber: 'COMP-EXT-001', spendDate: new Date('2026-01-05'),
            approvedBy: accountant.id, approvedAt: new Date('2026-01-05'),
            expenseScope: 'COMPANY',
        },
    });
    await prisma.invoiceItem.create({ data: { invoiceId: compInv1.id, name: 'إيجار شهر يناير', quantity: 1, unitPrice: 8500, totalPrice: 8500 } });

    await prisma.invoice.create({
        data: {
            reference: 'COMP-002', type: 'تراخيص', amount: 2200, status: 'APPROVED',
            date: new Date('2026-02-15'), notes: 'تجديد رخصة تجارية سنوية',
            creatorId: accountant.id,
            paymentSource: 'COMPANY_DIRECT', categoryId: catLegal.id,
            externalNumber: 'COMP-EXT-002', spendDate: new Date('2026-02-15'),
            approvedBy: accountant.id, approvedAt: new Date('2026-02-15'),
            expenseScope: 'COMPANY',
        },
    });

    await prisma.invoice.create({
        data: {
            reference: 'COMP-003', type: 'بنية تحتية', amount: 4500, status: 'PENDING',
            date: new Date('2026-03-01'), notes: 'اشتراك خوادم سحابية — تنتظر الاعتماد',
            creatorId: accountant.id,
            paymentSource: 'COMPANY_DIRECT', categoryId: catIT.id,
            expenseScope: 'COMPANY',
        },
    });
    console.log('✔ 3 company expenses (2 approved, 1 pending)\n');

    // ═══════════════════════════════════════════════════════════════════
    // FINANCE REQUESTS
    // ═══════════════════════════════════════════════════════════════════
    await prisma.financeRequest.create({
        data: { type: 'SETTLE_DEBT', requestedBy: accountant.id, status: 'PENDING', amount: 480, note: 'تسوية الدين الشخصي لسارة أحمد — فاتورة INV-003' },
    });
    await prisma.financeRequest.create({
        data: { type: 'ALLOCATE_BUDGET', requestedBy: accountant.id, status: 'APPROVED', approvedBy: admin.id, amount: 50000, targetId: proj2.id, note: 'تخصيص ميزانية الحملة التسويقية' },
    });
    await prisma.financeRequest.create({
        data: { type: 'RETURN_CUSTODY', requestedBy: accountant.id, status: 'PENDING', amount: 2000, note: 'إرجاع فائض عهدة محمد طارق للخزنة' },
    });
    console.log('✔ 3 finance requests\n');

    // ═══════════════════════════════════════════════════════════════════
    // MESSAGES — محادثات مشاريع فقط (v5: لا رسائل شخصية)
    // ═══════════════════════════════════════════════════════════════════
    await prisma.message.create({ data: { content: 'السلام عليكم فريق العمل 👋 — يرجى رفع الإيصالات خلال 24 ساعة من صرف أي مبلغ.', isProjectChat: true, senderId: coordinator.id, projectId: proj1.id } });
    await prisma.message.create({ data: { content: 'تمام يا مهندس، سأرفع إيصال التنقل الآن.', isProjectChat: true, senderId: emp1.id, projectId: proj1.id } });
    await prisma.message.create({ data: { content: 'هل يوجد تحديث على عهدة المقاول الخارجي؟ أحتاج الفاتورة لتسجيلها.', isProjectChat: true, senderId: accountant.id, projectId: proj1.id } });
    await prisma.message.create({ data: { content: 'تم رفع فاتورة التصوير، أبلغوني عند الاعتماد.', isProjectChat: true, senderId: emp3.id, projectId: proj2.id } });
    await prisma.message.create({ data: { content: 'الهدايا الترويجية بأولوية عاجلة — نحتاج تنسيق سريع.', isProjectChat: true, senderId: coordinator.id, projectId: proj2.id } });
    console.log('✔ 5 project messages (no personal chats)\n');

    // ═══════════════════════════════════════════════════════════════════
    // NOTIFICATIONS
    // ═══════════════════════════════════════════════════════════════════
    await prisma.notification.create({ data: { title: 'مرحباً بكم في Pocket v5 🎉', content: 'تم تحديث النظام بميزات جديدة: مصاريف الشركة، التوقيع الإلكتروني، وسندات الصرف.', targetRole: 'ALL' } });
    await prisma.notification.create({ data: { title: 'فواتير تنتظر المراجعة', content: 'يوجد 4 فواتير معلقة تنتظر اعتمادك (مشاريع + شركة).', targetUserId: accountant.id } });
    await prisma.notification.create({ data: { title: 'تأكيد استلام العهدة', content: 'لم تؤكدي استلام العهدة البنكية بعد يا سارة. يرجى التوقيع من صفحة "عهدي".', targetUserId: emp2.id } });
    await prisma.notification.create({ data: { title: 'طلب شراء عاجل ⚡', content: 'طلب شراء هدايا ترويجية بأولوية URGENT — يرجى التنسيق.', targetUserId: emp3.id } });
    console.log('✔ 4 notifications\n');

    // ═══════════════════════════════════════════════════════════════════
    // SUMMARY
    // ═══════════════════════════════════════════════════════════════════
    console.log('══════════════════════════════════════════════════════');
    console.log('✅  Seeding complete! Pocket v5 test data ready\n');
    console.log('🔐  كلمة المرور للجميع: 123456');
    console.log('──────────────────────────────────────────────────────');
    console.log('  👑 ADMIN             admin@pocket.com        كل الصلاحيات + مدير مشاريع');
    console.log('  🌟 المدير العام      gm@pocket.com           مشاهدة فقط بدون تدخل');
    console.log('  🧾 المحاسب العام     accountant@pocket.com   اعتماد فواتير + مصاريف شركة');
    console.log('  🗂️ منسق مشاريع      coordinator@pocket.com  إدارة فرق + مشتريات');
    console.log('  👤 موظف ١ محمد       emp1@pocket.com         عهدة مؤكدة + فواتير');
    console.log('  👤 موظف ٢ سارة       emp2@pocket.com         عهدة تنتظر توقيع + دين');
    console.log('  👤 موظف ٣ فيصل       emp3@pocket.com         عهدة + طلب شراء عاجل');
    console.log('──────────────────────────────────────────────────────');
    console.log('  📁 مشروع ١  IN_PROGRESS  90K  عهد + خارجية + فواتير متنوعة');
    console.log('  📁 مشروع ٢  IN_PROGRESS  50K  حملة رمضان + مشتريات');
    console.log('  📁 مشروع ٣  PENDING      0    بدون ميزانية');
    console.log('  📁 مشروع ٤  COMPLETED    65K  أرشيف');
    console.log('  🏢 مصاريف شركة: 3 فواتير (إيجار + تراخيص + بنية تحتية)');
    console.log('══════════════════════════════════════════════════════\n');
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
