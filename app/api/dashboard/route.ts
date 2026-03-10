import { z } from 'zod'
import { getDashboardData } from '@/lib/actions'
import { apiError, apiSuccess } from '@/lib/api-response'

const dashboardQuerySchema = z.object({
  period: z.enum(['7d', '30d', '90d']).default('7d'),
  menuCategory: z.enum(['all', 'Kopi', 'Makanan', 'Minuman Lain']).default('all'),
  method: z.enum(['all', 'cash', 'qris', 'transfer']).default('all'),
  txType: z.enum(['all', 'income', 'expense']).default('all'),
})

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const parsed = dashboardQuerySchema.safeParse({
      period: searchParams.get('period') ?? '7d',
      menuCategory: searchParams.get('menuCategory') ?? 'all',
      method: searchParams.get('method') ?? 'all',
      txType: searchParams.get('txType') ?? 'all',
    })

    if (!parsed.success) {
      return apiError('Query dashboard tidak valid', 422, parsed.error.flatten())
    }

    const data = await getDashboardData(parsed.data)
    return apiSuccess(data, 'Data dashboard berhasil diambil')
  } catch (error) {
    return apiError('Gagal memuat dashboard', 500, String(error))
  }
}

