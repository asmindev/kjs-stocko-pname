import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const prods = await prisma.product.findMany({
    where: { session: { warehouse_id: 52 } },
    select: { id: true, name: true, state: true, document_id: true, session: { select: { warehouse_id: true } } },
    take: 5
  })
  console.log(prods)
}
main()
