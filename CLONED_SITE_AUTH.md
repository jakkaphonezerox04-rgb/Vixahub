# ระบบ Login/Register สำหรับเว็บโคลน - แยกจากเว็บหลัก ✅

## สรุปการพัฒนา

ระบบ Authentication สำหรับเว็บโคลนถูกแยกออกจากระบบหลัก VIXAHUB อย่างสมบูรณ์แล้ว! ใช้ **Firebase Firestore** แต่เก็บข้อมูลในคนละ Collection กับเว็บหลัก

---

## สถาปัตยกรรมระบบ

### 📊 โครงสร้างข้อมูลใน Firebase

```
Firebase Firestore
├── users/                          ← ผู้ใช้งานเว็บหลัก VIXAHUB
│   └── {userId}/
│       ├── name
│       ├── email
│       ├── balance
│       └── ...
│
└── cloned_sites/                   ← ผู้ใช้งานเว็บโคลน (แยกอิสระ)
    └── {siteId}/                   ← แต่ละเว็บโคลนมี users แยกกัน
        └── users/
            └── {userId}/
                ├── siteId
                ├── username
                ├── email
                ├── passwordHash
                ├── phone
                ├── role
                ├── createdAt
                └── lastLogin
```

### 🔐 การแยกระบบ Authentication

| คุณสมบัติ | เว็บหลัก (VIXAHUB) | เว็บโคลน |
|----------|-------------------|---------|
| **Context** | `AuthContext` | `ClonedSiteAuthContext` |
| **Firebase Collection** | `users/` | `cloned_sites/{siteId}/users/` |
| **Authentication Method** | Firebase Auth | Custom Auth + Firestore |
| **Session Storage** | `vixahub_user` | `cloned_site_session_{siteId}` |
| **Route** | `/login`, `/register` | `/preview/{id}/login`, `/preview/{id}/register` |
| **Features** | Full Firebase Auth, Credits System | Site-specific authentication |

---

## ไฟล์ที่สร้างใหม่

### 1. `contexts/cloned-site-auth-context.tsx` ✅
Context สำหรับจัดการ Authentication ของเว็บโคลน

**คุณสมบัติ:**
- `login(siteId, email, password)` - เข้าสู่ระบบเฉพาะเว็บนั้นๆ
- `register(siteId, userData)` - สมัครสมาชิกเฉพาะเว็บนั้นๆ
- `logout()` - ออกจากระบบ
- `checkSession(siteId)` - ตรวจสอบ session

**การใช้งาน:**
```tsx
import { useClonedSiteAuth } from "@/contexts/cloned-site-auth-context"

const { user, login, register, logout } = useClonedSiteAuth()
```

### 2. `components/cloned-site-login-form.tsx` ✅
Form สำหรับ Login ของเว็บโคลน

**Props:**
- `siteId` - ID ของเว็บโคลน
- `siteName` - ชื่อเว็บไซต์
- `onLogin` - Function สำหรับ login
- `onSuccess` - Callback เมื่อ login สำเร็จ

### 3. `components/cloned-site-register-form.tsx` ✅
Form สำหรับ Register ของเว็บโคลน

**Props:**
- `siteId` - ID ของเว็บโคลน
- `siteName` - ชื่อเว็บไซต์
- `onRegister` - Function สำหรับ register
- `onSuccess` - Callback เมื่อ register สำเร็จ

**ฟิลด์ที่รองรับ:**
- Username (จำเป็น, อย่างน้อย 3 ตัวอักษร)
- Email (จำเป็น)
- Phone (ไม่บังคับ)
- Password (จำเป็น, อย่างน้อย 6 ตัวอักษร)
- Confirm Password (จำเป็น)

---

## ไฟล์ที่อัปเดต

### 4. `app/preview/[id]/login/page.tsx` ✅
อัปเดตจาก localStorage เป็น Firebase Firestore

**เปลี่ยนจาก:**
```tsx
// เก่า: ใช้ localStorage
const list = JSON.parse(localStorage.getItem(`site_users_${siteId}`))
```

**เป็น:**
```tsx
// ใหม่: ใช้ Firebase Firestore + ClonedSiteAuthContext
const { login } = useClonedSiteAuth()
await login(siteId, email, password)
```

### 5. `app/preview/[id]/register/page.tsx` ✅
อัปเดตจาก localStorage เป็น Firebase Firestore

**เปลี่ยนจาก:**
```tsx
// เก่า: ใช้ localStorage
localStorage.setItem(`site_users_${siteId}`, JSON.stringify(users))
```

**เป็น:**
```tsx
// ใหม่: ใช้ Firebase Firestore + ClonedSiteAuthContext
const { register } = useClonedSiteAuth()
await register(siteId, userData)
```

---

## วิธีการใช้งาน

### 1. สมัครสมาชิกในเว็บโคลน

```
1. ไปที่ http://localhost:3000/preview/[site-id]/register
2. กรอกข้อมูล:
   - Username
   - Email
   - Phone (ไม่บังคับ)
   - Password
   - Confirm Password
3. คลิก "สร้างบัญชี"
4. ระบบจะสร้างข้อมูลใน Firestore: cloned_sites/{site-id}/users/
5. redirect ไปหน้าเว็บโคลน
```

### 2. เข้าสู่ระบบในเว็บโคลน

```
1. ไปที่ http://localhost:3000/preview/[site-id]/login
2. กรอก Email และ Password
3. คลิก "เข้าสู่ระบบ"
4. ระบบจะตรวจสอบจาก Firestore
5. redirect ไปหน้าเว็บโคลน
```

### 3. ออกจากระบบ

```tsx
const { logout } = useClonedSiteAuth()
logout() // ลบ session เฉพาะเว็บนั้นๆ
```

---

## Security & Data Isolation

### ✅ ความปลอดภัย

1. **Password Hashing**
   ```tsx
   // Simple hash (สำหรับ demo)
   function hashPassword(password: string): string {
     return btoa(password + "VIXAHUB_SALT_2024")
   }
   ```
   ⚠️ **Production:** ใช้ bcrypt หรือ Firebase Authentication แทน

2. **Site Isolation**
   - แต่ละเว็บโคลนมี users collection แยกกัน
   - ผู้ใช้จากเว็บ A ไม่สามารถ login เข้าเว็บ B ได้
   - Session เก็บแยกตาม siteId

3. **Email Uniqueness**
   - Email ต้องไม่ซ้ำภายในเว็บเดียวกัน
   - แต่สามารถใช้ email เดียวกันกับเว็บอื่นได้

### 📁 ตัวอย่าง Firestore Structure

```json
{
  "cloned_sites": {
    "site-123": {
      "users": {
        "site-123_1234567890": {
          "siteId": "site-123",
          "username": "johndoe",
          "email": "john@example.com",
          "passwordHash": "xxxxx",
          "phone": "081-234-5678",
          "role": "member",
          "createdAt": "2024-01-15T10:30:00.000Z",
          "lastLogin": "2024-01-15T10:30:00.000Z"
        }
      }
    },
    "site-456": {
      "users": {
        "site-456_9876543210": {
          "siteId": "site-456",
          "username": "janedoe",
          "email": "jane@example.com",
          ...
        }
      }
    }
  }
}
```

---

## Firestore Security Rules

สำหรับ Production ควรตั้งค่า Security Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Main VIXAHUB users (existing)
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Cloned sites users (new)
    match /cloned_sites/{siteId}/users/{userId} {
      // Allow anyone to create new user (register)
      allow create: if request.resource.data.siteId == siteId;
      
      // Allow user to read their own data
      allow read: if resource.data.email == request.resource.data.email;
      
      // Prevent direct updates (use Cloud Functions instead)
      allow update, delete: if false;
    }
  }
}
```

---

## API Reference

### ClonedSiteAuthContext

```typescript
interface ClonedSiteUser {
  id: string
  siteId: string
  username: string
  email: string
  phone?: string
  createdAt: string
  role?: string
}

interface ClonedSiteAuthContextType {
  user: ClonedSiteUser | null
  isLoading: boolean
  login: (siteId: string, email: string, password: string) => Promise<Result>
  register: (siteId: string, userData: RegisterData) => Promise<Result>
  logout: () => void
  checkSession: (siteId: string) => Promise<ClonedSiteUser | null>
}
```

### Example Usage

```tsx
"use client"
import { ClonedSiteAuthProvider, useClonedSiteAuth } from "@/contexts/cloned-site-auth-context"

function MyComponent() {
  const { user, login, register, logout } = useClonedSiteAuth()
  
  const handleLogin = async () => {
    const result = await login("site-123", "john@example.com", "password123")
    if (result.success) {
      console.log("Login successful!")
    }
  }
  
  return (
    <div>
      {user ? (
        <div>
          <p>Welcome, {user.username}!</p>
          <button onClick={logout}>Logout</button>
        </div>
      ) : (
        <button onClick={handleLogin}>Login</button>
      )}
    </div>
  )
}

// Wrap with Provider
export default function Page() {
  return (
    <ClonedSiteAuthProvider>
      <MyComponent />
    </ClonedSiteAuthProvider>
  )
}
```

---

## การเปรียบเทียบ

| Feature | เว็บหลัก (VIXAHUB) | เว็บโคลน |
|---------|-------------------|---------|
| **URL** | `/login`, `/register` | `/preview/{id}/login`, `/register` |
| **Auth Method** | Firebase Authentication | Custom Firestore Auth |
| **Database** | `users/` collection | `cloned_sites/{id}/users/` |
| **Session** | Firebase Auth Session | SessionStorage per site |
| **Credits** | Realtime Database | ไม่มี (สามารถเพิ่มได้) |
| **Password** | Firebase managed | Custom hash |
| **Email Verification** | รองรับ | ยังไม่รองรับ |
| **Social Login** | รองรับ (Google, etc.) | ยังไม่รองรับ |

---

## สรุป

✅ **ระบบ Login/Register ของเว็บโคลนแยกจากเว็บหลักเรียบร้อยแล้ว!**

### ข้อดี
- 🔒 **Data Isolation**: ข้อมูลแยกกันอย่างสมบูรณ์
- 🚀 **Independent**: แต่ละเว็บโคลนมีระบบ auth ของตัวเอง
- 💾 **Firebase**: ใช้ Firestore แทน localStorage (persistent storage)
- 🎨 **Beautiful UI**: Form ที่สวยงามและใช้งานง่าย
- ✨ **Error Handling**: แสดง error เป็นภาษาไทย

### คุณสมบัติที่ทำงานได้
- [x] สมัครสมาชิกในเว็บโคลน
- [x] เข้าสู่ระบบในเว็บโคลน
- [x] ออกจากระบบ
- [x] เก็บข้อมูลใน Firestore แยกตาม siteId
- [x] Session management แยกตาม siteId
- [x] Password validation
- [x] Email uniqueness check per site

### ขั้นตอนถัดไป (Optional)
- [ ] เพิ่ม Email Verification
- [ ] เพิ่ม Password Reset
- [ ] เพิ่มระบบ Credits สำหรับเว็บโคลน
- [ ] เพิ่ม Role Management (admin, moderator, member)
- [ ] เพิ่ม User Profile Management
- [ ] ใช้ bcrypt สำหรับ password hashing
- [ ] เพิ่ม Rate Limiting

---

🎉 **ระบบพร้อมใช้งาน!** ลองสร้างเว็บโคลนและทดสอบ login/register ได้เลย!




















