"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function PaymentProcessingPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const paymentId = params.id as string;
  const [status, setStatus] = useState<"processing" | "success" | "failed">(
    "processing",
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate payment processing
    const timer = setTimeout(async () => {
      try {
        // Assume payment is successful for testing
        const response = await fetch(`/api/payments/${paymentId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: "PAID",
            paymentMethod: "ONLINE_TRANSFER",
          }),
        });

        if (response.ok) {
          setStatus("success");
          toast({
            title: "Sukses",
            description: "Pembayaran berhasil diproses",
          });
        } else {
          setStatus("failed");
          toast({
            title: "Error",
            description: "Gagal memproses pembayaran",
            variant: "destructive",
          });
        }
      } catch (error) {
        setStatus("failed");
        toast({
          title: "Error",
          description: "Terjadi kesalahan saat memproses pembayaran",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [paymentId, toast]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Pemrosesan Pembayaran</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {status === "processing" && (
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="text-slate-600 text-center">
                Memproses pembayaran Anda...
              </p>
            </div>
          )}

          {status === "success" && (
            <div className="flex flex-col items-center space-y-4">
              <CheckCircle className="h-12 w-12 text-green-600" />
              <div className="text-center">
                <p className="font-semibold text-slate-900">
                  Pembayaran Berhasil!
                </p>
                <p className="text-sm text-slate-600 mt-1">
                  Tagihan Anda telah berhasil dibayarkan
                </p>
              </div>
              <Button
                onClick={() => router.push("/dashboard/payments")}
                className="w-full"
              >
                Kembali ke Tagihan
              </Button>
            </div>
          )}

          {status === "failed" && (
            <div className="flex flex-col items-center space-y-4">
              <Clock className="h-12 w-12 text-red-600" />
              <div className="text-center">
                <p className="font-semibold text-slate-900">Pembayaran Gagal</p>
                <p className="text-sm text-slate-600 mt-1">
                  Terjadi kesalahan saat memproses pembayaran Anda
                </p>
              </div>
              <Button
                onClick={() => router.push("/dashboard/payments")}
                className="w-full"
                variant="outline"
              >
                Kembali
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
