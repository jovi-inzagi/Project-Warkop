'use server'

import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

function parseDateStart(dateStr: string) {
  const [year, month, day] = dateStr.split('-').map(Number)
  if (!year || !month || !day) return new Date(dateStr)
  return new Date(year, month - 1, day, 0, 0, 0, 0)
}

function parseDateEnd(dateStr: string) {
  const [year, month, day] = dateStr.split('-').map(Number)
  if (!year || !month || !day) {
    const fallback = new Date(dateStr)
    fallback.setHours(23, 59, 59, 999)
    return fallback
  }
  return new Date(year, month - 1, day, 23, 59, 59, 999)
}

// ==================== AUTH ====================
export async function loginAction(username: string, password: string) {
  try {
    const user = await prisma.user.findUnique({ where: { username } })
    if (!user) return { success: false, error: 'Username atau password salah' }

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) return { success: false, error: 'Username atau password salah' }

    return {
      success: true,
      user: { id: user.id, username: user.username, name: user.name, role: user.role },
    }
  } catch (error) {
    return { success: false, error: 'Terjadi kesalahan server' }
  }
}

// ==================== SEED ====================
export async function seedDatabase() {
  try {
    const purchaseDate = new Date()
    purchaseDate.setHours(8, 0, 0, 0)

    // Users
    const adminPass = await bcrypt.hash('admin123', 10)
    const kasirPass = await bcrypt.hash('kasir123', 10)

    await prisma.user.upsert({
      where: { username: 'admin' },
      update: {},
      create: { username: 'admin', password: adminPass, name: 'Admin Kantor', role: 'admin' },
    })
    await prisma.user.upsert({
      where: { username: 'kasir' },
      update: {},
      create: { username: 'kasir', password: kasirPass, name: 'Kasir Utama', role: 'kasir' },
    })

    // Categories
    const kopi = await prisma.category.upsert({ where: { name: 'Kopi' }, update: {}, create: { name: 'Kopi', icon: 'Coffee', color: '#d97706' } })
    const makanan = await prisma.category.upsert({ where: { name: 'Makanan' }, update: {}, create: { name: 'Makanan', icon: 'UtensilsCrossed', color: '#059669' } })
    const minuman = await prisma.category.upsert({ where: { name: 'Minuman Lain' }, update: {}, create: { name: 'Minuman Lain', icon: 'GlassWater', color: '#2563eb' } })
    await prisma.category.upsert({ where: { name: 'Snack' }, update: {}, create: { name: 'Snack', icon: 'Cookie', color: '#7c3aed' } })
    const bahan = await prisma.category.upsert({ where: { name: 'Bahan Baku' }, update: {}, create: { name: 'Bahan Baku', icon: 'Package', color: '#ea580c' } })

    const bahanRows = [
      { namaBarang: 'Saus', satuan: 'Gram', size: '600 Gram', hargaSatuan: 4500 },
      { namaBarang: 'Sedotan', satuan: '1 Pack', size: '', hargaSatuan: 5000 },
      { namaBarang: 'Plastik', satuan: '1 Pack', size: '1 Kg', hargaSatuan: 10000 },
      { namaBarang: 'Sunlight', satuan: 'Gram', size: '230 Gram', hargaSatuan: 4000 },
      { namaBarang: 'Super pel', satuan: '1 Sachet', size: '', hargaSatuan: 1000 },
      { namaBarang: 'Sawi', satuan: '1 Ikat', size: '', hargaSatuan: 5000 },
      { namaBarang: 'Cabe', satuan: '1 Bungkus', size: '', hargaSatuan: 5000 },
      { namaBarang: 'Gunting', satuan: '1 Pcs', size: '', hargaSatuan: 10000 },
    ]

    const logistikRows = [
      { nama: 'Mie Goreng', satuan: 'Pcs', jumlah: 10, hargaSatuan: 3000, hargaTotal: 30000 },
      { nama: 'Mie Rebus Soto', satuan: 'Pcs', jumlah: 10, hargaSatuan: 3000, hargaTotal: 30000 },
      { nama: 'Mie Rendang', satuan: 'Pcs', jumlah: 10, hargaSatuan: 2900, hargaTotal: 29000 },
      { nama: 'Mie Sakura', satuan: 'Pcs', jumlah: 10, hargaSatuan: 1700, hargaTotal: 17000 },
      { nama: 'ABC Moca', satuan: 'Pcs', jumlah: 10, hargaSatuan: 1500, hargaTotal: 15000 },
      { nama: 'Kapal Api Mix', satuan: 'Pcs', jumlah: 10, hargaSatuan: 1700, hargaTotal: 17000 },
      { nama: 'GoodDay Freeze', satuan: 'Pcs', jumlah: 10, hargaSatuan: 2300, hargaTotal: 23000 },
      { nama: 'GoodDay Mocachino', satuan: 'Pcs', jumlah: 10, hargaSatuan: 1500, hargaTotal: 15000 },
      { nama: 'Indocafe Coffemix', satuan: 'Pcs', jumlah: 10, hargaSatuan: 1600, hargaTotal: 16000 },
      { nama: 'Tea Jus Gula Batu', satuan: 'Pcs', jumlah: 10, hargaSatuan: 350, hargaTotal: 3500 },
      { nama: 'Tea Jus Apel', satuan: 'Pcs', jumlah: 10, hargaSatuan: 350, hargaTotal: 3500 },
      { nama: 'Nutrisari Jeruk Peras', satuan: 'Pcs', jumlah: 10, hargaSatuan: 1250, hargaTotal: 12500 },
      { nama: 'Nutrisari Semangka', satuan: 'Pcs', jumlah: 10, hargaSatuan: 1250, hargaTotal: 12500 },
      { nama: 'Nutrisari Sweet Mango', satuan: 'Pcs', jumlah: 10, hargaSatuan: 1250, hargaTotal: 12500 },
      { nama: 'Nutrisari Blewah', satuan: 'Pcs', jumlah: 10, hargaSatuan: 1400, hargaTotal: 14000 },
      { nama: 'Nutrisari Lychee', satuan: 'Pcs', jumlah: 10, hargaSatuan: 1250, hargaTotal: 12500 },
    ]

    const hargaRows = [
      { namaMenu: 'Mie Goreng', hargaSatuan: 7000, hargaDouble: 10000, hargaPakaiTelur: 10000, hargaDoublePakaiTelur: 12000, hargaHot: null, hargaIce: null },
      { namaMenu: 'Mie Rebus Soto', hargaSatuan: 7000, hargaDouble: 10000, hargaPakaiTelur: 10000, hargaDoublePakaiTelur: 12000, hargaHot: null, hargaIce: null },
      { namaMenu: 'Mie Rendang', hargaSatuan: 7000, hargaDouble: 10000, hargaPakaiTelur: 10000, hargaDoublePakaiTelur: 12000, hargaHot: null, hargaIce: null },
      { namaMenu: 'Mie Sakura', hargaSatuan: 4000, hargaDouble: 7000, hargaPakaiTelur: 7000, hargaDoublePakaiTelur: 9000, hargaHot: null, hargaIce: null },
      { namaMenu: 'ABC Moca', hargaSatuan: null, hargaDouble: null, hargaPakaiTelur: null, hargaDoublePakaiTelur: null, hargaHot: 4000, hargaIce: null },
      { namaMenu: 'Kapal Api Mix', hargaSatuan: null, hargaDouble: null, hargaPakaiTelur: null, hargaDoublePakaiTelur: null, hargaHot: 4000, hargaIce: null },
      { namaMenu: 'GoodDay Freeze', hargaSatuan: null, hargaDouble: null, hargaPakaiTelur: null, hargaDoublePakaiTelur: null, hargaHot: 5000, hargaIce: 6000 },
      { namaMenu: 'GoodDay Mocachino', hargaSatuan: null, hargaDouble: null, hargaPakaiTelur: null, hargaDoublePakaiTelur: null, hargaHot: 4000, hargaIce: 5000 },
      { namaMenu: 'Indocafe Coffemix', hargaSatuan: null, hargaDouble: null, hargaPakaiTelur: null, hargaDoublePakaiTelur: null, hargaHot: 4000, hargaIce: 5000 },
      { namaMenu: 'Tea Jus Gula Batu', hargaSatuan: null, hargaDouble: null, hargaPakaiTelur: null, hargaDoublePakaiTelur: null, hargaHot: null, hargaIce: 3000 },
      { namaMenu: 'Tea Jus Apel', hargaSatuan: null, hargaDouble: null, hargaPakaiTelur: null, hargaDoublePakaiTelur: null, hargaHot: null, hargaIce: 3000 },
      { namaMenu: 'Nutrisari Jeruk Peras', hargaSatuan: null, hargaDouble: null, hargaPakaiTelur: null, hargaDoublePakaiTelur: null, hargaHot: null, hargaIce: 4000 },
      { namaMenu: 'Nutrisari Semangka', hargaSatuan: null, hargaDouble: null, hargaPakaiTelur: null, hargaDoublePakaiTelur: null, hargaHot: null, hargaIce: 4000 },
      { namaMenu: 'Nutrisari Sweet Mango', hargaSatuan: null, hargaDouble: null, hargaPakaiTelur: null, hargaDoublePakaiTelur: null, hargaHot: null, hargaIce: 4000 },
      { namaMenu: 'Nutrisari Blewah', hargaSatuan: null, hargaDouble: null, hargaPakaiTelur: null, hargaDoublePakaiTelur: null, hargaHot: null, hargaIce: 4000 },
      { namaMenu: 'Nutrisari Lychee', hargaSatuan: null, hargaDouble: null, hargaPakaiTelur: null, hargaDoublePakaiTelur: null, hargaHot: null, hargaIce: 4000 },
    ]

    const menuPriceMap = new Map(
      hargaRows.map((h) => [h.namaMenu, h.hargaSatuan ?? h.hargaHot ?? h.hargaIce ?? 0])
    )

    const products = [
      ...logistikRows.map((row, idx) => ({
        name: row.nama,
        sku: `ACT-MENU-${String(idx + 1).padStart(3, '0')}`,
        categoryId: row.nama.startsWith('Mie')
          ? makanan.id
          : /(abc moca|kapal api|goodday|indocafe)/i.test(row.nama)
            ? kopi.id
            : minuman.id,
        price: menuPriceMap.get(row.nama) ?? 0,
        cost: row.hargaSatuan,
        stock: row.jumlah,
        minStock: 3,
        unit: 'pcs',
      })),
      ...bahanRows.map((row, idx) => ({
        name: row.namaBarang,
        sku: `ACT-BHN-${String(idx + 1).padStart(3, '0')}`,
        categoryId: bahan.id,
        price: 0,
        cost: row.hargaSatuan,
        stock: 1,
        minStock: 1,
        unit: row.satuan.toLowerCase(),
      })),
    ]

    await prisma.product.deleteMany()
    await prisma.product.createMany({ data: products })

    await prisma.bahan.deleteMany()
    await prisma.logistik.deleteMany()
    await prisma.harga.deleteMany()
    await prisma.logisticItem.deleteMany()

    await prisma.bahan.createMany({ data: bahanRows })
    await prisma.logistik.createMany({
      data: logistikRows.map((row) => ({ ...row, tanggalBeli: purchaseDate })),
    })
    await prisma.harga.createMany({ data: hargaRows })
    await prisma.logisticItem.createMany({
      data: [
        ...logistikRows.map((row) => ({
          name: row.nama,
          category: 'makanan_minuman',
          unit: row.satuan.toLowerCase(),
          size: '',
          unitPrice: row.hargaSatuan,
          quantity: row.jumlah,
          totalPrice: row.hargaTotal,
          purchaseDate,
          notes: '',
        })),
        ...bahanRows.map((row) => ({
          name: row.namaBarang,
          category: 'bahan',
          unit: row.satuan.toLowerCase(),
          size: row.size,
          unitPrice: row.hargaSatuan,
          quantity: 1,
          totalPrice: row.hargaSatuan,
          purchaseDate,
          notes: '',
        })),
      ],
    })

    const transactionData: Array<{
      type: string; category: string; description: string;
      amount: number; method: string; date: Date
    }> = [
      ...logistikRows.map((row) => ({
        type: 'expense',
        category: 'pembelian_bahan',
        description: `Pengadaan ${row.nama}`,
        amount: row.hargaTotal,
        method: 'cash',
        date: purchaseDate,
      })),
      ...bahanRows.map((row) => ({
        type: 'expense',
        category: 'pembelian_bahan',
        description: `Pengadaan ${row.namaBarang}`,
        amount: row.hargaSatuan,
        method: 'cash',
        date: purchaseDate,
      })),
    ]

    await prisma.transaction.deleteMany()
    await prisma.transaction.createMany({ data: transactionData })

    return {
      success: true,
      counts: {
        users: await prisma.user.count(),
        categories: await prisma.category.count(),
        products: await prisma.product.count(),
        transactions: await prisma.transaction.count(),
      },
    }
  } catch (error) {
    console.error('Seed error:', error)
    return { success: false, error: String(error) }
  }
}

// ==================== PRODUCTS ====================
export async function getProducts(search?: string, category?: string, status?: string) {
  const where: Record<string, unknown> = {}
  if (search) where.name = { contains: search }
  if (category && category !== 'all') where.categoryId = category
  if (status === 'active') where.isActive = true
  if (status === 'inactive') where.isActive = false

  let products = await prisma.product.findMany({
    where,
    include: { category: true },
    orderBy: { name: 'asc' },
  })

  // Filter stok rendah di sisi aplikasi karena perlu bandingkan stock vs minStock per produk
  if (status === 'low') {
    products = products.filter(p => p.minStock > 0 && p.stock <= p.minStock)
  }

  return products
}

export async function getCategories() {
  return prisma.category.findMany({ orderBy: { name: 'asc' } })
}

export async function createProduct(data: {
  name: string; sku: string; categoryId: string; price: number;
  cost: number; stock: number; minStock: number; unit: string
}) {
  try {
    const product = await prisma.product.create({
      data,
      include: { category: true },
    })
    return { success: true, product }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    if (message.includes('Unique constraint')) {
      return { success: false, error: 'SKU sudah digunakan' }
    }
    return { success: false, error: message }
  }
}

export async function updateProduct(id: string, data: {
  name?: string; sku?: string; categoryId?: string; price?: number;
  cost?: number; stock?: number; minStock?: number; unit?: string; isActive?: boolean
}) {
  try {
    const product = await prisma.product.update({
      where: { id },
      data,
      include: { category: true },
    })
    return { success: true, product }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    return { success: false, error: message }
  }
}

export async function deleteProduct(id: string) {
  try {
    await prisma.product.delete({ where: { id } })
    return { success: true }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    return { success: false, error: message }
  }
}

// ==================== TRANSACTIONS ====================
export async function getTransactions(filters?: {
  type?: string; category?: string; dateFrom?: string; dateTo?: string
}) {
  const where: Record<string, unknown> = {}
  if (filters?.type && filters.type !== 'all') where.type = filters.type
  if (filters?.category && filters.category !== 'all') where.category = filters.category
  if (filters?.dateFrom || filters?.dateTo) {
    where.date = {}
    if (filters?.dateFrom) (where.date as Record<string, unknown>).gte = new Date(filters.dateFrom)
    if (filters?.dateTo) {
      const endDate = new Date(filters.dateTo)
      endDate.setHours(23, 59, 59, 999)
      ;(where.date as Record<string, unknown>).lte = endDate
    }
  }

  return prisma.transaction.findMany({
    where,
    orderBy: { date: 'desc' },
    take: 200,
  })
}

export async function createTransaction(data: {
  type: string; category: string; description: string;
  amount: number; method: string; date?: string
}) {
  try {
    const transaction = await prisma.transaction.create({
      data: {
        ...data,
        date: data.date ? new Date(data.date) : new Date(),
      },
    })
    return { success: true, transaction }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    return { success: false, error: message }
  }
}

export async function deleteTransaction(id: string) {
  try {
    await prisma.transaction.delete({ where: { id } })
    return { success: true }
  } catch (error: unknown) {
    return { success: false, error: String(error) }
  }
}

export async function getChecklistProducts() {
  return prisma.product.findMany({
    where: {
      isActive: true,
      price: { gt: 0 },
    },
    include: { category: true },
    orderBy: { name: 'asc' },
  })
}

export async function executeSalesChecklist(data: {
  items: Array<{ productId: string; quantity: number }>
  method?: 'cash' | 'transfer' | 'qris'
  date?: string
  executorName?: string
}) {
  try {
    if (!data.items.length) {
      return { success: false, error: 'Checklist kosong. Pilih minimal 1 produk.' }
    }

    const normalizedItems = data.items
      .filter((item) => item.productId && Number.isFinite(item.quantity) && item.quantity > 0)
      .map((item) => ({ productId: item.productId, quantity: Math.floor(item.quantity) }))

    if (!normalizedItems.length) {
      return { success: false, error: 'Data checklist tidak valid.' }
    }

    const ids = [...new Set(normalizedItems.map((item) => item.productId))]
    const products = await prisma.product.findMany({
      where: { id: { in: ids } },
      include: { category: true },
    })
    const productMap = new Map(products.map((p) => [p.id, p]))

    const notFound = ids.filter((id) => !productMap.has(id))
    if (notFound.length > 0) {
      return { success: false, error: 'Ada produk yang tidak ditemukan. Muat ulang halaman.' }
    }

    const stockIssues: string[] = []
    for (const item of normalizedItems) {
      const product = productMap.get(item.productId)
      if (!product) continue
      if (!product.isActive) {
        stockIssues.push(`${product.name} sedang nonaktif`)
        continue
      }
      if (product.stock < item.quantity) {
        stockIssues.push(`${product.name} (stok ${product.stock}, diminta ${item.quantity})`)
      }
    }
    if (stockIssues.length > 0) {
      return {
        success: false,
        error: `Stok tidak mencukupi untuk: ${stockIssues.join(', ')}`,
      }
    }

    const method = data.method ?? 'cash'
    const txDate = data.date ? new Date(data.date) : new Date()
    const executorName = data.executorName?.trim() || 'Operator'
    let totalIncome = 0
    let totalQty = 0
    const executedItems: Array<{ name: string; productId: string; qty: number; unitPrice: number; amount: number }> = []

    await prisma.$transaction(async (dbTx) => {
      const execution = await dbTx.salesChecklistExecution.create({
        data: {
          executorName,
          method,
          totalQty: 0,
          totalIncome: 0,
          itemCount: 0,
          executedAt: txDate,
        },
      })

      for (const item of normalizedItems) {
        const product = productMap.get(item.productId)
        if (!product) continue
        const qty = item.quantity
        const amount = product.price * qty

        await dbTx.product.update({
          where: { id: product.id },
          data: { stock: { decrement: qty } },
        })

        await dbTx.transaction.create({
          data: {
            type: 'income',
            category: 'penjualan',
            description: `${product.name} x${qty} [CHK:${execution.id}]`,
            amount,
            method,
            date: txDate,
          },
        })

        totalIncome += amount
        totalQty += qty
        executedItems.push({
          name: product.name,
          productId: product.id,
          qty,
          unitPrice: product.price,
          amount,
        })
      }

      await dbTx.salesChecklistExecution.update({
        where: { id: execution.id },
        data: {
          totalQty,
          totalIncome,
          itemCount: executedItems.length,
        },
      })

      await dbTx.salesChecklistExecutionItem.createMany({
        data: executedItems.map((item) => ({
          executionId: execution.id,
          productId: item.productId,
          productName: item.name,
          quantity: item.qty,
          unitPrice: item.unitPrice,
          amount: item.amount,
        })),
      })
    })

    return {
      success: true,
      summary: {
        itemCount: executedItems.length,
        totalQty,
        totalIncome,
        method,
      },
      executedItems,
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    return { success: false, error: message }
  }
}

export async function getSalesChecklistHistory(options?: {
  page?: number
  pageSize?: number
  method?: 'all' | 'cash' | 'transfer' | 'qris'
  dateFrom?: string
  dateTo?: string
  productName?: string
}) {
  const page = Number.isFinite(options?.page) ? Math.max(1, Math.floor(options!.page!)) : 1
  const pageSize = Number.isFinite(options?.pageSize) ? Math.max(1, Math.min(50, Math.floor(options!.pageSize!))) : 10
  const skip = (page - 1) * pageSize

  const where: Record<string, unknown> = {}
  if (options?.method && options.method !== 'all') {
    where.method = options.method
  }
  if (options?.dateFrom || options?.dateTo) {
    where.executedAt = {}
    if (options?.dateFrom) (where.executedAt as Record<string, unknown>).gte = parseDateStart(options.dateFrom)
    if (options?.dateTo) {
      ;(where.executedAt as Record<string, unknown>).lte = parseDateEnd(options.dateTo)
    }
  }
  if (options?.productName?.trim()) {
    where.items = {
      some: {
        productName: {
          contains: options.productName.trim(),
        },
      },
    }
  }

  const [rows, total] = await Promise.all([
    prisma.salesChecklistExecution.findMany({
      where,
      orderBy: { executedAt: 'desc' },
      take: pageSize,
      skip,
      include: {
        items: {
          orderBy: { amount: 'desc' },
        },
      },
    }),
    prisma.salesChecklistExecution.count({ where }),
  ])

  return {
    rows,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  }
}

export async function deleteSalesChecklistHistory(executionId: string, itemIds?: string[]) {
  try {
    if (!executionId) {
      return { success: false, error: 'ID riwayat tidak valid' }
    }

    const execution = await prisma.salesChecklistExecution.findUnique({
      where: { id: executionId },
      include: { items: true },
    })
    if (!execution) {
      return { success: false, error: 'Riwayat tidak ditemukan' }
    }

    const selectedIds = itemIds && itemIds.length > 0 ? new Set(itemIds) : null
    const targetItems = selectedIds
      ? execution.items.filter((item) => selectedIds.has(item.id))
      : execution.items

    if (targetItems.length === 0) {
      return { success: false, error: 'Pilih minimal 1 produk untuk dihapus' }
    }

    await prisma.$transaction(async (dbTx) => {
      for (const item of targetItems) {
        await dbTx.product.updateMany({
          where: { id: item.productId },
          data: {
            stock: {
              increment: item.quantity,
            },
          },
        })
      }

      let markerDeleteCount = 0
      for (const item of targetItems) {
        const markerDelete = await dbTx.transaction.deleteMany({
          where: {
            type: 'income',
            category: 'penjualan',
            method: execution.method,
            date: execution.executedAt,
            amount: item.amount,
            description: `${item.productName} x${item.quantity} [CHK:${execution.id}]`,
          },
        })
        markerDeleteCount += markerDelete.count
      }

      // Fallback for old records created before CHK marker was introduced.
      if (markerDeleteCount === 0) {
        for (const item of targetItems) {
          await dbTx.transaction.deleteMany({
            where: {
              type: 'income',
              category: 'penjualan',
              method: execution.method,
              date: execution.executedAt,
              description: `${item.productName} x${item.quantity}`,
              amount: item.amount,
            },
          })
        }
      }

      await dbTx.salesChecklistExecutionItem.deleteMany({
        where: {
          id: { in: targetItems.map((item) => item.id) },
        },
      })

      const remainingItems = await dbTx.salesChecklistExecutionItem.findMany({
        where: { executionId: execution.id },
      })

      if (remainingItems.length === 0) {
        await dbTx.salesChecklistExecution.delete({
          where: { id: execution.id },
        })
      } else {
        const totalQty = remainingItems.reduce((sum, item) => sum + item.quantity, 0)
        const totalIncome = remainingItems.reduce((sum, item) => sum + item.amount, 0)
        await dbTx.salesChecklistExecution.update({
          where: { id: execution.id },
          data: {
            itemCount: remainingItems.length,
            totalQty,
            totalIncome,
          },
        })
      }
    })

    return { success: true, removedItems: targetItems.length }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    return { success: false, error: message }
  }
}

export async function getChecklistSalesOverview(options?: {
  method?: 'all' | 'cash' | 'transfer' | 'qris'
  dateFrom?: string
  dateTo?: string
  productName?: string
}) {
  const where: Record<string, unknown> = {}
  if (options?.method && options.method !== 'all') where.method = options.method
  if (options?.dateFrom || options?.dateTo) {
    where.executedAt = {}
    if (options?.dateFrom) (where.executedAt as Record<string, unknown>).gte = parseDateStart(options.dateFrom)
    if (options?.dateTo) {
      ;(where.executedAt as Record<string, unknown>).lte = parseDateEnd(options.dateTo)
    }
  }
  if (options?.productName?.trim()) {
    where.items = {
      some: {
        productName: {
          contains: options.productName.trim(),
        },
      },
    }
  }

  const rows = await prisma.salesChecklistExecution.findMany({
    where,
    include: {
      items: true,
    },
    orderBy: { executedAt: 'desc' },
  })

  const productKeyword = options?.productName?.trim().toLowerCase()
  const byMethod: Record<string, number> = { cash: 0, transfer: 0, qris: 0 }
  const productStats = new Map<string, { qty: number; income: number }>()
  let totalQty = 0
  let totalIncome = 0
  let itemCount = 0

  for (const row of rows) {
    byMethod[row.method] = (byMethod[row.method] ?? 0) + 1
    const matchedItems = productKeyword
      ? row.items.filter((item) => item.productName.toLowerCase().includes(productKeyword))
      : row.items

    for (const item of matchedItems) {
      totalQty += item.quantity
      totalIncome += item.amount
      itemCount += 1

      const current = productStats.get(item.productName) ?? { qty: 0, income: 0 }
      productStats.set(item.productName, {
        qty: current.qty + item.quantity,
        income: current.income + item.amount,
      })
    }
  }

  const topProduct = [...productStats.entries()]
    .map(([name, value]) => ({ name, ...value }))
    .sort((a, b) => b.qty - a.qty)[0] ?? null

  const methodOrder = Object.entries(byMethod).sort((a, b) => b[1] - a[1])
  const dominantMethod = methodOrder[0]?.[1] ? methodOrder[0][0] : null

  return {
    totalExecution: rows.length,
    totalQty,
    totalIncome,
    averageIncomePerExecution: rows.length > 0 ? Math.round(totalIncome / rows.length) : 0,
    averageItemsPerExecution: rows.length > 0 ? Number((itemCount / rows.length).toFixed(1)) : 0,
    dominantMethod,
    topProduct,
    methodBreakdown: byMethod,
  }
}

// ==================== DASHBOARD ====================
export async function getDashboardData(filters?: {
  period?: '7d' | '30d' | '90d'
  menuCategory?: 'all' | 'Kopi' | 'Makanan' | 'Minuman Lain'
  method?: 'all' | 'cash' | 'qris' | 'transfer'
  txType?: 'all' | 'income' | 'expense'
}) {
  const period = filters?.period ?? '7d'
  const menuCategory = filters?.menuCategory ?? 'all'
  const method = filters?.method ?? 'all'
  const txType = filters?.txType ?? 'all'

  const now = new Date()
  const todayStart = new Date(now)
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date(now)
  todayEnd.setHours(23, 59, 59, 999)

  const yesterdayStart = new Date(todayStart)
  yesterdayStart.setDate(yesterdayStart.getDate() - 1)
  const yesterdayEnd = new Date(todayStart)
  yesterdayEnd.setMilliseconds(-1)

  const startDate = new Date(todayStart)
  if (period === '30d') startDate.setDate(startDate.getDate() - 29)
  else if (period === '90d') startDate.setDate(startDate.getDate() - 89)
  else startDate.setDate(startDate.getDate() - 6)

  const transactions = await prisma.transaction.findMany({
    where: { date: { gte: startDate } },
    orderBy: { date: 'asc' },
  })

  const allProducts = await prisma.product.findMany({
    where: { isActive: true },
    include: { category: true },
  })

  const menuProducts = menuCategory === 'all'
    ? allProducts
    : allProducts.filter((p) => p.category.name === menuCategory)

  const categoryProductNames = new Set(menuProducts.map((p) => p.name.toLowerCase()))
  const getProductNameFromDescription = (description: string) =>
    description.replace(/\s*x\d+$/i, '').trim().toLowerCase()
  const isIncludedIncomeTransaction = (description: string) =>
    menuCategory === 'all' || categoryProductNames.has(getProductNameFromDescription(description))

  const filteredTransactions = transactions.filter((t) => {
    if (txType !== 'all' && t.type !== txType) return false
    if (method !== 'all' && t.method !== method) return false
    if (t.type === 'income' && !isIncludedIncomeTransaction(t.description)) return false
    return true
  })

  const isInRange = (date: Date, start: Date, end: Date) => date >= start && date <= end

  const todayTx = filteredTransactions.filter((t) => isInRange(t.date, todayStart, todayEnd))
  const yesterdayTx = filteredTransactions.filter((t) => isInRange(t.date, yesterdayStart, yesterdayEnd))

  const sumByType = (rows: typeof filteredTransactions, type: 'income' | 'expense') =>
    rows.filter((t) => t.type === type).reduce((sum, t) => sum + t.amount, 0)

  const countIncome = (rows: typeof filteredTransactions) =>
    rows.filter((t) => t.type === 'income').length

  const lowStock = menuProducts.filter((p) => p.minStock > 0 && p.stock <= p.minStock)

  const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']
  const revenueData = []
  const totalDays = Math.max(1, Math.floor((todayStart.getTime() - startDate.getTime()) / 86400000) + 1)
  for (let i = 0; i < totalDays; i++) {
    const d = new Date(startDate)
    d.setDate(d.getDate() + i)
    const dateStr = d.toISOString().split('T')[0]
    const dayTx = filteredTransactions.filter((t) => t.date.toISOString().split('T')[0] === dateStr)
    revenueData.push({
      date: period === '7d' ? dayNames[d.getDay()] : d.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' }),
      revenue: dayTx.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
      expense: dayTx.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0),
    })
  }

  const categoryData: Record<string, number> = {}
  filteredTransactions
    .filter((t) => t.type === 'income')
    .forEach((t) => {
      if (!categoryData[t.category]) categoryData[t.category] = 0
      categoryData[t.category] += t.amount
    })
  const categoryBreakdown = Object.entries(categoryData).map(([category, amount]) => ({
    category,
    _sum: { amount },
  }))

  const recentTransactions = [...todayTx]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 5)

  const topProductMap = new Map<string, { sales: number; revenue: number }>()
  filteredTransactions
    .filter((t) => t.type === 'income')
    .forEach((t) => {
      const name = t.description.replace(/ x\d+$/i, '').trim()
      const current = topProductMap.get(name) ?? { sales: 0, revenue: 0 }
      topProductMap.set(name, { sales: current.sales + 1, revenue: current.revenue + t.amount })
    })
  const topProducts = [...topProductMap.entries()]
    .map(([name, val]) => ({ name, sales: val.sales, revenue: val.revenue }))
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 5)

  // Potential revenue if all current stock is sold (selected categories)
  const potentialRevenueProducts = allProducts.filter((product) =>
    ['Kopi', 'Makanan', 'Minuman Lain'].includes(product.category.name)
  )

  const potentialRevenueByCategory: Record<'Kopi' | 'Makanan' | 'Minuman Lain', number> = {
    Kopi: 0,
    Makanan: 0,
    'Minuman Lain': 0,
  }

  for (const product of potentialRevenueProducts) {
    const categoryName = product.category.name as 'Kopi' | 'Makanan' | 'Minuman Lain'
    potentialRevenueByCategory[categoryName] += product.price * product.stock
  }

  const potentialRevenueTotal = Object.values(potentialRevenueByCategory).reduce((sum, value) => sum + value, 0)

  return {
    kpi: {
      todayIncome: sumByType(todayTx, 'income'),
      todayExpense: sumByType(todayTx, 'expense'),
      todayOrders: countIncome(todayTx),
      yesterdayIncome: sumByType(yesterdayTx, 'income'),
      yesterdayExpense: sumByType(yesterdayTx, 'expense'),
      yesterdayOrders: countIncome(yesterdayTx),
      lowStockCount: lowStock.length,
    },
    revenueData,
    recentTransactions: recentTransactions.map(t => ({
      id: t.id,
      item: t.description,
      time: t.date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      amount: t.type === 'income' ? t.amount : -t.amount,
      type: t.type,
    })),
    topProducts: topProducts.map(p => ({
      name: p.name,
      sales: p.sales,
      revenue: p.revenue,
    })),
    categoryBreakdown,
    potentialRevenueByCategory,
    potentialRevenueTotal,
    appliedFilters: {
      period,
      menuCategory,
      method,
      txType,
    },
  }
}

// ==================== REPORTS ====================
export async function getReportData(period: string = '30d', menuCategory: 'all' | 'Kopi' | 'Makanan' | 'Minuman Lain' = 'all') {
  const now = new Date()
  const startDate = new Date(now)

  switch (period) {
    case '7d': startDate.setDate(now.getDate() - 7); break
    case '30d': startDate.setDate(now.getDate() - 30); break
    case '90d': startDate.setDate(now.getDate() - 90); break
    default: startDate.setDate(now.getDate() - 30)
  }

  const transactions = await prisma.transaction.findMany({
    where: { date: { gte: startDate } },
    orderBy: { date: 'asc' },
  })

  const allProducts = await prisma.product.findMany({ include: { category: true } })
  const products = menuCategory === 'all'
    ? allProducts
    : allProducts.filter((p) => p.category.name === menuCategory)

  const categoryProductNames = new Set(products.map((p) => p.name.toLowerCase()))
  const getProductNameFromDescription = (description: string) =>
    description.replace(/\s*x\d+$/i, '').trim().toLowerCase()
  const isIncludedIncomeTransaction = (description: string) =>
    menuCategory === 'all' || categoryProductNames.has(getProductNameFromDescription(description))

  const totalIncome = transactions
    .filter(t => t.type === 'income' && isIncludedIncomeTransaction(t.description))
    .reduce((sum, t) => sum + t.amount, 0)
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)

  // Daily breakdown
  const dailyData: Record<string, { income: number; expense: number; date: string }> = {}
  transactions.forEach(t => {
    const dateKey = t.date.toISOString().split('T')[0]
    if (!dailyData[dateKey]) dailyData[dateKey] = { income: 0, expense: 0, date: dateKey }
    if (t.type === 'income' && isIncludedIncomeTransaction(t.description)) dailyData[dateKey].income += t.amount
    else dailyData[dateKey].expense += t.amount
  })

  // Category breakdown
  const categoryData: Record<string, number> = {}
  transactions.forEach(t => {
    if (t.type === 'income' && !isIncludedIncomeTransaction(t.description)) return
    if (!categoryData[t.category]) categoryData[t.category] = 0
    categoryData[t.category] += t.amount
  })

  // Method breakdown
  const methodData: Record<string, number> = {}
  transactions.filter(t => t.type === 'income' && isIncludedIncomeTransaction(t.description)).forEach(t => {
    if (!methodData[t.method]) methodData[t.method] = 0
    methodData[t.method] += t.amount
  })

  const lowStockProducts = products.filter(p => p.minStock > 0 && p.stock <= p.minStock)
  const transactionCount = transactions.filter(
    (t) => t.type !== 'income' || isIncludedIncomeTransaction(t.description)
  ).length

  return {
    totalIncome,
    totalExpense,
    profit: totalIncome - totalExpense,
    transactionCount,
    dailyData: Object.values(dailyData),
    categoryData: Object.entries(categoryData).map(([name, value]) => ({ name, value })),
    methodData: Object.entries(methodData).map(([name, value]) => ({ name, value })),
    lowStockProducts,
    products,
    selectedMenuCategory: menuCategory,
  }
}


