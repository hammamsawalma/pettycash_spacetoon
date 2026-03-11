import DashboardLayout from "@/components/layout/DashboardLayout";

export default function ManualPage() {
    return (
        <DashboardLayout title="User Manual">
            <ManualContent />
        </DashboardLayout>
    );
}

function ManualContent() {
    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-12">

            {/* ── Header Banner ── */}
            <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-[#102550] via-[#1a3a7c] to-[#122b5e] text-white p-8 flex items-center gap-6 shadow-xl shadow-blue-200/40">
                <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-4xl shadow-inner flex-shrink-0">
                    📋
                </div>
                <div>
                    <p className="text-blue-200 text-sm font-medium mb-1">Internal Employee Document</p>
                    <h1 className="text-2xl md:text-3xl font-bold">Project Management System Manual</h1>
                    <p className="text-blue-200 text-sm mt-1">Version 5.0 — March 2026</p>
                </div>
            </div>

            {/* ── Chapter 1: Overview ── */}
            <Chapter icon="🏢" num="Chapter 1" title="System Overview">
                <Section title="What is the System?">
                    <p>The Project Management System is an integrated digital platform that allows the company to track its projects, expenses, and employees in one place. The system helps organize work, track financial amounts, and ensure every riyal is spent correctly.</p>
                    <p>The system works online from any browser without needing to download any software.</p>
                </Section>
                <Section title="Core Concept">
                    <p>The system relies on a clear financial path that flows across three levels:</p>
                    <Steps items={[
                        { n: "1", text: <><strong>Company Wallet ← Projects:</strong> The Admin approves allocating a budget from the company wallet to each project.</> },
                        { n: "2", text: <><strong>Projects ← Employees (Custody):</strong> The Admin or Accountant issues cash amounts to employees called "Custody" to cover field expenses.</> },
                        { n: "3", text: <><strong>Employees ← Invoices:</strong> The employee uploads expense invoices, which the Accountant reviews and approves or rejects.</> },
                    ]} />
                </Section>
                <InfoBox type="info" title="Important Note" text="Every action in the system is recorded and tracked. No record can be permanently deleted without passing through the trash, ensuring full transparency." />
                <Section title="How to Login?">
                    <Steps items={[
                        { n: "1", text: "Open your web browser and navigate to the system link provided by the system admin." },
                        { n: "2", text: <>Enter the <b>Email</b> and Password given to you by the Admin.</> },
                        { n: "3", text: <>Click <b>"Login"</b>. You will be redirected to the dashboard.</> },
                        { n: "4", text: <>Your session remains active for <b>7 days</b> without needing to log in again.</> },
                    ]} />
                </Section>
                <InfoBox type="warn" title="Account Security" text="Do not share your password with anyone. If you forget it, contact the system admin immediately." />
            </Chapter>

            {/* ── Chapter 2: Roles ── */}
            <Chapter icon="👥" num="Chapter 2" title="Roles and Permissions">
                <p className="text-gray-600 mb-4">The system operates on a role-based model — each employee has their own account with specific permissions. There are <strong>four main roles</strong>:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    <RoleCard icon="👑" name="Admin" color="blue" desc="Has full control over the system. Manages projects, employees, and the wallet. Approves major actions and controls system settings." />
                    <RoleCard icon="📊" name="Accountant" color="blue" desc="Responsible for reviewing and approving or rejecting invoices, and monitoring the company wallet. Can issue and manage custodies and settle employee debts." />
                    <RoleCard icon="🧭" name="General Manager" color="green" desc="Views the entire financial system, projects, and reports. Can approve purchases, but cannot create projects or upload invoices." />
                    <RoleCard icon="👷" name="Employee" color="orange" desc="Works within their assigned projects. Receives custodies, confirms receipt with an e-signature, and uploads expense invoices. Views personal debts." />
                </div>
                <Section title="Permissions Comparison Table">
                    <PermTable rows={[
                        ["Create a new project", true, false, false, false],
                        ["Permanently close a project", true, false, false, false],
                        ["Add / Edit employee", true, false, false, false],
                        ["Issue custody to employee", true, true, false, false],
                        ["Confirm custody receipt", false, false, false, true],
                        ["Upload new invoice", true, true, false, true],
                        ["Upload company expense invoice", true, true, false, false],
                        ["Approve / Reject invoice", true, true, false, false],
                        ["Create purchase list", true, false, true, "Purchases Coordinator"],
                        ["Settle employee debts", true, true, false, false],
                        ["View personal debts", true, true, true, true],
                        ["Deposit into wallet", true, false, false, false],
                        ["Allocate budget to project", true, false, false, false],
                        ["Change global currency", true, false, false, false],
                        ["Reports and Statistics", true, true, true, false],
                        ["Trash", true, false, false, false],
                        ["Submit Tech Support ticket", true, true, true, true],
                    ]} />
                </Section>
            </Chapter>

            {/* ── Chapter 3: Dashboard ── */}
            <Chapter icon="🏠" num="Chapter 3" title="Dashboard">
                <p className="text-gray-600 mb-4">Upon logging in, the main dashboard opens automatically. It displays different information based on your role.</p>
                <Section title="What each role sees on the dashboard">
                    <SubSection title="👑 Admin and Accountant see:">
                        <FeatureList items={[
                            "Comprehensive financial overview (Total Expenses, Cash Balance, Company Expenses, and Liquidity Forecast)",
                            "Total number of projects (Ongoing and Completed)",
                            "Today's revenues and expenses",
                            "Last 4 pending invoices awaiting review",
                            "Monthly and annual project charts",
                        ]} />
                    </SubSection>
                    <SubSection title="🧭 General Manager sees:">
                        <FeatureList items={[
                            "Comprehensive view of company performance: Wallet, Projects, Employees",
                            "Overall cash flow: Deposits, Custodies, Invoices, Company Expenses, Wallet Balance",
                            "Pending invoices and urgent purchases",
                            "Latest projects and their financial details",
                        ]} />
                    </SubSection>
                    <SubSection title="👷 Employee sees:">
                        <FeatureList items={[
                            "Current projects they are a member of",
                            "Total received custodies, spent amounts, and remaining balance",
                            "Personal debt alerts with a direct link (if any)",
                            "Custodies pending confirmation (E-signature)",
                        ]} />
                    </SubSection>
                </Section>
            </Chapter>

            {/* ── Chapter 4: Projects ── */}
            <Chapter icon="📁" num="Chapter 4" title="Project Management">
                <p className="text-gray-600 mb-4">The project is the core unit in the system. Every expense, invoice, and custody is linked to a specific project. A project goes through three states: <strong>In Progress — Completed — Deleted</strong>.</p>
                <Section title="Create a new project (Admin only)">
                    <Steps items={[
                        { n: "1", text: <>From the sidebar, click <b>"Projects"</b>.</> },
                        { n: "2", text: <>Click on the <b>"New Project"</b> button.</> },
                        { n: "3", text: <>Enter the <b>Project Name</b> (mandatory), description, start/end dates, and planned budget.</> },
                        { n: "4", text: <>Select <b>Team Members</b> from the employee list, and assign a <b>specific role</b> to each (e.g., Project Manager, Accountant, or regular Employee).</> },
                        { n: "5", text: <>Click <b>"Save"</b>. The project will appear immediately in the list.</> },
                    ]} />
                </Section>
                <InfoBox type="tip" title="Financial Display Updates" text="Project cards and details pages display real-time updates: Approved Expenses, Pending Expenses, Remaining Custody, and Estimated Remaining Balance." />
                <InfoBox type="warn" title="Note" text="Creating a project does not automatically allocate a budget to it. The actual budget is allocated separately from the company wallet." />
                <Section title="Permanently close a project (Admin only)">
                    <p className="text-gray-600">Before closing, the system requires:</p>
                    <FeatureList items={[
                        "No open custodies with unreturned balances",
                        "No pending invoices awaiting review",
                        "No unsettled personal debts",
                    ]} />
                </Section>
                <InfoBox type="danger" title="Warning" text="Closing is final and cannot be undone except through the archive page by the Admin." />
            </Chapter>

            {/* ── Chapter 5: Employees ── */}
            <Chapter icon="👩‍💼" num="Chapter 5" title="Employee Management">
                <p className="text-gray-600 mb-4">The Admin, Accountant, and General Manager can view the employee list, but adding, editing, and deleting is restricted to the Admin. Employees cannot see the employee list.</p>
                <Section title="Add a new employee (Admin only)">
                    <Steps items={[
                        { n: "1", text: <>From the sidebar, click <b>"Employees"</b>.</> },
                        { n: "2", text: <>Click <b>"Add Employee"</b>.</> },
                        { n: "3", text: <>Enter: <b>Full Name, Phone Number</b> (mandatory), Email, Job Title, and Password.</> },
                        { n: "4", text: <>Select the <b>Role</b>: Employee, Accountant, or General Manager.</> },
                        { n: "5", text: <>Click <b>"Save"</b>. The employee can now log in immediately.</> },
                    ]} />
                </Section>
                <InfoBox type="info" title="Unique Phone Number" text="Duplicate phone numbers or emails cannot be registered in the system." />
            </Chapter>

            {/* ── Chapter 6: Custody ── */}
            <Chapter icon="💰" num="Chapter 6" title="Financial Custodies">
                <p className="text-gray-600 mb-4">"Custody" is a financial amount handed to an employee in cash or bank transfer to cover field work expenses. There are two types: <strong>Project Custody</strong> (from a project budget) and <strong>External Custody</strong> (without a project).</p>
                <Section title="How does custody work?">
                    <Steps items={[
                        { n: "1", text: <><b>Issuance:</b> The Admin or Accountant issues an amount to the employee from a project budget or as an external custody.</> },
                        { n: "2", text: <><b>E-Signature Confirmation:</b> The employee receives a notification and must <b>sign electronically</b> to confirm receipt before uploading any invoice.</> },
                        { n: "3", text: <><b>Spending:</b> Whenever an invoice linked to the custody is approved, its amount is automatically deducted from the balance.</> },
                        { n: "4", text: <><b>Return:</b> When there is a surplus, the employee can submit a "Cash Return" request from the My Custodies page for the Admin or Accountant to confirm receipt.</> },
                    ]} />
                </Section>
                <InfoBox type="danger" title="Very Important" text="You cannot upload an invoice from a custody that has not been confirmed via e-signature. Confirmation is mandatory via the Custodies page." />
                <Section title="External Custody (New in v5)">
                    <p className="text-gray-600">Custody not linked to a specific project — used for general or operational expenses. Issued directly by the Admin or Accountant.</p>
                </Section>
                <Section title="My Custodies Page">
                    <p className="text-gray-600">A dedicated page for employees enabling them to fully manage and track their custodies:</p>
                    <FeatureList items={[
                        "View all active and completed custodies.",
                        "Confirm receipt of new custody via e-signature or reject it with a reason.",
                        "Return remaining custody cash to the Admin with secure documentation.",
                    ]} />
                </Section>
            </Chapter>

            {/* ── Chapter 7: Invoices ── */}
            <Chapter icon="🧾" num="Chapter 7" title="Invoices and Expenses">
                <p className="text-gray-600 mb-4">An invoice is an official document proving the expenditure of a specific amount. It can be a <strong>Project Invoice</strong> (linked to a project) or a <strong>Company Expense Invoice</strong> (without a project — for Admin and Accountant only).</p>
                <Section title="Upload a new invoice">
                    <Steps items={[
                        { n: "1", text: <>From the menu, click <b>"Invoices"</b> then <b>"New Invoice"</b>.</> },
                        { n: "2", text: <>Select the <b>Project</b> and enter the <b>Reference Number</b> (unique), Date, and Total Amount. Or enable <b>"Company Expense"</b> for non-project invoices.</> },
                        { n: "3", text: <>Select the <b>Expense Category</b> and Payment Method.</> },
                        { n: "4", text: "Upload an image or PDF of the invoice (max 5MB)." },
                        { n: "5", text: <>Click <b>"Upload Invoice"</b>.</> },
                    ]} />
                </Section>
                <InfoBox type="info" title="Invoice Permissions" text="General Manager cannot upload invoices. Employees only upload invoices for their projects. Admin and Accountant can upload project invoices or company expenses." />
                <Section title="Payment Methods">
                    <div className="space-y-2">
                        <div className="p-3 rounded-xl bg-blue-50 border border-blue-100"><strong>From Custody (CUSTODY):</strong> The amount is deducted from the employee's custody balance upon approval.</div>
                        <div className="p-3 rounded-xl bg-blue-50 border border-blue-100"><strong>From Personal Pocket (PERSONAL):</strong> Recorded as a "debt" owed by the company to the employee, settled later.</div>
                        <div className="p-3 rounded-xl bg-green-50 border border-green-100"><strong>Split (SPLIT):</strong> Part custody and part personal — the employee specifies the distribution.</div>
                    </div>
                </Section>
                <InfoBox type="warn" title="Segregation of Duties" text="An employee cannot approve an invoice they created (except the Admin)." />
                <InfoBox type="info" title="Auto-Approval" text="The Admin can set a maximum limit for auto-approval. If the invoice amount is below it, it is approved immediately." />
            </Chapter>

            {/* ── Chapter 8: Purchases ── */}
            <Chapter icon="🛒" num="Chapter 8" title="Purchases List">
                <InfoBox type="warn" title="Request Creation Permissions" text="Purchase requests can be created by the Admin and General Manager at the global level, and by the Purchases Coordinator (PROJECT_MANAGER) within their projects. Regular employees can only execute requests." />
                <Section title="Purchase Request Statuses">
                    <div className="overflow-x-auto rounded-xl">
                        <table className="w-full text-sm border-collapse min-w-[320px]">
                            <thead><tr className="bg-[#102550] text-white"><th className="p-3 text-left rounded-tl-xl">Status</th><th className="p-3 text-left rounded-tr-xl">Meaning</th></tr></thead>
                            <tbody className="divide-y divide-gray-100">
                                {[
                                    ["🟡 Requested", "Purchase request created and awaiting execution"],
                                    ["🔵 In Progress", "Employee started heading out to purchase"],
                                    ["🟢 Purchased", "Employee bought the item and linked it to an invoice"],
                                    ["🔴 Cancelled", "Request cancelled by Purchases Coordinator or Admin"],
                                ].map(([s, m], i) => (
                                    <tr key={i} className={i % 2 === 1 ? "bg-gray-50" : ""}><td className="p-3">{s}</td><td className="p-3 text-gray-600">{m}</td></tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Section>
            </Chapter>

            {/* ── Chapter 9: Debts ── */}
            <Chapter icon="💳" num="Chapter 9" title="Personal Employee Debts">
                <p className="text-gray-600 mb-4">When an employee pays from their own money for work purposes, the system automatically records this as a <strong>"Debt"</strong> owed by the company. Admin and Accountant see it for all employees, the employee sees only theirs.</p>
                <Section title="Settle Employee Debt (Admin or Accountant)">
                    <Steps items={[
                        { n: "1", text: <>Open the <b>"Debts"</b> page from the sidebar and find the employee.</> },
                        { n: "2", text: <>Click <b>"Settle"</b> next to the debt, or <b>"Settle All"</b> to clear all at once.</> },
                        { n: "3", text: "The debt is marked as \"Settled\" with the time, date, and user who settled it." },
                    ]} />
                </Section>
            </Chapter>

            {/* ── Chapter 10: Wallet ── */}
            <Chapter icon="🏦" num="Chapter 10" title="Company Wallet">
                <p className="text-gray-600 mb-4">The company wallet is the central financial repository. It is visible only to the Admin and Accountant.</p>
                <Section title="Deposit into Wallet (Admin only)">
                    <Steps items={[
                        { n: "1", text: <>From the menu click <b>"Wallet"</b> then <b>"New Deposit"</b>.</> },
                        { n: "2", text: "Enter the amount and add an explanatory note." },
                        { n: "3", text: <>Click <b>"Confirm Deposit"</b>. The amount is immediately added to the balance.</> },
                    ]} />
                </Section>
                <InfoBox type="info" title="Budget Return on Closure" text="When a project is closed, any unspent budget is automatically returned to the company wallet." />
            </Chapter>

            {/* ── Chapter 11-17 Combined ── */}
            <Chapter icon="🗃️" num="Chapters 11 — 17" title="Financial Requests • Reports • Chats • Notifications • Archive • Trash • Tech Support">
                <Section title="Financial Requests">
                    <p className="text-gray-600">Allows the Accountant to submit official requests to the Admin. Types: debt settlement, budget allocation, custody return. The Admin approves or rejects them with a reason.</p>
                </Section>
                <Section title="Reports and Analytics">
                    <p className="text-gray-600">Admin, Accountant, and General Manager see all reports. Employees do not see reports. Reports can be filtered by different time periods.</p>
                </Section>
                <Section title="Project Chats">
                    <p className="text-gray-600">Chats are strictly linked to projects (no personal messages). Each project has a dedicated chat channel for its members. Notifications are automatically sent to relevant parties for every event.</p>
                </Section>
                <Section title="Trash (Admin only)">
                    <p className="text-gray-600">Any deleted item goes to the trash first. The Admin can restore it or permanently delete it. Any item in the trash for over 30 days is automatically deleted.</p>
                    <InfoBox type="danger" title="Warning" text="Permanent deletion cannot be undone by any means." />
                </Section>
                <Section title="Technical Support">
                    <Steps items={[
                        { n: "1", text: <>From the menu click <b>"Support"</b>.</> },
                        { n: "2", text: "Select the ticket type (Issue / Suggestion / Inquiry) and priority level." },
                        { n: "3", text: <>Enter a clear title and description, then click <b>"Submit"</b>. The ticket instantly reaches the Admin.</> },
                    ]} />
                </Section>
            </Chapter>

            {/* ── Final summary table ── */}
            <div className="rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                <div className="bg-gradient-to-r from-[#102550] to-[#122b5e] text-white px-6 py-4">
                    <h2 className="text-lg font-bold">📌 Comprehensive Permissions Reference Table</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50"><tr>
                            <th className="p-3 text-left font-bold text-gray-700">Page / Function</th>
                            <th className="p-3 text-center text-blue-700">👑 Admin</th>
                            <th className="p-3 text-center text-blue-700">📊 Accountant</th>
                            <th className="p-3 text-center text-green-700">🧭 General Manager</th>
                            <th className="p-3 text-center text-orange-700">👷 Employee</th>
                        </tr></thead>
                        <tbody className="divide-y divide-gray-100">
                            {[
                                ["Main Dashboard", "✔ Full", "✔ Financial", "✔ Comprehensive", "✔ Own Custody"],
                                ["Create / Close Project", true, false, false, false],
                                ["Add / Edit Employee", true, false, false, false],
                                ["Issue Custody", true, true, false, false],
                                ["Confirm Custody (Signature)", false, false, false, true],
                                ["Upload Project Invoice", true, true, false, true],
                                ["Upload Company Expense", true, true, false, false],
                                ["Approve / Reject Invoice", true, true, false, false],
                                ["Create Purchases", true, false, true, "Purchases Coordinator"],
                                ["Settle Debts", true, true, false, false],
                                ["View Personal Debts", true, true, true, true],
                                ["Deposit into Wallet", true, false, false, false],
                                ["Change Global Currency", true, false, false, false],
                                ["Reports", true, true, true, false],
                                ["Trash", true, false, false, false],
                                ["General Settings", true, false, false, false],
                                ["Project Chats", true, true, true, true],
                                ["Submit Support Ticket", true, true, true, true],
                            ].map(([label, a, b, c, d], i) => (
                                <tr key={i} className={i % 2 === 1 ? "bg-gray-50/50" : ""}>
                                    <td className="p-3 font-medium text-gray-800">{String(label)}</td>
                                    {[a, b, c, d].map((v, j) => (
                                        <td key={j} className="p-3 text-center">
                                            {v === true ? <span className="text-green-600 font-bold text-base">✔</span>
                                                : v === false ? <span className="text-red-400 font-bold text-base">✘</span>
                                                    : <span className="text-xs text-gray-500 font-medium">{String(v)}</span>}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Footer */}
            <div className="text-center text-sm text-gray-400 pt-4 border-t border-gray-100">
                Project Management System — Comprehensive User Manual — Version 5.0 — March 2026
            </div>
        </div>
    );
}

/* ─────────────── Helper Components ─────────────── */

function Chapter({ icon, num, title, children }: { icon: string; num: string; title: string; children: React.ReactNode }) {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-[#102550] to-[#122b5e] text-white px-6 py-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-2xl flex-shrink-0">{icon}</div>
                <div>
                    <div className="text-blue-200 text-xs font-medium tracking-wide">{num}</div>
                    <div className="text-lg font-bold leading-snug">{title}</div>
                </div>
            </div>
            <div className="p-6 space-y-5">{children}</div>
        </div>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div>
            <h2 className="flex items-center gap-2 text-base font-bold text-gray-800 mb-3">
                <span className="w-1 h-5 rounded-full bg-gradient-to-b from-[#102550] to-[#60a5fa] block flex-shrink-0" />
                {title}
            </h2>
            <div className="space-y-2">{children}</div>
        </div>
    );
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="mb-3">
            <h3 className="text-sm font-bold text-gray-700 mb-2">{title}</h3>
            {children}
        </div>
    );
}

function Steps({ items }: { items: { n: string; text: React.ReactNode }[] }) {
    return (
        <ol className="space-y-2">
            {items.map((item, i) => (
                <li key={i} className="flex gap-3 items-start bg-[#dbeafe] border border-[#93c5fd] rounded-xl p-3">
                    <span className="min-w-6 h-6 rounded-full bg-gradient-to-br from-[#102550] to-[#2563eb] text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{item.n}</span>
                    <span className="text-sm text-gray-700 leading-relaxed">{item.text}</span>
                </li>
            ))}
        </ol>
    );
}

function InfoBox({ type, title, text }: { type: "info" | "warn" | "danger" | "tip"; title: string; text: string }) {
    const styles = {
        info: "bg-blue-50 border-blue-200 text-blue-800",
        warn: "bg-amber-50 border-amber-200 text-amber-800",
        danger: "bg-red-50 border-red-200 text-red-800",
        tip: "bg-emerald-50 border-emerald-200 text-emerald-800",
    };
    const icons = { info: "💡", warn: "⚠️", danger: "🔴", tip: "✅" };
    return (
        <div className={`rounded-xl border p-4 flex gap-3 items-start ${styles[type]}`}>
            <span className="text-xl flex-shrink-0">{icons[type]}</span>
            <div className="text-sm leading-relaxed"><strong className="block mb-0.5">{title}</strong>{text}</div>
        </div>
    );
}

function FeatureList({ items }: { items: string[] }) {
    return (
        <ul className="space-y-1.5">
            {items.map((item, i) => (
                <li key={i} className="flex gap-2 items-start text-sm text-gray-700">
                    <span className="text-[#102550] font-bold mt-0.5">→</span>
                    <span>{item}</span>
                </li>
            ))}
        </ul>
    );
}

function RoleCard({ icon, name, color, desc }: { icon: string; name: string; color: string; desc: string }) {
    const colors: Record<string, string> = {
        blue: "bg-blue-50 border-blue-200",
        green: "bg-emerald-50 border-emerald-200",
        orange: "bg-orange-50 border-orange-200",
    };
    return (
        <div className={`rounded-xl border p-4 ${colors[color]}`}>
            <div className="text-2xl mb-2">{icon}</div>
            <div className="font-bold text-gray-800 mb-1 text-sm">{name}</div>
            <div className="text-xs text-gray-600 leading-relaxed">{desc}</div>
        </div>
    );
}

function PermTable({ rows }: { rows: (string | boolean | null)[][] }) {
    return (
        <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
            <table className="w-full text-sm">
                <thead>
                    <tr className="bg-[#102550] text-white">
                        <th className="p-3 text-left">Action</th>
                        <th className="p-3 text-center">👑 Admin</th>
                        <th className="p-3 text-center">📊 Accountant</th>
                        <th className="p-3 text-center">🧭 Gen. Manager</th>
                        <th className="p-3 text-center">👷 Employee</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {rows.map((row, i) => (
                        <tr key={i} className={i % 2 === 1 ? "bg-gray-50/50" : ""}>
                            <td className="p-3 font-medium text-gray-800">{String(row[0])}</td>
                            {row.slice(1).map((v, j) => (
                                <td key={j} className="p-3 text-center">
                                    {v === true ? <span className="text-green-600 font-bold">✔</span>
                                        : v === false ? <span className="text-red-400 font-bold">✘</span>
                                            : <span className="text-xs text-gray-500">{String(v)}</span>}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
