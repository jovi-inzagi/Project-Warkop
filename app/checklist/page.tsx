'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import AuthGuard from '@/components/auth-guard'
import AppLayout from '@/components/app-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import {
  CheckSquare,
  Search,
  Loader2,
  Package,
  RefreshCcw,
  Clock3,
  Download,
  Trash2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import {
  deleteSalesChecklistHistory,
  executeSalesChecklist,
  getChecklistProducts,
  getSalesChecklistHistory,
} from '@/lib/actions'
import { useAuth } from '@/lib/auth-context'

interface Product {
  id: string
  name: string
  price: number
  stock: number
  unit: string
  isActive: boolean
  categoryId: string
  category: { id: string; name: string }
}

interface ChecklistHistoryItem {
  id: string
  executorName: string
  method: string
  totalQty: number
  totalIncome: number
  itemCount: number
  executedAt: Date | string
  items: Array<{
    id: string
    productName: string
    quantity: number
    amount: number
  }>
}

const methodLabels: Record<string, string> = {
  cash: 'Tunai',
  transfer: 'Transfer',
  qris: 'QRIS',
}

const formatDateInput = (date: Date) => date.toISOString().split('T')[0]

const getDateRangeByPeriod = (period: 'all' | 'weekly' | 'monthly' | 'yearly' | 'custom') => {
  if (period === 'all' || period === 'custom') return { from: '', to: '' }
  const to = new Date()
  to.setHours(23, 59, 59, 999)
  const from = new Date()
  from.setHours(0, 0, 0, 0)

  if (period === 'weekly') from.setDate(from.getDate() - 6)
  if (period === 'monthly') from.setDate(from.getDate() - 29)
  if (period === 'yearly') from.setDate(from.getDate() - 364)

  return {
    from: formatDateInput(from),
    to: formatDateInput(to),
  }
}

export default function ChecklistPage() {
  const { user } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [history, setHistory] = useState<ChecklistHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [method, setMethod] = useState<'cash' | 'transfer' | 'qris'>('cash')
  const [selectedMap, setSelectedMap] = useState<Record<string, number>>({})
  const [salesProductFilter, setSalesProductFilter] = useState('')
  const [salesPeriodFilter, setSalesPeriodFilter] = useState<'all' | 'weekly' | 'monthly' | 'yearly' | 'custom'>('all')
  const [historyMethodFilter, setHistoryMethodFilter] = useState<'all' | 'cash' | 'transfer' | 'qris'>('all')
  const [historyDateFrom, setHistoryDateFrom] = useState('')
  const [historyDateTo, setHistoryDateTo] = useState('')
  const [historyPage, setHistoryPage] = useState(1)
  const [historyTotalPages, setHistoryTotalPages] = useState(1)
  const [historyTotal, setHistoryTotal] = useState(0)
  const [checklistModalOpen, setChecklistModalOpen] = useState(false)
  const [checklistSearchInput, setChecklistSearchInput] = useState('')
  const [checklistSearchTerm, setChecklistSearchTerm] = useState('')
  const [deletingHistoryId, setDeletingHistoryId] = useState<string | null>(null)
  const [deleteTargetExecution, setDeleteTargetExecution] = useState<ChecklistHistoryItem | null>(null)
  const [deleteSelectedItemIds, setDeleteSelectedItemIds] = useState<string[]>([])
  const [isHistoryCollapsed, setIsHistoryCollapsed] = useState(false)
  const [selectedExecution, setSelectedExecution] = useState<ChecklistHistoryItem | null>(null)

  const loadMasterData = useCallback(async () => {
    setLoading(true)
    try {
      const prods = await getChecklistProducts()
      setProducts(prods as unknown as Product[])
    } catch {
      toast.error('Gagal memuat data checklist')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadMasterData()
  }, [loadMasterData])

  useEffect(() => {
    if (salesPeriodFilter === 'custom') return
    const range = getDateRangeByPeriod(salesPeriodFilter)
    setHistoryDateFrom(range.from)
    setHistoryDateTo(range.to)
    setHistoryPage(1)
  }, [salesPeriodFilter])

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true)
    try {
      const result = await getSalesChecklistHistory({
        page: historyPage,
        pageSize: 10,
        method: historyMethodFilter,
        dateFrom: historyDateFrom || undefined,
        dateTo: historyDateTo || undefined,
        productName: salesProductFilter || undefined,
      })
      setHistory(result.rows as unknown as ChecklistHistoryItem[])
      setHistoryTotalPages(result.totalPages)
      setHistoryTotal(result.total)
    } catch {
      toast.error('Gagal memuat riwayat checklist')
    } finally {
      setHistoryLoading(false)
    }
  }, [historyPage, historyMethodFilter, historyDateFrom, historyDateTo, salesProductFilter])

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  useEffect(() => {
    const timer = setTimeout(() => {
      setChecklistSearchTerm(checklistSearchInput)
    }, 300)
    return () => clearTimeout(timer)
  }, [checklistSearchInput])

  const selectedRows = useMemo(() => {
    return products.filter((item) => selectedMap[item.id] && selectedMap[item.id] > 0)
  }, [products, selectedMap])

  const filteredChecklistProducts = useMemo(() => {
    const keyword = checklistSearchTerm.trim().toLowerCase()
    if (!keyword) return products
    return products.filter((item) => item.name.toLowerCase().includes(keyword))
  }, [products, checklistSearchTerm])

  const totalSelectedQty = useMemo(() => {
    return Object.values(selectedMap).reduce((sum, qty) => sum + qty, 0)
  }, [selectedMap])

  const toggleItem = (product: Product, checked: boolean) => {
    setSelectedMap((prev) => {
      const next = { ...prev }
      if (!checked) {
        delete next[product.id]
      } else {
        next[product.id] = Math.min(Math.max(next[product.id] || 1, 1), product.stock || 1)
      }
      return next
    })
  }

  const setQty = (product: Product, raw: string) => {
    const qty = Number(raw)
    setSelectedMap((prev) => {
      const next = { ...prev }
      if (!next[product.id]) return next
      next[product.id] = Number.isFinite(qty) ? Math.min(Math.max(Math.floor(qty), 1), product.stock) : 1
      return next
    })
  }

  const resetSelection = () => setSelectedMap({})

  const handleExecute = async () => {
    const items = Object.entries(selectedMap)
      .filter(([, qty]) => qty > 0)
      .map(([productId, quantity]) => ({ productId, quantity }))

    if (items.length === 0) {
      toast.error('Pilih minimal 1 produk untuk dieksekusi')
      return
    }

    setSubmitting(true)
    const result = await executeSalesChecklist({
      items,
      method,
      executorName: user?.name || user?.username || 'Operator',
    })
    if (result.success) {
      const summary = result.summary ?? { itemCount: items.length, totalIncome: 0 }
      toast.success(
        `Checklist berhasil dieksekusi. ${summary.itemCount} produk, total Rp ${summary.totalIncome.toLocaleString('id-ID')}`
      )
      resetSelection()
      setChecklistModalOpen(false)
      setChecklistSearchInput('')
      setChecklistSearchTerm('')
      await Promise.all([loadMasterData(), loadHistory()])
    } else {
      toast.error(result.error || 'Gagal mengeksekusi checklist')
    }
    setSubmitting(false)
  }

  const handleExportHistory = () => {
    if (history.length === 0) {
      toast.error('Tidak ada riwayat untuk diekspor')
      return
    }

    const csv = [
      ['Waktu Eksekusi', 'Eksekutor', 'Metode', 'Jumlah Produk', 'Total Qty', 'Total Pemasukan', 'Detail Item'].join(','),
      ...history.map((row) =>
        [
          new Date(row.executedAt).toLocaleString('id-ID'),
          `"${row.executorName || 'Operator'}"`,
          methodLabels[row.method] || row.method,
          row.itemCount,
          row.totalQty,
          row.totalIncome,
          `"${row.items.map((item) => `${item.productName} x${item.quantity}`).join(' | ')}"`,
        ].join(',')
      ),
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `riwayat-checklist-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    toast.success('Riwayat checklist berhasil diekspor')
  }

  const openDeleteHistoryModal = (row: ChecklistHistoryItem) => {
    setDeleteTargetExecution(row)
    setDeleteSelectedItemIds(row.items.map((item) => item.id))
  }

  const handleDeleteHistory = async () => {
    if (!deleteTargetExecution) return
    if (deleteSelectedItemIds.length === 0) {
      toast.error('Pilih minimal 1 produk yang ingin dihapus')
      return
    }

    const executionId = deleteTargetExecution.id
    setDeletingHistoryId(executionId)
    const result = await deleteSalesChecklistHistory(executionId, deleteSelectedItemIds)
    if (!result.success) {
      toast.error(result.error || 'Gagal menghapus riwayat checklist')
      setDeletingHistoryId(null)
      return
    }

    toast.success('Riwayat checklist berhasil dihapus')
    if (selectedExecution?.id === executionId) {
      setSelectedExecution(null)
    }
    setDeleteTargetExecution(null)
    setDeleteSelectedItemIds([])

    if (history.length === 1 && historyPage > 1) {
      setHistoryPage((prev) => Math.max(1, prev - 1))
      await Promise.all([loadMasterData()])
    } else {
      await Promise.all([loadMasterData(), loadHistory()])
    }
    setDeletingHistoryId(null)
  }

  const resetSalesFilters = () => {
    setSalesProductFilter('')
    setSalesPeriodFilter('all')
    setHistoryMethodFilter('all')
    setHistoryDateFrom('')
    setHistoryDateTo('')
    setHistoryPage(1)
  }

  return (
    <AuthGuard>
      <AppLayout>
        <div className="space-y-6 animate-fade-in">
          <Card className="border-0 shadow-md overflow-hidden bg-gradient-to-r from-rose-500 to-orange-400 text-white">
            <CardContent className="p-5 md:p-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-white/80">Menu</p>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight mt-1 flex items-center gap-2">
                  <CheckSquare className="w-6 h-6" />
                  Checklist
                </h1>
              </div>
              <Button
                size="sm"
                variant="secondary"
                className="h-9 text-xs gap-1.5 bg-white/20 hover:bg-white/30 text-white border border-white/30"
                onClick={() => setChecklistModalOpen(true)}
              >
                <span className="text-sm">+</span>
                Tambah Checklist
              </Button>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base">Filter Data Penjualan</CardTitle>
                  <CardDescription className="text-xs">Filter untuk dashboard penjualan dan riwayat checklist</CardDescription>
                </div>
                <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={resetSalesFilters}>
                  Reset
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <p className="text-[11px] text-muted-foreground">Nama Produk</p>
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      className="pl-9 h-9 text-sm"
                      placeholder="Filter nama produk..."
                      value={salesProductFilter}
                      onChange={(e) => {
                        setSalesProductFilter(e.target.value)
                        setHistoryPage(1)
                      }}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] text-muted-foreground">Periode</p>
                  <Select
                    value={salesPeriodFilter}
                    onValueChange={(v) => setSalesPeriodFilter(v as 'all' | 'weekly' | 'monthly' | 'yearly' | 'custom')}
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Pilih periode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Tanggal</SelectItem>
                      <SelectItem value="weekly">Mingguan (7 hari)</SelectItem>
                      <SelectItem value="monthly">Bulanan (30 hari)</SelectItem>
                      <SelectItem value="yearly">Tahunan (365 hari)</SelectItem>
                      <SelectItem value="custom">Rentang Tanggal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] text-muted-foreground">Jenis Pembayaran</p>
                  <Select
                    value={historyMethodFilter}
                    onValueChange={(v) => {
                      setHistoryMethodFilter(v as 'all' | 'cash' | 'transfer' | 'qris')
                      setHistoryPage(1)
                    }}
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Jenis pembayaran" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Pembayaran</SelectItem>
                      <SelectItem value="cash">Tunai</SelectItem>
                      <SelectItem value="transfer">Transfer</SelectItem>
                      <SelectItem value="qris">QRIS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] text-muted-foreground">Nilai</p>
                  <div className="text-xs text-muted-foreground rounded-md border p-2.5 h-9 flex items-center">
                    Semua data: {historyTotal} riwayat
                  </div>
                </div>
              </div>
              {salesPeriodFilter === 'custom' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <p className="text-[11px] text-muted-foreground">Tanggal Mulai</p>
                    <Input
                      type="date"
                      value={historyDateFrom}
                      onChange={(e) => {
                        setHistoryDateFrom(e.target.value)
                        setHistoryPage(1)
                      }}
                      className="h-9 text-xs"
                      placeholder="Dari tanggal"
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[11px] text-muted-foreground">Tanggal Akhir</p>
                    <Input
                      type="date"
                      value={historyDateTo}
                      onChange={(e) => {
                        setHistoryDateTo(e.target.value)
                        setHistoryPage(1)
                      }}
                      className="h-9 text-xs"
                      placeholder="Sampai tanggal"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Dialog open={checklistModalOpen} onOpenChange={setChecklistModalOpen}>
            <DialogContent className="sm:max-w-6xl">
              <DialogHeader>
                <DialogTitle>Input Checklist Penjualan</DialogTitle>
                <DialogDescription>Centang produk yang terjual, filter produk, lalu eksekusi checklist</DialogDescription>
              </DialogHeader>

              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
                  <div className="relative w-full sm:max-w-md">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={checklistSearchInput}
                      onChange={(e) => setChecklistSearchInput(e.target.value)}
                      placeholder="Cari produk untuk checklist..."
                      className="pl-9 h-9 text-sm"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Select value={method} onValueChange={(v) => setMethod(v as 'cash' | 'transfer' | 'qris')}>
                      <SelectTrigger className="w-32 h-9 text-xs">
                        <SelectValue placeholder="Metode" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Tunai</SelectItem>
                        <SelectItem value="transfer">Transfer</SelectItem>
                        <SelectItem value="qris">QRIS</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" className="h-9 text-xs gap-1.5" onClick={loadMasterData}>
                      <RefreshCcw className="w-3.5 h-3.5" />
                      Muat Ulang
                    </Button>
                  </div>
                </div>

                <Card className="border shadow-none overflow-hidden">
                  {loading ? (
                    <div className="flex items-center justify-center py-20 gap-2 text-muted-foreground">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span className="text-sm">Memuat produk...</span>
                    </div>
                  ) : (
                    <div className="overflow-x-auto max-h-[420px]">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/40 hover:bg-muted/40">
                            <TableHead className="w-14 text-center">Ceklis</TableHead>
                            <TableHead>Produk</TableHead>
                            <TableHead>Kategori</TableHead>
                            <TableHead className="text-right">Harga</TableHead>
                            <TableHead className="text-center">Stok</TableHead>
                            <TableHead className="text-center w-28">Qty Jual</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredChecklistProducts.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={6} className="py-12 text-center">
                                <Package className="w-10 h-10 mx-auto text-muted-foreground/30 mb-2" />
                                <p className="text-sm text-muted-foreground">Produk tidak ditemukan</p>
                              </TableCell>
                            </TableRow>
                          ) : (
                            filteredChecklistProducts.map((product) => {
                              const isChecked = !!selectedMap[product.id]
                              return (
                                <TableRow key={product.id} className="hover:bg-muted/20">
                                  <TableCell className="text-center">
                                    <Checkbox
                                      checked={isChecked}
                                      disabled={product.stock <= 0}
                                      onCheckedChange={(v) => toggleItem(product, Boolean(v))}
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <div>
                                      <p className="text-sm font-medium">{product.name}</p>
                                      {product.stock <= 0 && (
                                        <p className="text-[11px] text-rose-600 dark:text-rose-400">Stok habis</p>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="outline" className="text-[10px]">
                                      {product.category?.name || '-'}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-right text-sm">
                                    Rp {product.price.toLocaleString('id-ID')}
                                  </TableCell>
                                  <TableCell className="text-center text-sm">
                                    {product.stock} {product.unit}
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <Input
                                      type="number"
                                      min={1}
                                      max={product.stock}
                                      value={isChecked ? selectedMap[product.id] : ''}
                                      disabled={!isChecked}
                                      onChange={(e) => setQty(product, e.target.value)}
                                      className="h-8 text-xs w-20 mx-auto text-center"
                                    />
                                  </TableCell>
                                </TableRow>
                              )
                            })
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </Card>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">{selectedRows.length}</span> produk dipilih •{' '}
                    <span className="font-semibold text-foreground">{totalSelectedQty}</span> qty
                  </p>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={resetSelection}>
                      Reset checklist
                    </Button>
                    <Button
                      size="sm"
                      className="h-8 text-xs gap-1.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
                      onClick={handleExecute}
                      disabled={submitting || totalSelectedQty === 0}
                    >
                      {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckSquare className="w-3.5 h-3.5" />}
                      Eksekusi Checklist
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Card className="border-0 shadow-md">
            <CardHeader className="pb-2">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <CardTitle className="text-base">Riwayat Eksekusi Terbaru</CardTitle>
                  <CardDescription className="text-xs">Mencatat siapa yang mengeksekusi checklist, kapan, dan totalnya</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => setIsHistoryCollapsed((prev) => !prev)}
                    title={isHistoryCollapsed ? 'Maksimalkan riwayat' : 'Minimize riwayat'}
                  >
                    {isHistoryCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={handleExportHistory}>
                    <Download className="w-3.5 h-3.5" />
                    Ekspor CSV
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-3 text-xs text-muted-foreground flex items-center gap-1">
                <Clock3 className="w-3.5 h-3.5" />
                Riwayat mengikuti filter aktif di atas (produk, periode, metode pembayaran)
              </div>

              {isHistoryCollapsed ? (
                <p className="text-sm text-muted-foreground py-6 text-center">Riwayat diminimize. Klik panah untuk menampilkan.</p>
              ) : historyLoading ? (
                <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Memuat riwayat...</span>
                </div>
              ) : history.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">Belum ada riwayat eksekusi checklist</p>
              ) : (
                <div className="space-y-3">
                  {history.map((row) => (
                    <div key={row.id} className="rounded-2xl border border-border/60 p-4 md:p-5 bg-card">
                      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
                        <div className="space-y-2 min-w-[180px]">
                          <p className="text-3xl font-extrabold tracking-tight leading-none">
                            {new Date(row.executedAt).toLocaleDateString('id-ID')}
                          </p>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                            <div className="rounded-lg border p-2">
                              <p className="text-[11px] text-muted-foreground">Eksekutor</p>
                              <p className="font-medium truncate">{row.executorName || 'Operator'}</p>
                            </div>
                            <div className="rounded-lg border p-2">
                              <p className="text-[11px] text-muted-foreground">Pembayaran</p>
                              <p className="font-medium">{methodLabels[row.method] || row.method}</p>
                            </div>
                            <div className="rounded-lg border p-2">
                              <p className="text-[11px] text-muted-foreground">Jumlah</p>
                              <p className="font-medium">{row.itemCount} produk / {row.totalQty} qty</p>
                            </div>
                            <div className="rounded-lg border p-2">
                              <p className="text-[11px] text-muted-foreground">Nominal</p>
                              <p className="font-semibold">Rp {row.totalIncome.toLocaleString('id-ID')}</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-row xl:flex-col items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-9 text-xs"
                            onClick={() => setSelectedExecution(row)}
                          >
                            Detail
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-9 text-xs border-rose-200 text-rose-600 hover:text-rose-700 hover:border-rose-300"
                            onClick={() => openDeleteHistoryModal(row)}
                            disabled={deletingHistoryId === row.id}
                          >
                            {deletingHistoryId === row.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5 mr-1" />
                            )}
                            Hapus
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-1">
                    <p className="text-xs text-muted-foreground">
                      Menampilkan halaman {historyPage} dari {historyTotalPages} (total {historyTotal} eksekusi)
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        disabled={historyPage <= 1}
                        onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                      >
                        Prev
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        disabled={historyPage >= historyTotalPages}
                        onClick={() => setHistoryPage((p) => Math.min(historyTotalPages, p + 1))}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Dialog
            open={!!deleteTargetExecution}
            onOpenChange={(open) => {
              if (!open && !deletingHistoryId) {
                setDeleteTargetExecution(null)
                setDeleteSelectedItemIds([])
              }
            }}
          >
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Pilih Produk yang Ingin Dihapus</DialogTitle>
                <DialogDescription>
                  {deleteTargetExecution
                    ? `Riwayat ${new Date(deleteTargetExecution.executedAt).toLocaleString('id-ID')} oleh ${deleteTargetExecution.executorName || 'Operator'}`
                    : ''}
                </DialogDescription>
              </DialogHeader>

              {deleteTargetExecution && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="text-sm font-medium">Pilih Semua Produk</p>
                      <p className="text-xs text-muted-foreground">
                        {deleteSelectedItemIds.length} dari {deleteTargetExecution.items.length} item terpilih
                      </p>
                    </div>
                    <Checkbox
                      checked={
                        deleteSelectedItemIds.length > 0 &&
                        deleteSelectedItemIds.length === deleteTargetExecution.items.length
                      }
                      onCheckedChange={(checked) => {
                        if (Boolean(checked)) {
                          setDeleteSelectedItemIds(deleteTargetExecution.items.map((item) => item.id))
                        } else {
                          setDeleteSelectedItemIds([])
                        }
                      }}
                    />
                  </div>

                  <div className="max-h-64 overflow-auto rounded-lg border">
                    <div className="divide-y">
                      {deleteTargetExecution.items.map((item) => {
                        const checked = deleteSelectedItemIds.includes(item.id)
                        return (
                          <label key={item.id} className="flex items-start justify-between gap-2 p-3 cursor-pointer">
                            <div>
                              <p className="text-sm font-medium">{item.productName}</p>
                              <p className="text-xs text-muted-foreground">
                                Qty {item.quantity} • Rp {item.amount.toLocaleString('id-ID')}
                              </p>
                            </div>
                            <Checkbox
                              checked={checked}
                              onCheckedChange={(value) => {
                                if (Boolean(value)) {
                                  setDeleteSelectedItemIds((prev) => Array.from(new Set([...prev, item.id])))
                                } else {
                                  setDeleteSelectedItemIds((prev) => prev.filter((id) => id !== item.id))
                                }
                              }}
                            />
                          </label>
                        )
                      })}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        if (deletingHistoryId) return
                        setDeleteTargetExecution(null)
                        setDeleteSelectedItemIds([])
                      }}
                    >
                      Batal
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleDeleteHistory}
                      disabled={deletingHistoryId === deleteTargetExecution.id || deleteSelectedItemIds.length === 0}
                    >
                      {deletingHistoryId === deleteTargetExecution.id ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-1" />
                      ) : (
                        <Trash2 className="w-4 h-4 mr-1" />
                      )}
                      Hapus Terpilih
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          <Dialog open={!!selectedExecution} onOpenChange={() => setSelectedExecution(null)}>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Detail Eksekusi Checklist</DialogTitle>
                <DialogDescription>
                  {selectedExecution
                    ? `${selectedExecution.executorName || 'Operator'} • ${new Date(selectedExecution.executedAt).toLocaleString('id-ID')}`
                    : ''}
                </DialogDescription>
              </DialogHeader>

              {selectedExecution && (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="rounded-lg bg-muted/40 p-2">
                      <p className="text-[11px] text-muted-foreground">Metode</p>
                      <p className="font-semibold">{methodLabels[selectedExecution.method] || selectedExecution.method}</p>
                    </div>
                    <div className="rounded-lg bg-muted/40 p-2">
                      <p className="text-[11px] text-muted-foreground">Total Qty</p>
                      <p className="font-semibold">{selectedExecution.totalQty}</p>
                    </div>
                    <div className="rounded-lg bg-muted/40 p-2">
                      <p className="text-[11px] text-muted-foreground">Total Pemasukan</p>
                      <p className="font-semibold">Rp {selectedExecution.totalIncome.toLocaleString('id-ID')}</p>
                    </div>
                  </div>

                  <div className="max-h-72 overflow-auto rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Produk</TableHead>
                          <TableHead className="text-center">Qty</TableHead>
                          <TableHead className="text-right">Nominal</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedExecution.items.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.productName}</TableCell>
                            <TableCell className="text-center">{item.quantity}</TableCell>
                            <TableCell className="text-right">Rp {item.amount.toLocaleString('id-ID')}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </AppLayout>
    </AuthGuard>
  )
}

