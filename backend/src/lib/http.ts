import { Response } from 'express'

export function ok(res: Response, data: unknown, message = 'OK', status = 200) {
  return res.status(status).json({
    success: true,
    message,
    data,
    meta: { timestamp: new Date().toISOString() },
  })
}

export function fail(res: Response, message: string, status = 400, details?: unknown) {
  return res.status(status).json({
    success: false,
    message,
    details,
    meta: { timestamp: new Date().toISOString() },
  })
}



