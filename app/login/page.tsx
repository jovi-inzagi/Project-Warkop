'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Coffee,
  Eye,
  EyeOff,
  Lock,
  User,
  ArrowRight,
  Loader2,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  Package,
} from 'lucide-react'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [mounted, setMounted] = useState(false)

  const { login, user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!isLoading && user) {
      router.push('/')
    }
  }, [user, isLoading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!username.trim() || !password.trim()) {
      setError('Username dan password harus diisi')
      return
    }

    setIsSubmitting(true)
    const result = await login(username, password)

    if (result.success) {
      router.push('/')
    } else {
      setError(result.error || 'Login gagal')
      setIsSubmitting(false)
    }
  }

  if (isLoading || (!isLoading && user)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-amber-400 via-amber-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/30 animate-pulse">
            <Coffee className="w-6 h-6 text-white" />
          </div>
          <p className="text-sm text-muted-foreground">Memuat...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-[55%] xl:w-[60%] relative overflow-hidden bg-gradient-to-br from-amber-600 via-orange-600 to-amber-800">
        {/* Animated Background Pattern */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 opacity-10">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="coffee-pattern" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
                  <circle cx="30" cy="30" r="2" fill="white" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#coffee-pattern)" />
            </svg>
          </div>

          {/* Floating orbs */}
          <div className="absolute top-20 left-20 w-72 h-72 bg-amber-400/20 rounded-full blur-3xl animate-float-slow" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl animate-float-slower" />
          <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-yellow-400/15 rounded-full blur-2xl animate-float-medium" />
        </div>

        {/* Content */}
        <div className={`relative z-10 flex flex-col justify-between p-12 xl:p-16 w-full transition-all duration-700 ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`}>
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20 shadow-lg">
              <Coffee className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Kantor</h1>
              <p className="text-[10px] font-semibold text-amber-200 uppercase tracking-[0.3em]">Reborn</p>
            </div>
          </div>

          {/* Main Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-4xl xl:text-5xl font-bold text-white leading-tight">
                Kelola Warung Kopi <br />
                <span className="text-amber-200">Lebih Cerdas</span>
              </h2>
              <p className="text-lg text-amber-100/80 max-w-md leading-relaxed">
                Sistem manajemen terpadu untuk inventory, keuangan, dan analisis bisnis warung kopi Anda.
              </p>
            </div>

            {/* Feature cards */}
            <div className="grid grid-cols-2 gap-4 max-w-lg">
              {[
                { icon: Package, title: 'Inventory', desc: 'Kelola stok real-time' },
                { icon: TrendingUp, title: 'Cash Flow', desc: 'Monitor arus kas' },
                { icon: ShieldCheck, title: 'Keamanan', desc: 'Data terenkripsi aman' },
                { icon: Sparkles, title: 'Analisis', desc: 'Insight bisnis cerdas' },
              ].map((feat, idx) => (
                <div
                  key={idx}
                  className={`flex items-start gap-3 p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 hover:bg-white/15 transition-all duration-300 group ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                  style={{ transitionDelay: `${300 + idx * 100}ms` }}
                >
                  <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0 group-hover:bg-white/25 transition-colors">
                    <feat.icon className="w-5 h-5 text-amber-200" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{feat.title}</p>
                    <p className="text-xs text-amber-200/70 mt-0.5">{feat.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center gap-2 text-amber-200/50 text-xs">
            <Coffee className="w-3.5 h-3.5" />
            <span>&copy; 2026 Kantor Reborn. All rights reserved.</span>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex flex-col min-h-screen bg-background relative">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-center pt-8 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-gradient-to-br from-amber-400 via-amber-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/25">
              <Coffee className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Kantor</h1>
              <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-[0.3em]">Reborn</p>
            </div>
          </div>
        </div>

        {/* Form Container */}
        <div className="flex-1 flex items-center justify-center px-6 sm:px-8 py-8">
          <div className={`w-full max-w-[420px] space-y-8 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            {/* Heading */}
            <div className="space-y-2 text-center lg:text-left">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Selamat Datang! <span className="inline-block animate-wave">👋</span>
              </h2>
              <p className="text-muted-foreground text-sm">
                Masuk ke akun Anda untuk melanjutkan
              </p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Error Alert */}
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive animate-shake">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <p className="text-sm font-medium">{error}</p>
                </div>
              )}

              {/* Username Field */}
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium">
                  Username
                </Label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="Masukkan username"
                    value={username}
                    onChange={(e) => { setUsername(e.target.value); setError('') }}
                    className="h-12 pl-10 pr-4 rounded-xl text-sm bg-muted/30 border-border/60 focus:bg-background transition-colors"
                    autoComplete="username"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Password
                  </Label>
                  <button
                    type="button"
                    className="text-xs text-primary hover:text-primary/80 font-medium transition-colors hover:underline underline-offset-4"
                  >
                    Lupa password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Masukkan password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError('') }}
                    className="h-12 pl-10 pr-12 rounded-xl text-sm bg-muted/30 border-border/60 focus:bg-background transition-colors"
                    autoComplete="current-password"
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-0.5"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center gap-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                  disabled={isSubmitting}
                />
                <Label htmlFor="remember" className="text-sm text-muted-foreground font-normal cursor-pointer">
                  Ingat saya
                </Label>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 rounded-xl text-sm font-semibold bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 hover:from-amber-600 hover:via-amber-700 hover:to-orange-700 text-white shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 transition-all duration-300 border-0 group"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Masuk...
                  </>
                ) : (
                  <>
                    Masuk
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/60" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-background text-muted-foreground">Demo Akun</span>
              </div>
            </div>

            {/* Demo Accounts */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => { setUsername('admin'); setPassword('admin123'); setError('') }}
                disabled={isSubmitting}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/40 hover:border-amber-300/50 transition-all duration-200 group disabled:opacity-50"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                  <ShieldCheck className="w-5 h-5 text-white" />
                </div>
                <div className="text-center">
                  <p className="text-xs font-semibold">Admin</p>
                  <p className="text-[10px] text-muted-foreground">admin / admin123</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => { setUsername('kasir'); setPassword('kasir123'); setError('') }}
                disabled={isSubmitting}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/40 hover:border-blue-300/50 transition-all duration-200 group disabled:opacity-50"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div className="text-center">
                  <p className="text-xs font-semibold">Kasir</p>
                  <p className="text-[10px] text-muted-foreground">kasir / kasir123</p>
                </div>
              </button>
            </div>

            {/* Footer on mobile */}
            <p className="text-center text-xs text-muted-foreground/60 lg:hidden pt-2">
              &copy; 2026 Kantor Reborn. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}


