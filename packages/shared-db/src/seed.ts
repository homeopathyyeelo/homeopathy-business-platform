import { PrismaClient } from "../generated/client/index.js"

const prisma = new PrismaClient()

async function ensureInventory(productId: string, shopId: string, quantity: number, batchNo: string) {
  await prisma.inventory.upsert({
    where: {
      productId_shopId_batchNo: {
        productId,
        shopId,
        batchNo,
      },
    },
    update: {
      quantity: { increment: quantity },
    },
    create: {
      productId,
      shopId,
      quantity,
      batchNo,
    },
  })
}

async function createSampleOrder(params: {
  shopId: string
  customerId: string
  items: Array<{ productId: string; quantity: number; price: number }>
}) {
  const totalAmount = params.items.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const order = await prisma.order.create({
    data: {
      shopId: params.shopId,
      customerId: params.customerId,
      totalAmount,
      status: "CONFIRMED",
      orderItems: {
        create: params.items.map((i) => ({ productId: i.productId, quantity: i.quantity, price: i.price })),
      },
    },
    include: { orderItems: true },
  })

  // Deduct inventory FIFO by earliest expiry (nulls last)
  for (const item of params.items) {
    let remaining = item.quantity
    const batches = await prisma.inventory.findMany({
      where: { productId: item.productId, shopId: params.shopId, quantity: { gt: 0 } },
      orderBy: [{ expiryDate: "asc" }],
    })
    for (const batch of batches) {
      if (remaining <= 0) break
      const deduct = Math.min(batch.quantity, remaining)
      await prisma.inventory.update({ where: { id: batch.id }, data: { quantity: batch.quantity - deduct } })
      remaining -= deduct
    }
  }

  return order
}

async function main() {
  // Shops (multi-brand distributor + retail branches)
  const dist = await prisma.shop.upsert({
    where: { id: "dist-yeelo" },
    update: {},
    create: {
      id: "dist-yeelo",
      name: "Yeelo Distributors",
      address: "1 Distribution Way",
      phone: "+19990000000",
      email: "dist@yeelo.local",
    },
  })
  const branchA = await prisma.shop.upsert({
    where: { id: "retail-a" },
    update: {},
    create: {
      id: "retail-a",
      name: "Yeelo Clinic - Downtown",
      address: "10 Main Street",
      phone: "+19990000001",
      email: "downtown@yeelo.local",
    },
  })
  const branchB = await prisma.shop.upsert({
    where: { id: "retail-b" },
    update: {},
    create: {
      id: "retail-b",
      name: "Yeelo Clinic - Riverside",
      address: "25 River Road",
      phone: "+19990000002",
      email: "riverside@yeelo.local",
    },
  })

  // Products (simulate brands in names and categories)
  const products = await prisma.$transaction([
    prisma.product.create({ data: { name: "Boiron Arnica 30C", category: "Trauma", price: 99.99, shopId: dist.id } }),
    prisma.product.create({ data: { name: "SBL Nux Vomica 200C", category: "Digestive", price: 149.0, shopId: dist.id } }),
    prisma.product.create({ data: { name: "Reckeweg R1", category: "Inflammation", price: 249.5, shopId: dist.id } }),
    prisma.product.create({ data: { name: "Hahnemann Aconite 30C", category: "Cold/Flu", price: 89.0, shopId: dist.id } }),
    prisma.product.create({ data: { name: "Boiron Belladonna 200C", category: "Fever", price: 139.0, shopId: dist.id } }),
  ])

  // Inventory at distributor
  await ensureInventory(products[0].id, dist.id, 500, "BATCH-A1")
  await ensureInventory(products[1].id, dist.id, 400, "BATCH-N1")
  await ensureInventory(products[2].id, dist.id, 300, "BATCH-R1")
  await ensureInventory(products[3].id, dist.id, 600, "BATCH-AC1")
  await ensureInventory(products[4].id, dist.id, 450, "BATCH-B1")

  // Transfer inventory to branches (simple stock allocations)
  for (const p of products) {
    await ensureInventory(p.id, branchA.id, Math.floor(Math.random() * 80) + 120, `A-${p.id.slice(0, 4)}`)
    await ensureInventory(p.id, branchB.id, Math.floor(Math.random() * 80) + 120, `B-${p.id.slice(0, 4)}`)
  }

  // Customers
  const customers = await prisma.$transaction([
    prisma.customer.upsert({
      where: { phone: "+18880000001" },
      update: {},
      create: { name: "Alice Kapoor", phone: "+18880000001", email: "alice@example.com", marketingConsent: true },
    }),
    prisma.customer.upsert({
      where: { phone: "+18880000002" },
      update: {},
      create: { name: "Bharat Singh", phone: "+18880000002", email: "bharat@example.com", marketingConsent: true },
    }),
    prisma.customer.upsert({
      where: { phone: "+18880000003" },
      update: {},
      create: { name: "Chitra Rao", phone: "+18880000003", email: "chitra@example.com" },
    }),
  ])

  // Coupons
  await prisma.coupon.upsert({
    where: { code: "WELCOME10" },
    update: {},
    create: {
      code: "WELCOME10",
      type: "PERCENTAGE",
      value: 10,
      validFrom: new Date(Date.now() - 86400000),
      validUntil: new Date(Date.now() + 30 * 86400000),
    },
  })

  // Referrals
  await prisma.referral.upsert({
    where: { code: "REF-ALICE" },
    update: {},
    create: { referrerId: customers[0].id, code: "REF-ALICE" },
  })

  // Sample orders at branches
  await createSampleOrder({
    shopId: branchA.id,
    customerId: customers[0].id,
    items: [
      { productId: products[0].id, quantity: 2, price: Number(products[0].price) },
      { productId: products[3].id, quantity: 1, price: Number(products[3].price) },
    ],
  })

  await createSampleOrder({
    shopId: branchB.id,
    customerId: customers[1].id,
    items: [
      { productId: products[1].id, quantity: 1, price: Number(products[1].price) },
      { productId: products[4].id, quantity: 3, price: Number(products[4].price) },
    ],
  })

  console.log("Seed complete:", {
    shops: { distributor: dist.id, branchA: branchA.id, branchB: branchB.id },
    products: products.map((p) => ({ id: p.id, name: p.name })),
    customers: customers.map((c) => ({ id: c.id, name: c.name })),
  })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
