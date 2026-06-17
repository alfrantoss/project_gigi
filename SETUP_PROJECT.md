# 🚀 Panduan Lengkap Setup Project - RT Management System

## 📋 PERSYARATAN SISTEM

Sebelum memulai, pastikan sudah terinstall:

### **1. Node.js**
- ✅ **Versi 18.17.0 atau lebih tinggi**
- ✅ **Rekomendasi: Node.js v20.x (LTS)**
- ❌ Jangan pakai versi 16.x atau lebih lama

**Cek versi:**
```bash
node -v
```

**Download:** https://nodejs.org/ (Pilih versi LTS)

### **2. PostgreSQL**
- ✅ **Versi 12 atau lebih tinggi**
- Bisa pakai **Laragon**, **XAMPP + PostgreSQL**, atau install manual

**Cek versi:**
```bash
psql --version
```

### **3. Git**
- Untuk clone dan pull project

**Cek versi:**
```bash
git --version
```

---

## 🎯 LANGKAH-LANGKAH SETUP (UNTUK LAPTOP BARU)

### **STEP 1: Clone atau Pull Project**

#### Jika Pertama Kali (Clone):
```bash
git clone <URL_REPOSITORY>
cd project_gigi
```

#### Jika Sudah Pernah Clone (Pull Update):
```bash
cd project_gigi
git pull origin main
```

---

### **STEP 2: Install Dependencies**

```bash
npm install
```

**Waktu:** Sekitar 2-5 menit (tergantung koneksi internet)

**Jika ada error "Unsupported engine":**
- Artinya Node.js Anda versinya terlalu lama
- Update Node.js ke versi 18.17.0+ atau 20.x

---

### **STEP 3: Setup File `.env`**

#### **A. Copy dari template:**
```bash
copy .env.example .env
```

#### **B. Edit file `.env`:**

Buka file `.env` dengan text editor, lalu sesuaikan konfigurasi:

```env
# ============================================
# DATABASE CONFIGURATION
# ============================================
# PENTING: Ganti dengan kredensial PostgreSQL Anda!
DATABASE_URL="postgresql://USERNAME:PASSWORD@localhost:5432/NAMA_DATABASE?schema=public"

# Contoh:
# DATABASE_URL="postgresql://postgres:admin123@localhost:5432/project_gigi?schema=public"

# ============================================
# NEXTAUTH CONFIGURATION
# ============================================
NEXTAUTH_SECRET="ganti-dengan-random-string-panjang-minimal-32-karakter"
NEXTAUTH_URL="http://localhost:3000"

# Generate random secret dengan:
# Windows PowerShell: [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes((New-Guid).ToString()))
# atau pakai: https://generate-secret.vercel.app/32

# ============================================
# EMAIL CONFIGURATION (Opsional)
# ============================================
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="email-anda@gmail.com"
SMTP_PASS="app-password-gmail"
SMTP_FROM="noreply@rt.com"

# Cara dapat App Password Gmail:
# 1. Buka: https://myaccount.google.com/security
# 2. Aktifkan 2-Step Verification
# 3. Buka: https://myaccount.google.com/apppasswords
# 4. Generate password untuk "Mail"
# 5. Copy password 16 digit ke SMTP_PASS

# ============================================
# WHATSAPP API (Opsional - Fonnte)
# ============================================
WA_API_KEY=""
# Daftar di: https://fonnte.com/

# ============================================
# PAYMENT GATEWAY (Opsional - Midtrans)
# ============================================
MIDTRANS_SERVER_KEY=""
MIDTRANS_CLIENT_KEY=""
MIDTRANS_IS_PRODUCTION="false"
# Daftar di: https://midtrans.com/
```

**YANG WAJIB DIUBAH:**
- ✅ `DATABASE_URL` - Sesuaikan username, password, dan nama database
- ✅ `NEXTAUTH_SECRET` - Ganti dengan string random panjang

**Yang Opsional (bisa dikonfigurasi nanti):**
- Email (SMTP)
- WhatsApp API
- Midtrans Payment

---

### **STEP 4: Setup Database PostgreSQL**

#### **A. Start PostgreSQL Service**

**Jika pakai Laragon:**
```
1. Buka Laragon
2. Klik "Start All"
3. PostgreSQL akan jalan otomatis
```

**Jika pakai manual:**
```bash
# Windows - Start service
net start postgresql-x64-XX

# Atau cek via Services (Win+R → services.msc)
# Cari "postgresql" dan klik Start
```

#### **B. Buat Database Baru**

**Cara 1: Via pgAdmin (GUI)**
```
1. Buka pgAdmin 4
2. Login dengan password PostgreSQL
3. Klik kanan "Databases" → Create → Database
4. Database name: project_gigi (atau sesuai .env)
5. Owner: postgres
6. Klik Save
```

**Cara 2: Via Command Line (psql)**
```bash
# Masuk ke PostgreSQL
psql -U postgres

# Buat database
CREATE DATABASE project_gigi;

# Verifikasi
\l

# Keluar
\q
```

**Cara 3: Via Laragon Terminal**
```bash
# Di Laragon, klik kanan PostgreSQL → Terminal
CREATE DATABASE project_gigi;
```

---

### **STEP 5: Jalankan Database Migration**

Migration akan membuat semua tabel yang diperlukan:

```bash
npx prisma migrate deploy
```

**Output yang benar:**
```
Prisma schema loaded from prisma\schema.prisma
Datasource "db": PostgreSQL database "project_gigi"

20 migrations found in prisma/migrations

Applying migration `20260617003125_add_ektp_kartu_keluarga_to_warga`
...

The following migrations have been applied:

✓ All migrations have been applied successfully.
```

**Jika ada error:**
```bash
# Coba pakai ini:
npx prisma migrate dev

# Atau reset database (HATI-HATI: menghapus semua data!)
npx prisma migrate reset
```

---

### **STEP 6: Generate Prisma Client**

```bash
npx prisma generate
```

**Output yang benar:**
```
✔ Generated Prisma Client
```

---

### **STEP 7: (Opsional) Seed Data Awal**

Buat user admin pertama kali:

#### **A. Via Prisma Studio (GUI - Paling Mudah)**
```bash
npx prisma studio
```

Browser akan terbuka di `http://localhost:5555`

1. Klik tabel **"User"**
2. Klik **"Add record"**
3. Isi data:
   - **id**: (biarkan kosong, otomatis)
   - **email**: `admin@rt.com`
   - **password**: `$2b$10$XXX...` (harus di-hash, lihat cara di bawah)
   - **name**: `Super Admin`
   - **role**: `SUPER_ADMIN`
   - **phone**: `08123456789`
   - **isActive**: `true`
4. Klik **Save**

#### **B. Generate Password Hash untuk Admin**

Buka **Node.js REPL** di terminal:
```bash
node
```

Lalu ketik:
```javascript
const bcrypt = require('bcrypt');
bcrypt.hash('admin123', 10, (err, hash) => {
  console.log(hash);
});
```

**Output:** 
```
$2b$10$xyz...abc123
```

Copy hash tersebut dan paste ke field **password** di Prisma Studio.

**Keluar dari Node REPL:**
```
.exit
```

#### **C. Login dengan:**
- Email: `admin@rt.com`
- Password: `admin123`

---

### **STEP 8: Jalankan Development Server**

```bash
npm run dev
```

**Output yang benar:**
```
> nextjs@0.1.0 dev
> next dev

- ready started server on 0.0.0.0:3000, url: http://localhost:3000
- event compiled client and server successfully in XX ms
```

---

### **STEP 9: Buka Browser**

Kunjungi: **http://localhost:3000**

Halaman login akan muncul! 🎉

---

## ✅ CHECKLIST SETUP (PRINT & CENTANG!)

```
📦 PERSIAPAN:
☐ Node.js v18.17.0+ atau v20.x terinstall
☐ PostgreSQL terinstall dan service berjalan
☐ Git terinstall

📥 DOWNLOAD PROJECT:
☐ git pull origin main
☐ cd project_gigi

🔧 INSTALASI:
☐ npm install
☐ copy .env.example .env
☐ Edit DATABASE_URL di .env
☐ Edit NEXTAUTH_SECRET di .env

🗄️ DATABASE:
☐ PostgreSQL service berjalan
☐ Database baru sudah dibuat (project_gigi)
☐ npx prisma migrate deploy
☐ npx prisma generate

👤 USER ADMIN (OPSIONAL):
☐ npx prisma studio
☐ Buat user admin pertama
☐ Password sudah di-hash dengan bcrypt

🚀 JALANKAN:
☐ npm run dev
☐ Buka http://localhost:3000
☐ Login berhasil!
```

---

## 🔧 TROUBLESHOOTING UMUM

### ❌ **Error: "Can't reach database server"**

**Penyebab:** PostgreSQL tidak jalan atau `DATABASE_URL` salah

**Solusi:**
```bash
# 1. Cek PostgreSQL service
# Windows: Win+R → services.msc → cari "postgresql"

# 2. Cek DATABASE_URL di .env
# Format: postgresql://USER:PASS@HOST:PORT/DBNAME
# Contoh: postgresql://postgres:admin@localhost:5432/project_gigi

# 3. Test koneksi
npx prisma db pull
```

---

### ❌ **Error: "Database does not exist"**

**Penyebab:** Database belum dibuat

**Solusi:**
```bash
# Buat database dulu via psql atau pgAdmin
psql -U postgres
CREATE DATABASE project_gigi;
\q

# Lalu jalankan migration
npx prisma migrate deploy
```

---

### ❌ **Error: "Module not found" atau "Cannot find module"**

**Penyebab:** Dependencies belum terinstall lengkap

**Solusi:**
```bash
# Hapus node_modules dan install ulang
rmdir /s /q node_modules
del package-lock.json
npm install
```

---

### ❌ **Error: "Port 3000 already in use"**

**Penyebab:** Port 3000 sudah dipakai aplikasi lain

**Solusi:**
```bash
# Jalankan di port lain
npm run dev -- -p 3001

# Atau kill process yang pakai port 3000
netstat -ano | findstr :3000
taskkill /PID <PID_NUMBER> /F
```

---

### ❌ **Error: "Prisma Client did not initialize yet"**

**Penyebab:** Prisma Client belum di-generate

**Solusi:**
```bash
npx prisma generate
```

---

### ❌ **Error: bcrypt "node-gyp" error saat npm install**

**Penyebab:** bcrypt perlu compile untuk Windows

**Solusi:**
```bash
# Install Windows Build Tools (Run as Administrator)
npm install -g windows-build-tools

# Atau rebuild bcrypt
npm rebuild bcrypt
```

---

### ❌ **Error: "Invalid `prisma.user.findUnique()` invocation"**

**Penyebab:** Migration belum dijalankan atau database schema tidak sync

**Solusi:**
```bash
# Generate dan push schema
npx prisma generate
npx prisma db push

# Atau jalankan migration
npx prisma migrate deploy
```

---

## 📝 PERINTAH BERGUNA

```bash
# Development
npm run dev              # Jalankan dev server
npm run build            # Build untuk production
npm run start            # Jalankan production server

# Database
npx prisma studio        # Buka database GUI
npx prisma migrate dev   # Buat migration baru
npx prisma migrate deploy # Apply migrations
npx prisma generate      # Generate Prisma Client
npx prisma db push       # Push schema tanpa migration
npx prisma db pull       # Pull schema dari database

# Lainnya
npm run lint             # Check code quality
npm run typecheck        # Check TypeScript errors
```

---

## 🌐 AKSES APLIKASI

- **Frontend**: http://localhost:3000
- **Prisma Studio**: http://localhost:5555 (saat `npx prisma studio` berjalan)
- **API Routes**: http://localhost:3000/api/*

---

## 👥 UNTUK DEVELOPER LAIN (SHARING PROJECT)

Jika teman Anda mau setup project ini:

1. **Kirim file yang perlu:**
   - Link repository Git (jangan kirim `node_modules` atau `.env`)
   
2. **Instruksi:**
   ```
   "Lihat file SETUP_PROJECT.md untuk panduan lengkap setup"
   ```

3. **Pastikan teman Anda punya:**
   - Node.js v18.17.0+ atau v20.x
   - PostgreSQL
   - Git

4. **File yang TIDAK perlu di-share:**
   - ❌ `node_modules/` (besar, tinggal `npm install` saja)
   - ❌ `.env` (setiap developer buat sendiri)
   - ❌ `.next/` (auto-generate)
   - ❌ `prisma/migrations/` (optional, bisa di-generate ulang)

5. **File yang HARUS di-share:**
   - ✅ Semua file source code
   - ✅ `package.json` dan `package-lock.json`
   - ✅ `.env.example` (template)
   - ✅ `prisma/schema.prisma`
   - ✅ Dokumentasi (SETUP_PROJECT.md, dll)

---

## 🎓 STRUKTUR PROJECT

```
project_gigi/
├── .env                    # Konfigurasi (JANGAN DI-COMMIT!)
├── .env.example            # Template .env
├── .nvmrc                  # Versi Node.js
├── package.json            # Dependencies & scripts
├── prisma/
│   ├── schema.prisma       # Database schema
│   ├── migrations/         # Database migrations
│   └── seed.ts             # Data awal (optional)
├── app/
│   ├── api/                # API Routes
│   ├── auth/               # Auth pages
│   ├── dashboard/          # Dashboard pages
│   └── layout.tsx          # Root layout
├── components/             # React components
├── lib/                    # Utilities
│   ├── auth.ts             # NextAuth config
│   ├── prisma.ts           # Prisma client
│   └── utils.ts            # Helper functions
├── public/                 # Static files
│   ├── logo.png
│   └── uploads/            # File uploads
├── types/                  # TypeScript types
└── utils/                  # Utilities
    └── pdf-generator.ts    # PDF templates
```

---

## 📚 DOKUMENTASI TAMBAHAN

- `NODE_VERSION_GUIDE.md` - Panduan versi Node.js
- `FIX_PROFILE_SESSION_COMPLETE.md` - Troubleshooting session error
- `QUICK_FIX_INSTRUCTIONS.md` - Solusi cepat error umum
- `API_DOCUMENTATION.md` - API endpoints documentation

---

## 🆘 BUTUH BANTUAN?

Jika masih ada masalah:

1. Cek error message di terminal
2. Cek browser console (F12)
3. Cek server logs
4. Lihat file troubleshooting di dokumentasi
5. Tanya ke developer yang sudah setup sebelumnya

---

## ✅ SUKSES SETUP!

Jika sudah bisa:
- ✅ `npm run dev` jalan tanpa error
- ✅ Buka http://localhost:3000 tanpa error
- ✅ Login page muncul
- ✅ Bisa login dengan user admin

**Selamat! Setup berhasil!** 🎉

Sekarang Anda bisa mulai development atau menggunakan aplikasi.

---

**Dibuat:** 2026-06-17  
**Project:** RT Management System  
**Tech Stack:** Next.js 13.5, React 18, TypeScript, PostgreSQL, Prisma, NextAuth
