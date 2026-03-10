import { z } from 'zod'
import { apiError, apiSuccess } from '@/lib/api-response'
import { deleteProduct, updateProduct } from '@/lib/actions'

const productUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  sku: z.string().min(1).optional(),
  categoryId: z.string().min(1).optional(),
  price: z.number().nonnegative().optional(),
  cost: z.number().nonnegative().optional(),
  stock: z.number().int().nonnegative().optional(),
  minStock: z.number().int().nonnegative().optional(),
  unit: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const parsed = productUpdateSchema.safeParse(body)
    if (!parsed.success) {
      return apiError('Payload update produk tidak valid', 422, parsed.error.flatten())
    }

    const result = await updateProduct(id, parsed.data)
    if (!result.success) {
      return apiError(result.error || 'Gagal update produk', 400)
    }

    return apiSuccess(result.product, 'Produk berhasil diperbarui')
  } catch (error) {
    return apiError('Gagal update produk', 500, String(error))
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const result = await deleteProduct(id)
    if (!result.success) {
      return apiError(result.error || 'Gagal menghapus produk', 400)
    }

    return apiSuccess({ id }, 'Produk berhasil dihapus')
  } catch (error) {
    return apiError('Gagal menghapus produk', 500, String(error))
  }
}

