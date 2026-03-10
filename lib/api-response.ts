import { NextResponse } from 'next/server'

type ApiMeta = {
  timestamp: string
}

export function apiSuccess<T>(data: T, message = 'OK', status = 200) {
  return NextResponse.json(
    {
      success: true,
      message,
      data,
      meta: {
        timestamp: new Date().toISOString(),
      } satisfies ApiMeta,
    },
    { status }
  )
}

export function apiError(message: string, status = 400, details?: unknown) {
  return NextResponse.json(
    {
      success: false,
      message,
      details,
      meta: {
        timestamp: new Date().toISOString(),
      } satisfies ApiMeta,
    },
    { status }
  )
}

