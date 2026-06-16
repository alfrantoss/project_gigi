'use client';

import './globals.css';
import { Inter } from 'next/font/google';
import { SessionProvider } from 'next-auth/react';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <head>
        <link rel="icon" href="/logo.png" type="image/png" />
        <title>Sistem Manajemen Warga - Pesona Gading Cibitung 1</title>
      </head>
      <body className={inter.className}>
        <SessionProvider>
          {children}
          <Toaster />
        </SessionProvider>
      </body>
    </html>
  );
}
