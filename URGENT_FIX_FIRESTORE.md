# 🚨 แก้ไข Firestore Permissions ด่วน!

## วิธีแก้ไขด่วน (Test Mode)

### ขั้นตอน 1: ตั้งค่า Firestore เป็น Test Mode

1. ไปที่: https://console.firebase.google.com/project/vixahub/firestore/rules
2. แทนที่ Rules ทั้งหมดด้วยนี้ (Test Mode - อนุญาตทุกอย่าง):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

3. คลิก **"Publish"**
4. รอ 30 วินาที
5. รีเฟรชเว็บและทดสอบใหม่

⚠️ **หมายเหตุ:** Test Mode นี้ใช้สำหรับ Development เท่านั้น! ต้องเปลี่ยนเป็น Production Rules ก่อน deploy จริง

---

## ถ้ายังไม่ได้ผล: ใช้ Realtime Database แทน

Realtime Database มี rules ง่ายกว่า:

### ขั้นตอน 2: ตั้งค่า Realtime Database Rules

1. ไปที่: https://console.firebase.google.com/project/vixahub/database/vixahub-default-rtdb/rules
2. แทนที่ Rules ด้วย:

```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

3. คลิก **"Publish"**

---

## หรือใช้วิธีชั่วคราว: localStorage

ถ้ายังไม่ได้ผล ให้ฉันสร้าง fallback ใช้ localStorage ชั่วคราว



















