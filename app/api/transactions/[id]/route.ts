import { apiError, apiSuccess } from '@/lib/api-response'
import { deleteTransaction } from '@/lib/actions'

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const result = await deleteTransaction(id)
    if (!result.success) {
      return apiError(result.error || 'Gagal menghapus transaksi', 400)
    }

    return apiSuccess({ id }, 'Transaksi berhasil dihapus')
  } catch (error) {
    return apiError('Gagal menghapus transaksi', 500, String(error))
  }
}

