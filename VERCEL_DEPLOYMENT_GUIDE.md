# Vercel Deployment Guide

## ขั้นตอนการ Deploy ไป Vercel

### 1. เตรียมโปรเจค
- ✅ ไฟล์ `vercel.json` ถูกสร้างแล้ว
- ✅ ไฟล์ `package.json` พร้อมใช้งาน
- ✅ ไฟล์ `next.config.mjs` ถูกตั้งค่าแล้ว

### 2. สร้างบัญชี Vercel
1. ไปที่ [vercel.com](https://vercel.com)
2. คลิก "Sign Up" 
3. เลือก "Continue with GitHub"
4. อนุญาต Vercel เข้าถึง GitHub repositories

### 3. Deploy โปรเจค
1. คลิก "New Project" ใน Vercel Dashboard
2. เลือก repository "VIXAHUB2"
3. Vercel จะ detect Next.js อัตโนมัติ
4. ตั้งค่า Environment Variables:
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
5. คลิก "Deploy"

### 4. ตรวจสอบการ Deploy
- Vercel จะแสดง URL: `https://vixahub-xxx.vercel.app`
- ใช้เวลา deploy ประมาณ 2-3 นาที
- ระบบจะ auto-deploy เมื่อ push code ใหม่

### 5. ตั้งค่า Custom Domain (ถ้าต้องการ)
1. ไปที่ Project Settings > Domains
2. เพิ่ม domain ที่ต้องการ
3. ตั้งค่า DNS records ตามที่ Vercel แนะนำ

## ข้อดีของ Vercel
- ✅ ฟรี 100GB-Hours/เดือน
- ✅ CDN ทั่วโลก
- ✅ Auto-scaling
- ✅ Zero-config deployment
- ✅ ใช้งานได้ทันที

## การอัพเดท
- Push code ใหม่ไป GitHub
- Vercel จะ auto-deploy ทันที
- ไม่ต้องทำอะไรเพิ่มเติม


