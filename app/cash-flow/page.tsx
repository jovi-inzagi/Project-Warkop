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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import {
  Plus, ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown, Wallet,
  Download, Clock, MoreHorizontal, Receipt, CreditCard, Banknote, PiggyBank, Loader2, Trash2,
} from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { getTransactions, createTransaction, deleteTransaction } from '@/lib/actions'

interface Transaction {
  id: string; type: string; category: string; description: string
  amount: number; method: string; date: string | Date; createdAt: string | Date
}

const categoryLabels: Record<string, string> = {
  penjualan: 'Penjualan',
  pembelian_bahan: 'Pembelian Bahan',
  operasional: 'Operasional',
  gaji: 'Gaji',
  lainnya: 'Lainnya',
}

const methodLabels: Record<string, string> = {
  cash: 'Tunai',
  transfer: 'Transfer',
  qris: 'QRIS',
}

const emptyForm = { type: '', category: '', description: '', amount: '', method: 'cash', date: '' }

export default function CashFlowPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [filterType, setFilterType] = useState('all')
  const [formData, setFormData] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<Transaction | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getTransactions()
      setTransactions(data as unknown as Transaction[])
    } catch {
      toast.error('Gagal memuat data transaksi')
    }
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const profit = totalIncome - totalExpense
  const margin = totalIncome > 0 ? ((profit / totalIncome) * 100).toFixed(1) : '0'

  const filteredTx = transactions.filter(t => {
    if (filterType === 'all') return true
    return t.type === filterType
  })

  // Build 7-day chart
  const chartData = (() => {
    const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']
    const result = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      const dayTx = transactions.filter(t => {
        const txDate = typeof t.date === 'string' ? t.date.split('T')[0] : new Date(t.date).toISOString().split('T')[0]
        return txDate === dateStr
      })
      result.push({
        date: dayNames[d.getDay()],
        pemasukan: dayTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
        pengeluaran: dayTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
      })
    }
    return result
  })()

  const handleSubmit = async () => {
    if (!formData.type || !formData.category || !formData.amount) {
      toast.error('Lengkapi semua field wajib')
      return
    }
    setSubmitting(true)
    const res = await createTransaction({
      type: formData.type,
      category: formData.category,
      description: formData.description || formData.category,
      amount: Number(formData.amount),
      method: formData.method,
      date: formData.date || undefined,
    })
    if (res.success) {
      toast.success('Transaksi berhasil dicatat!')
      setIsOpen(false)
      setFormData(emptyForm)
      loadData()
    } else {
      toast.error(res.error || 'Gagal menyimpan transaksi')
    }
    setSubmitting(false)
  }

  const handleDelete = async () => {
    if (!deleteConfirm) return
    setSubmitting(true)
    const res = await deleteTransaction(deleteConfirm.id)
    if (res.success) {
      toast.success('Transaksi berhasil dihapus')
      setDeleteConfirm(null)
      loadData()
    } else {
      toast.error('Gagal menghapus transaksi')
    }
    setSubmitting(false)
  }

  const handleExport = () => {
    const csv = [
      ['Tanggal', 'Tipe', 'Kategori', 'Deskripsi', 'Jumlah', 'Metode'].join(','),
      ...filteredTx.map(t => [
        new Date(t.date).toLocaleDateString('id-ID'),
        t.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
        categoryLabels[t.category] || t.category,
        `"${t.description}"`,
        t.amount,
        methodLabels[t.method] || t.method,
      ].join(',')),
    ].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cashflow-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    toast.success('Data berhasil diekspor')
  }

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'cash': return Banknote
      case 'transfer': return CreditCard
      case 'qris': return Receipt
      default: return Wallet
    }
  }

  return (
    <AuthGuard>
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
          {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Cash Flow</h1>
            <p className="text-muted-foreground text-sm mt-1">Monitor dan kelola arus kas bisnis</p>
          </div>
          <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={handleExport}>
              <Download className="w-3.5 h-3.5" />
              Ekspor
            </Button>
              <Button size="sm" className="h-8 gap-1.5 text-xs bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-lg shadow-amber-500/25"
                onClick={() => { setFormData(emptyForm); setIsOpen(true) }}>
                  <Plus className="w-3.5 h-3.5" />
                  Transaksi Baru
                  </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-0 shadow-md overflow-hidden relative">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Pemasukan</p>
                    <p className="text-2xl font-bold tracking-tight text-emerald-700 dark:text-emerald-400">Rp {totalIncome.toLocaleString('id-ID')}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg">
                  <ArrowUpRight className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 opacity-60" />
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md overflow-hidden relative">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Pengeluaran</p>
                    <p className="text-2xl font-bold tracking-tight text-rose-700 dark:text-rose-400">Rp {totalExpense.toLocaleString('id-ID')}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 shadow-lg">
                  <ArrowDownRight className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 to-pink-500 opacity-60" />
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md overflow-hidden relative">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Keuntungan Bersih</p>
                    <p className={`text-2xl font-bold tracking-tight ${profit >= 0 ? 'text-blue-700 dark:text-blue-400' : 'text-rose-700 dark:text-rose-400'}`}>
                      Rp {profit.toLocaleString('id-ID')}
                    </p>
                </div>
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
                  <Wallet className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 opacity-60" />
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md overflow-hidden relative">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Margin Keuntungan</p>
                    <p className="text-2xl font-bold tracking-tight text-amber-700 dark:text-amber-400">{margin}%</p>
                  <div className="flex items-center gap-1">
                    <PiggyBank className="w-3.5 h-3.5 text-amber-500" />
                      <span className="text-xs text-muted-foreground">{Number(margin) > 30 ? 'Sehat' : Number(margin) > 10 ? 'Cukup' : 'Rendah'}</span>
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg">
                  <PiggyBank className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500 opacity-60" />
            </CardContent>
          </Card>
        </div>

        {/* Chart */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
                <CardTitle className="text-base">Tren Arus Kas</CardTitle>
              <CardDescription className="text-xs">Perbandingan pemasukan vs pengeluaran 7 hari terakhir</CardDescription>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="w-full h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="cashIn" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#059669" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="cashOut" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#dc2626" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}jt`} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '10px', fontSize: '12px' }}
                      formatter={(value: number) => [`Rp ${value.toLocaleString('id-ID')}`, '']} />
                  <Area type="monotone" dataKey="pemasukan" stroke="#059669" strokeWidth={2.5} fill="url(#cashIn)" name="Pemasukan" />
                  <Area type="monotone" dataKey="pengeluaran" stroke="#dc2626" strokeWidth={2} fill="url(#cashOut)" name="Pengeluaran" strokeDasharray="5 5" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center gap-6 mt-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-600" />
                <span className="text-xs text-muted-foreground">Pemasukan</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500 opacity-60" />
                <span className="text-xs text-muted-foreground">Pengeluaran</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transactions List */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base">Riwayat Transaksi</CardTitle>
                  <CardDescription className="text-xs">{filteredTx.length} transaksi ditemukan</CardDescription>
              </div>
                <Tabs value={filterType} onValueChange={setFilterType}>
                  <TabsList className="h-7 p-0.5">
                    <TabsTrigger value="all" className="text-[10px] h-6 px-2.5">Semua</TabsTrigger>
                    <TabsTrigger value="income" className="text-[10px] h-6 px-2.5">Masuk</TabsTrigger>
                    <TabsTrigger value="expense" className="text-[10px] h-6 px-2.5">Keluar</TabsTrigger>
                  </TabsList>
                </Tabs>
            </div>
          </CardHeader>
          <CardContent className="pb-4">
              {loading ? (
                <div className="flex items-center justify-center py-10 gap-2 text-muted-foreground">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm">Memuat data...</span>
                </div>
              ) : filteredTx.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <Receipt className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Belum ada transaksi</p>
                </div>
              ) : (
            <div className="space-y-2">
                  {filteredTx.slice(0, 50).map((tx) => {
                const MethodIcon = getMethodIcon(tx.method)
                    const txDate = new Date(tx.date)
                return (
                      <div key={tx.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/30 transition-all group border border-transparent hover:border-border/50">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          tx.type === 'income'
                        ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400'
                        : 'bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400'
                    }`}>
                          {tx.type === 'income' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                            <p className="text-sm font-medium truncate">{categoryLabels[tx.category] || tx.category}</p>
                        <Badge variant="outline" className="text-[10px] h-4 px-1.5 hidden sm:flex">
                          <MethodIcon className="w-2.5 h-2.5 mr-0.5" />
                              {methodLabels[tx.method] || tx.method}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{tx.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-muted-foreground">{txDate.toLocaleDateString('id-ID')}</span>
                        <span className="text-[10px] text-muted-foreground/50">•</span>
                        <div className="flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5 text-muted-foreground" />
                              <span className="text-[10px] text-muted-foreground">{txDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                          <span className={`text-sm font-bold tabular-nums ${tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {tx.type === 'income' ? '+' : '-'}Rp {tx.amount.toLocaleString('id-ID')}
                      </span>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-36">
                            <DropdownMenuItem className="text-xs text-destructive focus:text-destructive gap-2" onClick={() => setDeleteConfirm(tx)}>
                              <Trash2 className="w-3.5 h-3.5" />
                              Hapus
                            </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )
              })}
            </div>
              )}
          </CardContent>
        </Card>

          {/* Add Transaction Dialog */}
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Catat Transaksi Baru</DialogTitle>
                <DialogDescription>Tambahkan transaksi pemasukan atau pengeluaran.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Tipe Transaksi *</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button type="button" variant={formData.type === 'income' ? 'default' : 'outline'}
                      className={`h-9 text-xs gap-1.5 ${formData.type === 'income' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
                      onClick={() => setFormData({ ...formData, type: 'income', category: '' })}>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                      Pemasukan
                    </Button>
                    <Button type="button" variant={formData.type === 'expense' ? 'default' : 'outline'}
                      className={`h-9 text-xs gap-1.5 ${formData.type === 'expense' ? 'bg-rose-600 hover:bg-rose-700' : ''}`}
                      onClick={() => setFormData({ ...formData, type: 'expense', category: '' })}>
                      <ArrowDownRight className="w-3.5 h-3.5" />
                      Pengeluaran
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Kategori *</Label>
                  <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
                    <SelectContent>
                      {formData.type === 'income' ? (
                        <SelectItem value="penjualan">Penjualan</SelectItem>
                      ) : (
                        <>
                          <SelectItem value="pembelian_bahan">Pembelian Bahan</SelectItem>
                          <SelectItem value="operasional">Operasional</SelectItem>
                          <SelectItem value="gaji">Gaji</SelectItem>
                          <SelectItem value="lainnya">Lainnya</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Keterangan</Label>
                  <Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Deskripsi transaksi" className="h-9 text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Jumlah (Rp) *</Label>
                    <Input type="number" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      placeholder="0" className="h-9 text-sm" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Metode</Label>
                    <Select value={formData.method} onValueChange={(v) => setFormData({ ...formData, method: v })}>
                      <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Tunai</SelectItem>
                        <SelectItem value="transfer">Transfer</SelectItem>
                        <SelectItem value="qris">QRIS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Tanggal (opsional)</Label>
                  <Input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="h-9 text-sm" />
                </div>
                <Button onClick={handleSubmit} disabled={submitting}
                  className="w-full h-9 text-sm bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Simpan Transaksi
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Delete Confirmation */}
          <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
            <DialogContent className="sm:max-w-sm">
              <DialogHeader>
                <DialogTitle>Hapus Transaksi?</DialogTitle>
                <DialogDescription>Tindakan ini tidak bisa dibatalkan.</DialogDescription>
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
