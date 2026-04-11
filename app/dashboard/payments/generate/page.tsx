"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertCircle, CheckCircle } from "lucide-react";
import dayjs from "dayjs";
import "dayjs/locale/id";

dayjs.locale("id");

export default function GeneratePaymentsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [period, setPeriod] = useState(
    dayjs().add(1, "month").format("YYYY-MM"),
  );
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    count: number;
    message: string;
  } | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!period) {
      toast({
        title: "Error",
        description: "Periode harus diisi",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/payments/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          period,
          description: `Iuran bulanan - ${period}`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast({
          title: "Error",
          description: data.error || "Gagal membuat tagihan",
          variant: "destructive",
        });
        setResult({
          success: false,
          count: data.count || 0,
          message: data.error || "Gagal membuat tagihan",
        });
        return;
      }

      setResult({
        success: true,
        count: data.count,
        message: data.message,
      });

      toast({
        title: "Sukses",
        description: `${data.count} tagihan berhasil dibuat untuk periode ${period}`,
      });

      // Refresh payments list after 2 seconds
      setTimeout(() => {
        router.push("/dashboard/payments");
      }, 2000);
    } catch (error: any) {
      console.error("Generate error:", error);
      toast({
        title: "Error",
        description: error.message || "Gagal membuat tagihan",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const nextMonthDate = dayjs(period);
  const dueDate = nextMonthDate.date(10);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Buat Tagihan Bulanan</h1>
        <p className="text-slate-600 mt-2">
          Generate tagihan otomatis untuk semua warga untuk bulan tertentu
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Form Pembuatan Tagihan</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleGenerate} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="period">Pilih Periode *</Label>
              <Input
                id="period"
                type="month"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                required
              />
              <p className="text-sm text-slate-500">
                Jatuh tempo akan otomatis diset ke tanggal 10 bulan yang dipilih
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg space-y-2">
              <h3 className="font-semibold text-slate-900">Ringkasan</h3>
              <div className="space-y-1 text-sm">
                <p>
                  <span className="text-slate-600">Periode:</span>{" "}
                  <span className="font-medium">{period}</span>
                </p>
                <p>
                  <span className="text-slate-600">Jatuh Tempo:</span>{" "}
                  <span className="font-medium">
                    {dueDate.format("DD MMMM YYYY")}
                  </span>
                </p>
                <p>
                  <span className="text-slate-600">Action:</span>{" "}
                  <span className="font-medium">
                    Generate tagihan untuk semua warga
                  </span>
                </p>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Membuat Tagihan..." : "Buat Tagihan Bulan Ini"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {result && (
        <Card
          className={
            result.success
              ? "border-green-200 bg-green-50"
              : "border-red-200 bg-red-50"
          }
        >
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              {result.success ? (
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              )}
              <div>
                <p
                  className={
                    result.success
                      ? "text-green-800 font-medium"
                      : "text-red-800 font-medium"
                  }
                >
                  {result.message}
                </p>
                {result.success && (
                  <p className="text-sm text-green-700 mt-1">
                    Redirecting to payments page in 2 seconds...
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informasi Penting</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex gap-3">
            <div className="h-5 w-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
              1
            </div>
            <p className="text-slate-700">
              Tagihan otomatis dibuat untuk <strong>semua warga aktif</strong>
            </p>
          </div>
          <div className="flex gap-3">
            <div className="h-5 w-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
              2
            </div>
            <p className="text-slate-700">
              Jumlah tagihan ={" "}
              <strong>jumlah warga × iuran bulanan mereka</strong>
            </p>
          </div>
          <div className="flex gap-3">
            <div className="h-5 w-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
              3
            </div>
            <p className="text-slate-700">
              Jatuh tempo otomatis diset ke <strong>tanggal 10</strong> bulan
              yang dipilih
            </p>
          </div>
          <div className="flex gap-3">
            <div className="h-5 w-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
              4
            </div>
            <p className="text-slate-700">
              Sistem akan <strong>mencegah duplikasi</strong> - tidak bisa
              membuat tagihan dua kali untuk periode yang sama
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
