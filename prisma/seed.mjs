import { PrismaClient } from '../lib/generated/prisma/index.js'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database dengan data AKTUAL...')

  const purchaseDate = new Date()
  purchaseDate.setHours(8, 0, 0, 0)

  // Users
  const adminPass = await bcrypt.hash('admin123', 10)
  const kasirPass = await bcrypt.hash('kasir123', 10)

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: { username: 'admin', password: adminPass, name: 'Admin Kantor', role: 'admin' },
  })
  console.log('✅ User admin:', admin.name)

  const kasir = await prisma.user.upsert({
    where: { username: 'kasir' },
    update: {},
    create: { username: 'kasir', password: kasirPass, name: 'Kasir Utama', role: 'kasir' },
  })
  console.log('✅ User kasir:', kasir.name)

  // Categories
  const kopi = await prisma.category.upsert({ where: { name: 'Kopi' }, update: {}, create: { name: 'Kopi', icon: 'Coffee', color: '#d97706' } })
  const makanan = await prisma.category.upsert({ where: { name: 'Makanan' }, update: {}, create: { name: 'Makanan', icon: 'UtensilsCrossed', color: '#059669' } })
  const minuman = await prisma.category.upsert({ where: { name: 'Minuman Lain' }, update: {}, create: { name: 'Minuman Lain', icon: 'GlassWater', color: '#2563eb' } })
  await prisma.category.upsert({ where: { name: 'Snack' }, update: {}, create: { name: 'Snack', icon: 'Cookie', color: '#7c3aed' } })
  const bahan = await prisma.category.upsert({ where: { name: 'Bahan Baku' }, update: {}, create: { name: 'Bahan Baku', icon: 'Package', color: '#ea580c' } })
  console.log('✅ Categories: 5')

  const bahanRows = [
    { namaBarang: 'Saus', satuan: 'Gram', size: '600 Gram', hargaSatuan: 4500 },
    { namaBarang: 'Sedotan', satuan: '1 Pack', size: '', hargaSatuan: 5000 },
    { namaBarang: 'Plastik', satuan: '1 Pack', size: '1 Kg', hargaSatuan: 10000 },
    { namaBarang: 'Sunlight', satuan: 'Gram', size: '230 Gram', hargaSatuan: 4000 },
    { namaBarang: 'Super pel', satuan: '1 Sachet', size: '', hargaSatuan: 1000 },
    { namaBarang: 'Sawi', satuan: '1 Ikat', size: '', hargaSatuan: 5000 },
    { namaBarang: 'Cabe', satuan: '1 Bungkus', size: '', hargaSatuan: 5000 },
    { namaBarang: 'Gunting', satuan: '1 Pcs', size: '', hargaSatuan: 10000 },
  ]

  const logistikRows = [
    { nama: 'Mie Goreng', satuan: 'Pcs', jumlah: 10, hargaSatuan: 3000, hargaTotal: 30000 },
    { nama: 'Mie Rebus Soto', satuan: 'Pcs', jumlah: 10, hargaSatuan: 3000, hargaTotal: 30000 },
    { nama: 'Mie Rendang', satuan: 'Pcs', jumlah: 10, hargaSatuan: 2900, hargaTotal: 29000 },
    { nama: 'Mie Sakura', satuan: 'Pcs', jumlah: 10, hargaSatuan: 1700, hargaTotal: 17000 },
    { nama: 'ABC Moca', satuan: 'Pcs', jumlah: 10, hargaSatuan: 1500, hargaTotal: 15000 },
    { nama: 'Kapal Api Mix', satuan: 'Pcs', jumlah: 10, hargaSatuan: 1700, hargaTotal: 17000 },
    { nama: 'GoodDay Freeze', satuan: 'Pcs', jumlah: 10, hargaSatuan: 2300, hargaTotal: 23000 },
    { nama: 'GoodDay Mocachino', satuan: 'Pcs', jumlah: 10, hargaSatuan: 1500, hargaTotal: 15000 },
    { nama: 'Indocafe Coffemix', satuan: 'Pcs', jumlah: 10, hargaSatuan: 1600, hargaTotal: 16000 },
    { nama: 'Tea Jus Gula Batu', satuan: 'Pcs', jumlah: 10, hargaSatuan: 350, hargaTotal: 3500 },
    { nama: 'Tea Jus Apel', satuan: 'Pcs', jumlah: 10, hargaSatuan: 350, hargaTotal: 3500 },
    { nama: 'Nutrisari Jeruk Peras', satuan: 'Pcs', jumlah: 10, hargaSatuan: 1250, hargaTotal: 12500 },
    { nama: 'Nutrisari Semangka', satuan: 'Pcs', jumlah: 10, hargaSatuan: 1250, hargaTotal: 12500 },
    { nama: 'Nutrisari Sweet Mango', satuan: 'Pcs', jumlah: 10, hargaSatuan: 1250, hargaTotal: 12500 },
    { nama: 'Nutrisari Blewah', satuan: 'Pcs', jumlah: 10, hargaSatuan: 1400, hargaTotal: 14000 },
    { nama: 'Nutrisari Lychee', satuan: 'Pcs', jumlah: 10, hargaSatuan: 1250, hargaTotal: 12500 },
  ]

  const hargaRows = [
    { namaMenu: 'Mie Goreng', hargaSatuan: 7000, hargaDouble: 10000, hargaPakaiTelur: 10000, hargaDoublePakaiTelur: 12000, hargaHot: null, hargaIce: null },
    { namaMenu: 'Mie Rebus Soto', hargaSatuan: 7000, hargaDouble: 10000, hargaPakaiTelur: 10000, hargaDoublePakaiTelur: 12000, hargaHot: null, hargaIce: null },
    { namaMenu: 'Mie Rendang', hargaSatuan: 7000, hargaDouble: 10000, hargaPakaiTelur: 10000, hargaDoublePakaiTelur: 12000, hargaHot: null, hargaIce: null },
    { namaMenu: 'Mie Sakura', hargaSatuan: 4000, hargaDouble: 7000, hargaPakaiTelur: 7000, hargaDoublePakaiTelur: 9000, hargaHot: null, hargaIce: null },
    { namaMenu: 'ABC Moca', hargaSatuan: null, hargaDouble: null, hargaPakaiTelur: null, hargaDoublePakaiTelur: null, hargaHot: 4000, hargaIce: null },
    { namaMenu: 'Kapal Api Mix', hargaSatuan: null, hargaDouble: null, hargaPakaiTelur: null, hargaDoublePakaiTelur: null, hargaHot: 4000, hargaIce: null },
    { namaMenu: 'GoodDay Freeze', hargaSatuan: null, hargaDouble: null, hargaPakaiTelur: null, hargaDoublePakaiTelur: null, hargaHot: 5000, hargaIce: 6000 },
    { namaMenu: 'GoodDay Mocachino', hargaSatuan: null, hargaDouble: null, hargaPakaiTelur: null, hargaDoublePakaiTelur: null, hargaHot: 4000, hargaIce: 5000 },
    { namaMenu: 'Indocafe Coffemix', hargaSatuan: null, hargaDouble: null, hargaPakaiTelur: null, hargaDoublePakaiTelur: null, hargaHot: 4000, hargaIce: 5000 },
    { namaMenu: 'Tea Jus Gula Batu', hargaSatuan: null, hargaDouble: null, hargaPakaiTelur: null, hargaDoublePakaiTelur: null, hargaHot: null, hargaIce: 3000 },
    { namaMenu: 'Tea Jus Apel', hargaSatuan: null, hargaDouble: null, hargaPakaiTelur: null, hargaDoublePakaiTelur: null, hargaHot: null, hargaIce: 3000 },
    { namaMenu: 'Nutrisari Jeruk Peras', hargaSatuan: null, hargaDouble: null, hargaPakaiTelur: null, hargaDoublePakaiTelur: null, hargaHot: null, hargaIce: 4000 },
    { namaMenu: 'Nutrisari Semangka', hargaSatuan: null, hargaDouble: null, hargaPakaiTelur: null, hargaDoublePakaiTelur: null, hargaHot: null, hargaIce: 4000 },
    { namaMenu: 'Nutrisari Sweet Mango', hargaSatuan: null, hargaDouble: null, hargaPakaiTelur: null, hargaDoublePakaiTelur: null, hargaHot: null, hargaIce: 4000 },
    { namaMenu: 'Nutrisari Blewah', hargaSatuan: null, hargaDouble: null, hargaPakaiTelur: null, hargaDoublePakaiTelur: null, hargaHot: null, hargaIce: 4000 },
    { namaMenu: 'Nutrisari Lychee', hargaSatuan: null, hargaDouble: null, hargaPakaiTelur: null, hargaDoublePakaiTelur: null, hargaHot: null, hargaIce: 4000 },
  ]

  const menuPriceMap = new Map(hargaRows.map((h) => [h.namaMenu, h.hargaSatuan ?? h.hargaHot ?? h.hargaIce ?? 0]))

  const products = [
    ...logistikRows.map((row, idx) => ({
      name: row.nama,
      sku: `ACT-MENU-${String(idx + 1).padStart(3, '0')}`,
      categoryId: row.nama.startsWith('Mie')
        ? makanan.id
        : /(abc moca|kapal api|goodday|indocafe)/i.test(row.nama)
          ? kopi.id
          : minuman.id,
      price: menuPriceMap.get(row.nama) ?? 0,
      cost: row.hargaSatuan,
      stock: row.jumlah,
      minStock: 3,
      unit: 'pcs',
    })),
    ...bahanRows.map((row, idx) => ({
      name: row.namaBarang,
      sku: `ACT-BHN-${String(idx + 1).padStart(3, '0')}`,
      categoryId: bahan.id,
      price: 0,
      cost: row.hargaSatuan,
      stock: 1,
      minStock: 1,
      unit: row.satuan.toLowerCase(),
    })),
  ]

  await prisma.product.deleteMany()
  await prisma.product.createMany({ data: products })
  console.log(`✅ Products: ${products.length}`)

  await prisma.bahan.deleteMany()
  await prisma.logistik.deleteMany()
  await prisma.harga.deleteMany()
  await prisma.logisticItem.deleteMany()

  await prisma.bahan.createMany({ data: bahanRows })
  await prisma.logistik.createMany({
    data: logistikRows.map((row) => ({ ...row, tanggalBeli: purchaseDate })),
  })
  await prisma.harga.createMany({ data: hargaRows })
  await prisma.logisticItem.createMany({
    data: [
      ...logistikRows.map((row) => ({
        name: row.nama,
        category: 'makanan_minuman',
        unit: row.satuan.toLowerCase(),
        size: '',
        unitPrice: row.hargaSatuan,
        quantity: row.jumlah,
        totalPrice: row.hargaTotal,
        purchaseDate,
        notes: '',
      })),
      ...bahanRows.map((row) => ({
        name: row.namaBarang,
        category: 'bahan',
        unit: row.satuan.toLowerCase(),
        size: row.size,
        unitPrice: row.hargaSatuan,
        quantity: 1,
        totalPrice: row.hargaSatuan,
        purchaseDate,
        notes: '',
      })),
    ],
  })
  console.log('✅ Logistic/Bahan/Harga synced')

  const transactionData = [
    ...logistikRows.map((row) => ({
      type: 'expense',
      category: 'pembelian_bahan',
      description: `Pengadaan ${row.nama}`,
      amount: row.hargaTotal,
      method: 'cash',
      date: purchaseDate,
    })),
    ...bahanRows.map((row) => ({
      type: 'expense',
      category: 'pembelian_bahan',
      description: `Pengadaan ${row.namaBarang}`,
      amount: row.hargaSatuan,
      method: 'cash',
      date: purchaseDate,
    })),
  ]
  await prisma.transaction.deleteMany()
  await prisma.transaction.createMany({ data: transactionData })
  console.log(`✅ Transactions: ${transactionData.length} (aktual)`)

  // Summary
  const counts = {
    users: await prisma.user.count(),
    categories: await prisma.category.count(),
    products: await prisma.product.count(),
    transactions: await prisma.transaction.count(),
  }
  console.log('\n📊 Database Summary:')
  console.log(`   Users:        ${counts.users}`)
  console.log(`   Categories:   ${counts.categories}`)
  console.log(`   Products:     ${counts.products}`)
  console.log(`   Transactions: ${counts.transactions}`)
  console.log('\n✨ Seeding selesai!')
}

main()
  .catch(e => { console.error('❌ Error:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())

