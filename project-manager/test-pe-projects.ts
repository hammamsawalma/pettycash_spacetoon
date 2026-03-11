import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const users = await prisma.user.findMany({ where: { email: { in: ['emp1@pocket.com', 'coordinator@pocket.com', 'emp2@pocket.com', 'accountant@pocket.com'] } } });
  
  for (const u of users) {
      const memberships = await prisma.projectMember.findMany({
                where: {
                    userId: u.id,
                    project: { status: "IN_PROGRESS", isDeleted: false }
                },
                select: { projectRoles: true, project: { select: { name: true } } }
            });
      const eligible = memberships.filter(m => (m.projectRoles || "").includes("PROJECT_EMPLOYEE")).map(m => m.project?.name);
      console.log(`${u.email}:`, eligible);
  }
}
main();
