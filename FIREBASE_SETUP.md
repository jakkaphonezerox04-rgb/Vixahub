# การตั้งค่า Firebase สำหรับระบบ Login และ Registration

## ขั้นตอนการตั้งค่า Firebase

### 1. สร้างโปรเจกต์ Firebase

1. ไปที่ [Firebase Console](https://console.firebase.google.com/)
2. คลิก "Add project" หรือ "เพิ่มโปรเจกต์"
3. ตั้งชื่อโปรเจกต์และทำตามขั้นตอน
4. เมื่อสร้างเสร็จแล้ว ไปที่ Project Settings (⚙️ ข้างชื่อโปรเจกต์)

### 2. เพิ่ม Web App

1. ในหน้า Project Settings ไปที่ส่วน "Your apps"
2. คลิกไอคอน Web (`</>`)
3. ตั้งชื่อแอปและคลิก "Register app"
4. คัดลอก Firebase config (firebaseConfig object)

### 3. ตั้งค่า Environment Variables

สร้างไฟล์ `.env.local` ในโฟลเดอร์หลักของโปรเจกต์:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key-here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your-project-id-default-rtdb.asia-southeast1.firebasedatabase.app
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

แทนที่ค่าต่างๆ ด้วยค่าจริงจาก Firebase config ที่คัดลอกมา

### 4. เปิดใช้งาน Authentication

1. ในเมนูด้านซ้ายของ Firebase Console เลือก "Authentication"
2. คลิกแท็บ "Sign-in method"
3. คลิก "Email/Password"
4. เปิดใช้งาน (Enable) และกด "Save"

### 5. สร้าง Firestore Database

1. ในเมนูด้านซ้ายเลือก "Firestore Database"
2. คลิก "Create database"
3. เลือก "Start in test mode" (สำหรับการพัฒนา)
4. เลือก location ที่ใกล้ที่สุด (เช่น asia-southeast1)
5. คลิก "Enable"

### 6. สร้าง Realtime Database (สำหรับระบบ Credits)

1. ในเมนูด้านซ้ายเลือก "Realtime Database"
2. คลิก "Create Database"
3. เลือก location ที่ใกล้ที่สุด (เช่น asia-southeast1)
4. เลือก "Start in test mode"
5. คลิก "Enable"

### 7. ตั้งค่า Security Rules (สำหรับ Production)

#### Firestore Security Rules
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection - authenticated users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow authenticated users to read website data
    match /websites/{websiteId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == resource.data.userId;
    }
  }
}
```

#### Realtime Database Security Rules
```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid"
      }
    },
    "credit_transactions": {
      ".read": "auth != null",
      "$transaction": {
        ".write": "auth != null"
      }
    }
  }
}
```

### 8. Restart Development Server

หลังจากตั้งค่า environment variables แล้ว รีสตาร์ท development server:

```bash
npm run dev
```

## การทดสอบระบบ

### สมัครสมาชิกใหม่

1. ไปที่ http://localhost:3000/register
2. กรอกข้อมูล:
   - Username: ชื่อผู้ใช้ (อย่างน้อย 3 ตัวอักษร)
   - Email: อีเมลที่ถูกต้อง
   - Password: รหัสผ่าน (อย่างน้อย 6 ตัวอักษร)
   - Confirm Password: ยืนยันรหัสผ่าน
3. ติ๊กยอมรับข้อตกลง
4. คลิก "สร้างบัญชี"

### เข้าสู่ระบบ

1. ไปที่ http://localhost:3000/login
2. กรอก Email และ Password ที่สมัครไว้
3. คลิก "เข้าสู่ระบบ"

### ตรวจสอบข้อมูลใน Firebase

1. ใน Firebase Console ไปที่ "Authentication" จะเห็นผู้ใช้ที่สมัครไว้
2. ไปที่ "Firestore Database" จะเห็น collection "users" พร้อมข้อมูลผู้ใช้
3. ไปที่ "Realtime Database" จะเห็นข้อมูล credits ของผู้ใช้

## คุณสมบัติที่ใช้งานได้

- ✅ สมัครสมาชิกด้วย Email/Password
- ✅ เข้าสู่ระบบด้วย Email/Password
- ✅ ออกจากระบบ
- ✅ บันทึกข้อมูลผู้ใช้ใน Firestore
- ✅ ระบบ Credits เชื่อมต่อกับ Realtime Database
- ✅ ตรวจสอบสถานะการล็อกอินอัตโนมัติ
- ✅ แก้ไขข้อมูลโปรไฟล์

## หมายเหตุ

- ใน Development Mode (ไม่มี Firebase config) ระบบจะใช้ Mock Database
- เมื่อตั้งค่า Firebase เรียบร้อยแล้ว ระบบจะใช้ Firebase จริง
- อย่าลืมตั้งค่า Security Rules ให้เหมาะสมก่อนเปิดใช้งาน Production
- ผู้ใช้ใหม่จะได้รับ Credits เริ่มต้น 1250 หน่วย




















