import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const docs = await prisma.document.findMany({
    where: { warehouse_id: 52 },
    select: { id: true, inventory_id: true }
  })
  console.log('Docs for W52:', docs)
}
main()
