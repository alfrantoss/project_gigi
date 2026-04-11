# Panduan Instalasi Lengkap

## Prasyarat

Sebelum memulai instalasi, pastikan sistem Anda memiliki:

1. **Node.js** (v18 atau lebih baru)
   ```bash
   node --version  # harus v18+
   ```

2. **npm** atau **yarn**
   ```bash
   npm --version
   ```

3. **PostgreSQL** (v14 atau lebih baru)
   ```bash
   psql --version
   ```

4. **Git**
   ```bash
   git --version
   ```

## Langkah 1: Clone Repository

```bash
git clone <repository-url>
cd rt-management
```

## Langkah 2: Install Dependencies

```bash
npm install
```

Ini akan menginstall semua package yang diperlukan termasuk:
- Next.js
- Prisma
- NextAuth
- TailwindCSS
- dan lainnya

## Langkah 3: Setup Database PostgreSQL

### Opsi A: PostgreSQL Lokal

1. Install PostgreSQL jika belum:
   - **Ubuntu/Debian**:
     ```bash
     sudo apt update
     sudo apt install postgresql postgresql-contrib
     ```
   - **macOS** (via Homebrew):
     ```bash
     brew install postgresql@14
     ```
   - **Windows**: Download dari [postgresql.org](https://www.postgresql.org/download/windows/)

2. Jalankan PostgreSQL:
   ```bash
   sudo service postgresql start  # Linux
   brew services start postgresql@14  # macOS
   ```

3. Buat database baru:
   ```bash
   sudo -u postgres psql
   ```

   Di dalam psql console:
   ```sql
   CREATE DATABASE rt_management;
   CREATE USER rt_user WITH PASSWORD 'rt_password';
   GRANT ALL PRIVILEGES ON DATABASE rt_management TO rt_user;
   \q
   ```

### Opsi B: PostgreSQL Docker

```bash
docker run --name rt-postgres \
  -e POSTGRES_DB=rt_management \
  -e POSTGRES_USER=rt_user \
  -e POSTGRES_PASSWORD=rt_password \
  -p 5432:5432 \
  -d postgres:14
```

## Langkah 4: Konfigurasi Environment Variables

1. Copy file `.env.example` ke `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit file `.env` dengan konfigurasi Anda:

```env
# Database URL
DATABASE_URL="postgresql://rt_user:rt_password@localhost:5432/rt_management?schema=public"

# NextAuth Configuration
NEXTAUTH_SECRET="generate-random-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# SMTP Email Configuration (Opsional)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="noreply@rt.com"

# WhatsApp API (Opsional)
WA_API_KEY=""

# Midtrans Payment Gateway (Opsional)
MIDTRANS_SERVER_KEY=""
MIDTRANS_CLIENT_KEY=""
MIDTRANS_IS_PRODUCTION="false"
```

### Generate NEXTAUTH_SECRET

```bash
openssl rand -base64 32
```

Copy output dan paste ke `NEXTAUTH_SECRET`

### Setup Gmail SMTP (Opsional)

1. Login ke Gmail
2. Buka [App Passwords](https://myaccount.google.com/apppasswords)
3. Generate password untuk "Mail"
4. Copy password ke `SMTP_PASS`

## Langkah 5: Setup Prisma dan Database

1. Generate Prisma Client:
   ```bash
   npm run prisma:generate
   ```

2. Jalankan migration untuk membuat tabel:
   ```bash
   npm run prisma:migrate
   ```

   Beri nama migration (contoh: "init"):
   ```
   Enter a name for the new migration: › init
   ```

3. Seed database dengan data dummy:
   ```bash
   npm run prisma:seed
   ```

   Output berhasil:
   ```
   Seeding completed successfully!
   Login credentials:
   Super Admin: admin@rt.com / password123
   Ketua RT: ketua@rt.com / password123
   Bendahara: bendahara@rt.com / password123
   Warga 1: warga1@rt.com / password123
   Warga 2: warga2@rt.com / password123
   Warga 3: warga3@rt.com / password123
   ```

## Langkah 6: Jalankan Development Server

```bash
npm run dev
```

Aplikasi akan berjalan di: **http://localhost:3000**

## Langkah 7: Login Pertama Kali

1. Buka browser ke `http://localhost:3000`
2. Anda akan diredirect ke halaman login
3. Login dengan salah satu akun demo:
   - **Super Admin**: `admin@rt.com` / `password123`
   - **Ketua RT**: `ketua@rt.com` / `password123`
   - **Bendahara**: `bendahara@rt.com` / `password123`
   - **Warga**: `warga1@rt.com` / `password123`

## Troubleshooting

### Error: "Can't reach database server"

**Penyebab**: PostgreSQL tidak berjalan atau konfigurasi DATABASE_URL salah

**Solusi**:
```bash
# Cek status PostgreSQL
sudo service postgresql status

# Start PostgreSQL jika belum berjalan
sudo service postgresql start

# Verify connection
psql -U rt_user -d rt_management -h localhost
```

### Error: "Invalid `prisma.user.findUnique()` invocation"

**Penyebab**: Migration belum dijalankan

**Solusi**:
```bash
npm run prisma:migrate
```

### Error: "NEXTAUTH_URL not set"

**Penyebab**: Environment variable tidak terbaca

**Solusi**:
1. Pastikan file `.env` ada di root project
2. Restart development server
3. Verify dengan:
   ```bash
   cat .env | grep NEXTAUTH_URL
   ```

### Port 3000 sudah digunakan

**Solusi**: Gunakan port lain
```bash
PORT=3001 npm run dev
```

Update `NEXTAUTH_URL` di `.env`:
```env
NEXTAUTH_URL="http://localhost:3001"
```

## Prisma Studio (Database GUI)

Untuk melihat dan edit data via GUI:

```bash
npm run prisma:studio
```

Buka browser ke: **http://localhost:5555**

## Build untuk Production

```bash
npm run build
npm start
```

## Docker Deployment (Advanced)

Buat file `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run prisma:generate
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

Build dan run:
```bash
docker build -t rt-management .
docker run -p 3000:3000 --env-file .env rt-management
```

## Setup Midtrans (Payment Gateway)

1. Daftar di [Midtrans](https://midtrans.com/)
2. Dapatkan Server Key dan Client Key dari dashboard
3. Tambahkan ke `.env`:
   ```env
   MIDTRANS_SERVER_KEY="SB-Mid-server-xxxxx"
   MIDTRANS_CLIENT_KEY="SB-Mid-client-xxxxx"
   MIDTRANS_IS_PRODUCTION="false"
   ```

## Setup WhatsApp API (Fonnte)

1. Daftar di [Fonnte](https://fonnte.com/)
2. Dapatkan API Key
3. Tambahkan ke `.env`:
   ```env
   WA_API_KEY="your-fonnte-api-key"
   ```

## Verifikasi Instalasi

Checklist untuk memastikan semua berjalan:

- [ ] Database PostgreSQL berjalan
- [ ] Migration berhasil (ada tabel di database)
- [ ] Seed data berhasil (bisa login dengan akun demo)
- [ ] Development server berjalan tanpa error
- [ ] Bisa login dan akses dashboard
- [ ] Semua menu navigasi dapat diakses

## Next Steps

Setelah instalasi berhasil:

1. **Ubah password default** untuk semua akun
2. **Konfigurasi email & WhatsApp** untuk notifikasi
3. **Import data warga** yang sebenarnya
4. **Setup payment gateway** jika diperlukan
5. **Customize settings** sesuai kebutuhan RT

## Support

Jika mengalami masalah:

1. Cek log error di terminal
2. Cek Prisma Studio untuk verify data
3. Restart development server
4. Buka issue di repository

---

**Happy Coding! 🚀**
