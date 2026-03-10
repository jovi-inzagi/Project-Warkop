'use client'

import { useState, useEffect } from 'react'
import AuthGuard from '@/components/auth-guard'
import AppLayout from '@/components/app-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  ArrowUpRight, ArrowDownRight, Calendar, Coffee, Zap, Target, Clock, Filter, RotateCcw,
  DollarSign, ShoppingCart, Package, Loader2,
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts'
import { getDashboardData } from '@/lib/actions'
import Link from 'next/link'

const categoryColors: Record<string, string> = {
  penjualan: '#d97706',
  pembelian_bahan: '#059669',
  operasional: '#2563eb',
  gaji: '#7c3aed',
  lainnya: '#ea580c',
}

export default function Dashboard() {
  const [data, setData] = useState<Awaited<ReturnType<typeof getDashboardData>> | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('7d')
  const [menuCategory, setMenuCategory] = useState<'all' | 'Kopi' | 'Makanan' | 'Minuman Lain'>('all')
  const [method, setMethod] = useState<'all' | 'cash' | 'qris' | 'transfer'>('all')
  const [txType, setTxType] = useState<'all' | 'income' | 'expense'>('all')
  const [summaryCategory, setSummaryCategory] = useState<'all' | 'Kopi' | 'Makanan' | 'Minuman Lain'>('all')

  useEffect(() => {
    setLoading(true)
    getDashboardData({ period, menuCategory, method, txType })
      .then((d) => setData(d))
      .finally(() => setLoading(false))
  }, [period, menuCategory, method, txType])

  if (loading || !data) {
    return (
      <AuthGuard>
        <AppLayout>
          <div className="flex items-center justify-center py-32 gap-2 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>Memuat dashboard...</span>
          </div>
        </AppLayout>
      </AuthGuard>
    )
  }

  const {
    kpi,
    revenueData,
    recentTransactions,
    topProducts,
    categoryBreakdown,
    potentialRevenueByCategory,
    potentialRevenueTotal,
  } = data

  // Calculate changes
  const incomeChange = kpi.yesterdayIncome > 0
    ? (((kpi.todayIncome - kpi.yesterdayIncome) / kpi.yesterdayIncome) * 100).toFixed(1)
    : '0'
  const expenseChange = kpi.yesterdayExpense > 0
    ? (((kpi.todayExpense - kpi.yesterdayExpense) / kpi.yesterdayExpense) * 100).toFixed(1)
    : '0'
  const ordersChange = kpi.yesterdayOrders > 0
    ? (((kpi.todayOrders - kpi.yesterdayOrders) / kpi.yesterdayOrders) * 100).toFixed(1)
    : '0'

const kpiCards = [
  {
      title: 'Pendapatan Hari Ini', value: `Rp ${kpi.todayIncome.toLocaleString('id-ID')}`,
      change: `${Number(incomeChange) >= 0 ? '+' : ''}${incomeChange}%`, trend: Number(incomeChange) >= 0 ? 'up' : 'down',
      icon: DollarSign, color: 'from-emerald-500 to-teal-600',
  },
  {
      title: 'Pengeluaran', value: `Rp ${kpi.todayExpense.toLocaleString('id-ID')}`,
      change: `${Number(expenseChange) >= 0 ? '+' : ''}${expenseChange}%`, trend: Number(expenseChange) <= 0 ? 'up' : 'down',
      icon: ShoppingCart, color: 'from-blue-500 to-indigo-600',
  },
  {
      title: 'Transaksi Hari Ini', value: String(kpi.todayOrders),
      change: `${Number(ordersChange) >= 0 ? '+' : ''}${ordersChange}%`, trend: Number(ordersChange) >= 0 ? 'up' : 'down',
      icon: Coffee, color: 'from-amber-500 to-orange-600',
  },
  {
      title: 'Stok Rendah', value: `${kpi.lowStockCount} Item`,
      change: kpi.lowStockCount > 0 ? 'Perlu restock' : 'Aman', trend: kpi.lowStockCount > 0 ? 'down' : 'up',
      icon: Package, color: 'from-rose-500 to-pink-600',
  },
]

  const potentialRevenueCards = [
    {
      title: 'Kopi',
      value: potentialRevenueByCategory.Kopi,
      icon: Coffee,
      color: 'from-amber-500 to-orange-600',
    },
    {
      title: 'Makanan',
      value: potentialRevenueByCategory.Makanan,
      icon: ShoppingCart,
      color: 'from-emerald-500 to-teal-600',
    },
    {
      title: 'Minuman Lain',
      value: potentialRevenueByCategory['Minuman Lain'],
      icon: DollarSign,
      color: 'from-blue-500 to-indigo-600',
    },
    {
      title: 'Total Potensi',
      value: potentialRevenueTotal,
      icon: Target,
      color: 'from-violet-500 to-purple-600',
    },
  ]

  const filteredPotentialRevenueCards = summaryCategory === 'all'
    ? potentialRevenueCards
    : potentialRevenueCards.filter((item) => item.title === summaryCategory || item.title === 'Total Potensi')

  const resetFilters = () => {
    setPeriod('7d')
    setMenuCategory('all')
    setMethod('all')
    setTxType('all')
  }

  const activeFilterCount = [period !== '7d', menuCategory !== 'all', method !== 'all', txType !== 'all'].filter(Boolean).length

  const pieData = categoryBreakdown.map(c => ({
    name: c.category,
    value: c._sum.amount || 0,
    color: categoryColors[c.category] || '#888',
  }))

  return (
    <AuthGuard>
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
          {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Overview</h1>
            <p className="text-muted-foreground text-sm mt-1">Ringkasan operasional Warkop dan tren keuangan</p>
          </div>
            <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
              <Calendar className="w-3.5 h-3.5" />
              Last updated {new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
            </Button>
        </div>

        {/* Filter Bar */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-4 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Filter className="w-4 h-4" />
                Filter:
              </div>
              <Select value={txType} onValueChange={(v) => setTxType(v as 'all' | 'income' | 'expense')}>
                <SelectTrigger className="w-[170px] h-9 text-xs">
                  <SelectValue placeholder="Pilih status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Transaksi</SelectItem>
                  <SelectItem value="income">Pendapatan Saja</SelectItem>
                  <SelectItem value="expense">Pengeluaran Saja</SelectItem>
                </SelectContent>
              </Select>

              <Select value={menuCategory} onValueChange={(v) => setMenuCategory(v as 'all' | 'Kopi' | 'Makanan' | 'Minuman Lain')}>
                <SelectTrigger className="w-[170px] h-9 text-xs">
                  <SelectValue placeholder="Pilih kategori menu" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kategori</SelectItem>
                  <SelectItem value="Kopi">Kopi</SelectItem>
                  <SelectItem value="Makanan">Makanan</SelectItem>
                  <SelectItem value="Minuman Lain">Minuman Lain</SelectItem>
                </SelectContent>
              </Select>

              <Select value={method} onValueChange={(v) => setMethod(v as 'all' | 'cash' | 'qris' | 'transfer')}>
                <SelectTrigger className="w-[150px] h-9 text-xs">
                  <SelectValue placeholder="Pilih metode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Metode</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="qris">QRIS</SelectItem>
                  <SelectItem value="transfer">Transfer</SelectItem>
                </SelectContent>
              </Select>

              <Select value={period} onValueChange={(v) => setPeriod(v as '7d' | '30d' | '90d')}>
                <SelectTrigger className="w-[130px] h-9 text-xs">
                  <SelectValue placeholder="Periode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 Days</SelectItem>
                  <SelectItem value="30d">Last 30 Days</SelectItem>
                  <SelectItem value="90d">Last 90 Days</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" size="sm" className="h-9 text-xs gap-1.5" onClick={resetFilters}>
                <RotateCcw className="w-3.5 h-3.5" />
                Reset
              </Button>
            </div>

            <div className="text-xs text-muted-foreground">
              {activeFilterCount === 0
                ? 'Active Filters: tidak ada filter aktif - menampilkan semua data.'
                : `Active Filters: ${activeFilterCount} filter aktif.`}
            </div>
          </CardContent>
        </Card>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiCards.map((kpi, idx) => {
            const Icon = kpi.icon
            return (
                <Card key={idx} className={`relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-all duration-300 animate-slide-up`}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{kpi.title}</p>
                      <p className="text-2xl font-bold tracking-tight">{kpi.value}</p>
                      <div className="flex items-center gap-1">
                          {kpi.trend === 'up' ? <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" /> : <ArrowDownRight className="w-3.5 h-3.5 text-rose-500" />}
                          <span className={`text-xs font-medium ${kpi.trend === 'up' ? 'text-emerald-600' : 'text-rose-600'}`}>{kpi.change}</span>
                        <span className="text-xs text-muted-foreground">vs kemarin</span>
                      </div>
                    </div>
                    <div className={`p-2.5 rounded-xl bg-gradient-to-br ${kpi.color} shadow-lg`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${kpi.color} opacity-60`} />
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Potensi Pemasukan dari Seluruh Stok */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle className="text-base">Potensi Pemasukan Jika Semua Stok Terjual</CardTitle>
                <CardDescription className="text-xs">
                  Berdasarkan kategori Kopi, Makanan, dan Minuman Lain (harga jual x stok)
                </CardDescription>
              </div>
              <Select value={summaryCategory} onValueChange={(v) => setSummaryCategory(v as 'all' | 'Kopi' | 'Makanan' | 'Minuman Lain')}>
                <SelectTrigger className="w-full sm:w-48 h-8 text-xs">
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kategori</SelectItem>
                  <SelectItem value="Kopi">Kopi</SelectItem>
                  <SelectItem value="Makanan">Makanan</SelectItem>
                  <SelectItem value="Minuman Lain">Minuman Lain</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {filteredPotentialRevenueCards.map((item, idx) => {
                const Icon = item.icon
                return (
                  <div key={idx} className="relative overflow-hidden rounded-xl border border-border/60 bg-card p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{item.title}</p>
                        <p className="text-lg font-bold mt-1">Rp {item.value.toLocaleString('id-ID')}</p>
                      </div>
                      <div className={`p-2 rounded-lg bg-gradient-to-br ${item.color}`}>
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${item.color} opacity-70`} />
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Revenue Chart */}
          <Card className="lg:col-span-2 border-0 shadow-md">
            <CardHeader className="pb-2">
                  <CardTitle className="text-base">Tren Pendapatan & Pengeluaran</CardTitle>
                  <CardDescription className="text-xs">Perbandingan sesuai periode yang dipilih</CardDescription>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="w-full h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradientRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#d97706" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#d97706" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gradientExpense" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#dc2626" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}jt`} />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '10px', fontSize: '12px' }}
                        formatter={(value: number) => [`Rp ${value.toLocaleString('id-ID')}`, '']} />
                    <Area type="monotone" dataKey="revenue" stroke="#d97706" strokeWidth={2.5} fill="url(#gradientRevenue)" name="Pendapatan" />
                    <Area type="monotone" dataKey="expense" stroke="#dc2626" strokeWidth={2} fill="url(#gradientExpense)" name="Pengeluaran" strokeDasharray="5 5" />
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

          {/* Category Pie Chart */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Kategori Penjualan</CardTitle>
              <CardDescription className="text-xs">Distribusi per kategori</CardDescription>
            </CardHeader>
            <CardContent>
                {pieData.length > 0 ? (
                  <>
              <div className="w-full h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                          <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="value" strokeWidth={0}>
                            {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                          <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '10px', fontSize: '12px' }}
                            formatter={(value: number) => [`Rp ${value.toLocaleString('id-ID')}`, '']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                      {pieData.map((cat, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-muted/40">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                    <div className="min-w-0">
                            <p className="text-[11px] font-medium truncate capitalize">{cat.name.replace('_', ' ')}</p>
                            <p className="text-[10px] text-muted-foreground">Rp {(cat.value / 1000).toFixed(0)}rb</p>
                    </div>
                  </div>
                ))}
              </div>
                  </>
                ) : (
                  <p className="text-center text-sm text-muted-foreground py-10">Belum ada data</p>
                )}
            </CardContent>
          </Card>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Top Products */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
                  <CardTitle className="text-base">Produk Terlaris</CardTitle>
                <CardDescription className="text-xs">Berdasarkan jumlah penjualan minggu ini</CardDescription>
            </CardHeader>
            <CardContent className="pb-4">
                {topProducts.length > 0 ? (
              <div className="space-y-3">
                {topProducts.map((product, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/30 hover:bg-muted/50 transition-all">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/40 dark:to-orange-900/40 flex items-center justify-center text-sm font-bold text-amber-700 dark:text-amber-400 shrink-0">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium truncate">{product.name}</p>
                            <Badge variant="default" className="text-[10px] px-1.5 py-0 h-5">
                              {product.sales}x
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-muted-foreground">{product.sales} terjual</span>
                            <span className="text-xs font-semibold">Rp {product.revenue.toLocaleString('id-ID')}</span>
                          </div>
                          <Progress value={topProducts[0]?.sales ? (product.sales / topProducts[0].sales) * 100 : 0} className="h-1 mt-1.5" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-sm text-muted-foreground py-10">Belum ada data penjualan</p>
                )}
            </CardContent>
          </Card>

          {/* Recent Transactions */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Transaksi Terkini</CardTitle>
                  <CardDescription className="text-xs">Aktivitas hari ini</CardDescription>
                </div>
                  <Link href="/cash-flow">
                    <Button variant="outline" size="sm" className="h-7 text-[10px]">Lihat Semua</Button>
                  </Link>
              </div>
            </CardHeader>
            <CardContent className="pb-4">
                {recentTransactions.length > 0 ? (
              <div className="space-y-2">
                {recentTransactions.map((tx) => (
                      <div key={tx.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/40 transition-all">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      tx.type === 'income'
                        ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400'
                        : 'bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400'
                    }`}>
                          {tx.type === 'income' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{tx.item}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        <span className="text-[11px] text-muted-foreground">{tx.time}</span>
                      </div>
                    </div>
                        <span className={`text-sm font-semibold tabular-nums ${tx.amount > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {tx.amount > 0 ? '+' : ''}Rp {Math.abs(tx.amount).toLocaleString('id-ID')}
                    </span>
                  </div>
                ))}
              </div>
                ) : (
                  <p className="text-center text-sm text-muted-foreground py-10">Belum ada transaksi hari ini</p>
                )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats Footer */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
              { icon: Target, label: 'Keuntungan Bersih', value: `Rp ${((kpi.todayIncome - kpi.todayExpense) / 1000).toFixed(0)}rb`, sub: 'hari ini' },
              { icon: Zap, label: 'Rata-rata Transaksi', value: kpi.todayOrders > 0 ? `Rp ${(kpi.todayIncome / kpi.todayOrders / 1000).toFixed(0)}rb` : '-', sub: 'per transaksi' },
              { icon: Coffee, label: 'Total Produk', value: String(topProducts.length), sub: 'produk aktif' },
              { icon: Clock, label: 'Terakhir Diperbarui', value: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }), sub: 'data real-time' },
          ].map((stat, idx) => {
            const Icon = stat.icon
            return (
              <div key={idx} className="flex items-center gap-3 p-3.5 rounded-xl bg-card border border-border/50 shadow-sm hover:shadow-md transition-all">
                <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-900/30">
                  <Icon className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">{stat.label}</p>
                    <p className="text-sm font-bold">{stat.value}</p>
                  <p className="text-[10px] text-muted-foreground">{stat.sub}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </AppLayout>
    </AuthGuard>
  )
}
