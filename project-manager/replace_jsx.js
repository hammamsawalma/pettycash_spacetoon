const fs = require('fs');

const files = [
    "src/components/dashboard/EmployeeDashboard.tsx",
    "src/components/dashboard/CoordinatorDashboard.tsx",
    "src/components/dashboard/ManagerMarginCards.tsx",
    "src/components/dashboard/AdminDashboard.tsx",
    "src/components/dashboard/AccountantDashboard.tsx",
    "src/app/(dashboard)/reports/page.tsx",
    "src/app/(dashboard)/deposits/page.tsx",
    "src/app/(dashboard)/archives/page.tsx",
    "src/app/(dashboard)/wallet/page.tsx",
    "src/app/(dashboard)/invoices/page.tsx",
    "src/app/(dashboard)/debts/page.tsx",
    "src/app/(dashboard)/projects/[id]/page.tsx",
    "src/app/(dashboard)/projects/page.tsx" // exclude settings/page.tsx for now
];

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    if (content.includes('ر.ق')) {
        // add import
        if (!content.includes('CurrencyDisplay')) {
            content = content.replace(/(import.*?;?\n)(?![ \t]*import)/, `$1import { CurrencyDisplay } from "@/components/ui/CurrencyDisplay";\n`);
        }
        // replace ر.ق
        content = content.replace(/>ر\.ق</g, '><CurrencyDisplay /><');
        content = content.replace(/} ر\.ق/g, '} <CurrencyDisplay />');
        content = content.replace(/ر\.ق<\/p>/g, '<CurrencyDisplay /></p>');
        fs.writeFileSync(file, content);
        console.log('Updated', file);
    }
});
