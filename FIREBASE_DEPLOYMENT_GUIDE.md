# 🚀 คู่มือการ Deploy ขึ้น Firebase Hosting

## 📋 **การเตรียมความพร้อมก่อน Deploy**

### 1. **ตรวจสอบการตั้งค่า Firebase**

#### **Firebase Configuration (lib/firebase.ts)**
```typescript
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDsxkKY3M9476plC9NUIIeuXrPfH0EUB8Y",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "vixahub.firebaseapp.com",
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || "https://vixahub-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "vixahub",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "vixahub.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "336784504819",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:336784504819:web:958bad204051e9c1534486",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-D4C98J4Y8H"
};
```

#### **Environment Variables**
สร้างไฟล์ `.env.local` ใน root directory:
```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDsxkKY3M9476plC9NUIIeuXrPfH0EUB8Y
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=vixahub.firebaseapp.com
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://vixahub-default-rtdb.asia-southeast1.firebasedatabase.app
NEXT_PUBLIC_FIREBASE_PROJECT_ID=vixahub
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=vixahub.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=336784504819
NEXT_PUBLIC_FIREBASE_APP_ID=1:336784504819:web:958bad204051e9c1534486
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-D4C98J4Y8H

# TMWEasy Configuration
TMWEASY_API_KEY=4c2012ece2c849a82bad840fd568b914
```

### 2. **ตรวจสอบ Firestore Security Rules**

ไฟล์ `firestore.rules`:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // VIXAHUB Main Website Users
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow create: if request.auth != null && request.auth.uid == userId;
    }
    
    // Cloned Sites - All Collections
    match /cloned_sites/{siteId}/{document=**} {
      allow read, write: if true;
    }
    
    // Websites Collection
    match /websites/{websiteId} {
      allow read: if true;
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
      allow update, delete: if request.auth != null && resource.data.userId == request.auth.uid;
    }
    
    // Credit Transactions
    match /credit_transactions/{transactionId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if false;
    }
  }
}
```

### 3. **ตรวจสอบ Firebase Configuration**

ไฟล์ `firebase.json`:
```json
{
  "hosting": {
    "public": ".next",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  },
  "functions": {
    "source": "firebase-functions",
    "runtime": "nodejs18"
  }
}
```

## 🛠️ **ขั้นตอนการ Deploy**

### 1. **ติดตั้ง Firebase CLI**
```bash
npm install -g firebase-tools
```

### 2. **Login เข้า Firebase**
```bash
firebase login
```

### 3. **เลือก Project**
```bash
firebase use vixahub
```

### 4. **Build Project**
```bash
npm run build
```

### 5. **Deploy ขึ้น Firebase Hosting**
```bash
firebase deploy --only hosting
```

### 6. **Deploy Firestore Rules**
```bash
firebase deploy --only firestore:rules
```

### 7. **Deploy ทั้งหมด**
```bash
firebase deploy
```

## ✅ **การตรวจสอบหลัง Deploy**

### 1. **ตรวจสอบ URL**
- หลัก: `https://vixahub.web.app`
- ทางเลือก: `https://vixahub.firebaseapp.com`

### 2. **ทดสอบฟีเจอร์หลัก**
- [ ] หน้าแรก
- [ ] ระบบ Login/Register
- [ ] User Dashboard
- [ ] สร้างเว็บไซต์
- [ ] Cloned Site System
- [ ] Admin Panel
- [ ] Staff Dashboard
- [ ] ระบบ Webhook

### 3. **ตรวจสอบ Console**
- เปิด F12 Developer Tools
- ตรวจสอบว่าไม่มี console.log messages (ถูกปิดแล้ว)
- ตรวจสอบ Network requests

## 🔧 **การแก้ไขปัญหาที่อาจเกิดขึ้น**

### 1. **Build Error**
```bash
# ลบ node_modules และติดตั้งใหม่
rm -rf node_modules package-lock.json
npm install
npm run build
```

### 2. **Firebase Deploy Error**
```bash
# ตรวจสอบ Firebase project
firebase projects:list
firebase use vixahub

# Deploy ใหม่
firebase deploy
```

### 3. **Environment Variables ไม่ทำงาน**
- ตรวจสอบว่าไฟล์ `.env.local` อยู่ใน root directory
- ตรวจสอบชื่อตัวแปรต้องขึ้นต้นด้วย `NEXT_PUBLIC_`
- Restart development server

### 4. **Firestore Permission Denied**
- ตรวจสอบ Firestore rules
- ตรวจสอบ authentication state
- ตรวจสอบ user permissions

## 📊 **การตรวจสอบระบบ**

### 1. **ตรวจสอบ Build Status**
```bash
npm run build
# ต้องแสดง "✓ Compiled successfully"
```

### 2. **ตรวจสอบ Linting**
```bash
npm run lint
# ต้องไม่มี errors
```

### 3. **ตรวจสอบ TypeScript**
```bash
npx tsc --noEmit
# ต้องไม่มี errors
```

## 🎯 **สรุป**

ระบบพร้อมสำหรับการ deploy ขึ้น Firebase Hosting แล้ว! 

**สิ่งที่ตรวจสอบแล้ว:**
- ✅ Firebase Configuration
- ✅ Firestore Security Rules
- ✅ Next.js Build Configuration
- ✅ Dependencies และ Packages
- ✅ TypeScript และ Linting
- ✅ API Routes
- ✅ Console Log Disable
- ✅ Webhook System
- ✅ Authentication System

**URL หลัง Deploy:**
- `https://vixahub.web.app`
- `https://vixahub.firebaseapp.com`


