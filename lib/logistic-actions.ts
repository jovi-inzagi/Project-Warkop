'use server'

import { prisma } from '@/lib/prisma'

// ==================== CRUD ====================

export async function getLogisticItems(filters?: {
  search?: string
  category?: string
  dateFrom?: string
  dateTo?: string
}) {
  const where: Record<string, unknown> = {}

  if (filters?.search) {
    where.name = { contains: filters.search }
  }
  if (filters?.category && filters.category !== 'all') {
    where.category = filters.category
  }
  if (filters?.dateFrom || filters?.dateTo) {
    where.purchaseDate = {}
    if (filters?.dateFrom) {
      (where.purchaseDate as Record<string, unknown>).gte = new Date(filters.dateFrom)
    }
    if (filters?.dateTo) {
      const endDate = new Date(filters.dateTo)
      endDate.setHours(23, 59, 59, 999)
      ;(where.purchaseDate as Record<string, unknown>).lte = endDate
    }
  }

  return prisma.logisticItem.findMany({
    where,
    orderBy: { purchaseDate: 'desc' },
  })
}

export async function createLogisticItem(data: {
  name: string
  category: string
  unit: string
  size?: string
  unitPrice: number
  quantity: number
  totalPrice: number
  purchaseDate?: string
  notes?: string
}) {
  try {
    const item = await prisma.logisticItem.create({
      data: {
        name: data.name,
        category: data.category,
        unit: data.unit,
        size: data.size || '',
        unitPrice: data.unitPrice,
        quantity: data.quantity,
        totalPrice: data.totalPrice,
        purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : new Date(),
        notes: data.notes || '',
      },
    })
    return { success: true, item }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    return { success: false, error: message }
  }
}

export async function updateLogisticItem(
  id: string,
  data: {
    name?: string
    category?: string
    unit?: string
    size?: string
    unitPrice?: number
    quantity?: number
    totalPrice?: number
    purchaseDate?: string
    notes?: string
  }
) {
  try {
    const updateData: Record<string, unknown> = { ...data }
    if (data.purchaseDate) {
      updateData.purchaseDate = new Date(data.purchaseDate)
    }
    const item = await prisma.logisticItem.update({
      where: { id },
      data: updateData,
    })
    return { success: true, item }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    return { success: false, error: message }
  }
}

export async function deleteLogisticItem(id: string) {
  try {
    await prisma.logisticItem.delete({ where: { id } })
    return { success: true }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    return { success: false, error: message }
  }
}

// ==================== DASHBOARD / REPORTS ====================

export async function getLogisticDashboard(period: string = 'daily') {
  const now = new Date()
  const todayStart = new Date(now)
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date(now)
  todayEnd.setHours(23, 59, 59, 999)

  // Periode ranges
  const weekStart = new Date(todayStart)
  weekStart.setDate(weekStart.getDate() - weekStart.getDay()) // Awal minggu (Minggu)

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  // === Harian ===
  const dailyItems = await prisma.logisticItem.findMany({
    where: { purchaseDate: { gte: todayStart, lte: todayEnd } },
    orderBy: { purchaseDate: 'desc' },
  })
  const dailyTotal = dailyItems.reduce((s, i) => s + i.totalPrice, 0)
  const dailyBahan = dailyItems.filter(i => i.category === 'bahan').reduce((s, i) => s + i.totalPrice, 0)
  const dailyMakmin = dailyItems.filter(i => i.category === 'makanan_minuman').reduce((s, i) => s + i.totalPrice, 0)

  // === Mingguan ===
  const weeklyItems = await prisma.logisticItem.findMany({
    where: { purchaseDate: { gte: weekStart, lte: todayEnd } },
    orderBy: { purchaseDate: 'asc' },
  })
  const weeklyTotal = weeklyItems.reduce((s, i) => s + i.totalPrice, 0)
  const weeklyBahan = weeklyItems.filter(i => i.category === 'bahan').reduce((s, i) => s + i.totalPrice, 0)
  const weeklyMakmin = weeklyItems.filter(i => i.category === 'makanan_minuman').reduce((s, i) => s + i.totalPrice, 0)

  // Chart harian per hari di minggu ini
  const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']
  const weeklyChart = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + i)
    const dateStr = d.toISOString().split('T')[0]
    const dayItems = weeklyItems.filter(
      item => item.purchaseDate.toISOString().split('T')[0] === dateStr
    )
    weeklyChart.push({
      day: dayNames[i],
      date: dateStr,
      bahan: dayItems.filter(x => x.category === 'bahan').reduce((s, x) => s + x.totalPrice, 0),
      makanan_minuman: dayItems.filter(x => x.category === 'makanan_minuman').reduce((s, x) => s + x.totalPrice, 0),
      total: dayItems.reduce((s, x) => s + x.totalPrice, 0),
    })
  }

  // === Bulanan ===
  const monthlyItems = await prisma.logisticItem.findMany({
    where: { purchaseDate: { gte: monthStart, lte: todayEnd } },
    orderBy: { purchaseDate: 'asc' },
  })
  const monthlyTotal = monthlyItems.reduce((s, i) => s + i.totalPrice, 0)
  const monthlyBahan = monthlyItems.filter(i => i.category === 'bahan').reduce((s, i) => s + i.totalPrice, 0)
  const monthlyMakmin = monthlyItems.filter(i => i.category === 'makanan_minuman').reduce((s, i) => s + i.totalPrice, 0)

  // Chart bulanan per minggu
  const monthlyChart = []
  const weeksInMonth = Math.ceil((todayEnd.getDate()) / 7)
  for (let w = 0; w < weeksInMonth; w++) {
    const wStart = new Date(monthStart)
    wStart.setDate(wStart.getDate() + w * 7)
    const wEnd = new Date(wStart)
    wEnd.setDate(wEnd.getDate() + 6)
    if (wEnd > todayEnd) wEnd.setTime(todayEnd.getTime())

    const wStartStr = wStart.toISOString().split('T')[0]
    const wEndStr = wEnd.toISOString().split('T')[0]
    const wItems = monthlyItems.filter(item => {
      const d = item.purchaseDate.toISOString().split('T')[0]
      return d >= wStartStr && d <= wEndStr
    })
    monthlyChart.push({
      label: `Minggu ${w + 1}`,
      bahan: wItems.filter(x => x.category === 'bahan').reduce((s, x) => s + x.totalPrice, 0),
      makanan_minuman: wItems.filter(x => x.category === 'makanan_minuman').reduce((s, x) => s + x.totalPrice, 0),
      total: wItems.reduce((s, x) => s + x.totalPrice, 0),
    })
  }

  // Top items by total spending
  const allItems = await prisma.logisticItem.findMany()
  const itemSpending: Record<string, { name: string; category: string; total: number; count: number }> = {}
  allItems.forEach(item => {
    if (!itemSpending[item.name]) {
      itemSpending[item.name] = { name: item.name, category: item.category, total: 0, count: 0 }
    }
    itemSpending[item.name].total += item.totalPrice
    itemSpending[item.name].count += 1
  })
  const topItems = Object.values(itemSpending).sort((a, b) => b.total - a.total).slice(0, 10)

  return {
    daily: { total: dailyTotal, bahan: dailyBahan, makmin: dailyMakmin, itemCount: dailyItems.length },
    weekly: { total: weeklyTotal, bahan: weeklyBahan, makmin: weeklyMakmin, itemCount: weeklyItems.length, chart: weeklyChart },
    monthly: { total: monthlyTotal, bahan: monthlyBahan, makmin: monthlyMakmin, itemCount: monthlyItems.length, chart: monthlyChart },
    topItems,
    totalAllTime: allItems.reduce((s, i) => s + i.totalPrice, 0),
  }
}


