import { z } from 'zod'
import { apiError, apiSuccess } from '@/lib/api-response'
import { deleteLogisticItem, updateLogisticItem } from '@/lib/logistic-actions'

const logisticUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
  unit: z.string().min(1).optional(),
  size: z.string().optional(),
  unitPrice: z.number().nonnegative().optional(),
  quantity: z.number().int().positive().optional(),
  totalPrice: z.number().nonnegative().optional(),
  purchaseDate: z.string().optional(),
  notes: z.string().optional(),
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const parsed = logisticUpdateSchema.safeParse(body)
    if (!parsed.success) {
      return apiError('Payload update logistic item tidak valid', 422, parsed.error.flatten())
    }

    const result = await updateLogisticItem(id, parsed.data)
    if (!result.success) {
      return apiError(result.error || 'Gagal update logistic item', 400)
    }

    return apiSuccess(result.item, 'Logistic item berhasil diperbarui')
  } catch (error) {
    return apiError('Gagal update logistic item', 500, String(error))
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const result = await deleteLogisticItem(id)
    if (!result.success) {
      return apiError(result.error || 'Gagal menghapus logistic item', 400)
    }

    return apiSuccess({ id }, 'Logistic item berhasil dihapus')
  } catch (error) {
    return apiError('Gagal menghapus logistic item', 500, String(error))
  }
}

