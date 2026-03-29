const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const docs = await prisma.document.findMany({
    where: { warehouse_id: 52 },
    select: { id: true, inventory_id: true }
  })
  
  // count total products matched by type
  const prods = await prisma.product.count({
    where: { session: { warehouse_id: 52 } }
  })
  console.log('Total products W52:', prods)
  console.log('Docs W52:', docs)
}
main()
