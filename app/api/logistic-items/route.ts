import { z } from 'zod'
import { apiError, apiSuccess } from '@/lib/api-response'
import { createLogisticItem, getLogisticItems } from '@/lib/logistic-actions'

const logisticCreateSchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  unit: z.string().min(1),
  size: z.string().optional(),
  unitPrice: z.number().nonnegative(),
  quantity: z.number().int().positive(),
  totalPrice: z.number().nonnegative(),
  purchaseDate: z.string().optional(),
  notes: z.string().optional(),
})

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const data = await getLogisticItems({
      search: searchParams.get('search') ?? undefined,
      category: searchParams.get('category') ?? undefined,
      dateFrom: searchParams.get('dateFrom') ?? undefined,
      dateTo: searchParams.get('dateTo') ?? undefined,
    })
    return apiSuccess(data, 'Data logistic item berhasil diambil')
  } catch (error) {
    return apiError('Gagal memuat logistic item', 500, String(error))
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = logisticCreateSchema.safeParse(body)
    if (!parsed.success) {
      return apiError('Payload logistic item tidak valid', 422, parsed.error.flatten())
    }

    const result = await createLogisticItem(parsed.data)
    if (!result.success) {
      return apiError(result.error || 'Gagal membuat logistic item', 400)
    }

    return apiSuccess(result.item, 'Logistic item berhasil dibuat', 201)
  } catch (error) {
    return apiError('Gagal membuat logistic item', 500, String(error))
  }
}

