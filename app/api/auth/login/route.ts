import { z } from 'zod'
import { loginAction } from '@/lib/actions'
import { apiError, apiSuccess } from '@/lib/api-response'

const loginSchema = z.object({
  username: z.string().min(1, 'Username wajib diisi'),
  password: z.string().min(1, 'Password wajib diisi'),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = loginSchema.safeParse(body)
    if (!parsed.success) {
      return apiError('Payload login tidak valid', 422, parsed.error.flatten())
    }

    const result = await loginAction(parsed.data.username, parsed.data.password)
    if (!result.success) {
      return apiError(result.error || 'Login gagal', 401)
    }

    return apiSuccess(result.user, 'Login berhasil')
  } catch (error) {
    return apiError('Terjadi kesalahan server', 500, String(error))
  }
}

