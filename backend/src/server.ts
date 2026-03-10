import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from './lib/prisma.js'
import { fail, ok } from './lib/http.js'

const app = express()
const port = Number(process.env.PORT ?? 4000)

app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN ?? 'http://localhost:3000',
    credentials: true,
  })
)
app.use(express.json())

const toSingle = (value: unknown) => (typeof value === 'string' ? value : undefined)

const dashboardQuerySchema = z.object({
  period: z.enum(['7d', '30d', '90d']).default('7d'),
  menuCategory: z.enum(['all', 'Kopi', 'Makanan', 'Minuman Lain']).default('all'),
  method: z.enum(['all', 'cash', 'qris', 'transfer']).default('all'),
  txType: z.enum(['all', 'income', 'expense']).default('all'),
})

const reportQuerySchema = z.object({
  period: z.enum(['7d', '30d', '90d']).default('30d'),
  menuCategory: z.enum(['all', 'Kopi', 'Makanan', 'Minuman Lain']).default('all'),
})

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
})

const productCreateSchema = z.object({
  name: z.string().min(1),
  sku: z.string().min(1),
  categoryId: z.string().min(1),
  price: z.number().nonnegative(),
  cost: z.number().nonnegative(),
  stock: z.number().int().nonnegative(),
  minStock: z.number().int().nonnegative(),
  unit: z.string().min(1),
})

const productUpdateSchema = productCreateSchema.partial().extend({
  isActive: z.boolean().optional(),
})

const transactionCreateSchema = z.object({
  type: z.string().min(1),
  category: z.string().min(1),
  description: z.string().min(1),
  amount: z.number().positive(),
  method: z.string().min(1),
  date: z.string().optional(),
})

const logisticCreateSchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  unit: z.string().min(1),
  size: z.string().optional(),
  unitPrice: z.number().nonnegative(),
  quantity: z.number().int().positive(),
  totalPrice: z.number().nonnegative(),
  purchaseDate: z.string().optional(),
  notes: z.string().optional(),
})

const logisticUpdateSchema = logisticCreateSchema.partial()

const getStartDateByPeriod = (period: '7d' | '30d' | '90d') => {
  const now = new Date()
  const startDate = new Date(now)
  if (period === '90d') startDate.setDate(now.getDate() - 90)
  else if (period === '30d') startDate.setDate(now.getDate() - 30)
  else startDate.setDate(now.getDate() - 7)
  return startDate
}

app.get('/health', (_req, res) =>
  ok(res, { service: 'warkop-backend', status: 'healthy' }, 'Backend healthy')
)

app.post('/api/auth/login', async (req, res) => {
  try {
    const parsed = loginSchema.safeParse(req.body)
    if (!parsed.success) return fail(res, 'Payload login tidak valid', 422, parsed.error.flatten())

    const user = await prisma.user.findUnique({ where: { username: parsed.data.username } })
    if (!user) return fail(res, 'Username atau password salah', 401)

    const valid = await bcrypt.compare(parsed.data.password, user.password)
    if (!valid) return fail(res, 'Username atau password salah', 401)

    return ok(
      res,
      { id: user.id, username: user.username, name: user.name, role: user.role },
      'Login berhasil'
    )
  } catch (error) {
    return fail(res, 'Terjadi kesalahan server', 500, String(error))
  }
})

app.get('/api/products', async (req, res) => {
  try {
    const search = toSingle(req.query.search)
    const category = toSingle(req.query.category)
    const status = toSingle(req.query.status)
    const where: Record<string, unknown> = {}

    if (search) where.name = { contains: search, mode: 'insensitive' }
    if (category && category !== 'all') where.categoryId = category
    if (status === 'active') where.isActive = true
    if (status === 'inactive') where.isActive = false

    let products = await prisma.product.findMany({
      where,
      include: { category: true },
      orderBy: { name: 'asc' },
    })

    if (status === 'low') products = products.filter((p) => p.minStock > 0 && p.stock <= p.minStock)
    return ok(res, products, 'Data produk berhasil diambil')
  } catch (error) {
    return fail(res, 'Gagal memuat data produk', 500, String(error))
  }
})

app.post('/api/products', async (req, res) => {
  try {
    const parsed = productCreateSchema.safeParse(req.body)
    if (!parsed.success) return fail(res, 'Payload produk tidak valid', 422, parsed.error.flatten())

    const product = await prisma.product.create({
      data: parsed.data,
      include: { category: true },
    })
    return ok(res, product, 'Produk berhasil dibuat', 201)
  } catch (error) {
    return fail(res, 'Gagal membuat produk', 400, String(error))
  }
})

app.patch('/api/products/:id', async (req, res) => {
  try {
    const parsed = productUpdateSchema.safeParse(req.body)
    if (!parsed.success) return fail(res, 'Payload update produk tidak valid', 422, parsed.error.flatten())

    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: parsed.data,
      include: { category: true },
    })
    return ok(res, product, 'Produk berhasil diperbarui')
  } catch (error) {
    return fail(res, 'Gagal update produk', 400, String(error))
  }
})

app.delete('/api/products/:id', async (req, res) => {
  try {
    await prisma.product.delete({ where: { id: req.params.id } })
    return ok(res, { id: req.params.id }, 'Produk berhasil dihapus')
  } catch (error) {
    return fail(res, 'Gagal menghapus produk', 400, String(error))
  }
})

app.get('/api/transactions', async (req, res) => {
  try {
    const where: Record<string, unknown> = {}
    const type = toSingle(req.query.type)
    const category = toSingle(req.query.category)
    const dateFrom = toSingle(req.query.dateFrom)
    const dateTo = toSingle(req.query.dateTo)

    if (type && type !== 'all') where.type = type
    if (category && category !== 'all') where.category = category
    if (dateFrom || dateTo) {
      where.date = {}
      if (dateFrom) (where.date as Record<string, unknown>).gte = new Date(dateFrom)
      if (dateTo) {
        const endDate = new Date(dateTo)
        endDate.setHours(23, 59, 59, 999)
        ;(where.date as Record<string, unknown>).lte = endDate
      }
    }

    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: { date: 'desc' },
      take: 500,
    })
    return ok(res, transactions, 'Data transaksi berhasil diambil')
  } catch (error) {
    return fail(res, 'Gagal memuat transaksi', 500, String(error))
  }
})

app.post('/api/transactions', async (req, res) => {
  try {
    const parsed = transactionCreateSchema.safeParse(req.body)
    if (!parsed.success) return fail(res, 'Payload transaksi tidak valid', 422, parsed.error.flatten())

    const transaction = await prisma.transaction.create({
      data: {
        ...parsed.data,
        date: parsed.data.date ? new Date(parsed.data.date) : new Date(),
      },
    })
    return ok(res, transaction, 'Transaksi berhasil dibuat', 201)
  } catch (error) {
    return fail(res, 'Gagal membuat transaksi', 400, String(error))
  }
})

app.delete('/api/transactions/:id', async (req, res) => {
  try {
    await prisma.transaction.delete({ where: { id: req.params.id } })
    return ok(res, { id: req.params.id }, 'Transaksi berhasil dihapus')
  } catch (error) {
    return fail(res, 'Gagal menghapus transaksi', 400, String(error))
  }
})

app.get('/api/logistic-items', async (req, res) => {
  try {
    const where: Record<string, unknown> = {}
    const search = toSingle(req.query.search)
    const category = toSingle(req.query.category)
    const dateFrom = toSingle(req.query.dateFrom)
    const dateTo = toSingle(req.query.dateTo)

    if (search) where.name = { contains: search, mode: 'insensitive' }
    if (category && category !== 'all') where.category = category
    if (dateFrom || dateTo) {
      where.purchaseDate = {}
      if (dateFrom) (where.purchaseDate as Record<string, unknown>).gte = new Date(dateFrom)
      if (dateTo) {
        const endDate = new Date(dateTo)
        endDate.setHours(23, 59, 59, 999)
        ;(where.purchaseDate as Record<string, unknown>).lte = endDate
      }
    }

    const items = await prisma.logisticItem.findMany({
      where,
      orderBy: { purchaseDate: 'desc' },
    })
    return ok(res, items, 'Data logistic item berhasil diambil')
  } catch (error) {
    return fail(res, 'Gagal memuat logistic item', 500, String(error))
  }
})

app.post('/api/logistic-items', async (req, res) => {
  try {
    const parsed = logisticCreateSchema.safeParse(req.body)
    if (!parsed.success) return fail(res, 'Payload logistic item tidak valid', 422, parsed.error.flatten())

    const item = await prisma.logisticItem.create({
      data: {
        ...parsed.data,
        size: parsed.data.size ?? '',
        notes: parsed.data.notes ?? '',
        purchaseDate: parsed.data.purchaseDate ? new Date(parsed.data.purchaseDate) : new Date(),
      },
    })
    return ok(res, item, 'Logistic item berhasil dibuat', 201)
  } catch (error) {
    return fail(res, 'Gagal membuat logistic item', 400, String(error))
  }
})

app.patch('/api/logistic-items/:id', async (req, res) => {
  try {
    const parsed = logisticUpdateSchema.safeParse(req.body)
    if (!parsed.success) {
      return fail(res, 'Payload update logistic item tidak valid', 422, parsed.error.flatten())
    }

    const data = {
      ...parsed.data,
      purchaseDate: parsed.data.purchaseDate ? new Date(parsed.data.purchaseDate) : undefined,
    }
    const item = await prisma.logisticItem.update({
      where: { id: req.params.id },
      data,
    })
    return ok(res, item, 'Logistic item berhasil diperbarui')
  } catch (error) {
    return fail(res, 'Gagal update logistic item', 400, String(error))
  }
})

app.delete('/api/logistic-items/:id', async (req, res) => {
  try {
    await prisma.logisticItem.delete({ where: { id: req.params.id } })
    return ok(res, { id: req.params.id }, 'Logistic item berhasil dihapus')
  } catch (error) {
    return fail(res, 'Gagal menghapus logistic item', 400, String(error))
  }
})

app.get('/api/dashboard', async (req, res) => {
  try {
    const parsed = dashboardQuerySchema.safeParse({
      period: toSingle(req.query.period) ?? '7d',
      menuCategory: toSingle(req.query.menuCategory) ?? 'all',
      method: toSingle(req.query.method) ?? 'all',
      txType: toSingle(req.query.txType) ?? 'all',
    })
    if (!parsed.success) return fail(res, 'Query dashboard tidak valid', 422, parsed.error.flatten())

    const { period, menuCategory, method, txType } = parsed.data
    const startDate = getStartDateByPeriod(period)
    const now = new Date()
    const todayStart = new Date(now)
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date(now)
    todayEnd.setHours(23, 59, 59, 999)
    const yesterdayStart = new Date(todayStart)
    yesterdayStart.setDate(yesterdayStart.getDate() - 1)
    const yesterdayEnd = new Date(todayStart)
    yesterdayEnd.setMilliseconds(-1)

    const transactions = await prisma.transaction.findMany({
      where: { date: { gte: startDate } },
      orderBy: { date: 'asc' },
    })

    const allProducts = await prisma.product.findMany({
      where: { isActive: true },
      include: { category: true },
    })
    const menuProducts =
      menuCategory === 'all' ? allProducts : allProducts.filter((p) => p.category.name === menuCategory)
    const categoryProductNames = new Set(menuProducts.map((p) => p.name.toLowerCase()))
    const getProductName = (description: string) => description.replace(/\s*x\d+$/i, '').trim().toLowerCase()
    const includeIncome = (description: string) =>
      menuCategory === 'all' || categoryProductNames.has(getProductName(description))

    const filteredTransactions = transactions.filter((t) => {
      if (txType !== 'all' && t.type !== txType) return false
      if (method !== 'all' && t.method !== method) return false
      if (t.type === 'income' && !includeIncome(t.description)) return false
      return true
    })

    const inRange = (date: Date, start: Date, end: Date) => date >= start && date <= end
    const todayTx = filteredTransactions.filter((t) => inRange(t.date, todayStart, todayEnd))
    const yesterdayTx = filteredTransactions.filter((t) => inRange(t.date, yesterdayStart, yesterdayEnd))
    const sumByType = (rows: typeof filteredTransactions, type: 'income' | 'expense') =>
      rows.filter((t) => t.type === type).reduce((sum, t) => sum + t.amount, 0)
    const countIncome = (rows: typeof filteredTransactions) =>
      rows.filter((t) => t.type === 'income').length

    const lowStock = menuProducts.filter((p) => p.minStock > 0 && p.stock <= p.minStock)
    const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']
    const totalDays = Math.max(1, Math.floor((todayStart.getTime() - startDate.getTime()) / 86400000) + 1)
    const revenueData = []
    for (let i = 0; i < totalDays; i++) {
      const d = new Date(startDate)
      d.setDate(d.getDate() + i)
      const key = d.toISOString().split('T')[0]
      const dayTx = filteredTransactions.filter((t) => t.date.toISOString().split('T')[0] === key)
      revenueData.push({
        date:
          period === '7d'
            ? dayNames[d.getDay()]
            : d.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' }),
        revenue: dayTx.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
        expense: dayTx.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0),
      })
    }

    const categoryMap: Record<string, number> = {}
    filteredTransactions
      .filter((t) => t.type === 'income')
      .forEach((t) => {
        if (!categoryMap[t.category]) categoryMap[t.category] = 0
        categoryMap[t.category] += t.amount
      })
    const categoryBreakdown = Object.entries(categoryMap).map(([category, amount]) => ({
      category,
      _sum: { amount },
    }))

    const recentTransactions = [...todayTx]
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 5)
      .map((t) => ({
        id: t.id,
        item: t.description,
        time: t.date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        amount: t.type === 'income' ? t.amount : -t.amount,
        type: t.type,
      }))

    const topMap = new Map<string, { sales: number; revenue: number }>()
    filteredTransactions
      .filter((t) => t.type === 'income')
      .forEach((t) => {
        const name = t.description.replace(/ x\d+$/i, '').trim()
        const curr = topMap.get(name) ?? { sales: 0, revenue: 0 }
        topMap.set(name, { sales: curr.sales + 1, revenue: curr.revenue + t.amount })
      })
    const topProducts = [...topMap.entries()]
      .map(([name, v]) => ({ name, sales: v.sales, revenue: v.revenue }))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5)

    const potentialRevenueByCategory: Record<'Kopi' | 'Makanan' | 'Minuman Lain', number> = {
      Kopi: 0,
      Makanan: 0,
      'Minuman Lain': 0,
    }
    for (const product of allProducts) {
      if (!['Kopi', 'Makanan', 'Minuman Lain'].includes(product.category.name)) continue
      const key = product.category.name as 'Kopi' | 'Makanan' | 'Minuman Lain'
      potentialRevenueByCategory[key] += product.price * product.stock
    }
    const potentialRevenueTotal = Object.values(potentialRevenueByCategory).reduce((a, b) => a + b, 0)

    return ok(res, {
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
      recentTransactions,
      topProducts,
      categoryBreakdown,
      potentialRevenueByCategory,
      potentialRevenueTotal,
      appliedFilters: { period, menuCategory, method, txType },
    })
  } catch (error) {
    return fail(res, 'Gagal memuat dashboard', 500, String(error))
  }
})

app.get('/api/reports', async (req, res) => {
  try {
    const parsed = reportQuerySchema.safeParse({
      period: toSingle(req.query.period) ?? '30d',
      menuCategory: toSingle(req.query.menuCategory) ?? 'all',
    })
    if (!parsed.success) return fail(res, 'Query reports tidak valid', 422, parsed.error.flatten())

    const { period, menuCategory } = parsed.data
    const startDate = getStartDateByPeriod(period)
    const transactions = await prisma.transaction.findMany({
      where: { date: { gte: startDate } },
      orderBy: { date: 'asc' },
    })
    const allProducts = await prisma.product.findMany({ include: { category: true } })
    const products =
      menuCategory === 'all' ? allProducts : allProducts.filter((p) => p.category.name === menuCategory)
    const productNames = new Set(products.map((p) => p.name.toLowerCase()))
    const normalize = (description: string) => description.replace(/\s*x\d+$/i, '').trim().toLowerCase()
    const includeIncome = (description: string) =>
      menuCategory === 'all' || productNames.has(normalize(description))

    const totalIncome = transactions
      .filter((t) => t.type === 'income' && includeIncome(t.description))
      .reduce((sum, t) => sum + t.amount, 0)
    const totalExpense = transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)

    const dailyData: Record<string, { date: string; income: number; expense: number }> = {}
    transactions.forEach((t) => {
      const key = t.date.toISOString().split('T')[0]
      if (!dailyData[key]) dailyData[key] = { date: key, income: 0, expense: 0 }
      if (t.type === 'income' && includeIncome(t.description)) dailyData[key].income += t.amount
      else if (t.type === 'expense') dailyData[key].expense += t.amount
    })

    const categoryData: Record<string, number> = {}
    transactions.forEach((t) => {
      if (t.type === 'income' && !includeIncome(t.description)) return
      if (!categoryData[t.category]) categoryData[t.category] = 0
      categoryData[t.category] += t.amount
    })

    const methodData: Record<string, number> = {}
    transactions
      .filter((t) => t.type === 'income' && includeIncome(t.description))
      .forEach((t) => {
        if (!methodData[t.method]) methodData[t.method] = 0
        methodData[t.method] += t.amount
      })

    const lowStockProducts = products.filter((p) => p.minStock > 0 && p.stock <= p.minStock)
    const transactionCount = transactions.filter(
      (t) => t.type !== 'income' || includeIncome(t.description)
    ).length

    return ok(res, {
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
    })
  } catch (error) {
    return fail(res, 'Gagal memuat reports', 500, String(error))
  }
})

app.get('/api/logistic-dashboard', async (req, res) => {
  try {
    const period = toSingle(req.query.period) ?? 'daily'
    if (!['daily', 'weekly', 'monthly'].includes(period)) {
      return fail(res, 'Query logistic dashboard tidak valid', 422)
    }

    const now = new Date()
    const todayStart = new Date(now)
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date(now)
    todayEnd.setHours(23, 59, 59, 999)
    const weekStart = new Date(todayStart)
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    const dailyItems = await prisma.logisticItem.findMany({
      where: { purchaseDate: { gte: todayStart, lte: todayEnd } },
      orderBy: { purchaseDate: 'desc' },
    })
    const weeklyItems = await prisma.logisticItem.findMany({
      where: { purchaseDate: { gte: weekStart, lte: todayEnd } },
      orderBy: { purchaseDate: 'asc' },
    })
    const monthlyItems = await prisma.logisticItem.findMany({
      where: { purchaseDate: { gte: monthStart, lte: todayEnd } },
      orderBy: { purchaseDate: 'asc' },
    })
    const allItems = await prisma.logisticItem.findMany()

    const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']
    const weeklyChart = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart)
      d.setDate(d.getDate() + i)
      const dateStr = d.toISOString().split('T')[0]
      const dayItems = weeklyItems.filter((item) => item.purchaseDate.toISOString().split('T')[0] === dateStr)
      weeklyChart.push({
        day: dayNames[i],
        date: dateStr,
        bahan: dayItems.filter((x) => x.category === 'bahan').reduce((s, x) => s + x.totalPrice, 0),
        makanan_minuman: dayItems
          .filter((x) => x.category === 'makanan_minuman')
          .reduce((s, x) => s + x.totalPrice, 0),
        total: dayItems.reduce((s, x) => s + x.totalPrice, 0),
      })
    }

    const monthlyChart = []
    const weeksInMonth = Math.ceil(todayEnd.getDate() / 7)
    for (let w = 0; w < weeksInMonth; w++) {
      const wStart = new Date(monthStart)
      wStart.setDate(wStart.getDate() + w * 7)
      const wEnd = new Date(wStart)
      wEnd.setDate(wEnd.getDate() + 6)
      if (wEnd > todayEnd) wEnd.setTime(todayEnd.getTime())

      const wStartStr = wStart.toISOString().split('T')[0]
      const wEndStr = wEnd.toISOString().split('T')[0]
      const wItems = monthlyItems.filter((item) => {
        const d = item.purchaseDate.toISOString().split('T')[0]
        return d >= wStartStr && d <= wEndStr
      })
      monthlyChart.push({
        label: `Minggu ${w + 1}`,
        bahan: wItems.filter((x) => x.category === 'bahan').reduce((s, x) => s + x.totalPrice, 0),
        makanan_minuman: wItems
          .filter((x) => x.category === 'makanan_minuman')
          .reduce((s, x) => s + x.totalPrice, 0),
        total: wItems.reduce((s, x) => s + x.totalPrice, 0),
      })
    }

    const itemSpending: Record<string, { name: string; category: string; total: number; count: number }> = {}
    allItems.forEach((item) => {
      if (!itemSpending[item.name]) {
        itemSpending[item.name] = { name: item.name, category: item.category, total: 0, count: 0 }
      }
      itemSpending[item.name].total += item.totalPrice
      itemSpending[item.name].count += 1
    })
    const topItems = Object.values(itemSpending).sort((a, b) => b.total - a.total).slice(0, 10)

    const data = {
      daily: {
        total: dailyItems.reduce((s, i) => s + i.totalPrice, 0),
        bahan: dailyItems.filter((i) => i.category === 'bahan').reduce((s, i) => s + i.totalPrice, 0),
        makmin: dailyItems
          .filter((i) => i.category === 'makanan_minuman')
          .reduce((s, i) => s + i.totalPrice, 0),
        itemCount: dailyItems.length,
      },
      weekly: {
        total: weeklyItems.reduce((s, i) => s + i.totalPrice, 0),
        bahan: weeklyItems.filter((i) => i.category === 'bahan').reduce((s, i) => s + i.totalPrice, 0),
        makmin: weeklyItems
          .filter((i) => i.category === 'makanan_minuman')
          .reduce((s, i) => s + i.totalPrice, 0),
        itemCount: weeklyItems.length,
        chart: weeklyChart,
      },
      monthly: {
        total: monthlyItems.reduce((s, i) => s + i.totalPrice, 0),
        bahan: monthlyItems.filter((i) => i.category === 'bahan').reduce((s, i) => s + i.totalPrice, 0),
        makmin: monthlyItems
          .filter((i) => i.category === 'makanan_minuman')
          .reduce((s, i) => s + i.totalPrice, 0),
        itemCount: monthlyItems.length,
        chart: monthlyChart,
      },
      topItems,
      totalAllTime: allItems.reduce((s, i) => s + i.totalPrice, 0),
      selectedPeriod: period,
    }

    return ok(res, data, 'Data logistic dashboard berhasil diambil')
  } catch (error) {
    return fail(res, 'Gagal memuat logistic dashboard', 500, String(error))
  }
})

app.listen(port, () => {
  console.log(`Warkop backend running on http://localhost:${port}`)
})



