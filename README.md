# ☕ Warkop Management App

Aplikasi manajemen warung kopi berbasis web untuk mendigitalisasi sistem konvensional yang masih manual pada **logistik barang**, **cashflow keuangan**, dan **pendataan laporan penjualan & pembelian**.

---

## 🛠️ Tech Stack

| Teknologi | Versi | Keterangan |
|-----------|-------|------------|
| Next.js | 16.1.6 | Framework React (Turbopack) |
| React | 19.2.4 | UI Library |
| Tailwind CSS | 4.1.9 | Styling |
| Shadcn/ui | - | Komponen UI |
| Prisma | 6.19.2 | ORM Database |
| SQLite | - | Database lokal |
| Recharts | - | Grafik & chart |
| bcryptjs | - | Hashing password |

---

## 🚀 Cara Menjalankan

```bash
# 1. Install dependencies
npm install

# 2. Generate Prisma Client
npx prisma generate

# 3. Buat & push schema ke database
npx prisma db push

# 4. Seed data awal
node prisma/seed.mjs

# 5. Jalankan aplikasi
npm run dev
```

Buka **http://localhost:3000** di browser.

## 🧩 Backend Terpisah (Server Sendiri + PostgreSQL)

Sekarang tersedia server backend terpisah di folder `backend/` agar API tidak bergantung pada Next.js App Router.

### Struktur Backend
- `backend/src/server.ts` -> entry server Express API
- `backend/src/lib/prisma.ts` -> Prisma client backend
- `backend/prisma/schema.prisma` -> schema PostgreSQL
- `backend/env.example` -> contoh environment backend

### Menjalankan Backend Terpisah
```bash
# 1) Masuk folder backend
cd backend

# 2) Install dependency backend
npm install

# 3) Buat file env dari contoh
copy env.example .env

# 4) Sesuaikan DATABASE_URL PostgreSQL
# contoh:
# DATABASE_URL="postgresql://postgres:postgres@localhost:5432/warkop_db?schema=public"

# 5) Generate Prisma client + push schema
npm run prisma:generate
npm run prisma:push

# 6) Jalankan backend server
npm run dev
```

Default backend berjalan di `http://localhost:4000`.

### Endpoint Utama Backend
- `GET /health`
- `POST /api/auth/login`
- `GET /api/dashboard`
- `GET /api/reports`
- `GET/POST /api/products`
- `PATCH/DELETE /api/products/:id`
- `GET/POST /api/transactions`
- `DELETE /api/transactions/:id`
- `GET/POST /api/logistic-items`
- `PATCH/DELETE /api/logistic-items/:id`
- `GET /api/logistic-dashboard`

### Catatan Integrasi Frontend
- Frontend saat ini masih bisa berjalan normal seperti sebelumnya.
- Untuk full migrate ke backend terpisah, panggilan data di frontend diarahkan ke `http://localhost:4000/api/...` (disarankan lewat env `NEXT_PUBLIC_API_BASE_URL`).

### Akun Demo

| Username | Password | Role |
|----------|----------|------|
| `admin` | `admin123` | Admin |
| `kasir` | `kasir123` | Kasir |

---

## 📂 Struktur Halaman

| Halaman | Path | Deskripsi |
|---------|------|-----------|
| Login | `/login` | Autentikasi pengguna |
| Dashboard | `/` | Ringkasan performa bisnis |
| Inventory | `/inventory` | Kelola stok & produk |
| Cash Flow | `/cash-flow` | Monitor arus kas |
| Laporan | `/reports` | Analisis & ekspor laporan |
| Setup | `/setup` | Seed database awal |

---

## 📊 Fitur yang Sudah Ada

### ✅ Autentikasi
- Login dengan username & password (bcrypt)
- Role-based access (admin, kasir)
- Auth guard untuk proteksi halaman

### ✅ Dashboard
- KPI harian (pendapatan, pengeluaran, transaksi, stok rendah)
- Grafik tren pendapatan vs pengeluaran 7 hari
- Pie chart kategori penjualan
- Produk terlaris & transaksi terkini

### ✅ Inventory
- CRUD produk (tambah, edit, hapus)
- Manajemen kategori (Kopi, Makanan, Minuman, Snack, Bahan Baku)
- Tracking stok & minimum stok
- Filter (kategori, status stok), pencarian
- Export CSV

### ✅ Cash Flow
- Catat transaksi pemasukan & pengeluaran
- Grafik tren arus kas 7 hari
- Filter tipe transaksi
- Hapus transaksi
- Export CSV

### ✅ Laporan & Analisis
- Laporan ringkasan keuangan (7/30/90 hari)
- Laporan kondisi inventori
- Analisis pengeluaran per kategori
- Distribusi metode pembayaran
- Status bisnis (margin keuntungan)
- Export CSV per tab laporan

---

## 📋 Saran Implementasi

Berikut adalah roadmap fitur yang direkomendasikan untuk melengkapi sistem agar benar-benar menggantikan proses manual pada operasional warkop.

### 🔴 Phase 1 — Fondasi (Prioritas Kritis)

#### 1. Halaman POS / Kasir
> **Status:** Belum diimplementasikan
>
> **Masalah:** Model `Order` dan `OrderItem` sudah ada di schema database tetapi belum digunakan. Saat ini penjualan dicatat sebagai `Transaction` biasa dengan deskripsi teks, bukan sebagai order terstruktur yang terhubung ke produk.

**Fitur yang dibutuhkan:**
- Grid produk yang bisa diklik cepat (seperti kasir restoran/cafe)
- Keranjang belanja dengan pengaturan qty
- Pilihan metode bayar (Cash / Transfer / QRIS)
- Hitung kembalian otomatis
- Generate nomor order otomatis
- Cetak struk (thermal print)
- Otomatis: buat transaksi income + kurangi stok + catat riwayat stok

**Dampak jika tidak ada:**
- ❌ Tidak bisa tahu produk mana yang paling laku secara akurat
- ❌ Stok tidak berkurang saat ada penjualan
- ❌ Tidak bisa hitung profit per produk
- ❌ Tidak bisa generate struk/receipt

#### 2. Auto-Deduct Stok saat Penjualan
> **Status:** Belum diimplementasikan
>
> **Masalah:** Saat ini transaksi penjualan tidak mempengaruhi stok sama sekali. Stok hanya bisa diubah manual melalui halaman inventory.

**Yang perlu dilakukan:**
- Saat order selesai di POS, stok produk terkait otomatis berkurang
- Validasi stok tersedia sebelum konfirmasi order
- Rollback stok jika order dibatalkan

#### 3. Riwayat Pergerakan Stok (Stock Movement)
> **Status:** Belum diimplementasikan
>
> **Masalah:** Setiap perubahan stok tidak tercatat. Tidak ada jejak audit kapan, siapa, dan mengapa stok berubah.

**Model database yang dibutuhkan:**

```prisma
model StockMovement {
  id          String   @id @default(cuid())
  productId   String
  product     Product  @relation(fields: [productId], references: [id])
  type        String   // in, out, adjustment, opname
  quantity    Int
  previousQty Int
  newQty      Int
  reason      String   // purchase, sale, damage, expired, correction
  reference   String   @default("") // orderId, purchaseId
  createdBy   String   @default("")
  createdAt   DateTime @default(now())
}
```

**Manfaat:**
- Jejak audit lengkap untuk setiap pergerakan stok
- Mudah melacak penyusutan atau kehilangan barang
- Data untuk analisis pola konsumsi bahan baku

---

### 🟡 Phase 2 — Operasional Harian (Prioritas Sedang)

#### 4. Sistem Pembelian Bahan Baku
> Form khusus untuk mencatat pembelian dari supplier yang otomatis:
> - Menambah stok produk terkait
> - Mencatat transaksi expense
> - Mencatat stock movement (type: in)

**Model database yang dibutuhkan:**

```prisma
model Supplier {
  id        String          @id @default(cuid())
  name      String
  contact   String          @default("")
  address   String          @default("")
  orders    PurchaseOrder[]
  createdAt DateTime        @default(now())
}

model PurchaseOrder {
  id          String         @id @default(cuid())
  supplierId  String?
  supplier    Supplier?      @relation(fields: [supplierId], references: [id])
  items       PurchaseItem[]
  totalAmount Float
  status      String         @default("received")
  notes       String         @default("")
  createdAt   DateTime       @default(now())
}

model PurchaseItem {
  id              String        @id @default(cuid())
  purchaseOrderId String
  purchaseOrder   PurchaseOrder @relation(fields: [purchaseOrderId], references: [id])
  productId       String
  product         Product       @relation(fields: [productId], references: [id])
  quantity        Int
  unitPrice       Float
  subtotal        Float
}
```

#### 5. Laporan Penjualan per Produk
> Setelah POS diimplementasikan, data `Order` bisa digunakan untuk menghasilkan:
> - Produk terlaris berdasarkan qty terjual
> - Produk paling menguntungkan (revenue - cost)
> - Tren penjualan per produk dari waktu ke waktu
> - Kontribusi setiap produk terhadap total pendapatan

#### 6. Buka/Tutup Kasir (Shift Management)
> Sistem shift untuk akuntabilitas kasir:
> - Kasir membuka shift dengan saldo awal
> - Semua transaksi tercatat dalam shift tersebut
> - Kasir menutup shift → sistem menghitung:
>   - Total penjualan
>   - Total pengeluaran
>   - Saldo akhir (seharusnya = saldo awal + pemasukan - pengeluaran)
>   - Selisih (jika ada)

#### 7. Edit Transaksi
> Saat ini transaksi hanya bisa ditambah dan dihapus. Perlu fitur edit untuk koreksi tanpa harus hapus dan buat ulang.

---

### 🟢 Phase 3 — Analisis & Optimasi (Prioritas Rendah)

#### 8. Manajemen Supplier
> Daftar pemasok beserta:
> - Informasi kontak & alamat
> - Produk yang disuplai
> - Riwayat pembelian
> - Rekomendasi reorder saat stok mendekati minimum

#### 9. Stok Opname
> Fitur hitung fisik stok berkala:
> - Input stok aktual per produk
> - Sistem bandingkan dengan stok di database
> - Catat dan arsipkan selisih
> - Generate laporan penyusutan

#### 10. Perbandingan Antar Periode
> Fitur analisis perbandingan:
> - Bulan ini vs bulan lalu
> - Minggu ini vs minggu lalu
> - Tren pertumbuhan/penurunan pendapatan
> - Tren pengeluaran per kategori

#### 11. Laporan Harian / Per Shift
> Rekap harian yang bisa diprint:
> - Total penjualan & jumlah transaksi
> - Produk terjual (qty & revenue)
> - Total pengeluaran
> - Keuntungan bersih hari itu
> - Rincian metode pembayaran

#### 12. Export Laporan PDF
> Selain CSV, fitur generate PDF yang lebih rapi:
> - Format professional untuk arsip
> - Include grafik & chart
> - Header dengan logo & info warkop
> - Cocok untuk cetak atau kirim ke stakeholder

#### 13. Notifikasi Stok Rendah Proaktif
> Alert otomatis (banner/toast/badge) saat stok mendekati atau di bawah minimum, tampil di seluruh halaman, bukan hanya di inventory.

#### 14. Tracking Tanggal Kadaluarsa
> Untuk bahan perishable (susu, roti, dll):
> - Input tanggal kadaluarsa per batch
> - Peringatan otomatis mendekati expired
> - Laporan produk terbuang karena expired

#### 15. Pengeluaran Berulang (Recurring)
> Biaya rutin bisa dijadwalkan:
> - Sewa tempat (bulanan)
> - Listrik, air, WiFi (bulanan)
> - Gaji karyawan (bulanan)
> - Sistem otomatis mencatat di tanggal yang ditentukan

---

## 🏗️ Ringkasan Urutan Implementasi

```
Phase 1 (Fondasi — Kritis)
├── 1. 🔴 Halaman POS / Kasir
├── 2. 🔴 Auto-deduct stok saat penjualan
└── 3. 🔴 Riwayat pergerakan stok

Phase 2 (Operasional Harian — Sedang)
├── 4. 🟡 Sistem pembelian bahan baku
├── 5. 🟡 Laporan penjualan per produk
├── 6. 🟡 Buka/tutup kasir (shift)
└── 7. 🟡 Edit transaksi

Phase 3 (Analisis & Optimasi — Rendah)
├── 8.  🟢 Manajemen supplier
├── 9.  🟢 Stok opname
├── 10. 🟢 Perbandingan antar periode
├── 11. 🟢 Laporan harian / per shift
├── 12. 🟢 Export PDF
├── 13. 🟢 Notifikasi stok rendah proaktif
├── 14. 🟢 Tracking tanggal kadaluarsa
└── 15. 🟢 Pengeluaran berulang
```

---

## ⚠️ Catatan Arsitektur Penting

### Model `Order` & `OrderItem` Belum Digunakan

Schema database sudah memiliki model `Order` dan `OrderItem`, namun **belum ada implementasi** di sisi aplikasi. Saat ini seluruh penjualan hanya dicatat sebagai `Transaction` dengan deskripsi teks bebas (misal: *"Americano x2"*).

**Implikasinya:**
- Data penjualan tidak terstruktur dan tidak terhubung ke produk
- Tidak bisa menghitung profit per produk secara akurat
- Stok tidak otomatis berkurang saat terjadi penjualan
- Tidak bisa generate struk pembelian

**Solusi:** Implementasi halaman POS yang menggunakan model `Order` → setiap penjualan otomatis membuat:
1. `Order` + `OrderItem` (data penjualan terstruktur)
2. `Transaction` income (cashflow)
3. `StockMovement` (riwayat stok)
4. Update `Product.stock` (deduct stok)

---

## 📜 Lisensi

Proyek ini dibuat untuk keperluan pembelajaran dan penggunaan internal.
