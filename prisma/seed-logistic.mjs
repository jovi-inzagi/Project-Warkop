import { PrismaClient } from '../lib/generated/prisma/index.js'

const prisma = new PrismaClient()

async function main() {
  console.log('🚚 Seeding data AKTUAL Warkop dari Excel...')

  const purchaseDate = new Date()
  purchaseDate.setHours(8, 0, 0, 0)

  // ==================== DATA AKTUAL: TABEL BAHAN ====================
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

  // ==================== DATA AKTUAL: TABEL LOGISTIK ====================
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

  // ==================== DATA AKTUAL: TABEL HARGA ====================
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

  await prisma.$transaction(async (tx) => {
    // Reset tabel target agar tidak bercampur data lama/dummy
    await tx.logisticItem.deleteMany()
    await tx.logistik.deleteMany()
    await tx.harga.deleteMany()
    await tx.bahan.deleteMany()

    // Insert tabel bahan
    await tx.bahan.createMany({ data: bahanRows })

    // Insert tabel logistik (model baru)
    await tx.logistik.createMany({
      data: logistikRows.map((row) => ({
        ...row,
        tanggalBeli: purchaseDate,
      })),
    })

    // Sinkron juga ke logisticItem (dipakai UI logistik saat ini)
    const bahanNames = new Set(bahanRows.map((b) => b.namaBarang.toLowerCase()))
    await tx.logisticItem.createMany({
      data: logistikRows.map((row) => ({
        name: row.nama,
        category: bahanNames.has(row.nama.toLowerCase()) ? 'bahan' : 'makanan_minuman',
        unit: row.satuan.toLowerCase(),
        size: '',
        unitPrice: row.hargaSatuan,
        quantity: row.jumlah,
        totalPrice: row.hargaTotal,
        purchaseDate,
        notes: '',
      })),
    })

    // Tambahkan juga item bahan ke logisticItem agar menu logistik lengkap
    await tx.logisticItem.createMany({
      data: bahanRows.map((row) => ({
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
    })

    // Insert tabel harga
    await tx.harga.createMany({ data: hargaRows })
  })

  const totalLogistik = logistikRows.reduce((sum, item) => sum + item.hargaTotal, 0)
  const totalBahan = bahanRows.reduce((sum, item) => sum + item.hargaSatuan, 0)
  const totalHargaMenu = hargaRows.length

  console.log(`✅ Tabel bahan: ${bahanRows.length} baris`)
  console.log(`✅ Tabel logistik: ${logistikRows.length} baris (Total: Rp ${totalLogistik.toLocaleString('id-ID')})`)
  console.log(`✅ Tabel harga: ${totalHargaMenu} baris`)
  console.log(`✅ LogisticItem sinkron: ${logistikRows.length + bahanRows.length} baris`)
  console.log(`💰 Total bahan + logistik: Rp ${(totalBahan + totalLogistik).toLocaleString('id-ID')}`)
  console.log('\n✨ Seeding data aktual selesai!')
}

main()
  .catch(e => { console.error('❌ Error:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())


