'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Paksa hilangkan scroll pada halaman login
  useEffect(() => {
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    document.body.style.margin = '0';
    return () => {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
      document.body.style.margin = '';
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    } catch (err) {
      setError('Terjadi kesalahan saat login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen overflow-hidden flex flex-col md:flex-row bg-[#1C2F57]/5">
      {/* Kiri: Foto / Ilustrasi Perumahan & Branding (Hanya tampil di Desktop) */}
      <div className="hidden md:flex md:w-1/2 lg:w-3/5 relative overflow-hidden bg-[#1C2F57] h-full">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-70 mix-blend-overlay"
          style={{ backgroundImage: "url('/login_bg.png')" }}
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1C2F57] via-[#1C2F57]/30 to-transparent" />
        
        {/* Konten di atas Gambar */}
        <div className="relative z-10 flex flex-col justify-between p-12 text-white h-full">
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
              <span className="font-bold text-lg tracking-wider">PESONA GADING</span>
              <p className="text-xs text-white/60">Cibitung 1</p>
            </div>
          </div>
          
          <div className="space-y-4 max-w-lg mb-12">
            <h2 className="text-4xl font-extrabold leading-tight tracking-tight text-white lg:text-5xl">
              Kemudahan Layanan <br />
              <span className="text-[#B59A5A]">Manajemen Warga</span>
            </h2>
            <p className="text-white/80 text-lg leading-relaxed">
              Platform pelayanan digital RT 001 / RW 016 untuk transparansi keuangan, efisiensi administrasi, dan koordinasi kegiatan warga yang lebih harmonis.
            </p>
          </div>
          
          <div className="text-xs text-white/40">
            © {new Date().getFullYear()} RT 001 Pesona Gading Cibitung 1. All rights reserved.
          </div>
        </div>
      </div>

      {/* Kanan: Form Login */}
      <div className="flex-1 flex flex-col justify-center items-center p-4 md:p-8 lg:p-12 bg-white h-full overflow-y-auto">
        <div className="w-full max-w-md space-y-5">
          {/* Logo & Judul untuk Mobile */}
          <div className="text-center md:hidden space-y-4">
            <div className="flex justify-center">
              <div className="h-16 w-16 rounded-xl bg-white flex items-center justify-center border-2 border-[#B59A5A] shadow-md">
                <img 
                  src="/logo.png" 
                  alt="Logo" 
                  className="h-10 w-10 object-contain" 
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    if (e.currentTarget.parentElement) {
                      e.currentTarget.parentElement.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-8 w-8 text-[#1C2F57]"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>';
                    }
                  }} 
                />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-[#1C2F57]">Sistem Manajemen Warga</h1>
              <p className="text-sm text-[#B59A5A] font-semibold tracking-wider uppercase">Pesona Gading Cibitung 1</p>
            </div>
          </div>

          {/* Header untuk Desktop */}
          <div className="hidden md:block space-y-2">
            <h1 className="text-3xl font-extrabold text-[#1C2F57] tracking-tight">Selamat Datang Kembali</h1>
            <p className="text-slate-500 text-sm">Masuk ke akun Anda untuk mengakses dashboard warga.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive" className="border-red-200 bg-red-50 text-red-800">
                <AlertDescription className="text-sm font-medium">{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700 font-medium text-sm">Alamat Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="warga@rt.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#1C2F57] focus:ring-2 focus:ring-[#1C2F57]/10 transition-colors"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-700 font-medium text-sm">Kata Sandi</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#1C2F57] focus:ring-2 focus:ring-[#1C2F57]/10 transition-colors"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full py-5 rounded-xl bg-[#1C2F57] hover:bg-[#1C2F57]/90 text-white font-semibold transition-all shadow-lg shadow-[#1C2F57]/10 hover:shadow-[#1C2F57]/20 flex items-center justify-center gap-2" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  Memproses...
                </>
              ) : (
                'Masuk ke Dashboard'
              )}
            </Button>
          </form>

          {/* Panel Akun Demo */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 space-y-2">
            <h3 className="text-xs font-bold text-[#1C2F57] uppercase tracking-wider flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#B59A5A]" />
              Akun Uji Coba (Demo)
            </h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-slate-600">
              <div>
                <p className="font-semibold text-slate-800">Super Admin:</p>
                <p className="font-mono text-[10px] text-slate-500">admin@rt.com</p>
              </div>
              <div>
                <p className="font-semibold text-slate-800">Ketua RT:</p>
                <p className="font-mono text-[10px] text-slate-500">ketua@rt.com</p>
              </div>
              <div>
                <p className="font-semibold text-slate-800">Bendahara:</p>
                <p className="font-mono text-[10px] text-slate-500">bendahara@rt.com</p>
              </div>
              <div>
                <p className="font-semibold text-slate-800">Warga (Contoh):</p>
                <p className="font-mono text-[10px] text-slate-500">warga11@rt.com</p>
              </div>
            </div>
            <p className="text-[10px] text-[#B59A5A] font-medium pt-1 border-t border-slate-100">
              * Password untuk semua akun demo adalah: <span className="font-mono bg-white px-1.5 py-0.5 rounded border text-slate-800">password123</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
