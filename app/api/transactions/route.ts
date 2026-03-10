import { z } from 'zod'
import { apiError, apiSuccess } from '@/lib/api-response'
import { createTransaction, getTransactions } from '@/lib/actions'

const transactionCreateSchema = z.object({
  type: z.string().min(1),
  category: z.string().min(1),
  description: z.string().min(1),
  amount: z.number().positive(),
  method: z.string().min(1),
  date: z.string().optional(),
})

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const data = await getTransactions({
      type: searchParams.get('type') ?? undefined,
      category: searchParams.get('category') ?? undefined,
      dateFrom: searchParams.get('dateFrom') ?? undefined,
      dateTo: searchParams.get('dateTo') ?? undefined,
    })
    return apiSuccess(data, 'Data transaksi berhasil diambil')
  } catch (error) {
    return apiError('Gagal memuat transaksi', 500, String(error))
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = transactionCreateSchema.safeParse(body)
    if (!parsed.success) {
      return apiError('Payload transaksi tidak valid', 422, parsed.error.flatten())
    }

    const result = await createTransaction(parsed.data)
    if (!result.success) {
      return apiError(result.error || 'Gagal membuat transaksi', 400)
    }

    return apiSuccess(result.transaction, 'Transaksi berhasil dibuat', 201)
  } catch (error) {
    return apiError('Gagal membuat transaksi', 500, String(error))
  }
}

