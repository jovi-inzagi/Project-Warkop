'use client'

import { useState, useEffect, useCallback } from 'react'
import AuthGuard from '@/components/auth-guard'
import AppLayout from '@/components/app-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import {
  Plus, Search, Edit2, Trash2, Truck, Package, ShoppingBasket, Loader2,
  MoreHorizontal, Download, Filter, CalendarDays, TrendingDown, BarChart3,
  Utensils, Sparkles, ChevronRight, Leaf, CupSoda,
} from 'lucide-react'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import {
  getLogisticItems, createLogisticItem, updateLogisticItem, deleteLogisticItem, getLogisticDashboard,
} from '@/lib/logistic-actions'

interface LogisticItem {
  id: string
  name: string
  category: string
  unit: string
  size: string
  unitPrice: number
  quantity: number
  totalPrice: number
  purchaseDate: string | Date
  notes: string
  createdAt: string | Date
}

type DashboardData = Awaited<ReturnType<typeof getLogisticDashboard>>

const categoryLabels: Record<string, string> = {
  bahan: 'Bahan',
  makanan_minuman: 'Makanan & Minuman',
}

const unitOptions = [
  { value: 'pcs', label: 'Pcs' },
  { value: 'pack', label: 'Pack' },
  { value: 'gram', label: 'Gram' },
  { value: 'kg', label: 'Kg' },
  { value: 'liter', label: 'Liter' },
  { value: 'sachet', label: 'Sachet' },
  { value: 'ikat', label: 'Ikat' },
  { value: 'bungkus', label: 'Bungkus' },
  { value: 'botol', label: 'Botol' },
  { value: 'dus', label: 'Dus' },
]

// Icon mapping berdasarkan nama barang
const sayurNames = ['sawi', 'cabe', 'cabai', 'tomat', 'bawang', 'wortel', 'kangkung', 'bayam', 'terong', 'timun', 'labu']
const minumanNames = ['nutrisari', 'indocafe', 'kapal api', 'abc moca', 'goodday', 'good day', 'tea jus', 'teajus', 'nescafe', 'kopi', 'teh', 'susu']

function getItemIcon(name: string, category: string) {
  const lower = name.toLowerCase()
  if (sayurNames.some(s => lower.includes(s))) {
    return { Icon: Leaf, bg: 'bg-green-100 dark:bg-green-900/30', color: 'text-green-600 dark:text-green-400' }
  }
  if (minumanNames.some(s => lower.includes(s))) {
    return { Icon: CupSoda, bg: 'bg-cyan-100 dark:bg-cyan-900/30', color: 'text-cyan-600 dark:text-cyan-400' }
  }
  if (category === 'bahan') {
    return { Icon: ShoppingBasket, bg: 'bg-orange-100 dark:bg-orange-900/30', color: 'text-orange-600 dark:text-orange-400' }
  }
  return { Icon: Utensils, bg: 'bg-blue-100 dark:bg-blue-900/30', color: 'text-blue-600 dark:text-blue-400' }
}

const emptyForm = {
  name: '', category: '', unit: 'pcs', size: '',
  unitPrice: '', quantity: '1', totalPrice: '',
  purchaseDate: '', notes: '',
}

export default function LogisticPage() {
  const [activeTab, setActiveTab] = useState('barang')
  const [items, setItems] = useState<LogisticItem[]>([])
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dashboardLoading, setDashboardLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [isOpen, setIsOpen] = useState(false)
  const [editItem, setEditItem] = useState<LogisticItem | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<LogisticItem | null>(null)
  const [formData, setFormData] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [dashPeriod, setDashPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly')

  const loadItems = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getLogisticItems()
      setItems(data as unknown as LogisticItem[])
    } catch {
      toast.error('Gagal memuat data logistik')
    }
    setLoading(false)
  }, [])

  const loadDashboard = useCallback(async () => {
    setDashboardLoading(true)
    try {
      const data = await getLogisticDashboard()
      setDashboard(data)
    } catch {
      toast.error('Gagal memuat dashboard')
    }
    setDashboardLoading(false)
  }, [])

  useEffect(() => {
    loadItems()
    loadDashboard()
  }, [loadItems, loadDashboard])

  // Filter items
  const filteredItems = items.filter(item => {
    const matchSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchCategory = categoryFilter === 'all' || item.category === categoryFilter
    return matchSearch && matchCategory
  })

  // Totals
  const totalBahan = filteredItems.filter(i => i.category === 'bahan').reduce((s, i) => s + i.totalPrice, 0)
  const totalMakmin = filteredItems.filter(i => i.category === 'makanan_minuman').reduce((s, i) => s + i.totalPrice, 0)
  const grandTotal = filteredItems.reduce((s, i) => s + i.totalPrice, 0)

  // Auto-calculate totalPrice
  const updatePrice = (field: string, value: string) => {
    const newForm = { ...formData, [field]: value }
    if (field === 'unitPrice' || field === 'quantity') {
      const up = field === 'unitPrice' ? Number(value) : Number(newForm.unitPrice)
      const qty = field === 'quantity' ? Number(value) : Number(newForm.quantity)
      if (up > 0 && qty > 0) {
        newForm.totalPrice = String(up * qty)
      }
    }
    setFormData(newForm)
  }

  const openAddDialog = () => {
    setEditItem(null)
    setFormData({ ...emptyForm, purchaseDate: new Date().toISOString().split('T')[0] })
    setIsOpen(true)
  }

  const openEditDialog = (item: LogisticItem) => {
    setEditItem(item)
    const d = new Date(item.purchaseDate)
    setFormData({
      name: item.name,
      category: item.category,
      unit: item.unit,
      size: item.size,
      unitPrice: String(item.unitPrice),
      quantity: String(item.quantity),
      totalPrice: String(item.totalPrice),
      purchaseDate: d.toISOString().split('T')[0],
      notes: item.notes,
    })
    setIsOpen(true)
  }

  const handleSubmit = async () => {
    if (!formData.name || !formData.category || !formData.unitPrice) {
      toast.error('Lengkapi semua field wajib (Nama, Kategori, Harga)')
      return
    }
    setSubmitting(true)
    const payload = {
      name: formData.name,
      category: formData.category,
      unit: formData.unit,
      size: formData.size,
      unitPrice: Number(formData.unitPrice) || 0,
      quantity: Number(formData.quantity) || 1,
      totalPrice: Number(formData.totalPrice) || Number(formData.unitPrice) * (Number(formData.quantity) || 1),
      purchaseDate: formData.purchaseDate || undefined,
      notes: formData.notes,
    }

    if (editItem) {
      const result = await updateLogisticItem(editItem.id, payload)
      if (result.success) {
        toast.success(`"${formData.name}" berhasil diperbarui`)
        setIsOpen(false)
        loadItems()
        loadDashboard()
      } else {
        toast.error(result.error || 'Gagal memperbarui')
      }
    } else {
      const result = await createLogisticItem(payload)
      if (result.success) {
        toast.success(`"${formData.name}" berhasil ditambahkan`)
        setIsOpen(false)
        loadItems()
        loadDashboard()
      } else {
        toast.error(result.error || 'Gagal menambahkan')
      }
    }
    setSubmitting(false)
  }

  const handleDelete = async () => {
    if (!deleteConfirm) return
    setSubmitting(true)
    const result = await deleteLogisticItem(deleteConfirm.id)
    if (result.success) {
      toast.success(`"${deleteConfirm.name}" berhasil dihapus`)
      setDeleteConfirm(null)
      loadItems()
      loadDashboard()
    } else {
      toast.error(result.error || 'Gagal menghapus')
    }
    setSubmitting(false)
  }

  const handleExport = () => {
    const csv = [
      ['Nama', 'Kategori', 'Satuan', 'Size', 'Harga Satuan', 'Jumlah', 'Harga Total', 'Tanggal', 'Catatan'].join(','),
      ...filteredItems.map(item => [
        `"${item.name}"`,
        categoryLabels[item.category] || item.category,
        item.unit,
        item.size,
        item.unitPrice,
        item.quantity,
        item.totalPrice,
        new Date(item.purchaseDate).toLocaleDateString('id-ID'),
        `"${item.notes}"`,
      ].join(',')),
    ].join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `logistik-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    toast.success('Data logistik berhasil diekspor')
  }

  // Dashboard chart data
  const getChartData = () => {
    if (!dashboard) return []
    if (dashPeriod === 'weekly') return dashboard.weekly.chart.map(d => ({ name: d.day, bahan: d.bahan, makmin: d.makanan_minuman, total: d.total }))
    if (dashPeriod === 'monthly') return dashboard.monthly.chart.map(d => ({ name: d.label, bahan: d.bahan, makmin: d.makanan_minuman, total: d.total }))
    return []
  }

  const getDashSummary = () => {
    if (!dashboard) return { total: 0, bahan: 0, makmin: 0, itemCount: 0 }
    if (dashPeriod === 'daily') return dashboard.daily
    if (dashPeriod === 'weekly') return dashboard.weekly
    return dashboard.monthly
  }

  const dashSummary = getDashSummary()

  return (
    <AuthGuard>
      <AppLayout>
        <div className="space-y-6 animate-fade-in">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/25">
                  <Truck className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Logistik</h1>
              </div>
              <p className="text-muted-foreground text-sm">Kelola pengadaan bahan baku & stok makanan minuman</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={handleExport}>
                <Download className="w-3.5 h-3.5" />
                Ekspor
              </Button>
              <Button size="sm" className="h-8 gap-1.5 text-xs bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 shadow-lg shadow-violet-500/25" onClick={openAddDialog}>
                <Plus className="w-3.5 h-3.5" />
                Tambah Barang
              </Button>
            </div>
          </div>

          {/* Main Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="h-9 bg-muted/40 p-0.5">
              <TabsTrigger value="barang" className="text-xs h-8 px-4 gap-1.5">
                <Package className="w-3.5 h-3.5" />
                Data Barang
              </TabsTrigger>
              <TabsTrigger value="dashboard" className="text-xs h-8 px-4 gap-1.5">
                <BarChart3 className="w-3.5 h-3.5" />
                Laporan Pengeluaran
              </TabsTrigger>
            </TabsList>

            {/* ==================== TAB: DATA BARANG ==================== */}
            <TabsContent value="barang" className="space-y-4 mt-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="border-0 shadow-md overflow-hidden relative">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Bahan</p>
                        <p className="text-xl font-bold tracking-tight text-orange-700 dark:text-orange-400">
                          Rp {totalBahan.toLocaleString('id-ID')}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {filteredItems.filter(i => i.category === 'bahan').length} item
                        </p>
                      </div>
                      <div className="p-2.5 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 shadow-lg">
                        <ShoppingBasket className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 to-amber-500 opacity-60" />
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-md overflow-hidden relative">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Makanan & Minuman</p>
                        <p className="text-xl font-bold tracking-tight text-blue-700 dark:text-blue-400">
                          Rp {totalMakmin.toLocaleString('id-ID')}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {filteredItems.filter(i => i.category === 'makanan_minuman').length} item
                        </p>
                      </div>
                      <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
                        <Utensils className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 opacity-60" />
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-md overflow-hidden relative">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Grand Total</p>
                        <p className="text-xl font-bold tracking-tight text-violet-700 dark:text-violet-400">
                          Rp {grandTotal.toLocaleString('id-ID')}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {filteredItems.length} item total
                        </p>
                      </div>
                      <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg">
                        <Sparkles className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 to-purple-500 opacity-60" />
                  </CardContent>
                </Card>
              </div>

              {/* Filter & Search */}
              <Card className="border-0 shadow-md">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input placeholder="Cari barang..." className="pl-9 h-9 text-sm" value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger className="w-full sm:w-48 h-9 text-xs">
                        <Filter className="w-3.5 h-3.5 mr-1.5" />
                        <SelectValue placeholder="Kategori" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Semua Kategori</SelectItem>
                        <SelectItem value="bahan">Bahan</SelectItem>
                        <SelectItem value="makanan_minuman">Makanan & Minuman</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                    <span>Menampilkan {filteredItems.length} dari {items.length} barang</span>
                    {(categoryFilter !== 'all' || searchTerm) && (
                      <Button variant="ghost" size="sm" className="h-5 text-[10px] px-2"
                        onClick={() => { setSearchTerm(''); setCategoryFilter('all') }}>
                        Reset filter
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Table */}
              <Card className="border-0 shadow-md overflow-hidden">
                {loading ? (
                  <div className="flex items-center justify-center py-20 gap-2 text-muted-foreground">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-sm">Memuat data...</span>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/40 hover:bg-muted/40">
                            <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Nama Barang</TableHead>
                            <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hidden sm:table-cell">Kategori</TableHead>
                            <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-center hidden md:table-cell">Satuan</TableHead>
                            <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-center hidden md:table-cell">Size</TableHead>
                            <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-right">Harga Satuan</TableHead>
                            <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-center">Jumlah</TableHead>
                            <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-right">Harga Total</TableHead>
                            <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-center hidden lg:table-cell">Tanggal</TableHead>
                            <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-center w-16">Aksi</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredItems.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={9} className="text-center py-10">
                                <Package className="w-10 h-10 mx-auto text-muted-foreground/30 mb-2" />
                                <p className="text-sm text-muted-foreground">Tidak ada barang ditemukan</p>
                              </TableCell>
                            </TableRow>
                          ) : filteredItems.map((item) => {
                            const { Icon: ItemIcon, bg: iconBg, color: iconColor } = getItemIcon(item.name, item.category)
                            return (
                            <TableRow key={item.id} className="group hover:bg-muted/20 transition-colors">
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}>
                                    <ItemIcon className={`w-4 h-4 ${iconColor}`} />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-sm font-medium truncate">{item.name}</p>
                                    {item.notes && <p className="text-[10px] text-muted-foreground truncate">{item.notes}</p>}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="hidden sm:table-cell">
                                <Badge variant="outline" className={`text-[10px] font-medium ${
                                  item.category === 'bahan'
                                    ? 'border-orange-200 text-orange-700 dark:border-orange-800 dark:text-orange-400'
                                    : 'border-blue-200 text-blue-700 dark:border-blue-800 dark:text-blue-400'
                                }`}>
                                  {categoryLabels[item.category] || item.category}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center hidden md:table-cell">
                                <span className="text-xs capitalize">{item.unit}</span>
                              </TableCell>
                              <TableCell className="text-center hidden md:table-cell">
                                <span className="text-xs text-muted-foreground">{item.size || '-'}</span>
                              </TableCell>
                              <TableCell className="text-right">
                                <span className="text-sm">Rp {item.unitPrice.toLocaleString('id-ID')}</span>
                              </TableCell>
                              <TableCell className="text-center">
                                <span className="text-sm font-semibold">{item.quantity}</span>
                              </TableCell>
                              <TableCell className="text-right">
                                <span className="text-sm font-bold text-violet-700 dark:text-violet-400">
                                  Rp {item.totalPrice.toLocaleString('id-ID')}
                                </span>
                              </TableCell>
                              <TableCell className="text-center hidden lg:table-cell">
                                <span className="text-xs text-muted-foreground">
                                  {new Date(item.purchaseDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </span>
                              </TableCell>
                              <TableCell className="text-center">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <MoreHorizontal className="w-4 h-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-36">
                                    <DropdownMenuItem className="text-xs gap-2" onClick={() => openEditDialog(item)}>
                                      <Edit2 className="w-3.5 h-3.5" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="text-xs gap-2 text-destructive focus:text-destructive"
                                      onClick={() => setDeleteConfirm(item)}>
                                      <Trash2 className="w-3.5 h-3.5" />
                                      Hapus
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Total Footer */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border-t bg-muted/20 gap-2">
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Bahan: <span className="font-bold text-orange-600">Rp {totalBahan.toLocaleString('id-ID')}</span></span>
                        <span>Makanan & Minuman: <span className="font-bold text-blue-600">Rp {totalMakmin.toLocaleString('id-ID')}</span></span>
                      </div>
                      <p className="text-sm">
                        Grand Total: <span className="font-bold text-violet-700 dark:text-violet-400">Rp {grandTotal.toLocaleString('id-ID')}</span>
                      </p>
                    </div>
                  </>
                )}
              </Card>
            </TabsContent>

            {/* ==================== TAB: DASHBOARD LAPORAN ==================== */}
            <TabsContent value="dashboard" className="space-y-4 mt-4">
              {dashboardLoading || !dashboard ? (
                <div className="flex items-center justify-center py-32 gap-2 text-muted-foreground">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span>Memuat dashboard...</span>
                </div>
              ) : (
                <>
                  {/* Period Toggle */}
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Dashboard Pengeluaran Logistik</h2>
                    <Tabs value={dashPeriod} onValueChange={(v) => setDashPeriod(v as 'daily' | 'weekly' | 'monthly')}>
                      <TabsList className="h-8 p-0.5">
                        <TabsTrigger value="daily" className="text-[10px] h-7 px-3">Harian</TabsTrigger>
                        <TabsTrigger value="weekly" className="text-[10px] h-7 px-3">Mingguan</TabsTrigger>
                        <TabsTrigger value="monthly" className="text-[10px] h-7 px-3">Bulanan</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>

                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="border-0 shadow-md overflow-hidden relative">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                              Total {dashPeriod === 'daily' ? 'Hari Ini' : dashPeriod === 'weekly' ? 'Minggu Ini' : 'Bulan Ini'}
                            </p>
                            <p className="text-2xl font-bold tracking-tight text-violet-700 dark:text-violet-400">
                              Rp {dashSummary.total.toLocaleString('id-ID')}
                            </p>
                          </div>
                          <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg">
                            <TrendingDown className="w-5 h-5 text-white" />
                          </div>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 to-purple-500 opacity-60" />
                      </CardContent>
                    </Card>

                    <Card className="border-0 shadow-md overflow-hidden relative">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Pengeluaran Bahan</p>
                            <p className="text-2xl font-bold tracking-tight text-orange-700 dark:text-orange-400">
                              Rp {dashSummary.bahan.toLocaleString('id-ID')}
                            </p>
                          </div>
                          <div className="p-2.5 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 shadow-lg">
                            <ShoppingBasket className="w-5 h-5 text-white" />
                          </div>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 to-amber-500 opacity-60" />
                      </CardContent>
                    </Card>

                    <Card className="border-0 shadow-md overflow-hidden relative">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Pengeluaran Makmin</p>
                            <p className="text-2xl font-bold tracking-tight text-blue-700 dark:text-blue-400">
                              Rp {dashSummary.makmin.toLocaleString('id-ID')}
                            </p>
                          </div>
                          <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
                            <Utensils className="w-5 h-5 text-white" />
                          </div>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 opacity-60" />
                      </CardContent>
                    </Card>

                    <Card className="border-0 shadow-md overflow-hidden relative">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Item Dibeli</p>
                            <p className="text-2xl font-bold tracking-tight">{dashSummary.itemCount}</p>
                            <p className="text-[10px] text-muted-foreground">barang tercatat</p>
                          </div>
                          <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg">
                            <Package className="w-5 h-5 text-white" />
                          </div>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 opacity-60" />
                      </CardContent>
                    </Card>
                  </div>

                  {/* Chart */}
                  {dashPeriod !== 'daily' && (
                    <Card className="border-0 shadow-md">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">
                          Grafik Pengeluaran {dashPeriod === 'weekly' ? 'Mingguan' : 'Bulanan'}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          Perbandingan pengeluaran bahan vs makanan & minuman
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pb-4">
                        <div className="w-full h-72">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={getChartData()} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false}
                                tickFormatter={(v) => v >= 1000000 ? `${(v / 1000000).toFixed(0)}jt` : v >= 1000 ? `${(v / 1000).toFixed(0)}rb` : String(v)} />
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: 'hsl(var(--card))',
                                  border: '1px solid hsl(var(--border))',
                                  borderRadius: '10px',
                                  fontSize: '12px',
                                }}
                                formatter={(value: number) => [`Rp ${value.toLocaleString('id-ID')}`, '']}
                              />
                              <Bar dataKey="bahan" name="Bahan" fill="#f97316" radius={[4, 4, 0, 0]} />
                              <Bar dataKey="makmin" name="Makanan & Minuman" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="flex items-center justify-center gap-6 mt-2">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-orange-500" />
                            <span className="text-xs text-muted-foreground">Bahan</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-blue-500" />
                            <span className="text-xs text-muted-foreground">Makanan & Minuman</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Top Items */}
                  <Card className="border-0 shadow-md">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Barang Pengeluaran Terbesar</CardTitle>
                      <CardDescription className="text-xs">Top 10 barang berdasarkan total pengeluaran sepanjang waktu</CardDescription>
                    </CardHeader>
                    <CardContent className="pb-4">
                      {dashboard.topItems.length > 0 ? (
                        <div className="space-y-2">
                          {dashboard.topItems.map((item, idx) => {
                            const maxVal = dashboard.topItems[0]?.total || 1
                            const pct = Math.round((item.total / maxVal) * 100)
                            return (
                              <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-all">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${
                                  item.category === 'bahan'
                                    ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400'
                                    : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400'
                                }`}>
                                  {idx + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <p className="text-sm font-medium truncate">{item.name}</p>
                                      <Badge variant="outline" className="text-[10px] shrink-0">
                                        {item.count}x beli
                                      </Badge>
                                    </div>
                                    <span className="text-sm font-bold shrink-0">Rp {item.total.toLocaleString('id-ID')}</span>
                                  </div>
                                  <div className="mt-1.5 h-1.5 bg-muted rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full transition-all ${
                                        item.category === 'bahan' ? 'bg-orange-500' : 'bg-blue-500'
                                      }`}
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-10 text-muted-foreground">
                          <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
                          <p className="text-sm">Belum ada data pengeluaran</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* All-time Total */}
                  <Card className="border-0 shadow-md bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30">
                    <CardContent className="p-6 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Pengeluaran Logistik (Sepanjang Waktu)</p>
                        <p className="text-3xl font-bold text-violet-700 dark:text-violet-400 mt-1">
                          Rp {dashboard.totalAllTime.toLocaleString('id-ID')}
                        </p>
                      </div>
                      <div className="p-4 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-xl">
                        <BarChart3 className="w-8 h-8 text-white" />
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>
          </Tabs>

          {/* ==================== ADD/EDIT DIALOG ==================== */}
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>{editItem ? 'Edit Barang' : 'Tambah Barang Baru'}</DialogTitle>
                <DialogDescription>{editItem ? 'Perbarui data barang logistik.' : 'Masukkan detail barang untuk pengadaan.'}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2 col-span-2">
                    <Label className="text-xs font-medium">Nama Barang *</Label>
                    <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Contoh: Mie Goreng" className="h-9 text-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Kategori *</Label>
                    <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                      <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bahan">Bahan</SelectItem>
                        <SelectItem value="makanan_minuman">Makanan & Minuman</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Satuan</Label>
                    <Select value={formData.unit} onValueChange={(v) => setFormData({ ...formData, unit: v })}>
                      <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {unitOptions.map(u => <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Size / Ukuran</Label>
                    <Input value={formData.size} onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                      placeholder="Contoh: 600 Gram" className="h-9 text-sm" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Tanggal Beli</Label>
                    <Input type="date" value={formData.purchaseDate}
                      onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                      className="h-9 text-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Harga Satuan (Rp) *</Label>
                    <Input type="number" value={formData.unitPrice}
                      onChange={(e) => updatePrice('unitPrice', e.target.value)}
                      placeholder="0" className="h-9 text-sm" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Jumlah</Label>
                    <Input type="number" value={formData.quantity}
                      onChange={(e) => updatePrice('quantity', e.target.value)}
                      placeholder="1" className="h-9 text-sm" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Harga Total (Rp)</Label>
                    <Input type="number" value={formData.totalPrice}
                      onChange={(e) => setFormData({ ...formData, totalPrice: e.target.value })}
                      placeholder="0" className="h-9 text-sm bg-muted/30" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Catatan</Label>
                  <Input value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Opsional" className="h-9 text-sm" />
                </div>
                <Button onClick={handleSubmit} disabled={submitting}
                  className="w-full h-9 text-sm bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {editItem ? 'Simpan Perubahan' : 'Tambah Barang'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* ==================== DELETE CONFIRMATION ==================== */}
          <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
            <DialogContent className="sm:max-w-sm">
              <DialogHeader>
                <DialogTitle>Hapus Barang?</DialogTitle>
                <DialogDescription>
                  Anda yakin ingin menghapus &quot;{deleteConfirm?.name}&quot;? Tindakan ini tidak bisa dibatalkan.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Batal</Button>
                <Button variant="destructive" onClick={handleDelete} disabled={submitting}>
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Hapus
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </AppLayout>
    </AuthGuard>
  )
}

