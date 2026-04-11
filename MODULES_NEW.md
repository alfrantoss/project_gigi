# Modul Terbaru - Reports, Settings, & Profile

## 1. 📊 Modul Laporan (Reports)

**Path:** `/dashboard/reports`  
**Akses:** SUPER_ADMIN, KETUA_RT, BENDAHARA

### Fitur:

- 📈 Dashboard analytics dengan visual cards (6+ KPI)
- 📅 Date range picker untuk filter laporan custom
- 📊 Chart visualisasi:
  - Tren pembayaran bulanan (Line Chart)
  - Perbandingan pemasukan vs pengeluaran (Bar Chart)
- 📋 Tabel daftar debitur terbesar (Top 5)
- 💰 Ringkasan keuangan:
  - Koleksi pembayaran (%)
  - Tagihan tertunda
  - Tagihan terlambat
  - Total pemasukan & pengeluaran
  - Saldo bersih

### Endpoint API:

```
GET /api/reports/summary?startDate=2025-01-01&endDate=2025-01-31
```

## 2. ⚙️ Modul Pengaturan (Settings)

**Path:** `/dashboard/settings`  
**Akses:** SUPER_ADMIN only

### Tab 1: Pengaturan Aplikasi

- ➕ Tambah setting baru (key-value pair)
- 📝 Edit setting yang sudah ada
- 💾 Simpan perubahan otomatis
- Contoh setting:
  - IURAN_BULANAN: 50000
  - SMTP_HOST: mail.example.com
  - API_KEY_MIDTRANS: [key]

### Tab 2: Manajemen Pengguna

- 👥 Daftar semua user di sistem
- 🔐 Ubah role user (SUPER_ADMIN, KETUA_RT, BENDAHARA, WARGA)
- ✅ Aktifkan/Nonaktifkan akun user
- 📊 Tampilkan status dan info user

### Endpoint API:

```
GET /api/settings (fetch all settings & users)
POST /api/settings (create/update setting)
PUT /api/settings/users/[id] (update user role & status)
```

## 3. 👤 Modul Profil (Profile)

**Path:** `/dashboard/profile/me`  
**Akses:** Semua user authenticated

### Fitur:

- 📋 Informasi akun:
  - Nama, Email, Phone
  - Role, Status terdaftar, Last update
- ✏️ Edit profile (nama & phone)
- 👥 Informasi warga (jika user adalah warga):
  - Nomor rumah, alamat, NIK
  - Status warga, iuran bulanan
  - Total terbayar & total hutang
- 🎯 Quick stats (untuk warga)

### Endpoint API:

```
GET /api/profile/me (fetch user profile)
PUT /api/profile/me (update user profile - name & phone)
```

## Integrasi Navigation

### Sidebar Menu (Updated):

- SUPER_ADMIN: Laporan ✓, Pengaturan ✓ (sudah ada)
- KETUA_RT: Laporan ✓ (sudah ada)
- BENDAHARA: Laporan ✓ (sudah ada)

### Header Dropdown Menu (Updated):

- "Profil Saya" → `/dashboard/profile/me` ✓
- "Pengaturan" → `/dashboard/settings` ✓
- "Logout" button ✓

## Development Notes

### Files Created:

1. `/app/api/reports/summary/route.ts` - Reports API
2. `/app/dashboard/reports/page.tsx` - Reports UI dengan Chart.js
3. `/app/api/settings/route.ts` - Settings API
4. `/app/api/settings/users/[id]/route.ts` - User management API
5. `/app/dashboard/settings/page.tsx` - Settings UI dengan tabs
6. `/app/api/profile/me/route.ts` - Profile API
7. `/app/dashboard/profile/me/page.tsx` - Profile UI

### Updated Files:

1. `/components/dashboard/header.tsx` - Add links & logout

### Dependencies:

- chart.js (untuk charts)
- react-chartjs-2 (untuk React component wrapper)
- dayjs (sudah ada)
- React Hook Form / Zod (sudah ada)

### Permission Model:

- Reports: Role-based access (admin only)
- Settings: Super Admin only
- Profile: Self-service untuk semua user

## Testing Checklist:

- [ ] Visit `/dashboard/reports` - lihat analytics dashboard
- [ ] Filter by date range - refresh data
- [ ] Visit `/dashboard/settings` - SUPER_ADMIN only
- [ ] Try update setting - verify save
- [ ] Try change user role - verify audit log
- [ ] Visit `/dashboard/profile/me` - see personal profile
- [ ] Click "Edit" - update name/phone
- [ ] Verify header dropdown links work

## Next Steps:

- Install chart.js & react-chartjs-2 if needed
- Add email notification settings
- Add backup/restore functionality
- Add audit log viewer
- Add advanced reporting (PDF export)
