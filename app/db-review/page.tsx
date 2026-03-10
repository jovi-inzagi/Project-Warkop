'use client'

import AuthGuard from '@/components/auth-guard'
import AppLayout from '@/components/app-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Database, KeyRound, Link2 } from 'lucide-react'

type Column = {
  name: string
  type: string
  key?: 'PK' | 'FK'
  note?: string
}

type TableDef = {
  name: string
  color: string
  columns: Column[]
}

const tables: TableDef[] = [
  {
    name: 'users',
    color: 'border-violet-500/50 bg-violet-500/5',
    columns: [
      { name: 'id', type: 'String', key: 'PK', note: 'cuid' },
      { name: 'username', type: 'String', note: 'unique' },
      { name: 'password', type: 'String' },
      { name: 'name', type: 'String' },
      { name: 'role', type: 'String' },
      { name: 'createdAt', type: 'DateTime' },
    ],
  },
  {
    name: 'bahan',
    color: 'border-teal-500/50 bg-teal-500/5',
    columns: [
      { name: 'id', type: 'String', key: 'PK', note: 'cuid' },
      { name: 'namaBarang', type: 'String', note: 'unique' },
      { name: 'satuan', type: 'String' },
      { name: 'size', type: 'String' },
      { name: 'hargaSatuan', type: 'Float' },
      { name: 'createdAt', type: 'DateTime' },
    ],
  },
  {
    name: 'logistik',
    color: 'border-sky-500/50 bg-sky-500/5',
    columns: [
      { name: 'id', type: 'String', key: 'PK', note: 'cuid' },
      { name: 'nama', type: 'String' },
      { name: 'satuan', type: 'String' },
      { name: 'jumlah', type: 'Int' },
      { name: 'hargaSatuan', type: 'Float' },
      { name: 'hargaTotal', type: 'Float' },
      { name: 'tanggalBeli', type: 'DateTime' },
      { name: 'bahanId', type: 'String?', key: 'FK' },
    ],
  },
  {
    name: 'harga',
    color: 'border-amber-500/50 bg-amber-500/5',
    columns: [
      { name: 'id', type: 'String', key: 'PK', note: 'cuid' },
      { name: 'namaMenu', type: 'String', note: 'unique' },
      { name: 'hargaSatuan', type: 'Float?' },
      { name: 'hargaDouble', type: 'Float?' },
      { name: 'hargaPakaiTelur', type: 'Float?' },
      { name: 'hargaDoublePakaiTelur', type: 'Float?' },
      { name: 'hargaHot', type: 'Float?' },
      { name: 'hargaIce', type: 'Float?' },
    ],
  },
]

const relations = [
  'logistik.bahanId -> bahan.id (many-to-one, optional)',
]

function keyBadge(key?: 'PK' | 'FK') {
  if (key === 'PK') return <Badge className="text-[10px] h-5 px-1.5 bg-yellow-500 hover:bg-yellow-500">PK</Badge>
  if (key === 'FK') return <Badge variant="secondary" className="text-[10px] h-5 px-1.5">FK</Badge>
  return <span className="w-7" />
}

export default function DbReviewPage() {
  return (
    <AuthGuard>
      <AppLayout>
        <div className="space-y-5">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-background to-muted/20">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Database className="w-4 h-4" />
                </div>
                <CardTitle>Entity Relationship Diagram (ERD)</CardTitle>
              </div>
              <CardDescription>
                Tampilan model database WARKOP untuk bahan review: tabel logistik, bahan, harga, dan user.
              </CardDescription>
            </CardHeader>
          </Card>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {tables.map((table) => (
              <Card key={table.name} className={`border-2 ${table.color}`}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base lowercase">{table.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {table.columns.map((col) => (
                      <div
                        key={`${table.name}-${col.name}`}
                        className="grid grid-cols-[36px_1fr_auto] items-center gap-2 rounded-md border bg-background/70 px-2 py-1.5"
                      >
                        <div className="flex items-center justify-center">{keyBadge(col.key)}</div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium truncate">{col.name}</p>
                          {col.note ? (
                            <p className="text-[10px] text-muted-foreground truncate">{col.note}</p>
                          ) : null}
                        </div>
                        <p className="text-[11px] text-muted-foreground">{col.type}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="border">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Link2 className="w-4 h-4" />
                Relasi Antar Tabel
              </CardTitle>
              <CardDescription>Daftar relasi foreign key yang aktif pada model saat ini.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {relations.map((item, idx) => (
                <div key={item}>
                  <div className="flex items-center gap-2 text-sm">
                    <KeyRound className="w-3.5 h-3.5 text-primary" />
                    <span>{item}</span>
                  </div>
                  {idx < relations.length - 1 ? <Separator className="mt-3" /> : null}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    </AuthGuard>
  )
}

