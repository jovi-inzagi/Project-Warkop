'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { seedDatabase } from '@/lib/actions'
import { Button } from '@/components/ui/button'
import { Coffee, Database, CheckCircle, Loader2, Rocket } from 'lucide-react'

export default function SetupPage() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [result, setResult] = useState<Record<string, unknown> | null>(null)
  const router = useRouter()

  const handleSeed = async () => {
    setStatus('loading')
    try {
      const res = await seedDatabase()
      if (res.success) {
        setResult(res.counts as Record<string, unknown>)
        setStatus('success')
      } else {
        setResult({ error: res.error })
        setStatus('error')
      }
    } catch (err) {
      setResult({ error: String(err) })
      setStatus('error')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="w-16 h-16 mx-auto bg-gradient-to-br from-amber-400 via-amber-500 to-orange-600 rounded-3xl flex items-center justify-center shadow-xl shadow-amber-500/30">
          <Coffee className="w-8 h-8 text-white" />
        </div>

        <div>
          <h1 className="text-2xl font-bold">Setup Database</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Isi database dengan data awal untuk memulai aplikasi
          </p>
        </div>

        {status === 'idle' && (
          <Button onClick={handleSeed} size="lg" className="w-full h-12 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-lg gap-2">
            <Database className="w-5 h-5" />
            Mulai Setup Database
          </Button>
        )}

        {status === 'loading' && (
          <div className="flex flex-col items-center gap-3 py-8">
            <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
            <p className="text-sm text-muted-foreground">Mengisi data ke database...</p>
          </div>
        )}

        {status === 'success' && result && (
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2 text-emerald-600">
              <CheckCircle className="w-6 h-6" />
              <span className="font-semibold">Database berhasil diisi!</span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-left">
              {Object.entries(result).map(([key, val]) => (
                <div key={key} className="p-3 rounded-xl bg-muted/40 border">
                  <p className="text-xs text-muted-foreground capitalize">{key}</p>
                  <p className="text-lg font-bold">{String(val)}</p>
                </div>
              ))}
            </div>

            <Button onClick={() => router.push('/login')} size="lg" className="w-full h-12 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white gap-2">
              <Rocket className="w-5 h-5" />
              Mulai Gunakan Aplikasi
            </Button>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-3">
            <p className="text-sm text-destructive">Error: {String(result?.error)}</p>
            <Button onClick={handleSeed} variant="outline">Coba Lagi</Button>
          </div>
        )}
      </div>
    </div>
  )
}


