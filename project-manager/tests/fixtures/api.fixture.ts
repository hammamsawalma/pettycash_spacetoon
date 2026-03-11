import { test as base, APIRequestContext } from '@playwright/test';
import { PrismaClient, User, Project, Category } from '@prisma/client';

const prisma = new PrismaClient();

type ApiFixtures = {
    db: PrismaClient;
    testUser: User;
    testProject: Project;
    testCategory: Category;
};

export const test = base.extend<ApiFixtures>({
    db: async ({}, use) => {
        await use(prisma);
    },
    
    // We will use the PM (Project Manager/Coordinator) for most expense creation tests
    testUser: async ({ db }, use) => {
        const user = await db.user.findUnique({ where: { email: 'coordinator@pocket.com' } });
        if (!user) throw new Error('Test User coordinator@pocket.com not found. Run DB Seed first.');
        await use(user);
    },

    testProject: async ({ db, testUser }, use) => {
        let project = await db.project.findFirst({ where: { name: 'E2E Test Project - V2 Expenses' } });
        if (!project) {
            project = await db.project.create({
                data: {
                    name: 'E2E Test Project - V2 Expenses',
                    status: 'IN_PROGRESS',
                    budget: 100000,
                    budgetAllocated: 100000,
                    branchId: testUser.branchId, // Attach to the same branch to fix visibility scope
                    members: {
                        create: {
                            userId: testUser.id,
                            projectRoles: 'PROJECT_EMPLOYEE'
                        }
                    }
                }
            });
        } else if ((project.budgetAllocated ?? 0) === 0 || project.branchId !== testUser.branchId) {
            // Ensure budget is allocated and branch is correct
            project = await db.project.update({
                where: { id: project.id },
                data: { 
                    status: 'IN_PROGRESS',
                    budgetAllocated: 100000,
                    branchId: testUser.branchId
                }
            });
            // Ensure testUser is a member
            const membership = await db.projectMember.findFirst({ where: { projectId: project.id, userId: testUser.id } });
            if (!membership) {
                 await db.projectMember.create({ data: { projectId: project.id, userId: testUser.id, projectRoles: 'PROJECT_EMPLOYEE' } });
            }
        }
        await use(project);
    },

    testCategory: async ({ db }, use) => {
        let category = await db.category.findFirst({ where: { scope: 'PROJECT' } });
        if (!category) {
            category = await db.category.create({
                data: {
                    name: 'E2E Test Category',
                    scope: 'PROJECT'
                }
            });
        }
        await use(category);
    }
});

export { expect } from '@playwright/test';
