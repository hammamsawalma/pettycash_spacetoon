import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    if (process.env.NODE_ENV === 'production') {
        console.error('⚠️  DANGER: Seeding disabled in production!');
        process.exit(1);
    }

    console.log('🧹 Clearing old data...');
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
    console.log('✅ Old data cleared.\n');

    const hashed = await bcrypt.hash('123456', 10);

    // ─── USERS — كل دور موجود في النظام ───────────────────────────────
    console.log('👤 Creating users...');

    const admin = await prisma.user.create({
        data: {
            name: 'حمام صوالمة',
            email: 'admin@pocket.com',
            phone: '0500000001',
            password: hashed,
            role: 'ADMIN',
            jobTitle: 'مدير النظام',
            salary: 22000,
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
            salary: 35000,
        },
    });

    const accountant = await prisma.user.create({
        data: {
            name: 'أحمد العلي',
            email: 'accountant@pocket.com',
            phone: '0500000003',
            password: hashed,
            role: 'GLOBAL_ACCOUNTANT',
            jobTitle: 'محاسب أول',
            salary: 9500,
        },
    });

    // منسق (USER + PROJECT_MANAGER role في مشاريع)
    const coordinator = await prisma.user.create({
        data: {
            name: 'خالد يوسف',
            email: 'coordinator@pocket.com',
            phone: '0500000004',
            password: hashed,
            role: 'USER',
            jobTitle: 'منسق مشاريع',
            salary: 8200,
        },
    });

    // موظفون عاديون
    const emp1 = await prisma.user.create({
        data: {
            name: 'محمد طارق',
            email: 'emp1@pocket.com',
            phone: '0500000005',
            password: hashed,
            role: 'USER',
            jobTitle: 'مطور برمجيات',
            salary: 7000,
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
            salary: 6500,
        },
    });

    const emp3 = await prisma.user.create({
        data: {
            name: 'فيصل ناصر',
            email: 'emp3@pocket.com',
            phone: '0500000007',
            password: hashed,
            role: 'USER',
            jobTitle: 'مدير موقع',
            salary: 5800,
        },
    });

    // محاسب مشروع (USER + PROJECT_ACCOUNTANT في مشروع معين)
    const projAccountant = await prisma.user.create({
        data: {
            name: 'ريم المطيري',
            email: 'proj-acc@pocket.com',
            phone: '0500000008',
            password: hashed,
            role: 'USER',
            jobTitle: 'محاسبة مشروع',
            salary: 6800,
        },
    });

    console.log('✔ 8 users created\n');

    // ─── COMPANY WALLET ────────────────────────────────────────────────
    console.log('💰 Setting up company wallet...');
    const wallet = await prisma.companyWallet.create({
        data: { balance: 380000, totalIn: 500000, totalOut: 120000 },
    });
    await prisma.walletEntry.create({
        data: { walletId: wallet.id, type: 'DEPOSIT', amount: 500000, note: 'إيداع رأس المال الابتدائي', createdBy: admin.id },
    });
    await prisma.walletEntry.create({
        data: { walletId: wallet.id, type: 'WITHDRAW', amount: 120000, note: 'مصاريف تشغيل سنوية', createdBy: admin.id },
    });
    console.log('✔ Wallet: 380,000 QAR\n');

    // ─── CATEGORIES ────────────────────────────────────────────────────
    const catTravel = await prisma.category.create({ data: { name: 'تنقل ومواصلات', icon: '🚗' } });
    const catSupplies = await prisma.category.create({ data: { name: 'مستلزمات وأدوات', icon: '🧰' } });
    const catFood = await prisma.category.create({ data: { name: 'طعام وضيافة', icon: '🍽️' } });
    const catPrint = await prisma.category.create({ data: { name: 'طباعة وتصميم', icon: '🖨️' } });
    const catOther = await prisma.category.create({ data: { name: 'أخرى', icon: '📁' } });
    console.log('✔ 5 categories created\n');

    // ─── AUTO APPROVAL RULE ────────────────────────────────────────────
    await prisma.autoApprovalRule.create({
        data: { maxAmount: 500, requiresManager: false, isActive: true },
    });
    console.log('✔ AutoApprovalRule: فواتير < 500 ر.ق تُعتمد تلقائياً\n');

    // ═══════════════════════════════════════════════════════════════════
    // PROJECT 1: IN_PROGRESS — نظام إدارة عقارات
    // الحالات: عهدة مؤكدة + عهدة غير مؤكدة، فواتير في كل حالة، طلب شراء
    // ═══════════════════════════════════════════════════════════════════
    console.log('🏗️  Project 1: نظام إدارة عقارات...');
    const proj1 = await prisma.project.create({
        data: {
            name: 'نظام إدارة عقارات',
            description: 'تطوير منصة إلكترونية لإدارة العقارات والإيجارات مع لوحة تحكم للمالك وتطبيق جوال للمستأجرين. المشروع في مرحلته الثانية.',
            status: 'IN_PROGRESS',
            startDate: new Date('2026-01-10'),
            endDate: new Date('2026-07-30'),
            managerId: admin.id,
            budgetAllocated: 90000,
            custodyIssued: 15500,
            custodyReturned: 2000,
        },
    });
    await prisma.walletEntry.create({ data: { walletId: wallet.id, type: 'ALLOCATE_TO_PROJECT', amount: 90000, note: `ميزانية: ${proj1.name}`, createdBy: admin.id } });
    await prisma.companyWallet.update({ where: { id: wallet.id }, data: { balance: { decrement: 90000 }, totalOut: { increment: 90000 } } });

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
    const mem_acc_p1 = await prisma.projectMember.create({
        data: { projectId: proj1.id, userId: projAccountant.id, projectRoles: 'PROJECT_ACCOUNTANT', custodyBalance: 0 },
    });

    // عهدة 1 — محمد طارق (مؤكدة + إرجاع جزئي)
    const cust1 = await prisma.employeeCustody.create({
        data: {
            projectId: proj1.id, employeeId: emp1.id, memberId: mem_emp1_p1.id,
            amount: 10000, balance: 8500, method: 'CASH', isConfirmed: true,
            confirmedAt: new Date('2026-01-16'),
            note: 'عهدة المرحلة الثانية — مصاريف الموقع الميداني',
        },
    });
    await prisma.custodyConfirmation.create({ data: { custodyId: cust1.id, signature: `CONF-EMP1-${Date.now()}` } });
    await prisma.custodyReturn.create({ data: { custodyId: cust1.id, amount: 1500, returnedBy: emp1.id, recordedBy: admin.id, note: 'إرجاع فائض الأسبوع الماضي' } });

    // عهدة 2 — سارة أحمد (مؤكدة، لم يُرجع منها شيء)
    const cust2 = await prisma.employeeCustody.create({
        data: {
            projectId: proj1.id, employeeId: emp2.id, memberId: mem_emp2_p1.id,
            amount: 5000, balance: 5000, method: 'BANK', isConfirmed: false,
            note: 'عهدة بنكية لمستلزمات التصميم — لم تؤكد بعد',
        },
    });

    // فواتير المشروع 1
    // ✅ معتمدة (< 500 — auto-approved)
    const inv1 = await prisma.invoice.create({
        data: { reference: 'INV-001', type: 'تنقل', amount: 340, status: 'APPROVED', date: new Date('2026-01-18'), notes: 'تكسي للقاء العميل', projectId: proj1.id, creatorId: emp1.id, custodyId: cust1.id, paymentSource: 'CUSTODY', categoryId: catTravel.id, approvedBy: accountant.id, approvedAt: new Date('2026-01-18') },
    });
    await prisma.invoiceItem.create({ data: { invoiceId: inv1.id, name: 'تكسي ذهاب وإياب', quantity: 2, unitPrice: 170, totalPrice: 340 } });

    // ✅ معتمدة (> 500 — manual)
    const inv2 = await prisma.invoice.create({
        data: { reference: 'INV-002', type: 'مستلزمات', amount: 1200, status: 'APPROVED', date: new Date('2026-01-22'), notes: 'أدوات ومعدات الموقع', projectId: proj1.id, creatorId: emp1.id, custodyId: cust1.id, paymentSource: 'CUSTODY', categoryId: catSupplies.id, approvedBy: accountant.id, approvedAt: new Date('2026-01-23') },
    });
    await prisma.invoiceItem.createMany({
        data: [
            { invoiceId: inv2.id, name: 'كابلات شبكة', quantity: 10, unitPrice: 60, totalPrice: 600 },
            { invoiceId: inv2.id, name: 'أدوات تركيب', quantity: 4, unitPrice: 150, totalPrice: 600 },
        ]
    });

    // ⏳ معلقة — تنتظر اعتماد المحاسب
    const inv3 = await prisma.invoice.create({
        data: { reference: 'INV-003', type: 'طعام', amount: 480, status: 'PENDING', date: new Date('2026-02-02'), notes: 'وجبات فريق العمل في الموقع', projectId: proj1.id, creatorId: emp2.id, paymentSource: 'PERSONAL', categoryId: catFood.id },
    });
    await prisma.outOfPocketDebt.create({ data: { invoiceId: inv3.id, employeeId: emp2.id, amount: 480 } });

    // ❌ مرفوضة
    await prisma.invoice.create({
        data: { reference: 'INV-004', type: 'مصروف عام', amount: 890, status: 'REJECTED', date: new Date('2026-02-05'), notes: 'مصروف بدون إيصال', rejectionReason: 'يرجى إرفاق الإيصال الأصلي', projectId: proj1.id, creatorId: emp1.id, paymentSource: 'CUSTODY', categoryId: catOther.id, rejectedBy: accountant.id, rejectedAt: new Date('2026-02-06') },
    });

    // ⏳ معلقة ثانية — مصروف شخصي بدفع مختلط
    const inv5 = await prisma.invoice.create({
        data: { reference: 'INV-005', type: 'مستلزمات', amount: 750, status: 'PENDING', date: new Date('2026-02-10'), notes: 'مواد مكتبية دفع مختلط', projectId: proj1.id, creatorId: emp2.id, paymentSource: 'SPLIT', custodyAmount: 400, pocketAmount: 350, categoryId: catSupplies.id },
    });
    await prisma.outOfPocketDebt.create({ data: { invoiceId: inv5.id, employeeId: emp2.id, amount: 350 } });

    // طلبات شراء للمشروع 1
    await prisma.purchase.create({
        data: { orderNumber: 'PO-001', description: 'شراء سيرفر للاستضافة المحلية', amount: 8500, status: 'REQUESTED', projectId: proj1.id, creatorId: coordinator.id, priority: 'HIGH', notes: 'يرجى مقارنة 3 عروض أسعار' },
    });
    await prisma.purchase.create({
        data: { orderNumber: 'PO-002', description: 'كاميرا مراقبة للمشروع (4 قطع)', amount: 2400, status: 'IN_PROGRESS', projectId: proj1.id, creatorId: coordinator.id, purchasedBy: emp1.id, priority: 'NORMAL', notes: 'محمد بالطريق لشرائها' },
    });

    console.log('✔ Project 1 done\n');

    // ═══════════════════════════════════════════════════════════════════
    // PROJECT 2: IN_PROGRESS — حملة تسويق رمضان
    // الحالات: ميزانية كافية، فواتير، مشتريات مكتملة
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
            budgetAllocated: 50000,
            custodyIssued: 11000,
            custodyReturned: 0,
        },
    });
    await prisma.walletEntry.create({ data: { walletId: wallet.id, type: 'ALLOCATE_TO_PROJECT', amount: 50000, note: `ميزانية: ${proj2.name}`, createdBy: admin.id } });
    await prisma.companyWallet.update({ where: { id: wallet.id }, data: { balance: { decrement: 50000 }, totalOut: { increment: 50000 } } });

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
    await prisma.custodyConfirmation.create({ data: { custodyId: cust3.id, signature: `CONF-EMP3-${Date.now()}` } });

    // فواتير معتمدة
    const inv6 = await prisma.invoice.create({
        data: { reference: 'INV-006', type: 'طباعة وتصميم', amount: 3500, status: 'APPROVED', date: new Date('2026-02-22'), notes: 'طباعة بنرات الحملة', projectId: proj2.id, creatorId: emp3.id, custodyId: cust3.id, paymentSource: 'CUSTODY', categoryId: catPrint.id, approvedBy: accountant.id, approvedAt: new Date('2026-02-23') },
    });
    await prisma.invoiceItem.createMany({
        data: [
            { invoiceId: inv6.id, name: 'بنر خارجي 3×6', quantity: 2, unitPrice: 1200, totalPrice: 2400 },
            { invoiceId: inv6.id, name: 'ملصقات داخلية', quantity: 50, unitPrice: 22, totalPrice: 1100 },
        ]
    });

    // فاتورة معلقة
    await prisma.invoice.create({
        data: { reference: 'INV-007', type: 'تصوير', amount: 4200, status: 'PENDING', date: new Date('2026-03-01'), notes: 'جلسة تصوير المنتجات الرمضانية', projectId: proj2.id, creatorId: emp3.id, custodyId: cust3.id, paymentSource: 'CUSTODY', categoryId: catPrint.id },
    });

    // مشتريات بكل الحالات
    await prisma.purchase.create({ data: { orderNumber: 'PO-003', description: 'شراء ديكورات تصوير رمضانية', amount: 1800, status: 'PURCHASED', projectId: proj2.id, creatorId: coordinator.id, purchasedBy: emp3.id, priority: 'NORMAL', notes: 'تم الشراء بنجاح' } });
    await prisma.purchase.create({ data: { orderNumber: 'PO-004', description: 'إيجار معدات إضاءة المحترف', amount: 2200, status: 'IN_PROGRESS', projectId: proj2.id, creatorId: coordinator.id, purchasedBy: emp3.id, priority: 'HIGH', notes: 'مع استوديو النخبة' } });
    await prisma.purchase.create({ data: { orderNumber: 'PO-005', description: 'شراء هدايا ترويجية (50 قطعة)', amount: 3000, status: 'REQUESTED', projectId: proj2.id, creatorId: coordinator.id, priority: 'URGENT', notes: 'يجب التسليم قبل 15 مارس' } });
    await prisma.purchase.create({ data: { orderNumber: 'PO-006', description: 'محتوى فيديو إضافي', amount: 1500, status: 'CANCELLED', projectId: proj2.id, creatorId: coordinator.id, priority: 'NORMAL', notes: 'ألغي بسبب تغيير الخطة' } });

    console.log('✔ Project 2 done\n');

    // ═══════════════════════════════════════════════════════════════════
    // PROJECT 3: PENDING (لا ميزانية) — اختبار عرض مشروع بدون تمويل
    // ═══════════════════════════════════════════════════════════════════
    console.log('🏗️  Project 3: منصة تعليم (PENDING)...');
    const proj3 = await prisma.project.create({
        data: {
            name: 'منصة تعليم إلكتروني',
            description: 'بناء منصة تعليمية سحابية تدعم الكورسات المباشرة والمسجلة مع نظام اختبارات وشهادات إلكترونية.',
            status: 'PENDING',
            startDate: new Date('2026-05-01'),
            endDate: new Date('2026-11-01'),
            managerId: admin.id,
            budgetAllocated: 0,
            custodyIssued: 0,
        },
    });
    await prisma.projectMember.create({ data: { projectId: proj3.id, userId: emp1.id, projectRoles: 'PROJECT_EMPLOYEE', custodyBalance: 0 } });
    await prisma.projectMember.create({ data: { projectId: proj3.id, userId: emp2.id, projectRoles: 'PROJECT_EMPLOYEE', custodyBalance: 0 } });
    console.log('✔ Project 3 done (no budget — tests allocate CTA)\n');

    // ═══════════════════════════════════════════════════════════════════
    // PROJECT 4: COMPLETED (أرشيف) — اختبار صفحة الأرشيف وزر إعادة فتح
    // ═══════════════════════════════════════════════════════════════════
    console.log('🏗️  Project 4: متجر إلكتروني (COMPLETED)...');
    const proj4 = await prisma.project.create({
        data: {
            name: 'موقع متجر إلكتروني',
            description: 'متجر لبيع المنتجات الرياضية مع بوابة دفع إلكترونية وتتبع الطلبات — تم تسليمه بنجاح.',
            status: 'COMPLETED',
            startDate: new Date('2025-06-01'),
            endDate: new Date('2025-12-31'),
            closedAt: new Date('2025-12-31'),
            managerId: admin.id,
            budgetAllocated: 65000,
            custodyIssued: 65000,
            custodyReturned: 65000,
        },
    });
    await prisma.projectMember.create({ data: { projectId: proj4.id, userId: emp1.id, projectRoles: 'PROJECT_EMPLOYEE', custodyBalance: 0 } });
    await prisma.projectMember.create({ data: { projectId: proj4.id, userId: emp3.id, projectRoles: 'PROJECT_EMPLOYEE', custodyBalance: 0 } });
    // بعض الفواتير المعتمدة للأرشيف
    const inv_arch = await prisma.invoice.create({
        data: { reference: 'INV-ARCH-01', type: 'تطوير', amount: 12000, status: 'APPROVED', date: new Date('2025-11-15'), notes: 'دفعة تطوير المرحلة الأخيرة', projectId: proj4.id, creatorId: emp1.id, paymentSource: 'CUSTODY', categoryId: catOther.id, approvedBy: accountant.id, approvedAt: new Date('2025-11-16') },
    });
    await prisma.invoiceItem.create({ data: { invoiceId: inv_arch.id, name: 'تطوير واجهة المتجر النهائية', quantity: 1, unitPrice: 12000, totalPrice: 12000 } });
    console.log('✔ Project 4 done (archived)\n');

    // ═══════════════════════════════════════════════════════════════════
    // FINANCE REQUESTS — طلبات مالية في كل الحالات
    // ═══════════════════════════════════════════════════════════════════
    // ⏳ طلب تسوية دين — اختبار صفحة الطلبات المالية
    await prisma.financeRequest.create({
        data: { type: 'SETTLE_DEBT', requestedBy: accountant.id, status: 'PENDING', amount: 480, note: 'تسوية الدين الشخصي لسارة أحمد — فاتورة INV-003' },
    });
    // ✅ طلب معتمد
    await prisma.financeRequest.create({
        data: { type: 'ALLOCATE_BUDGET', requestedBy: accountant.id, status: 'APPROVED', approvedBy: admin.id, amount: 50000, targetId: proj2.id, note: 'تخصيص ميزانية الحملة التسويقية' },
    });
    // ❌ طلب مرفوض
    await prisma.financeRequest.create({
        data: { type: 'SETTLE_DEBT', requestedBy: accountant.id, status: 'REJECTED', approvedBy: admin.id, amount: 350, note: 'تسوية دين مزدوجة', rejectReason: 'الدين تمت تسويته مسبقاً' },
    });
    // ⏳ طلب إرجاع عهدة
    await prisma.financeRequest.create({
        data: { type: 'RETURN_CUSTODY', requestedBy: accountant.id, status: 'PENDING', amount: 2000, note: 'إرجاع فائض عهدة محمد طارق للخزنة' },
    });
    console.log('✔ 4 finance requests created\n');

    // ═══════════════════════════════════════════════════════════════════
    // MESSAGES — محادثات في مشاريع ومباشرة
    // ═══════════════════════════════════════════════════════════════════
    await prisma.message.create({ data: { content: 'السلام عليكم فريق العمل 👋 — يرجى رفع الإيصالات خلال 24 ساعة من صرف أي مبلغ.', isProjectChat: true, senderId: coordinator.id, projectId: proj1.id } });
    await prisma.message.create({ data: { content: 'تمام يا مهندس، سأرفع إيصال التنقل الآن.', isProjectChat: true, senderId: emp1.id, projectId: proj1.id } });
    await prisma.message.create({ data: { content: 'الفاتورة INV-005 معلقة بسبب الدفع المختلط، هل تحتاج توضيح؟', isProjectChat: true, senderId: emp2.id, projectId: proj1.id } });
    await prisma.message.create({ data: { content: 'تم رفع فاتورة التصوير، أبلغوني عند الاعتماد.', isProjectChat: true, senderId: emp3.id, projectId: proj2.id } });
    // رسالة مباشرة
    await prisma.message.create({ data: { content: 'أحمد، هل يمكنك مراجعة الفواتير المعلقة لمشروع العقارات؟', senderId: admin.id, receiverId: accountant.id } });
    await prisma.message.create({ data: { content: 'بالطبع، سأراجعها خلال ساعة.', senderId: accountant.id, receiverId: admin.id } });
    console.log('✔ Messages created\n');

    // ═══════════════════════════════════════════════════════════════════
    // NOTIFICATIONS — إشعارات مستهدفة لكل دور
    // ═══════════════════════════════════════════════════════════════════
    await prisma.notification.create({ data: { title: 'مرحباً بكم في النظام 🎉', content: 'يمكنكم الآن إدارة المشاريع والعهدات والفواتير بسهولة.', targetRole: 'ALL' } });
    await prisma.notification.create({ data: { title: 'فواتير تنتظر المراجعة', content: 'يوجد 3 فواتير معلقة تنتظر اعتمادك يا أحمد.', targetUserId: accountant.id } });
    await prisma.notification.create({ data: { title: 'تذكير: تأكيد استلام العهدة', content: 'لم تؤكدي استلام العهدة البنكية بعد يا سارة. يرجى المراجعة والتأكيد.', targetUserId: emp2.id } });
    await prisma.notification.create({ data: { title: 'طلب شراء عاجل', content: 'طلب شراء هدايا ترويجية بأولوية URGENT — يرجى التنسيق.', targetUserId: emp3.id } });
    await prisma.notification.create({ data: { title: 'تحديث مشروع العقارات', content: 'تم رفع فاتورة جديدة من فريق المشروع.', targetProjectId: proj1.id } });
    console.log('✔ Notifications created\n');

    // ═══════════════════════════════════════════════════════════════════
    // SUMMARY
    // ═══════════════════════════════════════════════════════════════════
    console.log('══════════════════════════════════════════════════════');
    console.log('✅  Seeding complete! بيانات الاختبار جاهزة\n');
    console.log('🔐  بيانات الدخول (كلمة المرور للجميع: 123456)');
    console.log('──────────────────────────────────────────────────────');
    console.log('  الدور              الإيميل                  الصلاحيات');
    console.log('  ─────────────────────────────────────────────────────');
    console.log('  ADMIN            admin@pocket.com          كل الصلاحيات');
    console.log('  GENERAL_MANAGER  gm@pocket.com             عرض فقط (بدون إضافة)');
    console.log('  GLOBAL_ACCOUNTANT accountant@pocket.com    محاسبة + اعتماد فواتير');
    console.log('  منسق (USER)      coordinator@pocket.com    إدارة مشاريعه + مشتريات');
    console.log('  موظف 1 (USER)    emp1@pocket.com           رفع فواتير + تأكيد عهدة');
    console.log('  موظف 2 (USER)    emp2@pocket.com           رفع فواتير (دين معلق عنده)');
    console.log('  موظف 3 (USER)    emp3@pocket.com           رفع فواتير + طلب شراء عاجل');
    console.log('  محاسبة مشروع    proj-acc@pocket.com        محاسب داخل مشروع العقارات');
    console.log('──────────────────────────────────────────────────────');
    console.log('📁  المشاريع:');
    console.log('  1. نظام إدارة عقارات    IN_PROGRESS  90,000 ر.ق  — فواتير متنوعة');
    console.log('  2. حملة تسويق رمضان    IN_PROGRESS  50,000 ر.ق  — مشتريات بكل الحالات');
    console.log('  3. منصة تعليم إلكتروني PENDING      لا ميزانية   — لاختبار التخصيص');
    console.log('  4. موقع متجر إلكتروني  COMPLETED    في الأرشيف   — لاختبار إعادة الفتح');
    console.log('──────────────────────────────────────────────────────');
    console.log('📄  الفواتير: 8 فواتير (3 معتمدة، 3 معلقة، 1 مرفوضة، 1 أرشيف)');
    console.log('🛒  المشتريات: 6 طلبات (REQUESTED, IN_PROGRESS, PURCHASED, CANCELLED)');
    console.log('💰  رصيد الخزنة: ~240,000 ر.ق (بعد تخصيص المشاريع)');
    console.log('📋  الطلبات المالية: 4 (PENDING, APPROVED, REJECTED, PENDING)');
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
