import { z } from 'zod'
import { apiError, apiSuccess } from '@/lib/api-response'
import { getLogisticDashboard } from '@/lib/logistic-actions'

const querySchema = z.object({
  period: z.enum(['daily', 'weekly', 'monthly']).default('daily'),
})

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const parsed = querySchema.safeParse({
      period: searchParams.get('period') ?? 'daily',
    })
    if (!parsed.success) {
      return apiError('Query logistic dashboard tidak valid', 422, parsed.error.flatten())
    }

    const data = await getLogisticDashboard(parsed.data.period)
    return apiSuccess(data, 'Data logistic dashboard berhasil diambil')
  } catch (error) {
    return apiError('Gagal memuat logistic dashboard', 500, String(error))
  }
}

