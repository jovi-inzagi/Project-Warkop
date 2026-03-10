'use client'

import { useState, useEffect, useCallback } from 'react'
import AuthGuard from '@/components/auth-guard'
import AppLayout from '@/components/app-layout'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import {
  Package, Plus, Search, Edit2, Trash2, AlertTriangle, Box, TrendingUp, Filter, Download,
  MoreHorizontal, Loader2,
} from 'lucide-react'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { getProducts, getCategories, createProduct, updateProduct, deleteProduct } from '@/lib/actions'

interface Category {
  id: string; name: string; icon: string; color: string
}

interface Product {
  id: string; name: string; sku: string; categoryId: string
  category: Category; price: number; cost: number; stock: number
  minStock: number; unit: string; isActive: boolean; createdAt: Date
}

const emptyForm = { name: '', sku: '', categoryId: '', price: '', cost: '', stock: '', minStock: '', unit: 'pcs' }

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isOpen, setIsOpen] = useState(false)
  const [editItem, setEditItem] = useState<Product | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<Product | null>(null)
  const [formData, setFormData] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [prods, cats] = await Promise.all([getProducts(), getCategories()])
      setProducts(prods as unknown as Product[])
      setCategories(cats as unknown as Category[])
    } catch {
      toast.error('Gagal memuat data inventory')
    }
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const filteredData = products.filter(item => {
    const matchSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase())
    const matchCategory = categoryFilter === 'all' || item.categoryId === categoryFilter
    let matchStatus = true
    if (statusFilter === 'low') matchStatus = item.minStock > 0 && item.stock <= item.minStock
    if (statusFilter === 'normal') matchStatus = item.minStock === 0 || item.stock > item.minStock
    if (statusFilter === 'inactive') matchStatus = !item.isActive
    return matchSearch && matchCategory && matchStatus
  })

  const totalValue = filteredData.reduce((sum, item) => sum + (item.cost * item.stock), 0)
  const lowStockCount = products.filter(p => p.minStock > 0 && p.stock <= p.minStock && p.isActive).length
  const activeCount = products.filter(p => p.isActive).length

  const stats = [
    { label: 'Total Produk', value: String(products.length), icon: Package, color: 'from-blue-500 to-cyan-500', bg: 'bg-blue-50 dark:bg-blue-900/30' },
    { label: 'Total Nilai Stok', value: `Rp ${(totalValue / 1000000).toFixed(1)}jt`, icon: Box, color: 'from-emerald-500 to-teal-500', bg: 'bg-emerald-50 dark:bg-emerald-900/30' },
    { label: 'Stok Rendah', value: String(lowStockCount), icon: AlertTriangle, color: 'from-amber-500 to-orange-500', bg: 'bg-amber-50 dark:bg-amber-900/30' },
    { label: 'Produk Aktif', value: String(activeCount), icon: TrendingUp, color: 'from-rose-500 to-pink-500', bg: 'bg-rose-50 dark:bg-rose-900/30' },
  ]

  const getStatusInfo = (item: Product) => {
    if (!item.isActive) return { text: 'Nonaktif', className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' }
    if (item.minStock > 0 && item.stock <= item.minStock) {
      if (item.stock === 0) return { text: 'Habis', className: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400' }
      return { text: 'Rendah', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' }
    }
    return { text: 'Normal', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' }
  }

  const openAddDialog = () => {
    setEditItem(null)
    setFormData(emptyForm)
    setIsOpen(true)
  }

  const openEditDialog = (item: Product) => {
    setEditItem(item)
    setFormData({
      name: item.name, sku: item.sku, categoryId: item.categoryId,
      price: String(item.price), cost: String(item.cost), stock: String(item.stock),
      minStock: String(item.minStock), unit: item.unit,
    })
    setIsOpen(true)
  }

  const handleSubmit = async () => {
    if (!formData.name || !formData.sku || !formData.categoryId) {
      toast.error('Lengkapi semua field wajib')
      return
    }
    setSubmitting(true)
    const payload = {
      name: formData.name,
      sku: formData.sku,
      categoryId: formData.categoryId,
      price: Number(formData.price) || 0,
      cost: Number(formData.cost) || 0,
      stock: Number(formData.stock) || 0,
      minStock: Number(formData.minStock) || 0,
      unit: formData.unit || 'pcs',
    }

    if (editItem) {
      const result = await updateProduct(editItem.id, payload)
      if (result.success) {
        toast.success(`Produk "${formData.name}" berhasil diperbarui`)
      setIsOpen(false)
        loadData()
      } else {
        toast.error(result.error || 'Gagal memperbarui produk')
      }
    } else {
      const result = await createProduct(payload)
      if (result.success) {
        toast.success(`Produk "${formData.name}" berhasil ditambahkan`)
        setIsOpen(false)
        loadData()
      } else {
        toast.error(result.error || 'Gagal menambahkan produk')
    }
  }
    setSubmitting(false)
  }

  const handleDelete = async () => {
    if (!deleteConfirm) return
    setSubmitting(true)
    const result = await deleteProduct(deleteConfirm.id)
    if (result.success) {
      toast.success(`"${deleteConfirm.name}" berhasil dihapus`)
      setDeleteConfirm(null)
      loadData()
    } else {
      toast.error(result.error || 'Gagal menghapus produk')
    }
    setSubmitting(false)
  }

  const handleExport = () => {
    const csv = [
      ['Nama', 'SKU', 'Kategori', 'Harga', 'Modal', 'Stok', 'Min Stok', 'Unit', 'Status'].join(','),
      ...filteredData.map(p => [
        p.name, p.sku, p.category.name, p.price, p.cost, p.stock, p.minStock, p.unit, getStatusInfo(p).text,
      ].join(',')),
    ].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `inventory-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    toast.success('Data inventory berhasil diekspor')
  }

  return (
    <AuthGuard>
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
          {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Inventory</h1>
            <p className="text-muted-foreground text-sm mt-1">Kelola stok dan persediaan barang</p>
          </div>
          <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={handleExport}>
              <Download className="w-3.5 h-3.5" />
              Ekspor
            </Button>
              <Button size="sm" className="h-8 gap-1.5 text-xs bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-lg shadow-amber-500/25" onClick={openAddDialog}>
                  <Plus className="w-3.5 h-3.5" />
                Tambah Produk
                  </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {stats.map((stat, idx) => {
            const Icon = stat.icon
            return (
              <Card key={idx} className="border-0 shadow-md overflow-hidden relative">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${stat.bg}`}>
                      <Icon className="w-4 h-4 text-foreground/70" />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">{stat.label}</p>
                      <p className="text-lg font-bold">{stat.value}</p>
                    </div>
                  </div>
                  <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${stat.color}`} />
                </CardContent>
              </Card>
            )
          })}
        </div>

          {/* Filter & Search */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Cari produk..." className="pl-9 h-9 text-sm" value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full sm:w-40 h-9 text-xs">
                  <Filter className="w-3.5 h-3.5 mr-1.5" />
                  <SelectValue placeholder="Kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kategori</SelectItem>
                    {categories.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-36 h-9 text-xs">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="low">Stok Rendah</SelectItem>
                    <SelectItem value="inactive">Nonaktif</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                <span>Menampilkan {filteredData.length} dari {products.length} produk</span>
              {(categoryFilter !== 'all' || statusFilter !== 'all' || searchTerm) && (
                  <Button variant="ghost" size="sm" className="h-5 text-[10px] px-2"
                    onClick={() => { setSearchTerm(''); setCategoryFilter('all'); setStatusFilter('all') }}>
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
                        <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Produk</TableHead>
                        <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hidden sm:table-cell">SKU</TableHead>
                        <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hidden md:table-cell">Kategori</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-center">Stok</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-right hidden md:table-cell">Harga</TableHead>
                        <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-right hidden lg:table-cell">Modal</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-center">Status</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-center w-16">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                      {filteredData.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-10">
                            <Package className="w-10 h-10 mx-auto text-muted-foreground/30 mb-2" />
                            <p className="text-sm text-muted-foreground">Tidak ada produk ditemukan</p>
                          </TableCell>
                        </TableRow>
                      ) : filteredData.map((item) => {
                        const statusInfo = getStatusInfo(item)
                        const stockPct = item.minStock > 0 ? Math.min((item.stock / (item.minStock * 3)) * 100, 100) : 100
                  return (
                    <TableRow key={item.id} className="group hover:bg-muted/20 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-100 to-orange-50 dark:from-amber-900/40 dark:to-orange-900/30 flex items-center justify-center shrink-0">
                            <Package className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                          </div>
                          <div className="min-w-0">
                                  <p className="text-sm font-medium truncate">{item.name}</p>
                                  <p className="text-[10px] text-muted-foreground sm:hidden">{item.sku}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                              <span className="text-xs font-mono text-muted-foreground">{item.sku}</span>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              <Badge variant="outline" className="text-[10px] font-medium">{item.category.name}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center gap-1">
                                <span className="text-sm font-semibold">{item.stock} <span className="text-[10px] text-muted-foreground font-normal">{item.unit}</span></span>
                                {item.minStock > 0 && <Progress value={stockPct} className="h-1 w-16" />}
                        </div>
                      </TableCell>
                      <TableCell className="text-right hidden md:table-cell">
                              <span className="text-sm">{item.price > 0 ? `Rp ${item.price.toLocaleString('id-ID')}` : '-'}</span>
                      </TableCell>
                            <TableCell className="text-right hidden lg:table-cell">
                              <span className="text-sm text-muted-foreground">Rp {item.cost.toLocaleString('id-ID')}</span>
                      </TableCell>
                      <TableCell className="text-center">
                              <Badge variant="outline" className={`text-[10px] ${statusInfo.className}`}>{statusInfo.text}</Badge>
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
          <div className="flex items-center justify-between p-4 border-t bg-muted/20">
            <p className="text-xs text-muted-foreground">
                    Total Nilai Stok: <span className="font-bold text-foreground">Rp {totalValue.toLocaleString('id-ID')}</span>
                  </p>
                </div>
              </>
            )}
          </Card>

          {/* Add/Edit Dialog */}
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>{editItem ? 'Edit Produk' : 'Tambah Produk Baru'}</DialogTitle>
                <DialogDescription>{editItem ? 'Perbarui data produk.' : 'Isi detail produk untuk menambahkannya ke inventory.'}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Nama Produk *</Label>
                    <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Contoh: Mie Goreng" className="h-9 text-sm" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">SKU *</Label>
                    <Input value={formData.sku} onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      placeholder="KPI-007" className="h-9 text-sm font-mono" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Kategori *</Label>
                    <Select value={formData.categoryId} onValueChange={(val) => setFormData({ ...formData, categoryId: val })}>
                      <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
                      <SelectContent>
                        {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Unit</Label>
                    <Select value={formData.unit} onValueChange={(val) => setFormData({ ...formData, unit: val })}>
                      <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pcs">pcs</SelectItem>
                        <SelectItem value="cup">cup</SelectItem>
                        <SelectItem value="porsi">porsi</SelectItem>
                        <SelectItem value="kg">kg</SelectItem>
                        <SelectItem value="liter">liter</SelectItem>
                        <SelectItem value="botol">botol</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Harga Jual (Rp)</Label>
                    <Input type="number" value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="0" className="h-9 text-sm" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Harga Modal (Rp)</Label>
                    <Input type="number" value={formData.cost}
                      onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                      placeholder="0" className="h-9 text-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Stok Awal</Label>
                    <Input type="number" value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                      placeholder="0" className="h-9 text-sm" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Stok Minimum</Label>
                    <Input type="number" value={formData.minStock}
                      onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                      placeholder="0" className="h-9 text-sm" />
                  </div>
                </div>
                <Button onClick={handleSubmit} disabled={submitting}
                  className="w-full h-9 text-sm bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {editItem ? 'Simpan Perubahan' : 'Tambah Produk'}
              </Button>
            </div>
            </DialogContent>
          </Dialog>

          {/* Delete Confirmation Dialog */}
          <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
            <DialogContent className="sm:max-w-sm">
              <DialogHeader>
                <DialogTitle>Hapus Produk?</DialogTitle>
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
