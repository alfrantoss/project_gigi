# Fix: Error Halaman Profil untuk Super Admin & Ketua RT

## Masalah
Halaman profil error saat dibuka oleh user dengan role **SUPER_ADMIN** atau **KETUA_RT**.

## Penyebab
1. Super Admin dan Ketua RT **tidak memiliki data warga** (relasi `warga` adalah `null`)
2. Code halaman profil mencoba mengakses `profile.warga.ektp` tanpa cek null terlebih dahulu
3. Mengakses property dari `null` menyebabkan error

## Solusi

### 1. Update API Profile (`app/api/profile/me/route.ts`)
Menambahkan field `ektp` dan `kartuKeluarga` ke query:

```typescript
warga: {
  select: {
    id: true,
    nomorRumah: true,
    alamat: true,
    nik: true,
    status: true,
    monthlyFee: true,
    totalPaid: true,
    totalDebt: true,
    ektp: true,          // ✅ DITAMBAHKAN
    kartuKeluarga: true, // ✅ DITAMBAHKAN
  },
},
```

### 2. Update Halaman Profil (`app/dashboard/profile/me/page.tsx`)
Menggunakan **optional chaining** (`?.`) untuk mengakses dokumen:

**SEBELUM** (Error):
```typescript
{profile.warga.ektp ? (  // ❌ Error jika warga null
  <a href={profile.warga.ektp}>...</a>
) : (
  <p>Belum diunggah</p>
)}
```

**SESUDAH** (Fixed):
```typescript
{profile.warga?.ektp ? (  // ✅ Safe dengan optional chaining
  <a href={profile.warga.ektp}>...</a>
) : (
  <p>Belum diunggah</p>
)}
```

## Penjelasan Optional Chaining

### Tanpa Optional Chaining:
```typescript
profile.warga.ektp
// Error jika warga = null
// "Cannot read property 'ektp' of null"
```

### Dengan Optional Chaining:
```typescript
profile.warga?.ektp
// Jika warga = null, hasilnya undefined (tidak error)
// Jika warga ada, ambil ektp
```

## Behavior Setelah Fix

### Untuk Role WARGA:
- ✅ Tetap bisa lihat informasi warga
- ✅ Tetap bisa lihat dokumen (E-KTP, KK)
- ✅ Tetap bisa lihat total terbayar & hutang

### Untuk Role SUPER_ADMIN & KETUA_RT:
- ✅ Bisa buka halaman profil tanpa error
- ✅ Lihat informasi akun (nama, email, phone, role)
- ✅ Section "Informasi Warga" tidak muncul (karena memang bukan warga)
- ✅ Section "Dokumen" tidak muncul (karena memang bukan warga)
- ✅ Section "Total Terbayar/Hutang" tidak muncul (karena bukan warga)

## Testing

### Test untuk WARGA:
1. Login sebagai warga
2. Buka menu **Profil Saya**
3. ✅ Harus tampil: Info Akun + Info Warga + Dokumen + Stats
4. ✅ Dokumen E-KTP & KK tampil (jika sudah upload)

### Test untuk SUPER_ADMIN:
1. Login sebagai super admin
2. Buka menu **Profil Saya**
3. ✅ Harus tampil: Info Akun + Status Sistem
4. ✅ Tidak error
5. ✅ Section warga/dokumen tidak tampil (normal)

### Test untuk KETUA_RT:
1. Login sebagai ketua RT
2. Buka menu **Profil Saya**
3. ✅ Harus tampil: Info Akun + Status Sistem
4. ✅ Tidak error
5. ✅ Section warga/dokumen tidak tampil (normal)

## File yang Diubah

1. ✅ `app/api/profile/me/route.ts` - Tambah field ektp & kartuKeluarga
2. ✅ `app/dashboard/profile/me/page.tsx` - Optional chaining untuk dokumen

## Catatan Penting

### Struktur User di Database:

```
User (semua role)
├── id, name, email, phone, role
└── warga (relasi optional)
    ├── nik, alamat, nomorRumah
    ├── ektp, kartuKeluarga
    └── totalPaid, totalDebt
```

**WARGA**: User yang punya relasi `warga`
**SUPER_ADMIN/KETUA_RT**: User tanpa relasi `warga`

### Best Practice:

Selalu gunakan optional chaining saat mengakses nested properties yang bisa null:

```typescript
// ✅ GOOD
profile.warga?.ektp
profile.warga?.kartuKeluarga
profile.warga?.totalPaid

// ❌ BAD
profile.warga.ektp  // Error jika warga = null
```

## Kesimpulan

✅ Halaman profil sekarang aman untuk semua role
✅ Tidak ada error saat super admin/ketua RT buka profil
✅ Section dokumen hanya muncul untuk role WARGA
✅ Tetap bisa edit nama & telepon untuk semua role
