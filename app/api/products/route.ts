import { z } from 'zod'
import { apiError, apiSuccess } from '@/lib/api-response'
import { createProduct, getProducts } from '@/lib/actions'

const productCreateSchema = z.object({
  name: z.string().min(1),
  sku: z.string().min(1),
  categoryId: z.string().min(1),
  price: z.number().nonnegative(),
  cost: z.number().nonnegative(),
  stock: z.number().int().nonnegative(),
  minStock: z.number().int().nonnegative(),
  unit: z.string().min(1),
})

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') ?? undefined
    const category = searchParams.get('category') ?? undefined
    const status = searchParams.get('status') ?? undefined

    const data = await getProducts(search, category, status)
    return apiSuccess(data, 'Data produk berhasil diambil')
  } catch (error) {
    return apiError('Gagal memuat data produk', 500, String(error))
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = productCreateSchema.safeParse(body)
    if (!parsed.success) {
      return apiError('Payload produk tidak valid', 422, parsed.error.flatten())
    }

    const result = await createProduct(parsed.data)
    if (!result.success) {
      return apiError(result.error || 'Gagal membuat produk', 400)
    }

    return apiSuccess(result.product, 'Produk berhasil dibuat', 201)
  } catch (error) {
    return apiError('Gagal membuat produk', 500, String(error))
  }
}

