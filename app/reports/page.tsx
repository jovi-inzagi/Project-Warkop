'use client'

import { useState, useEffect, useCallback } from 'react'
import AuthGuard from '@/components/auth-guard'
import AppLayout from '@/components/app-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import {
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Printer,
  FileBarChart,
  Loader2,
  AlertTriangle,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  PieChart as RechartsPie,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts'
import { getReportData } from '@/lib/actions'

const chartColors = ['#d97706', '#059669', '#2563eb', '#7c3aed', '#ec4899', '#06b6d4', '#f97316', '#14b8a6']
const categoryLabels: Record<string, string> = {
  penjualan: 'Penjualan',
  pembelian_bahan: 'Bahan Baku',
  operasional: 'Operasional',
  gaji: 'Gaji',
  lainnya: 'Lainnya',
}
const methodLabels: Record<string, string> = {
  cash: 'Tunai',
  transfer: 'Transfer',
  qris: 'QRIS',
}

type ReportData = Awaited<ReturnType<typeof getReportData>>

export default function ReportsPage() {
  const [period, setPeriod] = useState('30d')
  const [menuCategory, setMenuCategory] = useState<'all' | 'Kopi' | 'Makanan' | 'Minuman Lain'>('all')
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async (p: string, c: 'all' | 'Kopi' | 'Makanan' | 'Minuman Lain') => {
    setLoading(true)
    try {
      const result = await getReportData(p, c)
      setData(result)
    } catch {
      toast.error('Gagal memuat data laporan')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData(period, menuCategory) }, [period, menuCategory, loadData])

const handleExportCSV = (reportType: string) => {
    if (!data) return
    let csvContent = '\uFEFF' // BOM for Excel
  let fileName = ''

  if (reportType === 'ringkasan') {
      fileName = `Laporan_Ringkasan_${period}_${menuCategory}.csv`
      csvContent += 'Tanggal,Pendapatan,Pengeluaran,Keuntungan\n'
      data.dailyData.forEach(d => {
        csvContent += `${d.date},${d.income},${d.expense},${d.income - d.expense}\n`
    })
  } else if (reportType === 'inventori') {
      fileName = `Laporan_Inventori_${period}_${menuCategory}.csv`
      csvContent += 'Nama,SKU,Kategori,Stok,Min Stok,Harga Jual,Harga Beli,Nilai Stok\n'
      data.products.forEach(p => {
        csvContent += `${p.name},${p.sku},${p.category.name},${p.stock},${p.minStock},${p.price},${p.cost},${p.cost * p.stock}\n`
    })
  } else if (reportType === 'pengeluaran') {
      fileName = `Laporan_Pengeluaran_${period}_${menuCategory}.csv`
      csvContent += 'Kategori,Jumlah\n'
      data.categoryData.filter(c => c.name !== 'penjualan').forEach(c => {
        csvContent += `${categoryLabels[c.name] || c.name},${c.value}\n`
    })
  }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
    link.href = url
    link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
    URL.revokeObjectURL(url)
  toast.success(`${fileName} berhasil diunduh`)
}

  if (loading || !data) {
    return (
      <AuthGuard>
        <AppLayout>
          <div className="flex items-center justify-center py-32 gap-2 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>Memuat laporan...</span>
          </div>
        </AppLayout>
      </AuthGuard>
    )
  }

  const margin = data.totalIncome > 0
    ? ((data.profit / data.totalIncome) * 100).toFixed(1)
    : '0'

  const summaryCards = [
    { label: 'Total Pendapatan', value: data.totalIncome, icon: DollarSign, color: 'from-emerald-500 to-teal-500', trend: 'up' },
    { label: 'Total Pengeluaran', value: data.totalExpense, icon: TrendingDown, color: 'from-rose-500 to-pink-500', trend: 'down' },
    { label: 'Keuntungan Bersih', value: data.profit, icon: TrendingUp, color: 'from-blue-500 to-indigo-500', trend: data.profit >= 0 ? 'up' : 'down' },
    { label: 'Margin Keuntungan', value: `${margin}%`, icon: BarChart3, color: 'from-amber-500 to-orange-500', trend: Number(margin) >= 0 ? 'up' : 'down' },
  ]

  // Prepare chart data
  const dailyChartData = data.dailyData.map(d => ({
    date: new Date(d.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
    pendapatan: d.income,
    pengeluaran: d.expense,
  }))

  // Expense breakdown (only expense categories)
  const expenseData = data.categoryData
    .filter(c => c.name !== 'penjualan')
    .map((c, idx) => ({
      name: categoryLabels[c.name] || c.name,
      value: c.value,
      color: chartColors[(idx + 1) % chartColors.length],
      percentage: data.totalExpense > 0 ? Math.round((c.value / data.totalExpense) * 100) : 0,
    }))

  // Inventory data for report
  const totalStockValue = data.products.reduce((sum, p) => sum + p.cost * p.stock, 0)
  const inventoryItems = data.products
    .filter(p => p.minStock > 0)
    .map(p => ({
      name: p.name,
      category: p.category.name,
      qty: p.stock,
      minStock: p.minStock,
      value: p.cost * p.stock,
      percentage: totalStockValue > 0 ? Math.round((p.cost * p.stock / totalStockValue) * 100) : 0,
      isLow: p.stock <= p.minStock,
    }))
    .sort((a, b) => b.value - a.value)

  // Method breakdown for pie
  const methodData = data.methodData.map((m, idx) => ({
    name: methodLabels[m.name] || m.name,
    value: m.value,
    color: chartColors[idx % chartColors.length],
  }))

  const avgDaily = data.dailyData.length > 0
    ? data.totalIncome / data.dailyData.length
    : 0

  const bestDay = data.dailyData.reduce(
    (best, d) => d.income > best.income ? d : best,
    { income: 0, date: '-' }
  )

  const periodLabel = period === '7d' ? '7 Hari' : period === '30d' ? '30 Hari' : '90 Hari'
  const menuCategoryLabel = menuCategory === 'all' ? 'Semua Kategori' : menuCategory

  return (
    <AuthGuard>
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Laporan & Analisis</h1>
            <p className="text-muted-foreground text-sm mt-1">Analisis data bisnis dan ekspor laporan</p>
          </div>
          <div className="flex items-center gap-2">
              <Select value={menuCategory} onValueChange={(value) => setMenuCategory(value as 'all' | 'Kopi' | 'Makanan' | 'Minuman Lain')}>
                <SelectTrigger className="w-40 h-8 text-xs">
                  <SelectValue placeholder="Kategori Menu" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kategori</SelectItem>
                  <SelectItem value="Kopi">Kopi</SelectItem>
                  <SelectItem value="Makanan">Makanan</SelectItem>
                  <SelectItem value="Minuman Lain">Minuman Lain</SelectItem>
                </SelectContent>
              </Select>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-36 h-8 text-xs">
                <Calendar className="w-3.5 h-3.5 mr-1.5" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                  <SelectItem value="7d">7 Hari Terakhir</SelectItem>
                  <SelectItem value="30d">30 Hari Terakhir</SelectItem>
                  <SelectItem value="90d">90 Hari Terakhir</SelectItem>
              </SelectContent>
            </Select>
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={() => window.print()}>
              <Printer className="w-3.5 h-3.5" />
              Print
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {summaryCards.map((item, idx) => {
            const Icon = item.icon
            return (
              <Card key={idx} className="border-0 shadow-md overflow-hidden relative">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{item.label}</p>
                      <p className="text-xl font-bold tracking-tight">
                        {typeof item.value === 'number' ? `Rp ${item.value.toLocaleString('id-ID')}` : item.value}
                      </p>
                      <div className="flex items-center gap-1">
                        {item.trend === 'up' ? (
                          <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <ArrowDownRight className="w-3.5 h-3.5 text-rose-500" />
                        )}
                          <span className="text-[10px] text-muted-foreground">{periodLabel} • {menuCategoryLabel}</span>
                      </div>
                    </div>
                    <div className={`p-2.5 rounded-xl bg-gradient-to-br ${item.color} shadow-lg`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${item.color} opacity-60`} />
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="ringkasan" className="w-full">
          <TabsList className="h-9 bg-muted/40 p-0.5">
            <TabsTrigger value="ringkasan" className="text-xs h-8 px-4 gap-1.5">
              <FileBarChart className="w-3.5 h-3.5" />
              Ringkasan
            </TabsTrigger>
            <TabsTrigger value="inventori" className="text-xs h-8 px-4 gap-1.5">
              <Package className="w-3.5 h-3.5" />
              Inventori
            </TabsTrigger>
            <TabsTrigger value="pengeluaran" className="text-xs h-8 px-4 gap-1.5">
              <DollarSign className="w-3.5 h-3.5" />
              Pengeluaran
            </TabsTrigger>
            <TabsTrigger value="produk" className="text-xs h-8 px-4 gap-1.5">
              <BarChart3 className="w-3.5 h-3.5" />
                Metode Bayar
            </TabsTrigger>
          </TabsList>

          {/* Ringkasan Tab */}
          <TabsContent value="ringkasan" className="space-y-4 mt-4">
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                      <CardTitle className="text-base">Tren Keuangan {periodLabel}</CardTitle>
                      <CardDescription className="text-xs">Pendapatan vs pengeluaran harian</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1.5" onClick={() => handleExportCSV('ringkasan')}>
                    <Download className="w-3 h-3" />
                    Ekspor CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pb-4">
                <div className="w-full h-72">
                  <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={dailyChartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="gradPendapatan" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#d97706" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#d97706" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gradPengeluaran" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#dc2626" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                        <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} interval={period === '7d' ? 0 : 'preserveStartEnd'} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}jt`} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '10px',
                          fontSize: '12px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        }}
                        formatter={(value: number) => [`Rp ${value.toLocaleString('id-ID')}`, '']}
                      />
                      <Area type="monotone" dataKey="pendapatan" stroke="#d97706" strokeWidth={2.5} fill="url(#gradPendapatan)" name="Pendapatan" />
                      <Area type="monotone" dataKey="pengeluaran" stroke="#dc2626" strokeWidth={2} fill="url(#gradPengeluaran)" name="Pengeluaran" strokeDasharray="5 5" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex items-center justify-center gap-6 mt-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-amber-600" />
                    <span className="text-xs text-muted-foreground">Pendapatan</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500 opacity-60" />
                    <span className="text-xs text-muted-foreground">Pengeluaran</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Detail Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card className="border-0 shadow-md">
                <CardContent className="p-5 space-y-4">
                  <h3 className="text-sm font-semibold">Detail Periode</h3>
                  <div className="space-y-3">
                    {[
                        { label: 'Periode', value: periodLabel },
                        { label: 'Total Transaksi', value: `${data.transactionCount} transaksi` },
                        { label: 'Rata-rata Harian', value: `Rp ${Math.round(avgDaily).toLocaleString('id-ID')}` },
                        { label: 'Hari Terbaik', value: bestDay.date !== '-' ? new Date(bestDay.date).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' }) : '-' },
                        { label: 'Pendapatan Terbaik', value: `Rp ${bestDay.income.toLocaleString('id-ID')}` },
                    ].map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center py-2 border-b border-border/50 last:border-b-0">
                        <span className="text-xs text-muted-foreground">{item.label}</span>
                        <span className="text-xs font-semibold">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md">
                <CardContent className="p-5 space-y-4">
                  <h3 className="text-sm font-semibold">Status Bisnis</h3>
                  <div className="flex items-center justify-center py-4">
                    <div className="relative">
                        <div className={`w-28 h-28 rounded-full border-8 ${
                          Number(margin) >= 50 ? 'border-emerald-200 dark:border-emerald-800' :
                          Number(margin) >= 20 ? 'border-amber-200 dark:border-amber-800' :
                          'border-rose-200 dark:border-rose-800'
                        } flex items-center justify-center`}>
                        <div className="text-center">
                            <p className={`text-2xl font-bold ${
                              Number(margin) >= 50 ? 'text-emerald-600 dark:text-emerald-400' :
                              Number(margin) >= 20 ? 'text-amber-600 dark:text-amber-400' :
                              'text-rose-600 dark:text-rose-400'
                            }`}>{margin}%</p>
                          <p className="text-[10px] text-muted-foreground">Margin</p>
                        </div>
                      </div>
                        <div className={`absolute -top-1 -right-1 w-6 h-6 ${
                          Number(margin) >= 50 ? 'bg-emerald-500' :
                          Number(margin) >= 20 ? 'bg-amber-500' :
                          'bg-rose-500'
                        } rounded-full flex items-center justify-center`}>
                          {Number(margin) >= 20 ? (
                        <TrendingUp className="w-3.5 h-3.5 text-white" />
                          ) : (
                            <TrendingDown className="w-3.5 h-3.5 text-white" />
                          )}
                      </div>
                    </div>
                  </div>
                  <div className="text-center">
                      <Badge className={
                        Number(margin) >= 50
                          ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-400 dark:border-emerald-800'
                          : Number(margin) >= 20
                          ? 'bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200 dark:bg-amber-900/40 dark:text-amber-400 dark:border-amber-800'
                          : 'bg-rose-100 text-rose-700 hover:bg-rose-100 border-rose-200 dark:bg-rose-900/40 dark:text-rose-400 dark:border-rose-800'
                      }>
                        {Number(margin) >= 50 ? 'Bisnis Sehat & Menguntungkan' :
                         Number(margin) >= 20 ? 'Bisnis Cukup Stabil' : 'Perlu Evaluasi'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Inventori Tab */}
          <TabsContent value="inventori" className="space-y-4 mt-4">
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                      <CardTitle className="text-base">Kondisi Inventori</CardTitle>
                      <CardDescription className="text-xs">Stok bahan baku dan produk</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1.5" onClick={() => handleExportCSV('inventori')}>
                    <Download className="w-3 h-3" />
                    Ekspor CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pb-4">
                  {/* Low Stock Alert */}
                  {data.lowStockProducts.length > 0 && (
                    <div className="mb-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                          {data.lowStockProducts.length} produk dengan stok rendah
                        </p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {data.lowStockProducts.map((p) => (
                          <div key={p.id} className="flex items-center justify-between text-xs p-2 rounded-md bg-amber-100/50 dark:bg-amber-900/30">
                            <span className="font-medium text-amber-800 dark:text-amber-300">{p.name}</span>
                            <Badge variant="destructive" className="text-[10px] h-5">
                              {p.stock}/{p.minStock} {p.unit}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Pie Chart */}
                  <div className="w-full h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPie>
                        <Pie
                            data={inventoryItems.slice(0, 8)}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={85}
                          paddingAngle={3}
                          dataKey="value"
                          strokeWidth={0}
                        >
                            {inventoryItems.slice(0, 8).map((_, index) => (
                            <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '10px',
                            fontSize: '12px',
                          }}
                          formatter={(value: number) => [`Rp ${value.toLocaleString('id-ID')}`, '']}
                        />
                      </RechartsPie>
                    </ResponsiveContainer>
                  </div>

                    {/* Details List */}
                  <div className="space-y-2.5">
                      {inventoryItems.slice(0, 8).map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/30 transition-colors">
                        <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: chartColors[idx % chartColors.length] }} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                            <p className="text-sm font-medium truncate">{item.name}</p>
                                {item.isLow && (
                                  <Badge variant="destructive" className="text-[9px] h-4 px-1">Rendah</Badge>
                                )}
                              </div>
                            <span className="text-xs font-semibold shrink-0">Rp {item.value.toLocaleString('id-ID')}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Progress value={item.percentage} className="h-1.5 flex-1" />
                              <span className="text-[10px] text-muted-foreground w-14 text-right">{item.qty} {item.category === 'Bahan Baku' ? '' : ''}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    <Separator className="my-2" />
                    <div className="flex justify-between items-center px-2.5">
                      <p className="text-sm font-semibold">Total Nilai Stok</p>
                        <p className="text-sm font-bold">Rp {totalStockValue.toLocaleString('id-ID')}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pengeluaran Tab */}
          <TabsContent value="pengeluaran" className="space-y-4 mt-4">
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Analisis Pengeluaran</CardTitle>
                    <CardDescription className="text-xs">Breakdown pengeluaran per kategori</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {menuCategory !== 'all' && (
                      <Badge variant="outline" className="text-[10px] h-6">
                        Pengeluaran tidak difilter kategori menu
                      </Badge>
                    )}
                    <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1.5" onClick={() => handleExportCSV('pengeluaran')}>
                      <Download className="w-3 h-3" />
                      Ekspor CSV
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-4">
                  {expenseData.length > 0 ? (
                    <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Donut Chart */}
                  <div className="w-full h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPie>
                        <Pie
                                data={expenseData}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={85}
                          paddingAngle={3}
                          dataKey="value"
                          strokeWidth={0}
                        >
                                {expenseData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '10px',
                            fontSize: '12px',
                          }}
                          formatter={(value: number) => [`Rp ${value.toLocaleString('id-ID')}`, '']}
                        />
                      </RechartsPie>
                    </ResponsiveContainer>
                  </div>

                  {/* Horizontal Bar Chart */}
                  <div className="w-full h-64">
                    <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={expenseData} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                        <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}jt`} />
                        <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} width={80} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '10px',
                            fontSize: '12px',
                          }}
                          formatter={(value: number) => [`Rp ${value.toLocaleString('id-ID')}`, 'Jumlah']}
                        />
                        <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                                {expenseData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Details */}
                <div className="mt-6 space-y-2">
                        {expenseData.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/30 transition-colors">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium">{item.name}</p>
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="text-[10px]">{item.percentage}%</Badge>
                            <span className="text-sm font-semibold">Rp {item.value.toLocaleString('id-ID')}</span>
                          </div>
                        </div>
                        <Progress value={item.percentage} className="h-1 mt-2" />
                      </div>
                    </div>
                  ))}
                        <Separator className="my-2" />
                        <div className="flex justify-between items-center px-3">
                          <p className="text-sm font-semibold">Total Pengeluaran</p>
                          <p className="text-sm font-bold text-rose-600">Rp {data.totalExpense.toLocaleString('id-ID')}</p>
                        </div>
                </div>
                    </>
                  ) : (
                    <p className="text-center text-sm text-muted-foreground py-10">Belum ada data pengeluaran</p>
                  )}
              </CardContent>
            </Card>
          </TabsContent>

            {/* Metode Bayar Tab */}
          <TabsContent value="produk" className="space-y-4 mt-4">
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-2">
                <div>
                    <CardTitle className="text-base">Distribusi Metode Pembayaran</CardTitle>
                    <CardDescription className="text-xs">Pendapatan berdasarkan metode pembayaran</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="pb-4">
                  {methodData.length > 0 ? (
                    <>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="w-full h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <RechartsPie>
                              <Pie
                                data={methodData}
                                cx="50%"
                                cy="50%"
                                innerRadius={55}
                                outerRadius={85}
                                paddingAngle={3}
                                dataKey="value"
                                strokeWidth={0}
                              >
                                {methodData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: 'hsl(var(--card))',
                                  border: '1px solid hsl(var(--border))',
                                  borderRadius: '10px',
                                  fontSize: '12px',
                                }}
                                formatter={(value: number) => [`Rp ${value.toLocaleString('id-ID')}`, '']}
                              />
                            </RechartsPie>
                          </ResponsiveContainer>
                        </div>

                <div className="space-y-3">
                          {methodData.map((method, idx) => {
                            const totalMethodRevenue = methodData.reduce((s, m) => s + m.value, 0)
                            const pct = totalMethodRevenue > 0 ? Math.round((method.value / totalMethodRevenue) * 100) : 0
                            return (
                    <div key={idx} className="flex items-center gap-4 p-3 rounded-xl bg-muted/20 hover:bg-muted/40 transition-all">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: method.color + '20' }}>
                                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: method.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                                    <p className="text-sm font-semibold">{method.name}</p>
                                    <Badge variant="outline" className="text-[10px]">{pct}%</Badge>
                                  </div>
                                  <p className="text-xs font-semibold mt-1">Rp {method.value.toLocaleString('id-ID')}</p>
                                  <Progress value={pct} className="h-1.5 mt-2" />
                          </div>
                        </div>
                            )
                          })}
                          <Separator className="my-2" />
                          <div className="flex justify-between items-center px-3">
                            <p className="text-sm font-semibold">Total Pendapatan</p>
                            <p className="text-sm font-bold text-emerald-600">Rp {data.totalIncome.toLocaleString('id-ID')}</p>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="text-center text-sm text-muted-foreground py-10">Belum ada data pembayaran</p>
                  )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
    </AuthGuard>
  )
}
