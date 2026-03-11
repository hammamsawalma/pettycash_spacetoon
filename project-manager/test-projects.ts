import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const userId = "03cecdc7-f38f-4969-9d91-f5eeaab3ef07"; // coordinator@pocket.com ID
  const memberships = await prisma.projectMember.findMany({
            where: {
                userId: userId,
                project: { status: "IN_PROGRESS", isDeleted: false }
            },
            select: { projectId: true, projectRoles: true, project: { select: { id: true, name: true, status: true, isDeleted: false } } }
        });
        
  const eligible = memberships.filter(m => {
      const roles = (m.projectRoles || "").split(",").map((r: string) => r.trim());
      return roles.includes("PROJECT_EMPLOYEE");
  });
  console.log(JSON.stringify(eligible.map(m => m.project?.name), null, 2));
}
main();
