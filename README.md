# Sistem Informasi Manajemen Keuangan RT

Aplikasi fullstack berbasis Next.js untuk mengelola keuangan, data warga, dan administrasi RT/RW.

## 🚀 Fitur Utama

### 1. Manajemen Keuangan
- CRUD transaksi pemasukan & pengeluaran
- Laporan keuangan otomatis dengan filter periode
- Export ke PDF & Excel
- Audit log lengkap untuk setiap transaksi
- Alert otomatis saldo rendah

### 2. Pembayaran & Payment Gateway
- Integrasi Midtrans (Sandbox mode)
- Manajemen tagihan warga
- Update status pembayaran otomatis
- History pembayaran lengkap
- QR Code payment (QRIS)

### 3. Data Warga
- CRUD data warga lengkap
- Import data via Excel
- Dashboard statistik warga
- Tracking pembayaran per warga

### 4. Penyuratan Otomatis
- Pengajuan surat online (Domisili, Pengantar, dll)
- Approval workflow
- Generate PDF otomatis dengan template
- Tanda tangan digital

### 5. Kalender & Kegiatan
- Manajemen jadwal kegiatan RT
- Kalender interaktif
- Reminder otomatis via WhatsApp/Email

### 6. Informasi & Pengumuman
- Portal berita RT
- Notifikasi WhatsApp otomatis
- Kategori prioritas pengumuman

### 7. Multi-Role Access
- **Super Admin**: Akses penuh ke semua fitur
- **Ketua RT**: Kelola keuangan, surat, kegiatan, pengumuman
- **Bendahara**: Fokus transaksi dan pembayaran
- **Warga**: Portal pribadi (tagihan, surat, kalender)

### 8. Keamanan & Audit
- Password hashing dengan bcrypt
- Role-based access control (RBAC)
- Audit log detail setiap perubahan data
- Session management dengan NextAuth

### 9. Notifikasi & Otomasi
- Reminder tagihan via WhatsApp
- Reminder kegiatan via WhatsApp & Email
- Alert saldo kas rendah
- Notifikasi pengumuman penting

### 10. Laporan & Backup
- Export laporan keuangan (PDF/Excel)
- Laporan pembayaran
- Backup database otomatis

## 🛠 Tech Stack

- **Framework**: Next.js 13 (App Router)
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: NextAuth.js
- **Styling**: TailwindCSS + shadcn/ui
- **Charts**: Recharts
- **PDF**: jsPDF
- **Excel**: xlsx
- **Animations**: Framer Motion
- **Email**: Nodemailer
- **Payment**: Midtrans
- **WhatsApp**: Fonnte/Wablas API

## 📦 Installation

1. Clone repository
```bash
git clone <repository-url>
cd rt-management
```

2. Install dependencies
```bash
npm install
```

3. Setup environment variables
```bash
cp .env.example .env
```

Edit `.env` dengan konfigurasi Anda:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/rt_management"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# SMTP Configuration
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# WhatsApp API
WA_API_KEY="your-fonnte-api-key"

# Midtrans
MIDTRANS_SERVER_KEY="your-server-key"
MIDTRANS_CLIENT_KEY="your-client-key"
```

4. Setup database
```bash
# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed data
npm run prisma:seed
```

5. Run development server
```bash
npm run dev
```

Aplikasi akan berjalan di `http://localhost:3000`

## 🔑 Login Credentials (Demo)

Setelah seeding, gunakan kredensial berikut:

- **Super Admin**: `admin@rt.com` / `password123`
- **Ketua RT**: `ketua@rt.com` / `password123`
- **Bendahara**: `bendahara@rt.com` / `password123`
- **Warga 1**: `warga1@rt.com` / `password123`
- **Warga 2**: `warga2@rt.com` / `password123`
- **Warga 3**: `warga3@rt.com` / `password123`

## 📂 Struktur Folder

```
/app
├── api/              # API Routes
│   ├── auth/         # Authentication endpoints
│   ├── transactions/ # Keuangan endpoints
│   ├── payments/     # Pembayaran endpoints
│   ├── warga/        # Data warga endpoints
│   ├── surat/        # Penyuratan endpoints
│   ├── activities/   # Kegiatan endpoints
│   └── announcements/# Pengumuman endpoints
├── auth/
│   └── login/        # Login page
├── dashboard/        # Dashboard pages (protected)
│   ├── transactions/ # Halaman keuangan
│   ├── payments/     # Halaman pembayaran
│   ├── warga/        # Halaman data warga
│   ├── surat/        # Halaman penyuratan
│   ├── activities/   # Halaman kegiatan
│   ├── announcements/# Halaman pengumuman
│   ├── reports/      # Halaman laporan
│   └── settings/     # Halaman pengaturan
/components
├── ui/               # shadcn/ui components
└── dashboard/        # Dashboard components
/lib
├── prisma.ts         # Prisma client instance
└── auth.ts           # NextAuth configuration
/prisma
├── schema.prisma     # Database schema
└── seed.ts           # Database seeder
/utils
├── audit-log.ts      # Audit logging utilities
├── notification.ts   # Email & WhatsApp utilities
├── pdf-generator.ts  # PDF generation utilities
├── excel-generator.ts# Excel utilities
└── midtrans.ts       # Midtrans payment utilities
```

## 🗄 Database Schema

Database menggunakan PostgreSQL dengan Prisma ORM. Schema mencakup:

- **User**: Pengguna sistem dengan role-based access
- **Warga**: Data lengkap warga RT
- **Transaction**: Transaksi keuangan (pemasukan/pengeluaran)
- **Payment**: Tagihan dan pembayaran warga
- **Surat**: Pengajuan surat dan approval
- **Activity**: Kegiatan dan jadwal RT
- **Announcement**: Pengumuman dan informasi
- **AuditLog**: Log aktivitas sistem
- **Setting**: Konfigurasi aplikasi
- **Backup**: Log backup database

## 📱 Responsive Design

Aplikasi didesain mobile-first dengan breakpoints:
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

## 🔒 Security Best Practices

- Password hashing dengan bcrypt (10 rounds)
- JWT session dengan NextAuth
- RBAC middleware untuk setiap route
- SQL injection protection via Prisma
- XSS protection via React
- CSRF protection via NextAuth
- Environment variables untuk sensitive data

## 📊 API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register warga baru

### Transactions
- `GET /api/transactions` - List transaksi
- `POST /api/transactions` - Tambah transaksi
- `PUT /api/transactions/[id]` - Update transaksi
- `DELETE /api/transactions/[id]` - Hapus transaksi

### Payments
- `GET /api/payments` - List pembayaran
- `POST /api/payments` - Buat tagihan
- `PUT /api/payments/[id]` - Update status

### Warga
- `GET /api/warga` - List warga
- `POST /api/warga` - Tambah warga
- `PUT /api/warga/[id]` - Update warga

### Surat
- `GET /api/surat` - List pengajuan surat
- `POST /api/surat` - Ajukan surat
- `POST /api/surat/[id]/approve` - Approve surat
- `POST /api/surat/[id]/reject` - Reject surat

### Activities
- `GET /api/activities` - List kegiatan
- `POST /api/activities` - Tambah kegiatan
- `PUT /api/activities/[id]` - Update kegiatan

### Announcements
- `GET /api/announcements` - List pengumuman
- `POST /api/announcements` - Tambah pengumuman
- `PUT /api/announcements/[id]` - Update pengumuman

## 🚀 Deployment

### Vercel (Recommended)

1. Push code ke GitHub
2. Import project di Vercel
3. Set environment variables
4. Deploy

### Manual Deployment

```bash
# Build production
npm run build

# Start production server
npm start
```

## 📝 Scripts

```bash
npm run dev              # Development server
npm run build            # Production build
npm start                # Start production server
npm run lint             # Run ESLint
npm run typecheck        # TypeScript type checking

# Prisma
npm run prisma:generate  # Generate Prisma Client
npm run prisma:migrate   # Run migrations
npm run prisma:studio    # Open Prisma Studio
npm run prisma:seed      # Seed database
```

## 🐛 Known Issues & Limitations

- WhatsApp integration memerlukan API key dari provider (Fonnte/Wablas)
- Midtrans payment gateway dalam mode sandbox
- PDF generation menggunakan font default (bisa dikustomisasi)
- Backup database masih manual via script

## 🔮 Future Enhancements

- [ ] PWA support untuk install di mobile
- [ ] Push notifications
- [ ] Real-time updates dengan WebSocket
- [ ] Advanced reporting dengan grafik kompleks
- [ ] Multi-RT/RW support
- [ ] Mobile app (React Native)
- [ ] Attendance tracking untuk kegiatan
- [ ] Integration dengan e-KTP
- [ ] QR Code untuk absensi kegiatan
- [ ] Chat/Forum warga

## 🤝 Contributing

Pull requests are welcome! Untuk perubahan besar, silakan buka issue terlebih dahulu.

## 📄 License

MIT License

## 👨‍💻 Author

Sistem Informasi Manajemen RT - 2025

---

**Note**: Pastikan untuk mengganti semua environment variables dengan nilai production yang aman sebelum deployment!
# project_gigi
