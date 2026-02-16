import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
    const warehouseId = 52;
    const sessions = await prisma.session.findMany({
        where: { warehouse_id: warehouseId },
        select: { id: true },
    });
    const sessionIds = sessions.map((s) => s.id);

    console.log(`Session IDs count: ${sessionIds.length}`); // 162

    const allProducts = await prisma.product.count({
        where: { session_id: { in: sessionIds } },
    });
    console.log(`All products: ${allProducts}`); // 5502

    const noDoc = await prisma.product.count({
        where: { session_id: { in: sessionIds }, document_id: null },
    });
    console.log(`No Doc products: ${noDoc}`); // 3444

    const postState = await prisma.product.count({
        where: { session_id: { in: sessionIds }, state: "POST" },
    });
    console.log(`POST products: ${postState}`); // Should be all

    const legacyTarget = await prisma.product.count({
        where: {
            session_id: { in: sessionIds },
            document_id: null,
            state: "POST",
        },
    });
    console.log(`Target Legacy (No Doc + POST): ${legacyTarget}`); // EXPECT 3444

    // Test the OR logic
    const annualMatchingDocIds = [27, 28, 29, 30, 33, 34, 35, 36];
    const annualOrQuery = await prisma.product.count({
        where: {
            session_id: { in: sessionIds },
            OR: [
                { document_id: { in: annualMatchingDocIds } },
                { document_id: null, state: "POST" },
            ],
        },
    });
    console.log(`OR Query Result: ${annualOrQuery}`); // EXPECT 1337 + 3444 = 4781
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
