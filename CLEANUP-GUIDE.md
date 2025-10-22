# คู่มือทำความสะอาด Firestore

## 🎯 วัตถุประสงค์
ลบข้อมูล `cloned_sites` ที่ใช้ระบบเก่า (ID แบบตัวเลข) ออกจาก Firestore

---

## 📋 ขั้นตอนการทำความสะอาด

### 1️⃣ เปิด Firebase Console
```
https://console.firebase.google.com/
```

### 2️⃣ เลือก Project
- เลือก Project: **VIXAHUB**

### 3️⃣ ไปที่ Firestore Database
- เมนูซ้าย → **Firestore Database**
- คลิก **Data** tab

### 4️⃣ เปิด Collection `cloned_sites`
- คลิกที่ collection: `cloned_sites`
- คุณจะเห็น documents ทั้งหมด

### 5️⃣ ระบุ Documents ที่ต้องลบ

**ต้องลบ (ID แบบเก่า):**
- ✅ ID ที่เป็นตัวเลข เช่น: `1760331218965_gy4s3q`
- ✅ ID ที่เป็น `undefined`

**เก็บไว้ (ID แบบใหม่):**
- ❌ ID ที่เป็น slug เช่น: `test110`, `my-website`

### 6️⃣ ลบ Documents
สำหรับแต่ละ document ที่มี ID แบบเก่า:
1. คลิกที่ document
2. คลิกปุ่ม **⋮** (menu)
3. เลือก **Delete document**
4. ยืนยันการลบ

---

## 🔍 ตรวจสอบ Collection `websites`

### ตรวจสอบว่าทุก website มี `slug` field:

1. เปิด collection: `websites`
2. เปิดแต่ละ document
3. ตรวจสอบว่ามี field: **`slug`**

**ถ้าไม่มี slug:**
- ลบ website นั้น
- สร้าง website ใหม่ผ่านระบบ (จะได้ slug อัตโนมัติ)

---

## ✅ Checklist หลังทำความสะอาด

- [ ] ลบ documents ที่มี ID แบบตัวเลขทั้งหมดใน `cloned_sites`
- [ ] ลบ documents ที่มี ID เป็น `undefined` ทั้งหมด
- [ ] ตรวจสอบว่าทุก document ใน `websites` มี field `slug`
- [ ] ทดสอบสร้าง website ใหม่
- [ ] ทดสอบ login/register ในเว็บที่สร้างใหม่

---

## 🚀 ทดสอบหลังทำความสะอาด

### 1. สร้าง Website ใหม่
```
1. เข้า: http://localhost:3100/user-dashboard/create-website
2. กรอกชื่อเว็บไซต์
3. ตรวจสอบ URL preview ว่าเป็น: vixahub.web.app/{slug}
4. กดสร้าง
```

### 2. ทดสอบ Register
```
1. ไปที่ My Websites
2. กดปุ่ม "ดู" (สีม่วง)
3. สมัครสมาชิกใหม่
4. ควรเข้าสู่ dashboard ได้
```

### 3. ตรวจสอบ Console
```
เปิด DevTools Console ควรเห็น:
✅ [CLONED-AUTH] Session loaded for {slug}
❌ ไม่ควรเห็น: No session found for 17603...
```

### 4. ทดสอบ Admin Access
```
1. เปิด Firestore
2. ไปที่: cloned_sites/{slug}/users/{userId}
3. เปลี่ยน field: role = "admin"
4. รีเฟรชหน้า dashboard
5. คลิกเมนู "แอดมิน"
6. ควรเข้าหน้า admin ได้
```

---

## ❗ Important Notes

1. **Backup ก่อนลบ**: ถ่ายภาพหน้าจอ Firestore ก่อนลบข้อมูล
2. **ตรวจสอบให้แน่ใจ**: อย่าลบ documents ที่มี ID เป็น slug
3. **ลบทีละ Document**: อย่าใช้ batch delete เพื่อความปลอดภัย
4. **สร้างเว็บใหม่**: Website เก่าที่ไม่มี slug ต้องสร้างใหม่

---

## 🆘 หากพบปัญหา

### ปัญหา: ยังเข้า login ไม่ได้
**เช็ค:**
1. URL ที่เข้าเป็น `/{slug}/login` ไม่ใช่ `/{numbers}/login`
2. เปิด Console ดู error message
3. ตรวจสอบว่า cloned_sites/{slug}/users มีข้อมูล user หรือไม่

### ปัญหา: Website ไม่แสดงใน My Websites
**เช็ค:**
1. Firestore → websites → ตรวจสอบ field `userId`
2. ตรงกับ user ที่ login หรือไม่
3. ลอง logout และ login ใหม่

### ปัญหา: เข้า Admin ไม่ได้
**เช็ค:**
1. Firestore → cloned_sites/{slug}/users/{userId}
2. ตรวจสอบ field: `role` = "admin"
3. ตรวจสอบว่าใช้ slug ไม่ใช่ ID ตัวเลข

---

## 📞 ติดต่อ

หากยังพบปัญหา:
1. เปิด Browser Console (F12)
2. ถ่ายภาพหน้าจอ error messages
3. แจ้งปัญหา พร้อม screenshot

---

**สร้างโดย:** VIXAHUB System  
**วันที่อัปเดต:** 2025-10-13  
**เวอร์ชัน:** 2.0 (Slug-based System)

