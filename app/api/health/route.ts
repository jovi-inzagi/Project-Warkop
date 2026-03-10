import { apiSuccess } from '@/lib/api-response'

export async function GET() {
  return apiSuccess(
    {
      service: 'warkop-management-app',
      status: 'healthy',
    },
    'Health check OK'
  )
}

