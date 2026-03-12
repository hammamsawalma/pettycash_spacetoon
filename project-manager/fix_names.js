const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Fetching all users...");
  const users = await prisma.user.findMany();
  
  for (const user of users) {
    if (user.jobTitle && user.name !== user.jobTitle) {
      console.log(`Updating user: ${user.name} -> ${user.jobTitle}`);
      await prisma.user.update({
        where: { id: user.id },
        data: { name: user.jobTitle }
      });
    }
  }
  
  console.log("Done updating users.");
  
  // also check if any job titles are null and fix them
  const nullTitles = await prisma.user.findMany({ where: { jobTitle: null } });
  for (const u of nullTitles) {
      let newName = u.name;
      if (u.role === 'ADMIN') newName = 'مدير النظام';
      else if (u.role === 'ROOT') newName = 'IT';
      else if (u.role === 'GENERAL_MANAGER') newName = 'المدير العام';
      else if (u.role === 'GLOBAL_ACCOUNTANT') newName = 'المحاسب العام';
      else newName = 'موظف';
      
      console.log(`Fixing null jobTitle for ${u.name} -> ${newName}`);
      await prisma.user.update({
          where: { id: u.id },
          data: { name: newName, jobTitle: newName }
      });
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
