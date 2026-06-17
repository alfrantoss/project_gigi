# Fix: User Not Found - Session Invalid

## Masalah
Error "User not found" saat Ketua RT mencoba akses halaman profil.

## Akar Masalah
**Session lama tidak valid** setelah perubahan code. Session yang disimpan di browser tidak memiliki `user.id` yang benar atau struktur session berubah.

## Mengapa Terjadi?
1. Code NextAuth atau callbacks diubah
2. Session disimpan SEBELUM perubahan code
3. Browser masih menggunakan session lama
4. Session lama tidak punya structure yang benar (missing `user.id`)

## Solusi

### **SOLUSI UTAMA: LOGOUT & LOGIN ULANG** ✅

#### Untuk User yang Mengalami Error:

1. **Klik tombol Logout** atau buka: `http://localhost:3000/api/auth/signout`
2. **Login kembali** dengan kredensial yang sama
3. **Buka halaman Profil** lagi
4. ✅ Harusnya sudah bisa

### Solusi Code (Sudah Diterapkan):

#### 1. Better Session Validation ✅
**File**: `app/api/profile/me/route.ts`

```typescript
// Cek session ada
if (!session) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

// Cek session.user.id ada ✅ ADDED
if (!session.user?.id) {
  console.error("Session user ID is missing:", session);
  return NextResponse.json({ 
    error: "Session invalid. Please logout and login again.",
    code: "INVALID_SESSION"  // ✅ Error code untuk detect
  }, { status: 401 });
}

// Use session.user.id (bukan session.user?.id)
const user = await prisma.user.findUnique({
  where: { id: session.user.id },  // ✅ Sudah pasti ada
  // ...
});
```

#### 2. Auto Redirect ke Logout ✅
**File**: `app/dashboard/profile/me/page.tsx`

```typescript
const fetchProfile = async () => {
  try {
    const response = await fetch("/api/profile/me");
    if (!response.ok) {
      const errorData = await response.json();
      
      // ✅ Detect invalid session
      if (errorData.code === "INVALID_SESSION" || response.status === 401) {
        toast({
          title: "Session Expired",
          description: "Silakan login kembali",
          variant: "destructive",
        });
        
        // ✅ Auto redirect ke logout
        setTimeout(() => {
          window.location.href = "/api/auth/signout";
        }, 2000);
        return;
      }
      
      throw new Error(errorData.error);
    }
    // ...
  }
};
```

#### 3. Comprehensive Logging ✅

```typescript
console.log("Session:", JSON.stringify(session, null, 2));
console.log("Fetching user with ID:", session.user.id);
console.log("User found:", user.email, user.role);
// atau
console.error("User not found in database for ID:", session.user.id);
```

## Testing

### Test Scenario 1: User dengan Session Lama

**Expected Behavior**:
1. User buka `/dashboard/profile/me`
2. Error: "User not found"
3. Toast muncul: "Session Expired - Silakan login kembali"
4. Setelah 2 detik, auto redirect ke logout page
5. User login ulang
6. ✅ Profil bisa dibuka

### Test Scenario 2: User dengan Session Baru

**Expected Behavior**:
1. User logout
2. User login ulang
3. User buka `/dashboard/profile/me`
4. ✅ Profil langsung tampil tanpa error

### Test Scenario 3: Cek Server Log

**Di terminal server**, harusnya muncul log:
```
Session: {
  "user": {
    "id": "clxxx...",
    "email": "ketua@rt.com",
    "name": "Bapak Ketua RT",
    "role": "KETUA_RT"
  },
  ...
}
Fetching user with ID: clxxx...
User found: ketua@rt.com KETUA_RT
```

## Langkah-Langkah Manual Testing

### 1. Check Current Session
Buka browser console (F12) → Application tab → Cookies:
- Cari cookie: `next-auth.session-token`
- Note: Cookie ini menyimpan JWT session

### 2. Force Logout
```
http://localhost:3000/api/auth/signout
```

### 3. Login Ulang
```
http://localhost:3000/auth/login
- Email: [email ketua RT]
- Password: [password ketua RT]
```

### 4. Test Profil
```
http://localhost:3000/dashboard/profile/me
```

### 5. Check Console Log
Di browser console, harusnya muncul:
```
Profile data received: {
  id: "...",
  name: "...",
  email: "...",
  role: "KETUA_RT",
  ...
}
```

## Troubleshooting

### Jika Masih "User not found" Setelah Logout-Login:

#### 1. Cek Database
```sql
-- Cari user dengan role KETUA_RT
SELECT * FROM "User" WHERE role = 'KETUA_RT';

-- Pastikan ID match dengan session
-- Copy ID dari result
```

#### 2. Cek Session Token
- Buka browser DevTools (F12)
- Application → Cookies
- Cari `next-auth.session-token`
- Copy value
- Decode di https://jwt.io
- Pastikan ada field `id` di payload

#### 3. Cek Server Log
Di terminal, cari log:
```
Session user ID is missing: ...
atau
User not found in database for ID: ...
```

#### 4. Clear Browser Data
```
1. Open browser settings
2. Clear browsing data
3. Check: Cookies and site data
4. Time range: All time
5. Clear data
6. Close and reopen browser
7. Login ulang
```

#### 5. Restart Dev Server
```bash
# Stop server (Ctrl+C)
# Start ulang
npm run dev
```

## Root Cause Analysis

### Kenapa Session Bisa Invalid?

1. **Code Changes**
   - Callback NextAuth diubah
   - Structure session berubah
   - Types definition diubah

2. **JWT Token Lama**
   - Token di-sign sebelum perubahan
   - Token tidak auto-refresh
   - Token masih valid tapi structure lama

3. **Database Changes**
   - User ID berubah (jarang terjadi)
   - User dihapus dan dibuat ulang

### Prevention

Untuk mencegah ke depannya:

1. **Version Session Token**
   ```typescript
   async session({ session, token }) {
     if (session?.user) {
       session.user.id = token.id as string;
       session.user.role = token.role as string;
       session.version = "1.0";  // ✅ Add version
     }
     return session;
   }
   ```

2. **Session Refresh**
   ```typescript
   session: {
     strategy: 'jwt',
     maxAge: 30 * 24 * 60 * 60,  // 30 days
     updateAge: 24 * 60 * 60,     // ✅ Refresh every 24 hours
   }
   ```

3. **Validate Session Structure**
   ```typescript
   if (!session.user?.id || !session.user?.role) {
     // Force logout
     return NextResponse.json({ 
       error: "Invalid session structure",
       code: "INVALID_SESSION"
     }, { status: 401 });
   }
   ```

## Kesimpulan

✅ **Solusi Cepat**: User harus **LOGOUT dan LOGIN ULANG**

✅ **Solusi Code**: 
- Better session validation
- Auto redirect ke logout jika session invalid
- Comprehensive error logging

✅ **Prevention**: 
- Add session version
- Enable session refresh
- Validate session structure

## File yang Diubah

1. ✅ `app/api/profile/me/route.ts`
   - Validate session.user.id exists
   - Return error code INVALID_SESSION
   - Add comprehensive logging
   
2. ✅ `app/dashboard/profile/me/page.tsx`
   - Detect INVALID_SESSION error
   - Auto redirect to logout
   - Better error handling

## Next Steps

**UNTUK USER YANG MENGALAMI ERROR**:

1. **LOGOUT**: http://localhost:3000/api/auth/signout
2. **LOGIN ULANG**: http://localhost:3000/auth/login
3. **BUKA PROFIL**: http://localhost:3000/dashboard/profile/me
4. ✅ Harusnya sudah bisa!

Jika masih error setelah logout-login, kasih tahu:
- Error message di console browser
- Log di terminal server
- Screenshot error
