import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  const allUsers = await prisma.user.findMany()
  console.log('All users count:', allUsers.length)
  const employees = await prisma.user.findMany({
    where: { role: 'EMPLOYEE' }
  })
  console.log('Employees count:', employees.length)
  console.log(employees.map(u => ({ id: u.id, name: u.name, role: u.role })))
}
main()
