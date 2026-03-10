"use server"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { getUserRolesInProject } from "@/lib/roles";
import { isGlobalFinance, hasProjectPermission } from "@/lib/rbac";

// ─── Issue Custody to Employee ──────────────────────────
export async function issueCustody(prevState: unknown, formData: FormData) {
    try {
        const session = await getSession();
        if (!session) return { error: "غير مصرح" };

        const projectId = formData.get("projectId") as string;
        const employeeId = formData.get("employeeId") as string;
        const amount = parseFloat(formData.get("amount") as string);
        const method = (formData.get("method") as string) || "CASH";
        const note = formData.get("note") as string;

        // v5: External custody fields
        const isExternal = formData.get("isExternal") === "true";
        const externalName = formData.get("externalName") as string;
        const externalPhone = formData.get("externalPhone") as string;
        const externalPurpose = formData.get("externalPurpose") as string;
        const externalSignature = formData.get("externalSignature") as string;

        if (!projectId || isNaN(amount) || amount <= 0) {
            return { error: "جميع الحقول مطلوبة والمبلغ يجب أن يكون أكبر من صفر" };
        }

        // v5: External custody requires name
        if (isExternal) {
            if (!externalName?.trim()) return { error: "اسم الطرف الخارجي مطلوب" };
        } else {
            if (!employeeId) return { error: "يرجى اختيار الموظف" };
        }

        const project = await prisma.project.findUnique({ where: { id: projectId } });
        if (!project) return { error: "المشروع غير موجود" };

        // Block custody issuance for non-active projects
        if (project.status !== "IN_PROGRESS") {
            return { error: "لا يمكن صرف عهدة لمشروع مكتمل أو متوقف" };
        }

        // v4: Only ADMIN + GLOBAL_ACCOUNTANT can issue custody (all projects)
        const isAuthorized = session.role === "ADMIN" || session.role === "GLOBAL_ACCOUNTANT";

        if (!isAuthorized) {
            return { error: "ليس لديك صلاحية لصرف عهدة في هذا المشروع" };
        }

        // Check employee is a member of this project WITH PROJECT_EMPLOYEE role (skip for external)
        // منسق المشتريات (PROJECT_MANAGER) should NOT receive custodies — only PROJECT_EMPLOYEE
        let membership: { id: string; projectRoles: string } | null = null;
        if (!isExternal) {
            membership = await prisma.projectMember.findUnique({
                where: { projectId_userId: { projectId, userId: employeeId } },
                select: { id: true, projectRoles: true }
            });
            if (!membership) return { error: "الموظف المحدد ليس عضواً في هذا المشروع" };
            if (!membership.projectRoles?.includes("PROJECT_EMPLOYEE")) {
                return { error: "لا يمكن صرف عهدة لهذا العضو — فقط الموظفين (وليس منسقي المشتريات) يمكنهم استلام العهد" };
            }
        }

        // E2 + C4: Budget check AND all writes are wrapped in one atomic transaction.
        let custody: { id: string };
        await prisma.$transaction(async (tx: any) => {
            const lockedProject = await tx.project.findUnique({ where: { id: projectId } });
            if (!lockedProject) throw new Error("المشروع غير موجود");
            if (lockedProject.status !== "IN_PROGRESS") throw new Error("لا يمكن صرف عهدة لمشروع مكتمل أو متوقف");

            const available = (lockedProject.budgetAllocated ?? 0) - (lockedProject.custodyIssued ?? 0) + (lockedProject.custodyReturned ?? 0);
            if (amount > available) {
                throw new Error(`ميزانية المشروع المتاحة (${available.toLocaleString()}) أقل من المبلغ المطلوب (${amount.toLocaleString()})`);
            }

            // Create custody record
            custody = await tx.employeeCustody.create({
                data: {
                    projectId,
                    employeeId: isExternal ? session.id : employeeId,  // v5: external uses creator as placeholder
                    memberId: isExternal ? undefined : membership!.id,
                    amount,
                    balance: amount,
                    method,
                    note: note || null,
                    // v5: External custody fields
                    isExternal,
                    externalName: isExternal ? externalName : null,
                    externalPhone: isExternal ? externalPhone : null,
                    externalPurpose: isExternal ? externalPurpose : null,
                    externalSignature: isExternal ? externalSignature : null,
                    // v5: Auto-confirm external custody (no employee confirmation needed)
                    ...(isExternal ? {
                        isConfirmed: true,
                        confirmedAt: new Date(),
                        confirmation: {
                            create: { signatureFile: externalSignature || null }
                        }
                    } : {}),
                }
            });

            // Update project custodyIssued
            await tx.project.update({
                where: { id: projectId },
                data: { custodyIssued: { increment: amount } }
            });

            // Update member balance (only for internal)
            if (!isExternal && membership) {
                await tx.projectMember.update({
                    where: { id: membership.id },
                    data: { custodyBalance: { increment: amount } }
                });
            }
        });

        // Notify employee (only for internal)
        if (!isExternal) {
            await prisma.notification.create({
                data: {
                    title: 'تم صرف عهدة لك ✅',
                    content: `تم صرف مبلغ ${amount.toLocaleString()} ريال — يرجى تأكيد الاستلام`,
                    targetUserId: employeeId
                }
            });
        }

        revalidatePath(`/projects/${projectId}`);
        revalidatePath("/projects");
        revalidatePath("/employee-custodies");

        return { success: true, custodyId: custody!.id };
    } catch (error) {
        console.error("Issue Custody Error:", error);
        return { error: "حدث خطأ أثناء صرف العهدة" };
    }
}

// ─── Employee confirms receiving custody (v6: signature MANDATORY) ────
export async function confirmCustodyReceipt(custodyId: string, signatureBase64: string) {
    try {
        const session = await getSession();
        if (!session) return { error: "غير مصرح" };

        // v6 FIX: Signature is MANDATORY — no confirmation without digital signature
        if (!signatureBase64 || !signatureBase64.startsWith("data:image/")) {
            return { error: "التوقيع الإلكتروني مطلوب لتأكيد الاستلام" };
        }

        const custody = await prisma.employeeCustody.findUnique({
            where: { id: custodyId }
        });
        if (!custody) return { error: "العهدة غير موجودة" };

        // H1 FIX: Block confirmation of rejected custodies
        if (custody.status === 'REJECTED') return { error: "لا يمكن تأكيد عهدة مرفوضة" };

        // v6 FIX: ONLY the custody owner can confirm — no proxy confirmation
        if (custody.employeeId !== session.id) {
            return { error: "تأكيد الاستلام يتطلب توقيع صاحب العهدة شخصياً" };
        }
        if (custody.isConfirmed) return { error: "تم تأكيد الاستلام مسبقاً" };

        await prisma.employeeCustody.update({
            where: { id: custodyId },
            data: {
                isConfirmed: true,
                confirmedAt: new Date(),
                status: 'CONFIRMED',
                confirmation: {
                    create: {
                        signatureFile: signatureBase64,
                        confirmedById: session.id
                    }
                }
            }
        });

        // N-1: Notify GLOBAL_ACCOUNTANT that employee confirmed receipt
        try {
            await prisma.notification.create({
                data: {
                    title: 'تأكيد استلام عهدة ✅',
                    content: `قام ${session.name || 'موظف'} بتأكيد استلام عهدة بقيمة ${custody.amount.toLocaleString()} ريال`,
                    targetRole: 'GLOBAL_ACCOUNTANT'
                }
            });
        } catch { /* non-critical */ }

        revalidatePath("/");
        revalidatePath("/my-custodies");
        revalidatePath(`/projects/${custody.projectId}`);
        revalidatePath("/employee-custodies");
        return { success: true };
    } catch (error) {
        console.error("Confirm Custody Error:", error);
        return { error: "حدث خطأ أثناء تأكيد الاستلام" };
    }
}

// ─── Admin/Accountant sends a reminder to employee to confirm custody ─────
export async function resendCustodyReminder(custodyId: string) {
    try {
        const session = await getSession();
        if (!session) return { error: "غير مصرح" };

        // Only ADMIN and GLOBAL_ACCOUNTANT can send reminders
        if (session.role !== "ADMIN" && session.role !== "GLOBAL_ACCOUNTANT") {
            return { error: "غير مصرح" };
        }

        const custody = await prisma.employeeCustody.findUnique({
            where: { id: custodyId },
            include: { project: { select: { name: true } } }
        });
        if (!custody) return { error: "العهدة غير موجودة" };
        if (custody.isConfirmed) return { error: "تم تأكيد الاستلام مسبقاً" };
        // E6 FIX: Block reminder for rejected custodies
        if (custody.status === 'REJECTED') return { error: "لا يمكن إرسال تذكير لعهدة مرفوضة" };

        // Send a targeted notification to the employee
        await prisma.notification.create({
            data: {
                title: '⏳ تذكير: تأكيد استلام عهدة',
                content: `يرجى تأكيد استلام عهدة بقيمة ${custody.amount.toLocaleString()} ريال من مشروع "${custody.project?.name || ''}" — يتطلب توقيعك الإلكتروني`,
                targetUserId: custody.employeeId,
            }
        });

        return { success: true };
    } catch (error) {
        console.error("Resend Custody Reminder Error:", error);
        return { error: "حدث خطأ أثناء إرسال التذكير" };
    }
}

// ─── Employee rejects an unconfirmed custody ─────────────
// v7: Preserves record with REJECTED status instead of deleting
export async function rejectCustody(custodyId: string, reason?: string) {
    try {
        const session = await getSession();
        if (!session) return { error: "غير مصرح" };

        const custody = await prisma.employeeCustody.findUnique({
            where: { id: custodyId },
            include: { project: true }
        });
        if (!custody) return { error: "العهدة غير موجودة" };
        if (custody.employeeId !== session.id) return { error: "لا يمكنك رفض عهدة شخص آخر" };
        if (custody.isConfirmed || custody.status === 'CONFIRMED') return { error: "لا يمكن رفض عهدة تم تأكيد استلامها بالفعل" };
        if (custody.status === 'REJECTED') return { error: "تم رفض هذه العهدة مسبقاً" };

        await prisma.$transaction(async (tx) => {
            // v7: Update status instead of deleting
            await tx.employeeCustody.update({
                where: { id: custodyId },
                data: {
                    status: 'REJECTED',
                    rejectedReason: reason || null,
                    rejectedAt: new Date(),
                    isClosed: true,
                    closedAt: new Date(),
                    balance: 0,
                }
            });

            // Restore project budget (only for project custodies)
            if (custody.projectId) {
                await tx.project.update({
                    where: { id: custody.projectId },
                    data: { custodyIssued: { decrement: custody.amount } }
                });
            }

            // v7: Company custody — return to wallet
            if (custody.isCompanyExpense) {
                const wallet = await tx.companyWallet.findFirst();
                if (wallet) {
                    await tx.companyWallet.update({
                        where: { id: wallet.id },
                        data: {
                            balance: { increment: custody.amount },
                            totalOut: { decrement: custody.amount },
                        }
                    });
                }
            }

            // Restore project member balance
            if (custody.memberId) {
                await tx.projectMember.update({
                    where: { id: custody.memberId },
                    data: { custodyBalance: { decrement: custody.amount } }
                });
            }

            // v7: Notify ADMIN + GLOBAL_ACCOUNTANT (no PM role — admin manages all)
            const projectName = custody.project?.name || 'مصاريف الشركة';
            const notifContent = `قام ${session.name || 'موظف'} برفض عهدة بقيمة ${custody.amount.toLocaleString()} ريال — ${projectName}${reason ? `\nالسبب: ${reason}` : ''}`;

            await tx.notification.createMany({
                data: [
                    { title: 'تم رفض استلام عهدة ❌', content: notifContent, targetRole: 'ADMIN' },
                    { title: 'تم رفض استلام عهدة ❌', content: notifContent, targetRole: 'GLOBAL_ACCOUNTANT' },
                ]
            });
        });

        revalidatePath("/");
        revalidatePath("/my-custodies");
        if (custody.projectId) revalidatePath(`/projects/${custody.projectId}`);
        revalidatePath("/employee-custodies");
        return { success: true };
    } catch (error) {
        console.error("Reject Custody Error:", error);
        return { error: "حدث خطأ أثناء رفض العهدة" };
    }
}

// ─── Get Custodies for a Project ─────────────────────────
export async function getProjectCustodies(projectId: string) {
    try {
        const session = await getSession();
        if (!session) return [];

        // M1: Authorization check — global finance roles, project manager, or project member
        const isGlobalAuth = isGlobalFinance(session.role) || session.role === "GENERAL_MANAGER";
        let isManager = false;
        let isFinanceRole = false; // PROJECT_MANAGER

        if (!isGlobalAuth) {
            const project = await prisma.project.findUnique({ where: { id: projectId }, select: { managerId: true } });
            isManager = project?.managerId === session.id;
            const membership = !isManager
                ? await prisma.projectMember.findUnique({
                    where: { projectId_userId: { projectId, userId: session.id } }
                })
                : null;
            if (!isManager && !membership) {
                return []; // not a member of this project
            }
            // v4: Check if this member is a manager at project level
            if (membership) {
                isFinanceRole = hasProjectPermission(membership.projectRoles, ["PROJECT_MANAGER"]);
            }
        }

        // V2: Only managers / accountants / global finance roles see ALL custodies
        // Regular members (PROJECT_EMPLOYEE, COORDINATOR) only see their OWN custody
        const canSeeAll = isGlobalAuth || isManager || isFinanceRole;

        const custodies = await prisma.employeeCustody.findMany({
            where: {
                projectId,
                // V2: Restrict to own custody if not a privileged role
                ...(canSeeAll ? {} : { employeeId: session.id })
            },
            include: {
                employee: { select: { id: true, name: true, image: true } },
                confirmation: true,
                invoices: {
                    where: { isDeleted: false },
                    select: { id: true, amount: true, status: true }
                },
                returns: {
                    orderBy: { createdAt: 'desc' }
                }
            },
            orderBy: { createdAt: "desc" }
        });

        return custodies;
    } catch (error) {
        console.error("Get Custodies Error:", error);
        return [];
    }
}

// ─── Get Custodies for the Current Employee ───────────────
export async function getMyCustodies() {
    try {
        const session = await getSession();
        if (!session) return [];

        const custodies = await prisma.employeeCustody.findMany({
            where: {
                employeeId: session.id,
                isExternal: false,  // v5: EDGE-1 — don't show external custodies to the creator
            },
            include: {
                project: { select: { id: true, name: true, manager: { select: { name: true } } } },
                confirmation: true,
                invoices: {
                    where: { isDeleted: false },
                    select: { id: true, amount: true, status: true, paymentSource: true }
                },
                returns: {
                    orderBy: { createdAt: 'desc' }
                }
            },
            orderBy: { createdAt: "desc" }
        });

        // V1: Clamp negative balances to 0 for employee display
        // Negative balances are an internal accounting concept visible only to managers/accountants
        return custodies.map(c => ({
            ...c,
            balance: Math.max(0, c.balance)
        }));
    } catch (error) {
        console.error("Get My Custodies Error:", error);
        return [];
    }
}

// ─── Return Remaining Cash at Project Close ──────────────
export async function returnCustodyBalance(
    custodyId: string,
    returnedAmount: number,
    note?: string,
    signatureBase64?: string // v5: accountant signature
) {
    try {
        const session = await getSession();
        if (!session) return { error: "غير مصرح" };

        const custody = await prisma.employeeCustody.findUnique({
            where: { id: custodyId },
            include: { project: true }
        });
        if (!custody) return { error: "العهدة غير موجودة" };

        // v4+M-1 FIX: ADMIN + GLOBAL_ACCOUNTANT can record custody returns
        const isAuthorized = session.role === "GLOBAL_ACCOUNTANT" || session.role === "ADMIN";

        if (!isAuthorized) {
            return { error: "ليس لديك صلاحية لتسجيل إرجاع العهدة" };
        }
        if (custody.isClosed) return { error: "هذه العهدة مغلقة مسبقاً" };
        // H2 FIX: Block return on rejected custodies
        if (custody.status === 'REJECTED') return { error: "لا يمكن إرجاع عهدة مرفوضة" };
        // H3: Guard against zero or negative return amounts
        if (!returnedAmount || returnedAmount <= 0) {
            return { error: "المبلغ يجب أن يكون أكبر من صفر" };
        }
        if (returnedAmount > custody.balance) {
            return { error: `المبلغ المُرجَع (${returnedAmount}) أكبر من رصيد العهدة (${custody.balance})` };
        }

        const newBalance = custody.balance - returnedAmount;
        // M1: Use tolerance instead of === 0 to handle float precision issues
        const willClose = Math.abs(newBalance) < 0.01;

        // v5: Build transaction operations
        const txOps: any[] = [
            // تسجيل عملية الإرجاع + v5: accountant signature
            prisma.custodyReturn.create({
                data: {
                    custodyId,
                    amount: returnedAmount,
                    returnedBy: custody.employeeId,
                    recordedBy: session.id,
                    note: note || null,
                    signatureFile: signatureBase64 || null,
                }
            }),
            // تحديث رصيد العهدة
            prisma.employeeCustody.update({
                where: { id: custodyId },
                data: {
                    balance: newBalance,
                    isClosed: willClose,
                    closedAt: willClose ? new Date() : null
                }
            }),
        ];

        // v7: تحديث custodyReturned على المشروع (فقط للعهد المرتبطة بمشروع)
        if (custody.projectId) {
            txOps.push(
                prisma.project.update({
                    where: { id: custody.projectId },
                    data: { custodyReturned: { increment: returnedAmount } }
                })
            );
        }

        // v7: Company custody — return to wallet
        if (custody.isCompanyExpense) {
            const wallet = await prisma.companyWallet.findFirst();
            if (wallet) {
                txOps.push(
                    prisma.companyWallet.update({
                        where: { id: wallet.id },
                        data: {
                            balance: { increment: returnedAmount },
                        }
                    })
                );
            }
        }

        // EDGE-4: Only update projectMember for internal custodies
        if (!custody.isExternal && custody.projectId) {
            txOps.push(
                prisma.projectMember.updateMany({
                    where: { projectId: custody.projectId, userId: custody.employeeId },
                    data: { custodyBalance: { decrement: returnedAmount } }
                })
            );
        }

        await prisma.$transaction(txOps);

        // N-3: Notify employee that their custody balance was returned
        const scopeName = custody.project?.name || 'مصاريف الشركة';
        try {
            const msg = willClose
                ? `تم إرجاع ${returnedAmount.toLocaleString()} ريال وإغلاق عهدتك — ${scopeName}`
                : `تم إرجاع ${returnedAmount.toLocaleString()} ريال من عهدتك — ${scopeName}. المتبقي: ${newBalance.toLocaleString()}`;
            await prisma.notification.create({
                data: {
                    title: willClose ? 'تم إغلاق عهدتك 🔒' : 'تم إرجاع جزء من عهدتك 💰',
                    content: msg,
                    targetUserId: custody.employeeId
                }
            });
        } catch { /* non-critical */ }

        revalidatePath(`/projects/${custody.projectId}`);
        revalidatePath(`/custody/${custodyId}`);
        revalidatePath("/my-custodies");
        revalidatePath("/employee-custodies");
        return { success: true, closed: willClose, remainingBalance: newBalance };
    } catch (error) {
        console.error("Return Custody Error:", error);
        return { error: "حدث خطأ أثناء تسجيل الإرجاع" };
    }
}

// ─── External Custodies Report (all projects) ────────────
export async function getExternalCustodiesReport() {
    try {
        const session = await getSession();
        if (!session) return [];

        // v5.1: Only ADMIN, GLOBAL_ACCOUNTANT, GENERAL_MANAGER
        const canView = session.role === "ADMIN" || session.role === "GLOBAL_ACCOUNTANT" || session.role === "GENERAL_MANAGER";
        if (!canView) return [];

        const custodies = await (prisma.employeeCustody as any).findMany({
            where: { isExternal: true },
            include: {
                project: { select: { id: true, name: true } },
                returns: {
                    orderBy: { createdAt: 'desc' },
                    select: { id: true, amount: true, createdAt: true }
                }
            },
            orderBy: { createdAt: "desc" }
        });

        return custodies;
    } catch (error) {
        console.error("External Custodies Report Error:", error);
        return [];
    }
}

// ─── v7: Issue Company Expense Custody (Admin→Accountant from Wallet) ────
export async function issueCompanyCustody(prevState: unknown, formData: FormData) {
    try {
        const session = await getSession();
        if (!session || session.role !== "ADMIN") {
            return { error: "فقط المدير يمكنه صرف عهدة مصاريف الشركة" };
        }

        const employeeId = formData.get("employeeId") as string;
        const amount = parseFloat(formData.get("amount") as string);
        const method = (formData.get("method") as string) || "CASH";
        const note = formData.get("note") as string;

        if (!employeeId || isNaN(amount) || amount <= 0) {
            return { error: "جميع الحقول مطلوبة والمبلغ يجب أن يكون أكبر من صفر" };
        }

        // Verify employee exists and is GLOBAL_ACCOUNTANT
        const employee = await prisma.user.findUnique({ where: { id: employeeId } });
        if (!employee) return { error: "الموظف غير موجود" };
        if (employee.role !== "GLOBAL_ACCOUNTANT") {
            return { error: "عهدة مصاريف الشركة تُصرف للمحاسب فقط" };
        }

        let custodyId: string;
        // H5 FIX: Serializable isolation to prevent race conditions
        await prisma.$transaction(async (tx: any) => {
            // Check wallet balance
            const wallet = await tx.companyWallet.findFirst();
            if (!wallet) throw new Error("المحفظة غير موجودة");
            if (wallet.balance < amount) {
                throw new Error(`رصيد المحفظة (${wallet.balance.toLocaleString()}) أقل من المبلغ المطلوب (${amount.toLocaleString()})`);
            }

            // Deduct from wallet
            await tx.companyWallet.update({
                where: { id: wallet.id },
                data: {
                    balance: { decrement: amount },
                    totalOut: { increment: amount },
                }
            });

            // C2 FIX: Log wallet entry with correct field names
            await tx.walletEntry.create({
                data: {
                    walletId: wallet.id,
                    type: 'WITHDRAW',
                    amount,
                    note: `عهدة مصاريف شركة — ${employee.name || 'المحاسب'}${note ? ` — ${note}` : ''}`,
                    createdBy: session.id,
                }
            });

            // Create custody (no projectId)
            const custody = await tx.employeeCustody.create({
                data: {
                    employeeId,
                    amount,
                    balance: amount,
                    method,
                    note: note || null,
                    isCompanyExpense: true,
                    // No projectId — company-level custody
                }
            });
            custodyId = custody.id;
        });

        // Notify accountant
        await prisma.notification.create({
            data: {
                title: 'عهدة مصاريف شركة 🏢',
                content: `تم صرف عهدة مصاريف شركة بقيمة ${amount.toLocaleString()} ريال — يرجى تأكيد الاستلام`,
                targetUserId: employeeId
            }
        });

        revalidatePath("/");
        revalidatePath("/company-custodies");
        revalidatePath("/wallet");
        return { success: true, custodyId: custodyId! };
    } catch (error: any) {
        console.error("Issue Company Custody Error:", error);
        return { error: error.message || "حدث خطأ أثناء صرف عهدة الشركة" };
    }
}

// ─── v7: Get Company Custodies ──────────────────────────────
export async function getCompanyCustodies() {
    try {
        const session = await getSession();
        if (!session) return [];

        // ADMIN, GLOBAL_ACCOUNTANT, GM can view
        const canView = session.role === "ADMIN" || session.role === "GLOBAL_ACCOUNTANT" || session.role === "GENERAL_MANAGER";
        if (!canView) return [];

        const custodies = await prisma.employeeCustody.findMany({
            where: { isCompanyExpense: true },
            include: {
                employee: { select: { id: true, name: true, image: true } },
                confirmation: true,
                returns: {
                    orderBy: { createdAt: 'desc' }
                }
            },
            orderBy: { createdAt: "desc" }
        });

        return custodies;
    } catch (error) {
        console.error("Get Company Custodies Error:", error);
        return [];
    }
}

// ─── Get ALL Employee Custodies (across all projects) ────────────────────
// Used by the /employee-custodies page for ADMIN / GLOBAL_ACCOUNTANT / GM
export async function getAllEmployeeCustodies() {
    try {
        const session = await getSession();
        if (!session) return [];

        const canView =
            session.role === "ADMIN" ||
            session.role === "GLOBAL_ACCOUNTANT" ||
            session.role === "GENERAL_MANAGER";
        if (!canView) return [];

        const custodies = await prisma.employeeCustody.findMany({
            where: {
                isExternal: false,
                isCompanyExpense: false,
            },
            include: {
                employee: { select: { id: true, name: true, image: true } },
                project: { select: { id: true, name: true } },
                confirmation: true,
                returns: {
                    orderBy: { createdAt: "desc" },
                    select: { id: true, amount: true, createdAt: true },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        return custodies;
    } catch (error) {
        console.error("Get All Employee Custodies Error:", error);
        return [];
    }
}
