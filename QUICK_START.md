# 🚀 Quick Start Guide

Panduan singkat untuk menjalankan aplikasi dalam 5 menit!

## ⚡ Super Quick Start (Development)

```bash
# 1. Install dependencies
npm install

# 2. Copy environment file
cp .env.example .env

# 3. Edit .env - minimal config:
# DATABASE_URL="postgresql://user:password@localhost:5432/rt_management"
# NEXTAUTH_SECRET="generate-dengan-openssl-rand-base64-32"
# NEXTAUTH_URL="http://localhost:3000"

# 4. Setup database (pastikan PostgreSQL sudah running)
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed

# 5. Run!
npm run dev
```

Buka browser: **http://localhost:3000**

Login: `admin@rt.com` / `password123`

## 🐳 Docker Quick Start (Rekomendasi untuk pemula)

Jika tidak mau install PostgreSQL manual:

```bash
# 1. Install dependencies
npm install

# 2. Start PostgreSQL dengan Docker
docker run --name rt-postgres \
  -e POSTGRES_DB=rt_management \
  -e POSTGRES_USER=rt_user \
  -e POSTGRES_PASSWORD=rt_password \
  -p 5432:5432 \
  -d postgres:14

# 3. Setup .env
cp .env.example .env
# Edit DATABASE_URL menjadi:
# DATABASE_URL="postgresql://rt_user:rt_password@localhost:5432/rt_management"

# 4. Setup Prisma
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed

# 5. Run
npm run dev
```

## 📋 Checklist Setup

- [ ] Node.js v18+ installed (`node --version`)
- [ ] PostgreSQL running (`psql --version`)
- [ ] Dependencies installed (`npm install`)
- [ ] `.env` file configured
- [ ] Database migrated (`npm run prisma:migrate`)
- [ ] Data seeded (`npm run prisma:seed`)
- [ ] App running (`npm run dev`)
- [ ] Login berhasil di `http://localhost:3000`

## 🔑 Demo Accounts

Setelah seed, gunakan akun ini:

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@rt.com | password123 |
| Ketua RT | ketua@rt.com | password123 |
| Bendahara | bendahara@rt.com | password123 |
| Warga | warga1@rt.com | password123 |

## 🎯 First Things to Try

1. **Login** sebagai Super Admin
2. Buka **Dashboard** - lihat summary keuangan
3. Buka **Keuangan** - tambah transaksi baru
4. Buka **Data Warga** - lihat data warga
5. Logout, login sebagai **Warga**
6. Lihat **Tagihan Saya**
7. **Ajukan Surat** baru
8. Logout, login sebagai **Ketua RT**
9. **Approve** surat yang diajukan tadi
10. Buat **Pengumuman** baru

## 🛠️ Troubleshooting Cepat

### Error: "Can't reach database"
```bash
# Cek PostgreSQL running
sudo service postgresql status

# Start jika belum
sudo service postgresql start
```

### Error: "Module not found"
```bash
npm install
```

### Error: "Invalid prisma.xxx invocation"
```bash
npm run prisma:generate
npm run prisma:migrate
```

### Port 3000 sudah terpakai
```bash
PORT=3001 npm run dev
# Jangan lupa update NEXTAUTH_URL di .env
```

## 📱 Features Overview

Setelah login, Anda bisa:

### Sebagai Admin
- ✅ Kelola transaksi keuangan (pemasukan/pengeluaran)
- ✅ Lihat laporan keuangan real-time
- ✅ Kelola data warga lengkap
- ✅ Approve/reject pengajuan surat
- ✅ Buat kegiatan & jadwal RT
- ✅ Buat pengumuman untuk warga
- ✅ Kelola tagihan warga

### Sebagai Warga
- ✅ Lihat tagihan iuran RT
- ✅ Ajukan surat (domisili, pengantar, dll)
- ✅ Lihat kalender kegiatan RT
- ✅ Lihat pengumuman RT
- ✅ Download surat yang sudah disetujui

## 🎨 UI Components

Aplikasi menggunakan shadcn/ui dengan komponen:
- Button, Input, Textarea
- Table, Card, Badge
- Dialog, Select, Dropdown
- Alert, Toast, Tooltip
- dan 60+ komponen lainnya

## 🗄️ Database GUI

Ingin lihat data di database?

```bash
npm run prisma:studio
```

Buka: **http://localhost:5555**

## 📝 Next Steps

1. **Customize Data**
   - Edit data warga di Prisma Studio
   - Tambah transaksi dummy
   - Tambah kegiatan mendatang

2. **Configure Optional Features**
   - Setup email SMTP (SMTP_HOST, SMTP_USER, SMTP_PASS)
   - Setup WhatsApp API (WA_API_KEY)
   - Setup Midtrans (MIDTRANS_SERVER_KEY)

3. **Production Setup**
   - Baca `DEPLOYMENT.md` untuk deploy ke Vercel/VPS
   - Ganti semua password default
   - Setup backup database

## 📚 Full Documentation

- **README.md** - Overview lengkap
- **INSTALLATION.md** - Instalasi detail step-by-step
- **DEPLOYMENT.md** - Deploy ke production
- **API_DOCUMENTATION.md** - API endpoints
- **PROJECT_SUMMARY.md** - Ringkasan project

## 💡 Pro Tips

1. **Development**: Gunakan Prisma Studio untuk edit data cepat
2. **Debugging**: Check terminal untuk error logs
3. **Database**: Backup sebelum migrate (`pg_dump`)
4. **Testing**: Test di browser Incognito untuk fresh session
5. **Performance**: Close unused tabs, restart dev server jika lambat

## ❓ FAQ

**Q: Apakah harus pakai Docker?**
A: Tidak wajib. Docker hanya untuk memudahkan setup PostgreSQL.

**Q: Bisa pakai MySQL/MongoDB?**
A: Schema Prisma support MySQL, tapi perlu edit beberapa type. MongoDB tidak recommended.

**Q: Bisa deploy gratis?**
A: Ya, ke Vercel (gratis). Database bisa pakai Supabase/Neon (free tier).

**Q: Apakah production-ready?**
A: Ya untuk internal RT. Untuk scale besar perlu optimization tambahan.

**Q: Support mobile?**
A: Web sudah responsive mobile-first. Untuk native app perlu develop terpisah.

---

**Selamat Mencoba! 🎉**

Jika ada masalah, check dokumentasi lengkap atau debug dengan Prisma Studio.
