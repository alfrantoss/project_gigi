# Fix: Error dayjs.fromNow() di Halaman Profil

## Masalah
Halaman profil error dengan pesan:
```
dayjs(...).fromNow is not a function
```

## Penyebab
Method `.fromNow()` dari dayjs memerlukan **plugin relativeTime** yang belum di-import dan di-extend.

## Solusi

### File: `app/dashboard/profile/me/page.tsx`

**SEBELUM** (Error):
```typescript
import dayjs from "dayjs";

// ... di component
{dayjs(profile.updatedAt).fromNow()}  // ❌ ERROR: fromNow is not a function
```

**SESUDAH** (Fixed):
```typescript
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";  // ✅ IMPORT PLUGIN
import "dayjs/locale/id";

dayjs.extend(relativeTime);  // ✅ EXTEND PLUGIN
dayjs.locale("id");          // ✅ SET LOCALE INDONESIA

// ... di component
{dayjs(profile.updatedAt).fromNow()}  // ✅ WORKS: "2 jam yang lalu"
```

## Penjelasan

### Dayjs Plugins
Dayjs menggunakan sistem plugin untuk menjaga library tetap ringan. Method tertentu seperti:
- `.fromNow()` → butuh plugin `relativeTime`
- `.format('dddd')` untuk hari → butuh locale
- `.isBetween()` → butuh plugin `isBetween`
- dll.

### relativeTime Plugin
Plugin ini mengubah date menjadi format relatif:
```typescript
dayjs().fromNow()                    // "beberapa detik yang lalu"
dayjs().subtract(1, 'day').fromNow() // "sehari yang lalu"  
dayjs().subtract(2, 'hour').fromNow() // "2 jam yang lalu"
```

### Locale Indonesia
Dengan locale "id", output menjadi bahasa Indonesia:
```typescript
// Tanpa locale
"2 hours ago"

// Dengan locale "id"  
"2 jam yang lalu"
```

## File yang Diubah

✅ `app/dashboard/profile/me/page.tsx`
- Import `relativeTime` plugin
- Import locale Indonesia
- Extend plugin dengan `dayjs.extend()`
- Set locale dengan `dayjs.locale()`

## Testing

### Test Semua Role:

#### 1. **Role WARGA**:
```
✅ Login sebagai warga
✅ Buka "Profil Saya"
✅ Harus tampil: "Terakhir Diperbarui: X jam/hari yang lalu"
✅ Format dalam bahasa Indonesia
✅ Tidak error
```

#### 2. **Role SUPER_ADMIN**:
```
✅ Login sebagai super admin
✅ Buka "Profil Saya"  
✅ Harus tampil: "Terakhir Diperbarui: X jam/hari yang lalu"
✅ Format dalam bahasa Indonesia
✅ Tidak error
```

#### 3. **Role KETUA_RT**:
```
✅ Login sebagai ketua RT
✅ Buka "Profil Saya"
✅ Harus tampil: "Terakhir Diperbarui: X jam/hari yang lalu"
✅ Format dalam bahasa Indonesia
✅ Tidak error
```

## Contoh Output

### Terakhir Diperbarui:
- Baru saja: "beberapa detik yang lalu"
- 5 menit lalu: "5 menit yang lalu"
- 2 jam lalu: "2 jam yang lalu"
- Kemarin: "sehari yang lalu"
- 3 hari lalu: "3 hari yang lalu"
- 1 minggu lalu: "7 hari yang lalu"

## Dayjs Plugins Lain yang Sering Digunakan

Jika di masa depan butuh plugin lain:

```typescript
// Duration
import duration from "dayjs/plugin/duration";
dayjs.extend(duration);

// Is Between
import isBetween from "dayjs/plugin/isBetween";
dayjs.extend(isBetween);

// Custom Parse Format
import customParseFormat from "dayjs/plugin/customParseFormat";
dayjs.extend(customParseFormat);

// UTC
import utc from "dayjs/plugin/utc";
dayjs.extend(utc);
```

## Related Fixes

Perubahan ini juga terkait dengan fix sebelumnya:
1. ✅ Optional chaining untuk dokumen warga
2. ✅ Field ektp & kartuKeluarga di API
3. ✅ **Dayjs relativeTime plugin** (fix ini)

## Kesimpulan

✅ Error `.fromNow()` sudah diperbaiki
✅ Plugin relativeTime sudah di-extend
✅ Locale Indonesia sudah diset
✅ Halaman profil bisa dibuka semua role tanpa error
✅ Format "Terakhir Diperbarui" tampil dalam bahasa Indonesia

## Restart Required?

**TIDAK** - Next.js auto-reload setelah file disimpan. Cukup:
1. Refresh browser (F5)
2. Atau reload halaman profil
3. Error harusnya hilang
