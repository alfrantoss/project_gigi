# Fix: Profile Page "User not found" Error - Complete Solution

## Problem Summary
Profile page showing "User not found" error for SUPER_ADMIN and KETUA_RT roles after recent code changes.

## Root Cause
**OLD SESSION TOKEN** - The session JWT token was created before code changes and doesn't contain proper user ID mapping. After code updates, the session structure changed but existing user sessions still use the old token format.

## Complete Solution

### IMMEDIATE ACTION REQUIRED (FOR USER)

**YOU MUST LOGOUT AND LOGIN AGAIN** - This is the primary fix!

1. **Clear Browser Cache**:
   - Chrome/Edge: Press `Ctrl + Shift + Delete`
   - Select "Cookies and other site data"
   - Select "Cached images and files"
   - Click "Clear data"

2. **Logout**:
   - Go to: `http://localhost:3000/api/auth/signout`
   - Or click logout button in the app

3. **Clear Browser Cookies** (Optional but recommended):
   - Open Developer Tools (F12)
   - Go to Application tab
   - Under Storage → Cookies → http://localhost:3000
   - Delete all cookies, especially `next-auth.session-token`

4. **Login Again**:
   - Go to: `http://localhost:3000/auth/login`
   - Use your KETUA_RT or SUPER_ADMIN credentials
   - This will create a NEW session token with correct structure

5. **Test Profile**:
   - Go to: `http://localhost:3000/dashboard/profile/me`
   - Should now load without errors

### WHY THIS HAPPENS

**Session Token Structure:**
- OLD token (before fix): Only had `{ id: "abc123", role: "KETUA_RT" }`
- NEW token (after fix): Has `{ id: "abc123", role: "KETUA_RT", email: "user@example.com", name: "User Name" }`

**The Problem:**
1. User logged in BEFORE the code changes
2. Their browser stored JWT token in cookies
3. Code was updated with new session structure
4. Old token doesn't match new expectations
5. API can't find user because token.id is malformed or missing

### CODE FIXES APPLIED

#### 1. Enhanced JWT Callbacks (`lib/auth.ts`)
```typescript
callbacks: {
  async jwt({ token, user, trigger }) {
    if (user) {
      token.role = user.role;
      token.id = user.id;
      token.email = user.email;  // ← ADDED
      token.name = user.name;    // ← ADDED
      console.log("JWT callback - User signed in:", { 
        id: user.id, 
        email: user.email, 
        role: user.role 
      });
    }
    
    // Validate token has required data
    if (!token.id || !token.role) {
      console.warn("JWT token missing id or role:", token);
    }
    
    return token;
  },
  async session({ session, token }) {
    if (session?.user) {
      session.user.id = token.id as string;
      session.user.role = token.role as string;
      session.user.email = token.email as string;  // ← ADDED
      session.user.name = token.name as string;    // ← ADDED
      
      console.log("Session callback - Session created:", { 
        id: session.user.id, 
        email: session.user.email, 
        role: session.user.role 
      });
      
      // Error logging for debugging
      if (!session.user.id) {
        console.error("Session created without user ID! Token:", token);
      }
    }
    
    return session;
  },
}
```

#### 2. Updated TypeScript Definitions (`types/next-auth.d.ts`)
```typescript
declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: string;
    email: string;   // ← ADDED
    name: string;    // ← ADDED
  }
}
```

#### 3. Enhanced API Error Handling (`app/api/profile/me/route.ts`)
- Added comprehensive logging
- Added session validation
- Added auto-redirect for invalid sessions
- Returns clear error codes

#### 4. Debug Endpoint Created (`app/api/debug/session/route.ts`)
**NEW**: A diagnostic endpoint to check session status

**Usage:**
```bash
# While logged in, visit:
http://localhost:3000/api/debug/session

# Will show:
# - Session data
# - Database lookup results
# - Diagnosis of the problem
# - Suggested solution
```

**Example Response:**
```json
{
  "session": {
    "exists": true,
    "user": { "id": "cm5xyz...", "email": "admin@rt.com", "role": "SUPER_ADMIN" },
    "hasId": true,
    "hasEmail": true
  },
  "database": {
    "userById": { "id": "cm5xyz...", "email": "admin@rt.com", "name": "Admin", "role": "SUPER_ADMIN" },
    "userByEmail": { "id": "cm5xyz...", "email": "admin@rt.com", "name": "Admin", "role": "SUPER_ADMIN" },
    "idMatch": true
  },
  "diagnosis": {
    "sessionValid": true,
    "userIdInSession": true,
    "userFoundById": true,
    "userFoundByEmail": true,
    "problem": null,
    "solution": "Session is valid"
  }
}
```

### VERIFICATION STEPS

1. **Check Server Logs**:
   Look for these log messages when accessing profile:
   ```
   Session: { user: { id: "...", email: "...", role: "..." } }
   Fetching user with ID: cm5xyz...
   User found: admin@rt.com SUPER_ADMIN
   ```

2. **Check Browser Console**:
   - Open Developer Tools (F12)
   - Go to Console tab
   - Look for any error messages

3. **Test the Debug Endpoint**:
   ```
   Visit: http://localhost:3000/api/debug/session
   Check the "diagnosis" section in the response
   ```

### TROUBLESHOOTING

If logout/login doesn't work:

**1. Check Database**:
```sql
-- Verify user exists
SELECT id, email, name, role, "isActive" 
FROM "User" 
WHERE role IN ('SUPER_ADMIN', 'KETUA_RT');

-- Check if user is active
SELECT * FROM "User" WHERE email = 'your-email@example.com';
```

**2. Check Environment**:
```bash
# Verify .env file has NEXTAUTH_SECRET
cat .env | grep NEXTAUTH_SECRET

# Should have a value (not empty)
NEXTAUTH_SECRET="some-secret-key-here"
```

**3. Restart Next.js Server**:
```bash
# Stop the server (Ctrl+C)
# Clear Next.js cache
rm -rf .next

# Start again
npm run dev
```

**4. Check Cookie Storage**:
- Open DevTools (F12) → Application → Cookies
- Look for `next-auth.session-token`
- Delete it manually
- Try logging in again

### PREVENTION

To prevent this in the future:

1. **Always logout/login after major code changes** especially to:
   - Auth configuration (`lib/auth.ts`)
   - User model changes
   - Session structure changes

2. **Version your session tokens** if you frequently update auth structure

3. **Add session version checking** in production:
   ```typescript
   const SESSION_VERSION = "v2";
   
   // In JWT callback
   token.version = SESSION_VERSION;
   
   // In API routes
   if (session.version !== SESSION_VERSION) {
     return redirect("/api/auth/signout");
   }
   ```

## Summary

**THE FIX**: Logout → Clear browser cache/cookies → Login again

This recreates the session token with the correct structure that matches the updated code.

## Files Modified

1. `lib/auth.ts` - Enhanced session callbacks with logging and validation
2. `types/next-auth.d.ts` - Added email and name to JWT interface
3. `app/api/debug/session/route.ts` - NEW diagnostic endpoint
4. `app/api/profile/me/route.ts` - Already had validation from previous fix
5. `app/dashboard/profile/me/page.tsx` - Already had auto-redirect from previous fix

## Status
✅ Code fixes applied
⏳ **USER ACTION REQUIRED**: Logout and login again to test
