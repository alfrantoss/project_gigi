# API Documentation

Base URL: `http://localhost:3000/api` (Development)

## Authentication

Semua endpoint (kecuali `/auth/*`) memerlukan authentication menggunakan NextAuth session cookie.

### Login
```http
POST /api/auth/callback/credentials
Content-Type: application/json

{
  "email": "admin@rt.com",
  "password": "password123"
}
```

### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "warga@example.com",
  "password": "password",
  "name": "Nama Lengkap",
  "phone": "081234567890",
  "role": "WARGA",
  "wargaData": {
    "nik": "3201012345670001",
    "nomorRumah": "10",
    "alamat": "Jl. Mawar No. 10",
    "rt": "001",
    "rw": "001",
    "kelurahan": "Sukamaju",
    "kecamatan": "Cibeunying",
    "statusPerkawinan": "Kawin",
    "pekerjaan": "Karyawan Swasta",
    "monthlyFee": 50000
  }
}
```

**Response:**
```json
{
  "message": "Registrasi berhasil",
  "user": {
    "id": "clxxx",
    "email": "warga@example.com",
    "name": "Nama Lengkap",
    "role": "WARGA"
  }
}
```

---

## Transactions (Keuangan)

### Get All Transactions
```http
GET /api/transactions?type=PEMASUKAN&startDate=2025-01-01&endDate=2025-12-31&page=1&limit=50
```

**Query Parameters:**
- `type` (optional): `PEMASUKAN` | `PENGELUARAN`
- `category` (optional): Filter by category
- `startDate` (optional): Start date (YYYY-MM-DD)
- `endDate` (optional): End date (YYYY-MM-DD)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50)

**Response:**
```json
{
  "transactions": [
    {
      "id": "clxxx",
      "type": "PEMASUKAN",
      "category": "Iuran Bulanan",
      "description": "Iuran kas bulan Januari 2025",
      "amount": 450000,
      "date": "2025-01-10T00:00:00.000Z",
      "createdBy": "clxxx",
      "user": {
        "name": "Bendahara RT",
        "email": "bendahara@rt.com"
      },
      "createdAt": "2025-01-10T10:00:00.000Z"
    }
  ],
  "total": 50,
  "page": 1,
  "totalPages": 5,
  "summary": {
    "totalPemasukan": 2000000,
    "totalPengeluaran": 1500000,
    "saldo": 500000
  }
}
```

### Create Transaction
```http
POST /api/transactions
Content-Type: application/json

{
  "type": "PEMASUKAN",
  "category": "Iuran Bulanan",
  "description": "Iuran kas bulan Maret 2025",
  "amount": 500000,
  "date": "2025-03-10",
  "notes": "Pembayaran dari 10 warga"
}
```

**Roles allowed:** SUPER_ADMIN, KETUA_RT, BENDAHARA

### Update Transaction
```http
PUT /api/transactions/{id}
Content-Type: application/json

{
  "type": "PENGELUARAN",
  "category": "Kebersihan",
  "description": "Pembelian alat kebersihan",
  "amount": 200000,
  "date": "2025-03-15"
}
```

**Roles allowed:** SUPER_ADMIN, KETUA_RT, BENDAHARA

### Delete Transaction
```http
DELETE /api/transactions/{id}
```

**Roles allowed:** SUPER_ADMIN, KETUA_RT

---

## Payments (Pembayaran)

### Get All Payments
```http
GET /api/payments?userId=clxxx&status=PENDING&period=2025-01&page=1&limit=50
```

**Query Parameters:**
- `userId` (optional): Filter by user ID
- `status` (optional): `PENDING` | `PAID` | `FAILED` | `OVERDUE`
- `period` (optional): Format YYYY-MM
- `page` (optional): Page number
- `limit` (optional): Items per page

**Response:**
```json
{
  "payments": [
    {
      "id": "clxxx",
      "userId": "clxxx",
      "user": {
        "name": "Budi Santoso",
        "email": "warga1@rt.com",
        "phone": "081234567890"
      },
      "amount": 50000,
      "period": "2025-01",
      "description": "Iuran kas RT bulan Januari 2025",
      "status": "PAID",
      "paymentMethod": "Transfer Bank",
      "paidAt": "2025-01-05T10:00:00.000Z",
      "dueDate": "2025-01-10T00:00:00.000Z"
    }
  ],
  "total": 100,
  "page": 1,
  "totalPages": 10
}
```

### Create Payment (Tagihan)
```http
POST /api/payments
Content-Type: application/json

{
  "userId": "clxxx",
  "amount": 50000,
  "period": "2025-03",
  "description": "Iuran kas RT bulan Maret 2025",
  "dueDate": "2025-03-10"
}
```

**Roles allowed:** SUPER_ADMIN, KETUA_RT, BENDAHARA

### Update Payment Status
```http
PUT /api/payments/{id}
Content-Type: application/json

{
  "status": "PAID",
  "paymentMethod": "Cash",
  "paymentProof": "https://example.com/proof.jpg"
}
```

---

## Warga (Data Warga)

### Get All Warga
```http
GET /api/warga?search=budi&page=1&limit=50
```

**Query Parameters:**
- `search` (optional): Search by name, NIK, nomor rumah
- `page` (optional): Page number
- `limit` (optional): Items per page

**Response:**
```json
{
  "warga": [
    {
      "id": "clxxx",
      "userId": "clxxx",
      "user": {
        "id": "clxxx",
        "name": "Budi Santoso",
        "email": "warga1@rt.com",
        "phone": "081234567890",
        "isActive": true
      },
      "nik": "3201012345670001",
      "nomorRumah": "01",
      "alamat": "Jl. Mawar No. 01",
      "rt": "001",
      "rw": "001",
      "kelurahan": "Sukamaju",
      "kecamatan": "Cibeunying",
      "statusPerkawinan": "Kawin",
      "pekerjaan": "Karyawan Swasta",
      "monthlyFee": 50000,
      "totalPaid": 150000,
      "totalDebt": 50000,
      "lastPayment": "2025-01-10T10:00:00.000Z"
    }
  ],
  "total": 50,
  "page": 1,
  "totalPages": 5,
  "stats": {
    "totalWarga": 50,
    "totalActive": 48,
    "totalDebt": 2500000,
    "totalPaid": 10000000
  }
}
```

### Create Warga
```http
POST /api/warga
Content-Type: application/json

{
  "name": "Ahmad Hidayat",
  "email": "ahmad@example.com",
  "phone": "081234567899",
  "password": "password123",
  "nik": "3201012345670010",
  "nomorRumah": "10",
  "alamat": "Jl. Melati No. 10",
  "rt": "001",
  "rw": "001",
  "kelurahan": "Sukamaju",
  "kecamatan": "Cibeunying",
  "statusPerkawinan": "Kawin",
  "pekerjaan": "Wiraswasta",
  "monthlyFee": 50000
}
```

**Roles allowed:** SUPER_ADMIN, KETUA_RT

---

## Surat (Penyuratan)

### Get All Surat
```http
GET /api/surat?userId=clxxx&status=PENDING&type=DOMISILI&page=1&limit=50
```

**Query Parameters:**
- `userId` (optional): Filter by user ID
- `status` (optional): `PENDING` | `APPROVED` | `REJECTED`
- `type` (optional): `DOMISILI` | `PENGANTAR` | `IZIN_USAHA` | etc
- `page`, `limit`: Pagination

**Response:**
```json
{
  "surats": [
    {
      "id": "clxxx",
      "userId": "clxxx",
      "user": {
        "name": "Budi Santoso",
        "email": "warga1@rt.com"
      },
      "type": "DOMISILI",
      "title": "Permohonan Surat Domisili",
      "purpose": "Untuk keperluan pembuatan KTP",
      "status": "PENDING",
      "data": {
        "tempatLahir": "Jakarta",
        "tanggalLahir": "1990-01-01"
      },
      "pdfUrl": null,
      "createdAt": "2025-03-01T10:00:00.000Z"
    }
  ],
  "total": 20,
  "page": 1,
  "totalPages": 2
}
```

### Create Surat (Pengajuan)
```http
POST /api/surat
Content-Type: application/json

{
  "type": "DOMISILI",
  "title": "Permohonan Surat Domisili",
  "purpose": "Untuk keperluan pembuatan KTP",
  "data": {
    "tempatLahir": "Jakarta",
    "tanggalLahir": "1990-01-01",
    "keperluan": "Pembuatan KTP baru"
  }
}
```

### Approve Surat
```http
POST /api/surat/{id}/approve
```

**Roles allowed:** SUPER_ADMIN, KETUA_RT

**Response:**
```json
{
  "message": "Surat berhasil disetujui",
  "surat": {
    "id": "clxxx",
    "status": "APPROVED",
    "pdfUrl": "/uploads/surat-clxxx.pdf",
    "approvedBy": "clxxx",
    "approvedAt": "2025-03-02T10:00:00.000Z"
  }
}
```

---

## Activities (Kegiatan)

### Get All Activities
```http
GET /api/activities?type=Rapat&startDate=2025-03-01&endDate=2025-03-31
```

**Query Parameters:**
- `type` (optional): Activity type
- `startDate` (optional): Filter start date
- `endDate` (optional): Filter end date
- `page`, `limit`: Pagination

**Response:**
```json
{
  "activities": [
    {
      "id": "clxxx",
      "title": "Rapat RT Bulanan",
      "description": "Rapat evaluasi kegiatan RT bulan ini",
      "type": "Rapat",
      "location": "Balai RT",
      "startDate": "2025-03-15T19:00:00.000Z",
      "endDate": "2025-03-15T21:00:00.000Z",
      "createdBy": "clxxx",
      "user": {
        "name": "Ketua RT",
        "email": "ketua@rt.com"
      },
      "reminderSent": false,
      "createdAt": "2025-03-01T10:00:00.000Z"
    }
  ],
  "total": 10,
  "page": 1,
  "totalPages": 1
}
```

### Create Activity
```http
POST /api/activities
Content-Type: application/json

{
  "title": "Kerja Bakti",
  "description": "Kerja bakti membersihkan lingkungan RT",
  "type": "Kerja Bakti",
  "location": "Seluruh area RT",
  "startDate": "2025-03-20T07:00:00.000Z",
  "endDate": "2025-03-20T10:00:00.000Z"
}
```

**Roles allowed:** SUPER_ADMIN, KETUA_RT

---

## Announcements (Pengumuman)

### Get All Announcements
```http
GET /api/announcements?isActive=true&priority=high
```

**Query Parameters:**
- `isActive` (optional): Filter active announcements
- `priority` (optional): `high` | `normal` | `low`
- `page`, `limit`: Pagination

**Response:**
```json
{
  "announcements": [
    {
      "id": "clxxx",
      "title": "Informasi Iuran Bulanan",
      "content": "Batas pembayaran iuran kas RT bulan Maret adalah tanggal 10 Maret 2025. Mohon segera melakukan pembayaran.",
      "priority": "high",
      "createdBy": "clxxx",
      "user": {
        "name": "Ketua RT",
        "email": "ketua@rt.com"
      },
      "isActive": true,
      "notificationSent": false,
      "createdAt": "2025-03-01T10:00:00.000Z"
    }
  ],
  "total": 5,
  "page": 1,
  "totalPages": 1
}
```

### Create Announcement
```http
POST /api/announcements
Content-Type: application/json

{
  "title": "Jadwal Ronda Malam",
  "content": "Jadwal ronda malam minggu ini: Senin (Rumah 1-5), Selasa (Rumah 6-10), Rabu (Rumah 11-15).",
  "priority": "normal"
}
```

**Roles allowed:** SUPER_ADMIN, KETUA_RT

---

## Error Responses

Semua endpoint mengembalikan error dalam format berikut:

```json
{
  "error": "Error message here"
}
```

### HTTP Status Codes

- `200`: Success
- `201`: Created
- `400`: Bad Request (invalid data)
- `401`: Unauthorized (not logged in)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `500`: Internal Server Error

---

## Rate Limiting

- Development: Unlimited
- Production (Vercel): 100 requests per 10 seconds per IP
- Production (Custom): Configure via Nginx/middleware

## Pagination

Default pagination:
- `page`: 1
- `limit`: 50
- Maximum limit: 100

## Date Format

- Request: `YYYY-MM-DD` or ISO 8601
- Response: ISO 8601 (`2025-03-01T10:00:00.000Z`)

## Authentication Headers

NextAuth menggunakan cookie-based authentication. Tidak perlu header Authorization manual.

Untuk API testing dengan tools seperti Postman:
1. Login via POST `/api/auth/callback/credentials`
2. Cookie session akan otomatis di-set
3. Gunakan cookie tersebut untuk request selanjutnya

---

**Last Updated:** 2025-03-01
