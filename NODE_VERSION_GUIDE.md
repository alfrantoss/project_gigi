# 📦 Panduan Versi Node.js untuk Project Ini

## ✅ VERSI NODE.JS YANG DIREKOMENDASIKAN

Untuk project ini (Next.js 13.5.1), gunakan:

### **Node.js versi 18.x atau 20.x (LTS)**

**Rekomendasi terbaik:**
- ✅ **Node.js v18.17.0 atau lebih tinggi** (LTS)
- ✅ **Node.js v20.x** (LTS - Paling Stabil)

**TIDAK disarankan:**
- ❌ Node.js versi 16.x atau lebih lama (sudah tidak didukung Next.js 13.5)
- ⚠️ Node.js versi 21.x atau 22.x (terlalu baru, mungkin ada issue)

---

## 🔍 CEK VERSI NODE.JS YANG TERINSTALL

Buka **Command Prompt** atau **Terminal**, lalu ketik:

```bash
node -v
```

**Contoh output:**
```
v20.11.0
```

**Cek juga versi npm:**
```bash
npm -v
```

**Contoh output:**
```
10.2.4
```

---

## 📥 CARA INSTALL/UPDATE NODE.JS

### **Cara 1: Download dari Website Resmi** (Paling Mudah)

1. Kunjungi: **https://nodejs.org/**
2. Download versi **LTS** (Long Term Support)
3. Install seperti biasa
4. Restart Command Prompt
5. Cek versi dengan: `node -v`

### **Cara 2: Pakai NVM (Node Version Manager)** (Paling Fleksibel)

NVM memungkinkan Anda install dan switch antara berbagai versi Node.js.

#### **Install NVM di Windows:**

1. Download **nvm-windows** dari:
   ```
   https://github.com/coreybutler/nvm-windows/releases
   ```
   
2. Download file: `nvm-setup.exe` (yang terbaru)

3. Install dan restart Command Prompt

4. Verifikasi NVM terinstall:
   ```bash
   nvm version
   ```

#### **Install Node.js dengan NVM:**

```bash
# Lihat versi Node.js yang tersedia
nvm list available

# Install Node.js versi 20 (LTS)
nvm install 20

# Atau install versi 18 (LTS)
nvm install 18

# Gunakan versi yang sudah diinstall
nvm use 20

# Cek versi yang aktif
node -v
```

#### **Switch Between Versions:**

```bash
# Lihat versi yang terinstall di komputer
nvm list

# Ganti ke versi lain
nvm use 18
# atau
nvm use 20

# Set default version
nvm alias default 20
```

---

## 🔧 MENENTUKAN VERSI NODE.JS UNTUK PROJECT

### **Cara 1: Buat File `.nvmrc`**

Buat file `.nvmrc` di root project (sejajar dengan `package.json`):

```
20
```

Atau lebih spesifik:
```
20.11.0
```

**Kegunaan:**
- Tim bisa langsung tahu versi Node.js yang dipakai
- Saat buka project, tinggal ketik: `nvm use`
- NVM otomatis pakai versi yang ada di `.nvmrc`

### **Cara 2: Tambahkan `engines` di `package.json`**

Tambahkan di `package.json`:

```json
{
  "name": "nextjs",
  "version": "0.1.0",
  "engines": {
    "node": ">=18.17.0 <21.0.0",
    "npm": ">=9.0.0"
  },
  "scripts": {
    ...
  },
  ...
}
```

**Kegunaan:**
- npm akan warning jika versi Node.js tidak sesuai
- Dokumentasi jelas untuk developer lain

---

## 📋 COMPATIBILITY TABLE

| Next.js Version | Node.js Minimum | Recommended |
|-----------------|----------------|-------------|
| 13.5.1 (project ini) | 18.17.0+ | 18.x atau 20.x (LTS) |
| 13.x | 16.8.0+ | 18.x atau 20.x |
| 14.x | 18.17.0+ | 18.x atau 20.x |

---

## 🚀 SETUP UNTUK TEMAN YANG BARU CLONE PROJECT

### **Langkah 1: Cek Versi Node.js**
```bash
node -v
```

Jika versinya **< 18.17.0**, install/update Node.js dulu.

### **Langkah 2: Install Dependencies**
```bash
npm install
```

### **Jika Ada Error "Unsupported engine":**

**Solusi 1:** Update Node.js ke versi yang sesuai

**Solusi 2:** Force install (tidak disarankan)
```bash
npm install --force
```

Atau:
```bash
npm install --legacy-peer-deps
```

---

## ⚠️ TROUBLESHOOTING

### **Error: "The engine 'node' is incompatible"**

**Penyebab:** Versi Node.js terlalu lama

**Solusi:**
```bash
# Cek versi sekarang
node -v

# Update ke Node.js 20 (LTS)
# Download dari: https://nodejs.org/
# Atau pakai NVM:
nvm install 20
nvm use 20
```

### **Error: "npm ERR! code EBADENGINE"**

**Penyebab:** Versi npm tidak cocok

**Solusi:**
```bash
# Update npm
npm install -g npm@latest

# Cek versi
npm -v
```

### **Error: "bcrypt" tidak bisa di-compile**

**Penyebab:** bcrypt butuh rebuild untuk versi Node.js yang berbeda

**Solusi:**
```bash
# Rebuild bcrypt
npm rebuild bcrypt

# Atau hapus node_modules dan install ulang
rmdir /s /q node_modules
del package-lock.json
npm install
```

---

## 📝 REKOMENDASI UNTUK PROJECT INI

Saya sarankan tambahkan ke **`package.json`**:

```json
{
  "engines": {
    "node": ">=18.17.0 <21.0.0",
    "npm": ">=9.0.0"
  }
}
```

Dan buat file **`.nvmrc`** dengan isi:
```
20
```

---

## 🎯 KESIMPULAN

### **Untuk Teman yang Baru Setup:**

1. **Cek versi Node.js:**
   ```bash
   node -v
   ```

2. **Jika versi < 18.17.0:**
   - Download Node.js v20 (LTS) dari https://nodejs.org/
   - Install dan restart terminal
   - Verifikasi: `node -v`

3. **Clone/Pull project:**
   ```bash
   git pull origin main
   ```

4. **Install dependencies:**
   ```bash
   npm install
   ```

5. **Setup .env dan database** (lihat SETUP.md)

6. **Jalankan project:**
   ```bash
   npm run dev
   ```

---

## 📚 REFERENSI

- Node.js Official: https://nodejs.org/
- Next.js System Requirements: https://nextjs.org/docs/getting-started/installation
- NVM for Windows: https://github.com/coreybutler/nvm-windows

---

**Versi yang dipakai di project ini:**
- Next.js: 13.5.1
- React: 18.2.0
- TypeScript: 5.2.2
- Node.js (Recommended): **18.17.0+ atau 20.x (LTS)**
