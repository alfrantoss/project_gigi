# Update: Logo di PDF Surat

## Ringkasan
Logo yang sama dengan yang ada di sidebar kini muncul di semua PDF surat yang di-generate.

## Perubahan

### File: `utils/pdf-generator.ts`

**Fungsi Baru:**
```typescript
function getLogoBase64()
```
- Membaca file logo dari `public/logo.png`
- Konversi ke base64 untuk embed di PDF
- Handle error jika logo tidak ditemukan

**Update Fungsi:**
```typescript
function addHeader()
```
- Tambahkan logo di **kiri atas** (posisi: x=15, y=10, size=20x20)
- Tambahkan logo di **kanan atas** (posisi: x=175, y=10, size=20x20)
- Logo muncul di kedua sisi untuk tampilan resmi

## Layout Header PDF

```
┌─────────────────────────────────────────────────────┐
│  [LOGO]        PEMERINTAH KABUPATEN/KOTA      [LOGO]│
│                KECAMATAN [NAMA]                      │
│                RT/RW [NOMOR]                         │
│                Alamat: [Alamat RT]                   │
│─────────────────────────────────────────────────────│
```

## Fitur

✅ Logo otomatis diambil dari `public/logo.png`
✅ Logo muncul di **kiri dan kanan** header
✅ Logo di-embed sebagai base64 (tidak perlu file eksternal)
✅ Error handling jika logo tidak ditemukan
✅ Ukuran logo: 20x20mm (proporsional untuk A4)
✅ Berlaku untuk **semua jenis surat**:
   - Surat Keterangan Domisili
   - Surat Pengantar
   - Surat Keterangan Usaha
   - Surat Keterangan Tidak Mampu
   - Surat Lainnya

## Import Baru

Ditambahkan import untuk file system:
```typescript
import fs from 'fs';
import path from 'path';
```

## Testing

Untuk memastikan logo muncul:

1. **Generate surat baru**:
   - Ajukan surat sebagai warga
   - Approve sebagai admin
   - Download PDF

2. **Cek PDF**:
   - Buka PDF yang didownload
   - Logo harus muncul di kiri dan kanan atas
   - Logo harus proporsional (tidak terdistorsi)

3. **Test tanpa logo** (opsional):
   - Rename/hapus `public/logo.png`
   - Generate surat
   - Surat tetap ter-generate (logo tidak muncul tapi tidak error)

## Customization

### Ubah Posisi Logo

Edit file `utils/pdf-generator.ts` → function `addHeader()`:

```typescript
// Logo kiri
doc.addImage(logo, 'PNG', 15, 10, 20, 20);
//                         ^^  ^^  ^^  ^^
//                         x   y   w   h

// Logo kanan
doc.addImage(logo, 'PNG', 175, 10, 20, 20);
```

### Ubah Ukuran Logo

```typescript
// Ukuran lebih besar (30x30mm)
doc.addImage(logo, 'PNG', 15, 10, 30, 30);

// Ukuran lebih kecil (15x15mm)
doc.addImage(logo, 'PNG', 15, 10, 15, 15);
```

### Hanya Logo di Kiri (Hapus Logo Kanan)

Hapus/comment bagian ini:
```typescript
// Optional: Add logo on right side too (mirror)
if (logo) {
  try {
    doc.addImage(logo, 'PNG', 175, 10, 20, 20);
  } catch (error) {
    console.error('Error adding right logo to PDF:', error);
  }
}
```

### Ganti Logo

Cukup replace file `public/logo.png` dengan logo baru Anda.

**Rekomendasi**:
- Format: PNG dengan background transparan
- Ukuran: 500x500px atau lebih
- File size: < 500KB

## Notes

- Logo di-convert ke base64 saat runtime
- Tidak perlu konfigurasi tambahan
- Logo yang sama dengan di sidebar/login
- PDF tetap berfungsi meski logo tidak ada
- Logo tidak di-cache (selalu ambil yang terbaru)

## Troubleshooting

### Logo tidak muncul di PDF:

1. **Cek file logo ada**:
   ```bash
   ls public/logo.png
   ```

2. **Cek format logo**:
   - Harus PNG (bukan JPG/SVG)
   - Jika JPG, ubah parameter: `'PNG'` → `'JPEG'`

3. **Cek permission folder**:
   - Folder `public/` harus readable

4. **Cek console log**:
   - Lihat error di terminal server
   - Cari pesan: "Error loading logo" atau "Error adding logo"

### Logo terdistorsi:

- Pastikan ukuran width dan height sama (square): `20, 20`
- Atau sesuaikan dengan aspek ratio logo Anda

### Logo terlalu besar/kecil:

- Ubah parameter size di `addImage()`:
  - Lebih besar: `30, 30`
  - Lebih kecil: `15, 15`

## Future Enhancement

- [ ] Support multiple logo format (PNG, JPG, SVG)
- [ ] Configurable logo position (kiri/kanan/tengah/both)
- [ ] Configurable logo size via settings
- [ ] Logo preview di form pengajuan surat
- [ ] Upload custom logo per RT via admin panel
- [ ] Logo cache untuk performance
