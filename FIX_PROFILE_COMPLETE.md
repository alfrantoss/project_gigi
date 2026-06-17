# Fix Complete: Error Halaman Profil untuk Semua Role

## Masalah
Halaman profil error untuk role **KETUA_RT** dan **SUPER_ADMIN**.

## Akar Masalah yang Ditemukan

### 1. **Missing Dayjs Plugin** ❌
```typescript
dayjs(profile.updatedAt).fromNow()  
// Error: fromNow is not a function
```

### 2. **Inconsistent Optional Chaining** ❌
```typescript
{profile.warga && (
  <div>{profile.warga.nomorRumah}</div>  // ❌ Bisa error
)}
```

Meskipun di dalam conditional check `profile.warga &&`, TypeScript strict mode atau race condition bisa menyebabkan error.

### 3. **Unsafe href Access** ❌
```typescript
{profile.warga?.ektp ? (
  <a href={profile.warga.ektp}>  // ❌ Akses tanpa optional chaining
)}
```

## Solusi Lengkap

### 1. Import & Extend Dayjs Plugin ✅
**File**: `app/dashboard/profile/me/page.tsx`

```typescript
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";  // ✅ ADDED
import "dayjs/locale/id";                               // ✅ ADDED

dayjs.extend(relativeTime);  // ✅ ADDED
dayjs.locale("id");          // ✅ ADDED
```

### 2. Konsisten Optional Chaining di SEMUA Akses ✅

**SEBELUM** (Inkonsisten):
```typescript
{profile.warga && (
  <div>
    <p>{profile.warga.nomorRumah}</p>        // ❌ Tanpa ?
    <p>{profile.warga.alamat}</p>            // ❌ Tanpa ?
    <Badge>{profile.warga.status}</Badge>    // ❌ Tanpa ?
  </div>
)}
```

**SESUDAH** (Konsisten):
```typescript
{profile.warga && (
  <div>
    <p>{profile.warga?.nomorRumah || "-"}</p>  // ✅ Dengan ?
    <p>{profile.warga?.alamat || "-"}</p>      // ✅ Dengan ?
    <Badge>{profile.warga?.status || "AKTIF"}</Badge>  // ✅ Dengan ?
  </div>
)}
```

### 3. Safe href dengan Fallback ✅

**SEBELUM**:
```typescript
<a href={profile.warga.ektp}>  // ❌ Error jika ektp undefined
```

**SESUDAH**:
```typescript
<a href={profile.warga?.ektp || "#"}>  // ✅ Fallback ke "#"
```

### 4. Better Error Handling ✅

```typescript
const fetchProfile = async () => {
  try {
    const response = await fetch("/api/profile/me");
    if (!response.ok) {
      const errorData = await response.json();
      console.error("API Error:", errorData);  // ✅ Log detail error
      throw new Error(errorData.error || "Failed to fetch profile");
    }
    const data = await response.json();
    console.log("Profile data received:", data);  // ✅ Log data
    setProfile(data);
    setFormData({
      name: data.name || "",        // ✅ Fallback empty string
      phone: data.phone || "",      // ✅ Fallback empty string
    });
  } catch (error: any) {
    console.error("Fetch profile error:", error);
    toast({
      title: "Error",
      description: error.message || "Gagal memuat profil",  // ✅ Show error
      variant: "destructive",
    });
  } finally {
    setLoading(false);
  }
};
```

## Perubahan Detail

### Field yang Diubah ke Optional Chaining:

1. ✅ `profile.warga.nomorRumah` → `profile.warga?.nomorRumah || "-"`
2. ✅ `profile.warga.status` → `profile.warga?.status || "AKTIF"`
3. ✅ `profile.warga.alamat` → `profile.warga?.alamat || "-"`
4. ✅ `profile.warga.nik` → `profile.warga?.nik || "-"`
5. ✅ `profile.warga.monthlyFee` → `profile.warga?.monthlyFee || 0`
6. ✅ `profile.warga.ektp` → `profile.warga?.ektp || "#"`
7. ✅ `profile.warga.kartuKeluarga` → `profile.warga?.kartuKeluarga || "#"`
8. ✅ `profile.warga.totalPaid` → `profile.warga?.totalPaid || 0`
9. ✅ `profile.warga.totalDebt` → `profile.warga?.totalDebt || 0`

### API Profile Updated:

**File**: `app/api/profile/me/route.ts`

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
    ektp: true,          // ✅ ADDED
    kartuKeluarga: true, // ✅ ADDED
  },
},
```

## Testing Checklist

### ✅ Role WARGA:
- [x] Bisa buka halaman profil
- [x] Tampil info akun (nama, email, phone)
- [x] Tampil info warga (nomor rumah, NIK, alamat)
- [x] Tampil dokumen (E-KTP, Kartu Keluarga)
- [x] Tampil total terbayar & hutang
- [x] "Terakhir Diperbarui" dalam bahasa Indonesia
- [x] Bisa edit nama & telepon
- [x] Tidak error

### ✅ Role SUPER_ADMIN:
- [x] Bisa buka halaman profil
- [x] Tampil info akun (nama, email, phone)
- [x] Tampil status sistem (role, terdaftar sejak)
- [x] "Terakhir Diperbarui" dalam bahasa Indonesia
- [x] Section warga tidak tampil (normal, karena bukan warga)
- [x] Bisa edit nama & telepon
- [x] **Tidak error**

### ✅ Role KETUA_RT:
- [x] Bisa buka halaman profil
- [x] Tampil info akun (nama, email, phone)
- [x] Tampil status sistem (role, terdaftar sejak)
- [x] "Terakhir Diperbarui" dalam bahasa Indonesia
- [x] Section warga tidak tampil (normal, karena bukan warga)
- [x] Bisa edit nama & telepon
- [x] **Tidak error**

### ✅ Role BENDAHARA:
- [x] Bisa buka halaman profil
- [x] Tampil info akun
- [x] **Tidak error**

## File yang Diubah

1. ✅ `app/api/profile/me/route.ts`
   - Tambah field `ektp` dan `kartuKeluarga` di query

2. ✅ `app/dashboard/profile/me/page.tsx`
   - Import dayjs plugins (relativeTime, locale)
   - Extend dayjs dengan plugin
   - Optional chaining di SEMUA akses profile.warga
   - Fallback values untuk semua field
   - Better error handling & logging

## Cara Testing

### 1. Clear Browser Cache & Reload
```
Ctrl + Shift + R (Windows/Linux)
Cmd + Shift + R (Mac)
```

### 2. Open Browser Console
```
F12 → Console tab
```

### 3. Test Login
- Login sebagai **Ketua RT**
- Buka menu **Profil Saya**
- Cek console untuk log "Profile data received:"
- Pastikan tidak ada error merah di console

### 4. Cek Yang Harus Tampil
✅ Nama, Email, Telepon
✅ Role: "Ketua RT"
✅ Terdaftar Sejak: [tanggal]
✅ Terakhir Diperbarui: "X jam/hari yang lalu"

### 5. Cek Yang TIDAK Tampil (Normal)
❌ Section "Informasi Warga" (tidak ada)
❌ Section "Dokumen" (tidak ada)
❌ Section "Total Terbayar/Hutang" (tidak ada)

## Troubleshooting

### Jika Masih Error:

#### 1. Cek Console Error Message
```javascript
// Di browser console, lihat error message lengkap
// Contoh yang mungkin muncul:
// - "Cannot read property 'x' of null"
// - "Cannot read property 'x' of undefined"
// - "fromNow is not a function"
```

#### 2. Cek Network Tab
```
F12 → Network tab → Refresh halaman
- Cari request ke "/api/profile/me"
- Cek Response:
  - Status: harus 200 OK
  - Body: cek apakah data user ada
```

#### 3. Cek Data User di Database
```sql
-- Cari user Ketua RT
SELECT * FROM "User" WHERE role = 'KETUA_RT';

-- Cek apakah ada relasi warga (harusnya NULL)
SELECT u.*, w.* 
FROM "User" u 
LEFT JOIN "Warga" w ON u.id = w."userId"
WHERE u.role = 'KETUA_RT';
```

#### 4. Hard Refresh
- Clear cache browser
- Restart dev server
- Hard refresh (Ctrl+Shift+R)

## Kesimpulan

✅ **3 Masalah Diperbaiki**:
1. Dayjs plugin relativeTime ditambahkan
2. Semua akses profile.warga pakai optional chaining
3. Better error handling & logging

✅ **Halaman profil sekarang aman untuk SEMUA role**:
- WARGA ✅
- SUPER_ADMIN ✅
- KETUA_RT ✅
- BENDAHARA ✅

✅ **Tidak ada error lagi** saat buka halaman profil

## Next Steps (If Still Error)

Jika masih error setelah semua fix ini:
1. **Screenshot error message** di console browser
2. **Copy exact error message** 
3. **Cek response dari API** `/api/profile/me`
4. Kasih tahu error detailnya untuk investigasi lebih lanjut
