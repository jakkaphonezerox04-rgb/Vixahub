# 🔥 วิธีเพิ่ม Firebase Keys ลงในโปรเจกต์

## ขั้นตอนที่ 1: สร้างไฟล์ .env.local

สร้างไฟล์ใหม่ชื่อ `.env.local` ในโฟลเดอร์หลักของโปรเจกต์ (ที่เดียวกับ package.json)

**วิธีสร้าง:**
- Windows: คลิกขวาในโฟลเดอร์ > New > Text Document > ตั้งชื่อเป็น `.env.local` (ลบ .txt ออก)
- หรือใช้ VS Code: New File > ตั้งชื่อเป็น `.env.local`

## ขั้นตอนที่ 2: คัดลอกข้อมูลนี้ลงในไฟล์ .env.local

```env
# Firebase Configuration for VIXAHUB Project
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDsxkKY3M9476plC9NUIIeuXrPfH0EUB8Y
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=vixahub.firebaseapp.com
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://vixahub-default-rtdb.asia-southeast1.firebasedatabase.app
NEXT_PUBLIC_FIREBASE_PROJECT_ID=vixahub
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=vixahub.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=336784504819
NEXT_PUBLIC_FIREBASE_APP_ID=1:336784504819:web:958bad204051e9c1534486
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-D4C98J4Y8H
```

## ขั้นตอนที่ 3: Restart Development Server

**สำคัญมาก!** หลังจากสร้างไฟล์ `.env.local` แล้ว ต้อง restart server:

```bash
# กด Ctrl+C ใน terminal เพื่อหยุด server
# จากนั้นรันใหม่
npm run dev
```

## ขั้นตอนที่ 4: ตรวจสอบว่าทำงาน

1. เปิด browser ที่ http://localhost:3000
2. ไปที่หน้า /register
3. ลองสมัครสมาชิก
4. ถ้าไม่มี error แสดงว่าใช้งานได้แล้ว! ✅

## ⚠️ สำคัญ: เปิดใช้งาน Firebase Services

คุณต้องเปิดใช้งานใน Firebase Console ด้วย:

### 1. Authentication
1. ไปที่ https://console.firebase.google.com/project/vixahub/authentication
2. คลิกแท็บ "Sign-in method"
3. คลิก "Email/Password"
4. เปิดใช้งาน (Enable)
5. คลิก Save

### 2. Firestore Database
1. ไปที่ https://console.firebase.google.com/project/vixahub/firestore
2. คลิก "Create database"
3. เลือก "Start in test mode"
4. เลือก location: asia-southeast1 (Singapore)
5. คลิก Enable

### 3. Realtime Database
1. ไปที่ https://console.firebase.google.com/project/vixahub/database
2. คลิก "Create Database"
3. เลือก location: asia-southeast1
4. เลือก "Start in test mode"
5. คลิก Enable

## ✅ Checklist

- [ ] สร้างไฟล์ `.env.local` แล้ว
- [ ] คัดลอกค่าทั้งหมดลงไปแล้ว
- [ ] Restart dev server แล้ว (Ctrl+C แล้ว npm run dev)
- [ ] เปิดใช้งาน Email/Password Authentication
- [ ] สร้าง Firestore Database
- [ ] สร้าง Realtime Database

## 🎉 เสร็จแล้ว!

หลังจากทำทุกขั้นตอน:
- ระบบ Login/Register จะทำงานได้จริง
- ข้อมูลจะถูกเก็บใน Firebase
- ไม่มี error แสดงอีกต่อไป

---

**หมายเหตุ:** ไฟล์ `.env.local` จะไม่ถูก commit ขึ้น Git (มีใน .gitignore อยู่แล้ว) เพื่อความปลอดภัย



















