# ⚡ QUICK FIX - Profile "User not found" Error

## 🎯 IMMEDIATE SOLUTION

Your session token is **outdated** after code updates. Follow these steps:

### Step 1: Clear Browser Cache
**Windows:** Press `Ctrl + Shift + Delete`
- Check "Cookies and other site data"
- Check "Cached images and files"  
- Click "Clear data"

### Step 2: Logout Completely
Go to: `http://localhost:3000/api/auth/signout`

### Step 3: Login Again
Go to: `http://localhost:3000/auth/login`
- Use your KETUA_RT or SUPER_ADMIN credentials

### Step 4: Test Profile
Go to: `http://localhost:3000/dashboard/profile/me`
- Should now work! ✅

---

## 🔍 Still Not Working?

### Option A: Manual Cookie Delete
1. Press `F12` (Open Developer Tools)
2. Go to **Application** tab
3. Left sidebar: **Cookies** → `http://localhost:3000`
4. Right-click `next-auth.session-token` → **Delete**
5. Refresh page and login again

### Option B: Use Debug Tool
Visit: `http://localhost:3000/api/debug/session`

This will show you exactly what's wrong with your session.

### Option C: Restart Server
```bash
# Stop server (Ctrl+C in terminal)
npm run dev
# Then logout and login again
```

---

## 🤔 Why This Happened?

Your browser saved an old login token BEFORE the code was updated. The new code expects a different token format. Logging out and back in creates a fresh token that works with the new code.

---

## ✅ How to Know It's Fixed?

After login, you should see:
- Profile page loads without errors
- Your name, email, and role display correctly
- No "User not found" error message

---

**Need more details?** See `FIX_PROFILE_SESSION_COMPLETE.md`
