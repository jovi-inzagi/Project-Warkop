import { z } from 'zod'
import { getReportData } from '@/lib/actions'
import { apiError, apiSuccess } from '@/lib/api-response'

const reportsQuerySchema = z.object({
  period: z.enum(['7d', '30d', '90d']).default('30d'),
  menuCategory: z.enum(['all', 'Kopi', 'Makanan', 'Minuman Lain']).default('all'),
})

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const parsed = reportsQuerySchema.safeParse({
      period: searchParams.get('period') ?? '30d',
      menuCategory: searchParams.get('menuCategory') ?? 'all',
    })

    if (!parsed.success) {
      return apiError('Query reports tidak valid', 422, parsed.error.flatten())
    }

    const data = await getReportData(parsed.data.period, parsed.data.menuCategory)
    return apiSuccess(data, 'Data reports berhasil diambil')
  } catch (error) {
    return apiError('Gagal memuat reports', 500, String(error))
  }
}

