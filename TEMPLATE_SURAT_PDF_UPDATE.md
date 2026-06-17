# Update Template PDF Surat Menyurat

## Ringkasan Perubahan
Telah ditambahkan template PDF yang lengkap dan professional untuk setiap jenis surat dengan format yang berbeda sesuai kategorinya.

## Template Surat yang Tersedia

### 1. **Surat Keterangan Domisili**
**Fungsi**: `generateSuratDomisili()`

**Field yang digunakan**:
- Nama, NIK, Tempat/Tanggal Lahir
- Jenis Kelamin, Kewarganegaraan
- Pekerjaan, Alamat lengkap (RT/RW)
- Keperluan surat

**Format**:
- Header resmi dengan kop surat
- Nomor surat otomatis
- Data pemohon dalam format tabel
- Keterangan domisili
- Tanda tangan Ketua RT

### 2. **Surat Pengantar**
**Fungsi**: `generateSuratPengantar()`

**Field yang digunakan**:
- Nama, NIK
- Tempat/Tanggal Lahir
- Pekerjaan, Alamat
- Keperluan/tujuan pengantar

**Format**:
- Header resmi
- Data pengurus RT
- Data pemohon
- Keperluan yang detail
- Tanda tangan

### 3. **Surat Keterangan Usaha** ✨ BARU
**Fungsi**: `generateSuratIzinUsaha()`

**Field yang digunakan**:
- Nama, NIK, Tempat/Tanggal Lahir
- Jenis Kelamin, Agama, Pekerjaan
- Alamat, No. Telepon
- **Jenis Usaha** (contoh: Toko Kelontong, Warung Makan)
- **Lokasi Usaha**

**Format**:
- Header resmi
- Data pemohon lengkap
- Detail usaha yang akan dibuka
- Tanda tangan Ketua RT

### 4. **Surat Keterangan Tidak Mampu (SKTM)** ✨ BARU
**Fungsi**: `generateSuratKeteranganTidakMampu()`

**Field yang digunakan**:
- **Data Pemohon**: Nama, Tempat/Tanggal Lahir, Jenis Kelamin, Status/Hubungan, Alamat
- **Data Orang Tua 1 (Bapak)**:
  - Nama Bapak
  - Umur
  - Pekerjaan
  - Alamat
- **Data Orang Tua 2 (Ibu)**:
  - Nama Ibu
  - Umur
  - Pekerjaan
- Keperluan (contoh: untuk berobat, sekolah, dll)

**Format**:
- Header resmi
- Data pemohon
- Data kedua orang tua/wali lengkap
- Keterangan kondisi ekonomi keluarga
- Tanda tangan Ketua RT

### 5. **Surat Lainnya**
**Fungsi**: `generateSuratLainnya()`

**Field yang digunakan**:
- Nama, NIK, Alamat
- Keperluan (deskripsi bebas)

**Format**:
- Header resmi dengan judul custom
- Data pemohon dasar
- Keperluan bebas
- Tanda tangan

## Format Umum Semua Surat

Semua template memiliki:
✅ **Header Professional** dengan kop surat
- Nama Pemerintah Kabupaten/Kota
- Kecamatan
- RT/RW
- Alamat lengkap
- Garis pemisah

✅ **Nomor Surat Otomatis**
- Format: `XXX/KODE-SURAT/TAHUN`
- Contoh: `123/SK-DOM/2024`

✅ **Footer dengan Tanda Tangan**
- Tempat dan tanggal otomatis
- Jabatan Ketua RT
- Ruang untuk tanda tangan

## Cara Penggunaan

### Untuk Warga (Pengajuan Surat)

1. Login ke sistem
2. Buka menu **Pengajuan Surat**
3. Klik **Ajukan Surat**
4. Pilih jenis surat yang diinginkan
5. Isi form sesuai jenis surat:

#### Surat Domisili/Pengantar:
- Judul Surat
- Keperluan
- Tempat/Tanggal Lahir

#### Surat Izin Usaha (tambahan):
- **Jenis Usaha** (apa usaha yang akan dibuka)
- **Nomor Telepon**

#### Surat Keterangan Tidak Mampu (tambahan):
- **Nama Bapak**, Umur, Pekerjaan
- **Nama Ibu**, Umur, Pekerjaan

6. Klik **Ajukan**
7. Tunggu persetujuan dari Ketua RT/Admin

### Untuk Admin/Ketua RT (Approval)

1. Login sebagai SUPER_ADMIN atau KETUA_RT
2. Buka menu **Manajemen Surat** / **Pengajuan Surat**
3. Lihat daftar surat dengan status **Menunggu**
4. Klik tombol **Setujui** pada surat yang akan disetujui
5. Sistem otomatis generate PDF sesuai template
6. PDF akan tersimpan dan siap diunduh
7. Warga dapat mengunduh surat yang sudah disetujui

## File yang Diubah

### 1. PDF Generator (`utils/pdf-generator.ts`)
- ✅ `generateSuratDomisili()` - diperbarui dengan template lengkap
- ✅ `generateSuratPengantar()` - diperbarui dengan template lengkap
- ✨ `generateSuratIzinUsaha()` - **BARU**
- ✨ `generateSuratKeteranganTidakMampu()` - **BARU**
- ✨ `generateSuratLainnya()` - **BARU**
- ✅ `addHeader()` - helper function untuk header
- ✅ `addFooter()` - helper function untuk footer

### 2. API Approve (`app/api/surat/[id]/approve/route.ts`)
- Update import statement untuk semua generator
- Update switch case untuk memilih template yang sesuai

### 3. Form Pengajuan Surat (`app/dashboard/surat/page.tsx`)
- Tambah field baru di state formData
- Conditional form fields berdasarkan jenis surat
- Field tambahan untuk Izin Usaha
- Field tambahan untuk SKTM (data orang tua)

## Contoh Output PDF

### Surat Keterangan Domisili
```
=====================================
PEMERINTAH KABUPATEN/KOTA
KECAMATAN [NAMA KECAMATAN]
RT/RW [NOMOR RT/RW]
Alamat: [Alamat RT Lengkap]
=====================================

SURAT KETERANGAN DOMISILI
Nomor: 123/SK-DOM/2024
_____________________________________

Yang bertanda tangan di bawah ini...

Nama              : Mardi Hartono
Tempat/Tgl Lahir  : Jakarta, 15 Januari 1990
Jenis Kelamin     : Laki-laki
...
```

### Surat Keterangan Usaha
```
SURAT KETERANGAN USAHA
Nomor: 456/SK-IU/2024

...
Jenis Usaha    : Toko Kelontong
Lokasi Usaha   : Jl. Raya No. 123
...
```

### Surat Keterangan Tidak Mampu
```
SURAT KETERANGAN TIDAK MAMPU
Nomor: 789/SKTM/2024

...
I.  Nama Bapak    : Ahmad Suryanto
    Umur          : 55 Tahun
    Pekerjaan     : Buruh Harian
    
II. Nama Ibu      : Siti Aminah
    Umur          : 50 Tahun
    Pekerjaan     : Ibu Rumah Tangga
...
```

## Customization

Jika ingin mengubah header/footer:

### Edit Header
Buka `utils/pdf-generator.ts` → function `addHeader()`:
```typescript
// Ubah teks header
doc.text('PEMERINTAH KABUPATEN BEKASI', 105, 15, { align: 'center' });
doc.text('KECAMATAN BEKASI TIMUR', 105, 22, { align: 'center' });
doc.text('RT 001 / RW 016', 105, 29, { align: 'center' });
```

### Edit Footer
Buka `utils/pdf-generator.ts` → function `addFooter()`:
```typescript
// Ubah tempat default
const tempat = data.kelurahan || 'Bekasi Timur';
```

## Testing

Checklist untuk testing:

✅ Generate Surat Domisili dengan data lengkap
✅ Generate Surat Pengantar
✅ Generate Surat Izin Usaha (dengan jenis usaha)
✅ Generate SKTM (dengan data orang tua)
✅ Generate Surat Lainnya
✅ Download PDF yang sudah di-approve
✅ Verifikasi format PDF sesuai template
✅ Test dengan data yang minimal/optional fields kosong

## Roadmap Future Enhancement

- [ ] Upload logo RT untuk header
- [ ] Customize font dan style per RT
- [ ] Digital signature/stempel
- [ ] QR Code untuk validasi surat
- [ ] Multi-bahasa (Indonesia & Inggris)
- [ ] Template builder UI untuk admin
- [ ] Preview PDF sebelum approve
- [ ] Watermark "Draft" untuk surat belum approve
- [ ] Email notifikasi dengan attachment PDF
- [ ] Archive/history semua surat yang pernah di-generate
