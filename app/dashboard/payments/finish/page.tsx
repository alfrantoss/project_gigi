'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, Clock, Loader2, ArrowLeft } from 'lucide-react';

export default function PaymentFinishPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'success' | 'pending' | 'failed' | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    checkPaymentStatus();
  }, []);

  const checkPaymentStatus = async () => {
    try {
      const orderId = searchParams.get('order_id');
      const statusCode = searchParams.get('status_code');
      const transactionStatus = searchParams.get('transaction_status');

      if (!orderId) {
        setStatus('failed');
        setMessage('ID pesanan tidak ditemukan');
        setLoading(false);
        return;
      }

      // Check status from URL parameters first
      if (transactionStatus === 'settlement' || transactionStatus === 'capture') {
        setStatus('success');
        setMessage('Pembayaran Anda berhasil dikonfirmasi!');
        setLoading(false);
        return;
      } else if (transactionStatus === 'pending') {
        setStatus('pending');
        setMessage('Pembayaran Anda sedang diproses. Mohon tunggu konfirmasi.');
        setLoading(false);
        return;
      } else if (transactionStatus === 'cancel' || transactionStatus === 'deny' || transactionStatus === 'expire') {
        setStatus('failed');
        setMessage('Pembayaran dibatalkan atau gagal diproses.');
        setLoading(false);
        return;
      }

      // If no status in URL, check via API
      const response = await fetch('/api/payments/check-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });

      const data = await response.json();

      if (data.status === 'PAID') {
        setStatus('success');
        setMessage('Pembayaran Anda berhasil dikonfirmasi!');
      } else if (data.status === 'PENDING') {
        setStatus('pending');
        setMessage('Pembayaran Anda sedang diproses. Mohon tunggu konfirmasi.');
      } else {
        setStatus('failed');
        setMessage('Pembayaran gagal atau dibatalkan.');
      }
    } catch (error) {
      console.error('Failed to check payment status:', error);
      setStatus('failed');
      setMessage('Terjadi kesalahan saat memeriksa status pembayaran.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="h-16 w-16 animate-spin text-[#1C2F57] mx-auto" />
          <p className="text-slate-600">Memeriksa status pembayaran...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.push('/dashboard/payments')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Status Pembayaran</h1>
          <p className="text-slate-600 mt-1">Hasil transaksi pembayaran iuran RT</p>
        </div>
      </div>

      <div className="flex items-center justify-center min-h-[50vh]">
        <Card className="max-w-lg w-full">
          <CardHeader>
            <CardTitle className="text-center">
              {status === 'success' && (
                <div className="flex flex-col items-center gap-4">
                  <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle className="h-12 w-12 text-green-600" />
                  </div>
                  <span className="text-green-900">Pembayaran Berhasil!</span>
                </div>
              )}
              {status === 'pending' && (
                <div className="flex flex-col items-center gap-4">
                  <div className="h-20 w-20 rounded-full bg-yellow-100 flex items-center justify-center">
                    <Clock className="h-12 w-12 text-yellow-600" />
                  </div>
                  <span className="text-yellow-900">Pembayaran Tertunda</span>
                </div>
              )}
              {status === 'failed' && (
                <div className="flex flex-col items-center gap-4">
                  <div className="h-20 w-20 rounded-full bg-red-100 flex items-center justify-center">
                    <XCircle className="h-12 w-12 text-red-600" />
                  </div>
                  <span className="text-red-900">Pembayaran Gagal</span>
                </div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-center text-slate-600">{message}</p>

            {status === 'success' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800">
                  ✅ Transaksi Anda telah dikonfirmasi dan tercatat dalam sistem. Terima kasih atas
                  pembayaran tepat waktu!
                </p>
              </div>
            )}

            {status === 'pending' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  ⏳ Pembayaran Anda sedang diproses. Status akan diperbarui otomatis setelah
                  konfirmasi dari payment gateway. Anda akan menerima notifikasi via email/WhatsApp.
                </p>
              </div>
            )}

            {status === 'failed' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">
                  ❌ Pembayaran tidak dapat diproses. Silakan coba lagi atau hubungi admin jika
                  masalah berlanjut.
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => router.push('/dashboard/payments')}
              >
                Lihat Riwayat Pembayaran
              </Button>
              <Button className="flex-1" onClick={() => router.push('/dashboard')}>
                Kembali ke Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
