'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Mail } from 'lucide-react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Gagal mengirim email reset password');
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Kiri: Ilustrasi */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#1C2F57] via-[#2a4575] to-[#1C2F57] p-12 flex-col justify-between relative overflow-hidden">
        
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
              <img 
                src="/logo.png" 
                alt="Logo" 
                className="h-8 w-8 object-contain" 
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  if (e.currentTarget.parentElement) {
                    e.currentTarget.parentElement.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-6 w-6 text-white"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>';
                  }
                }} 
              />
            </div>
            <div>
              <span className="font-bold text-lg tracking-wider text-white">PESONA GADING</span>
              <p className="text-xs text-white/60">Cibitung 1</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 space-y-4 max-w-lg">
          <h2 className="text-4xl font-extrabold leading-tight tracking-tight text-white lg:text-5xl">
            Lupa Password?
          </h2>
          <p className="text-white/80 text-lg leading-relaxed">
            Tidak masalah! Masukkan email Anda dan kami akan mengirimkan instruksi untuk mereset password.
          </p>
        </div>
        
        <div className="relative z-10 text-xs text-white/40">
          © {new Date().getFullYear()} RT 001 Pesona Gading Cibitung 1. All rights reserved.
        </div>
      </div>

      {/* Kanan: Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-4 md:p-8 lg:p-12 bg-white">
        <div className="w-full max-w-md space-y-6">
          {/* Back Button */}
          <Link 
            href="/auth/login" 
            className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-[#1C2F57] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Login
          </Link>

          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold text-[#1C2F57] tracking-tight">Reset Password</h1>
            <p className="text-slate-500 text-sm">
              Masukkan email yang terdaftar di sistem
            </p>
          </div>

          {success ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                  <Mail className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-bold text-green-900">Email Terkirim!</h3>
                  <p className="text-sm text-green-700">Periksa inbox Anda</p>
                </div>
              </div>
              <p className="text-sm text-green-800">
                Kami telah mengirim instruksi reset password ke <strong>{email}</strong>. 
                Silakan cek email Anda (jangan lupa periksa folder spam).
              </p>
              <Link href="/auth/login">
                <Button className="w-full bg-green-600 hover:bg-green-700">
                  Kembali ke Login
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-700 font-medium text-sm">
                  Alamat Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="nama@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:border-[#1C2F57] focus:ring-2 focus:ring-[#1C2F57]/10 transition-colors"
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full py-5 rounded-xl bg-[#1C2F57] hover:bg-[#1C2F57]/90 text-white font-semibold transition-all shadow-lg shadow-[#1C2F57]/10 hover:shadow-[#1C2F57]/20" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                    Mengirim...
                  </>
                ) : (
                  'Kirim Link Reset Password'
                )}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
