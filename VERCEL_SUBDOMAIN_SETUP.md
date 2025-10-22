# Vercel Subdomain Setup Guide

## การตั้งค่า Wildcard Subdomains ใน Vercel

### 1. ไปที่ Vercel Dashboard
1. เปิด [vercel.com](https://vercel.com)
2. เข้าสู่ระบบและเลือกโปรเจค `vixahub-2`

### 2. ตั้งค่า Domains
1. ไปที่ **Settings** > **Domains**
2. เพิ่ม domain: `*.vixahub-2.vercel.app`
3. ตั้งค่า DNS records ตามที่ Vercel แนะนำ

### 3. ตั้งค่า Environment Variables
ตรวจสอบว่ามี Environment Variables ครบถ้วน:
```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDsxkKY3M9476plC9NUIIeuXrPfH0EUB8Y
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=vixahub.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=vixahub
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=vixahub.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=336784504819
NEXT_PUBLIC_FIREBASE_APP_ID=1:336784504819:web:958bad204051e9c1534486
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-D4C98J4Y8H
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://vixahub-default-rtdb.asia-southeast1.firebasedatabase.app
```

### 4. ตรวจสอบการตั้งค่า
1. ไปที่ **Settings** > **Functions**
2. ตรวจสอบว่า Runtime เป็น `Node.js 18.x`
3. ตรวจสอบว่า Build Command เป็น `npm run build`

### 5. ทดสอบ Subdomain
1. สร้างเว็บไซต์ใหม่ด้วย subdomain เช่น `mywebsite`
2. เข้าถึง `https://mywebsite.vixahub-2.vercel.app`
3. ควรแสดงหน้าเว็บโคลนได้

## หมายเหตุ
- Vercel ต้องใช้ Pro plan สำหรับ wildcard subdomains
- หรือใช้ custom domain ที่รองรับ wildcard subdomains
- ตรวจสอบว่า DNS records ถูกตั้งค่าถูกต้อง
