"use server"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache";
import { SessionData, getSession } from "@/lib/auth";
import { User } from "@prisma/client";
import { isGlobalFinance } from "@/lib/rbac";
import path from "path";
import fs from "fs";
import { createEmployeeSchema } from "@/lib/validations/employees";

export async function getEmployees(excludeAdmins: boolean = false) {
    try {
        const session = await getSession();
        if (!session) return [];

        // Global management roles see the full employee directory
        const allowedGlobalRoles = ["ADMIN", "GLOBAL_ACCOUNTANT", "GENERAL_MANAGER"];
        const isGlobalRole = allowedGlobalRoles.includes(session.role);

        let whereClause: any = { isDeleted: false };

        if (isGlobalRole) {
            // Global roles: full list, with optional admin exclusion
            if (excludeAdmins) {
                whereClause.role = { notIn: ["ADMIN", "GENERAL_MANAGER"] };
            }
        } else {
            // USER role: only see employees who share at least one project with the session user.
            // Step 1: find all projectIds this user is involved in (as manager or member)
            const [managedProjects, memberProjects] = await Promise.all([
                prisma.project.findMany({
                    where: { managerId: session.id, isDeleted: false },
                    select: { id: true }
                }),
                prisma.projectMember.findMany({
                    where: { userId: session.id },
                    select: { projectId: true }
                })
            ]);

            const projectIds = [
                ...managedProjects.map(p => p.id),
                ...memberProjects.map(m => m.projectId)
            ];

            if (projectIds.length === 0) {
                // Not involved in any project — sees nobody (empty contacts list)
                return [];
            }

            // Step 2: find all user IDs who are also in those projects (manager or member)
            const [coManagers, coMembers] = await Promise.all([
                prisma.project.findMany({
                    where: { id: { in: projectIds }, managerId: { not: null } },
                    select: { managerId: true }
                }),
                prisma.projectMember.findMany({
                    where: { projectId: { in: projectIds } },
                    select: { userId: true }
                })
            ]);

            const coWorkerIds = [
                ...coManagers.map(p => p.managerId as string),
                ...coMembers.map(m => m.userId)
            ].filter(Boolean);

            // Unique IDs, excluding the session user themselves
            const uniqueCoWorkerIds = [...new Set(coWorkerIds)].filter(id => id !== session.id);

            if (uniqueCoWorkerIds.length === 0) return [];

            whereClause = {
                isDeleted: false,
                id: { in: uniqueCoWorkerIds },
                ...(excludeAdmins ? { role: { notIn: ["ADMIN", "GENERAL_MANAGER"] } } : {})
            };
        }

        const users = await prisma.user.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { memberships: true, receivedMessages: true }
                }
            }
        });

        // Remove salary data from non-management roles
        if (!isGlobalFinance(session.role)) {
            const filteredUsers = users.map((u: User) => ({ ...u, salary: null }));
            return JSON.parse(JSON.stringify(filteredUsers));
        }

        return JSON.parse(JSON.stringify(users));
    } catch (error) {
        console.error("Employees Fetch Error:", error);
        return [];
    }
}

export async function getEmployeeById(id: string) {
    try {
        const session = await getSession();
        if (!session) return null;

        const employee = await prisma.user.findUnique({
            where: { id },
            include: {
                memberships: {
                    include: {
                        project: true
                    }
                }
            }
        });

        if (!employee) return null;

        // Strip salary if not admin/accountant and not their own profile
        if (!isGlobalFinance(session.role) && session.id !== id) {
            employee.salary = null;
        }

        return employee;
    } catch (error) {
        console.error("Employee Fetch Error:", error);
        return null;
    }
}

export async function createEmployee(prevState: unknown, formData: FormData) {
    try {
        const session = await getSession();
        // Only Admins can create new users
        if (!session || session.role !== "ADMIN") {
            return { error: "غير مصرح لك بإضافة موظفين، هذه الصلاحية للمدير فقط" };
        }

        const validatedFields = createEmployeeSchema.safeParse({
            name: formData.get("name"),
            email: formData.get("email"),
            phone: formData.get("phone"),
            role: formData.get("role"),
            jobTitle: formData.get("jobTitle"),
            password: formData.get("password"),
            salary: formData.get("salary"),
        });

        if (!validatedFields.success) {
            return { error: validatedFields.error.issues[0].message };
        }

        const { name, email, phone, role, jobTitle, password, salary } = validatedFields.data;
        const imageFile = formData.get("image") as File | null;

        // Check if phone or email already exists
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { phone },
                    ...(email ? [{ email }] : [])
                ]
            }
        });

        if (existingUser) {
            return { error: "رقم الهاتف أو البريد الإلكتروني مستخدم مسبقاً" };
        }

        let imagePath = undefined;
        if (imageFile && imageFile.size > 0) {
            const bytes = await imageFile.arrayBuffer();
            const buffer = Buffer.from(bytes);

            const fileName = `${Date.now()}-${imageFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
            const uploadDir = path.join(process.cwd(), 'public', 'uploads');

            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            const filePath = path.join(uploadDir, fileName);
            fs.writeFileSync(filePath, buffer);
            imagePath = `/uploads/${fileName}`;
        }

        const newEmployee = await prisma.user.create({
            data: {
                name,
                email: email || null,
                phone,
                password, // In a real app, hash this with bcrypt
                role: role || "USER",
                jobTitle: jobTitle || null,
                salary: salary,
                ...(imagePath && { image: imagePath })
            }
        });

        revalidatePath("/employees");
        return { success: true, employeeId: newEmployee.id };

    } catch (error) {
        console.error("Employee Creation Error:", error);
        return { error: error instanceof Error ? error.message : "حدث خطأ أثناء إضافة الموظف" };
    }
}

export async function updateEmployee(employeeId: string, prevState: unknown, formData: FormData) {
    try {
        const session = await getSession();
        // Only Admins can edit users
        if (!session || session.role !== "ADMIN") {
            return { error: "غير مصرح لك بتعديل بيانات الموظفين، هذه الصلاحية للمدير فقط" };
        }

        const name = formData.get("name") as string;
        const email = formData.get("email") as string;
        const phone = formData.get("phone") as string;
        const role = formData.get("role") as string;
        const jobTitle = formData.get("jobTitle") as string;
        const password = formData.get("password") as string;
        const salaryStr = formData.get("salary");
        const salary = salaryStr ? Number(salaryStr) : undefined;

        if (!name || !phone) {
            return { error: "الاسم ورقم الهاتف حقول مطلوبة" };
        }

        const existingUser = await prisma.user.findUnique({
            where: { id: employeeId }
        });

        if (!existingUser) return { error: "الموظف غير موجود" };

        // Check if phone or email already exists for another user
        const duplicateCheck = await prisma.user.findFirst({
            where: {
                id: { not: employeeId },
                OR: [
                    { phone },
                    ...(email ? [{ email }] : [])
                ]
            }
        });

        if (duplicateCheck) {
            return { error: "رقم الهاتف أو البريد الإلكتروني مستخدم مسبقاً لموظف آخر" };
        }

        const imageFile = formData.get("image") as File | null;
        let imagePath = undefined;
        if (imageFile && imageFile.size > 0) {
            const bytes = await imageFile.arrayBuffer();
            const buffer = Buffer.from(bytes);

            const fileName = `${Date.now()}-${imageFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
            const uploadDir = path.join(process.cwd(), 'public', 'uploads');

            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            const filePath = path.join(uploadDir, fileName);
            fs.writeFileSync(filePath, buffer);
            imagePath = `/uploads/${fileName}`;
        }

        const dataToUpdate: any = {
            name,
            email: email || null,
            phone,
            role: role || existingUser.role,
            jobTitle: jobTitle || null,
            ...(salary !== undefined && { salary }),
            ...(imagePath && { image: imagePath }),
            ...(password && { password }) // Update password only if provided
        };

        const updatedEmployee = await prisma.user.update({
            where: { id: employeeId },
            data: dataToUpdate
        });

        revalidatePath("/employees");
        revalidatePath(`/employees/${employeeId}`);
        return { success: true, employeeId: updatedEmployee.id };

    } catch (error) {
        console.error("Employee Update Error:", error);
        return { error: error instanceof Error ? error.message : "حدث خطأ أثناء تعديل بيانات الموظف" };
    }
}
