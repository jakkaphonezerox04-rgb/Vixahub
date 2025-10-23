# แก้ไขปัญหา "เกิดข้อผิดพลาดในการบันทึก" - ERR_BLOCKED_BY_CLIENT

## ปัญหาที่เกิดขึ้น
- Admin กดปุ่มบันทึกการตั้งค่าทั้งหมดแล้วขึ้นข้อความ "เกิดข้อผิดพลาดในการบันทึก"
- Console แสดง error: `net::ERR_BLOCKED_BY_CLIENT`
- การร้องขอไปยัง Firestore API ถูกบล็อกโดย client-side

## สาเหตุ
1. **Ad-blocker หรือ Browser Extension** ที่บล็อก Firestore API
2. **CORS issues** ระหว่าง Vercel และ Firebase
3. **Network security policies** ที่ป้องกันการเข้าถึง Firestore โดยตรง

## วิธีแก้ไข

### 1. สร้าง API Routes แทนการเรียก Firestore โดยตรง
- `app/api/save-site-settings/route.ts` - สำหรับ admin page ปกติ
- `app/api/save-preview-settings/route.ts` - สำหรับ preview admin page

### 2. เพิ่ม Retry Mechanism
- `lib/api-retry.ts` - ระบบ retry อัตโนมัติ 3 ครั้ง
- Exponential backoff delay (1s, 2s, 4s)

### 3. เพิ่ม CORS Headers
- รองรับ CORS preflight requests
- อนุญาตการเข้าถึงจากทุก origin

### 4. อัปเดต Admin Pages
- เปลี่ยนจาก `setDoc()` โดยตรงเป็น API calls
- ใช้ retry mechanism สำหรับความเสถียร

## ไฟล์ที่แก้ไข

### ไฟล์ใหม่:
- `app/api/save-site-settings/route.ts`
- `app/api/save-preview-settings/route.ts`
- `lib/api-retry.ts`

### ไฟล์ที่แก้ไข:
- `app/[slug]/admin/page.tsx` - ฟังก์ชัน `saveSettings()`
- `app/preview/[id]/admin/page.tsx` - ฟังก์ชัน `saveSettings()`

## การ Deploy

1. **อัปเดต Environment Variables ใน Vercel:**
   ```
   FIREBASE_PROJECT_ID=vixahub
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@vixahub.iam.gserviceaccount.com
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
   ```

2. **Deploy ไปยัง Vercel:**
   ```bash
   git add .
   git commit -m "Fix: Replace direct Firestore calls with API routes to prevent ERR_BLOCKED_BY_CLIENT"
   git push origin main
   ```

## การทดสอบ

1. เข้าไปที่ admin page
2. แก้ไขการตั้งค่า
3. กดปุ่ม "บันทึกการตั้งค่าทั้งหมด"
4. ตรวจสอบว่าไม่มี error `ERR_BLOCKED_BY_CLIENT`
5. ตรวจสอบว่าแสดงข้อความ "บันทึกการตั้งค่าสำเร็จ"

## ข้อดีของการแก้ไข

1. **แก้ปัญหา ERR_BLOCKED_BY_CLIENT** - ใช้ server-side API แทน client-side
2. **เพิ่มความเสถียร** - มี retry mechanism
3. **ปลอดภัยขึ้น** - ใช้ Firebase Admin SDK แทน client SDK
4. **รองรับ CORS** - ไม่มีปัญหา cross-origin
5. **Error Handling ดีขึ้น** - แสดงข้อความ error ที่ชัดเจน

## หมายเหตุ

- การแก้ไขนี้จะไม่กระทบต่อฟังก์ชันอื่นๆ ที่ใช้ Firestore client-side
- ใช้เฉพาะสำหรับการบันทึกการตั้งค่าเท่านั้น
- สามารถใช้วิธีเดียวกันนี้กับฟังก์ชันอื่นๆ ที่มีปัญหาเดียวกัน
