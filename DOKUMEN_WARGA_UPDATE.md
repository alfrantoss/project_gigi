# Update Fitur Dokumen Warga

## Ringkasan Perubahan
Telah ditambahkan fitur upload dan penyimpanan dokumen E-KTP dan Kartu Keluarga untuk setiap warga.

## Perubahan yang Dilakukan

### 1. Database Schema (Prisma)
**File**: `prisma/schema.prisma`

Ditambahkan 2 field baru pada model `Warga`:
```prisma
model Warga {
  // ... field lainnya
  
  // Dokumen
  ektp            String?
  kartuKeluarga   String?
  
  // ... field lainnya
}
```

**Migration**: `20260617003125_add_ektp_kartu_keluarga_to_warga`

### 2. API Endpoint Baru

#### Upload File API
**File**: `app/api/upload/route.ts`

Endpoint untuk upload dokumen warga:
- **Method**: POST
- **URL**: `/api/upload`
- **Body**: FormData dengan field:
  - `file`: File dokumen (JPG, PNG, atau PDF)
  - `type`: Tipe dokumen (`ektp` atau `kartu_keluarga`)
- **Validasi**:
  - Format file: JPG, PNG, PDF
  - Ukuran maksimal: 5MB
- **Response**: 
  ```json
  {
    "success": true,
    "url": "/uploads/dokumen-warga/filename.ext",
    "filename": "filename.ext"
  }
  ```

### 3. Update API Warga

#### API POST `/api/warga`
Ditambahkan parameter:
- `ektp` (optional): URL dokumen E-KTP
- `kartuKeluarga` (optional): URL dokumen Kartu Keluarga

#### API PUT `/api/warga/[id]`
Ditambahkan parameter:
- `ektp` (optional): URL dokumen E-KTP
- `kartuKeluarga` (optional): URL dokumen Kartu Keluarga

### 4. Update Halaman Frontend

#### Halaman Tambah Warga
**File**: `app/dashboard/warga/tambah/page.tsx`

Ditambahkan section "Dokumen" dengan:
- Upload field untuk E-KTP
- Upload field untuk Kartu Keluarga
- Preview file yang sudah diupload
- Tombol hapus file

#### Halaman Edit Warga
**File**: `app/dashboard/warga/edit/[id]/page.tsx`

Ditambahkan card "Dokumen" dengan:
- Upload field untuk E-KTP
- Upload field untuk Kartu Keluarga
- Preview file yang sudah diupload
- Tombol hapus file
- Link untuk melihat dokumen yang sudah ada

#### Halaman Profil Warga
**File**: `app/dashboard/profile/me/page.tsx`

Ditambahkan card "Dokumen" yang menampilkan:
- Status dokumen E-KTP (sudah diupload / belum)
- Status dokumen Kartu Keluarga (sudah diupload / belum)
- Link untuk melihat dokumen
- Informasi untuk menghubungi admin jika ingin mengubah dokumen

## Fitur-fitur

### Upload Dokumen
1. **Format yang didukung**: JPG, PNG, PDF
2. **Ukuran maksimal**: 5MB per file
3. **Validasi otomatis**: Sistem akan menolak file yang tidak sesuai format atau melebihi ukuran
4. **Preview**: File yang sudah diupload dapat dilihat langsung
5. **Hapus file**: File yang sudah diupload dapat dihapus sebelum menyimpan data

### Penyimpanan File
- File disimpan di folder: `public/uploads/dokumen-warga/`
- Nama file: `{type}-{timestamp}-{original-filename}`
- Contoh: `ektp-1718585525123-dokumen.pdf`

### Keamanan
- Hanya user yang sudah login yang bisa upload
- Validasi tipe file di backend
- Validasi ukuran file di backend
- File disimpan dengan nama yang di-sanitize

## Cara Menggunakan

### Untuk Admin/Ketua RT (Tambah/Edit Warga)

1. Buka halaman **Data Warga** → **Tambah Warga** atau **Edit Warga**
2. Scroll ke section **Dokumen**
3. Klik tombol **Browse** atau **Choose File** pada field yang diinginkan
4. Pilih file E-KTP atau Kartu Keluarga (JPG/PNG/PDF, max 5MB)
5. File akan otomatis diupload
6. Jika ingin menghapus, klik tombol **X** merah
7. Klik **Simpan** untuk menyimpan semua data warga

### Untuk Warga (Lihat Dokumen)

1. Buka halaman **Profil Saya**
2. Scroll ke bagian **Dokumen**
3. Klik **Lihat Dokumen** untuk membuka file di tab baru
4. Jika dokumen belum diupload, akan muncul status "Belum diunggah"
5. Untuk mengubah/upload dokumen, hubungi admin RT

## Testing

Setelah perubahan ini, pastikan untuk test:

1. ✅ Upload E-KTP saat tambah warga baru
2. ✅ Upload Kartu Keluarga saat tambah warga baru
3. ✅ Upload dokumen saat edit warga
4. ✅ Hapus dokumen yang sudah diupload
5. ✅ Lihat dokumen di halaman profil warga
6. ✅ Validasi format file (coba upload file non-JPG/PNG/PDF)
7. ✅ Validasi ukuran file (coba upload file > 5MB)
8. ✅ Download/view dokumen dari link

## Catatan Teknis

- Migration database sudah dijalankan
- Prisma client akan ter-regenerate otomatis saat restart dev server
- Folder `public/uploads/dokumen-warga/` akan dibuat otomatis saat upload pertama kali
- Field dokumen bersifat optional, warga bisa dibuat tanpa dokumen

## Roadmap Future Enhancement

Beberapa improvement yang bisa dilakukan di masa depan:
- [ ] Compress image otomatis sebelum upload
- [ ] Generate thumbnail untuk preview
- [ ] Watermark otomatis pada dokumen
- [ ] Enkripsi file untuk keamanan tambahan
- [ ] Batch upload multiple dokumen
- [ ] History perubahan dokumen
- [ ] Notifikasi reminder untuk warga yang belum upload dokumen
