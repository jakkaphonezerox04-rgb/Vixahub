# ระบบ Slug-Based Routing สำหรับเว็บไซต์ที่ถูกโคลน

## ภาพรวม

ระบบได้รับการอัพเกรดให้รองรับ **slug-based routing** แทน id-based routing เดิม

### การเปลี่ยนแปลง

#### เดิม (ID-based)
```
/preview/1234567890/login
/preview/1234567890/dashboard
```

#### ใหม่ (Slug-based)
```
/my-website/login
/my-website/dashboard
```

---

## โครงสร้างไฟล์ใหม่

### 1. Routing Structure
```
app/
├── [slug]/               # Dynamic slug route
│   ├── login/           # หน้า Login
│   ├── register/        # หน้า Register  
│   ├── dashboard/       # หน้า Dashboard
│   ├── leave/           # หน้าแจ้งลา (ใช้ไฟล์เดิมจาก preview/[id]/)
│   ├── delivery/        # หน้าส่งของ (ใช้ไฟล์เดิมจาก preview/[id]/)
│   ├── report/          # หน้ารายงาน (ใช้ไฟล์เดิมจาก preview/[id]/)
│   ├── members/         # หน้าสมาชิก (ใช้ไฟล์เดิมจาก preview/[id]/)
│   ├── admin/           # หน้า Admin (ใช้ไฟล์เดิมจาก preview/[id]/)
│   ├── fine-details/    # หน้ารายละเอียดค่าปรับ (ใช้ไฟล์เดิมจาก preview/[id]/)
│   └── page.tsx         # Redirect ไป login
```

### 2. Library Files
```
lib/
├── slug-utils.ts           # ฟังก์ชันจัดการ slug
├── firebase-websites.ts    # จัดการ CRUD เว็บไซต์ใน Firestore
├── firebase.ts             # Firebase config (เดิม)
├── firebase-credits.ts     # Credits management (เดิม)
└── tmweasy-api.ts          # Payment API (เดิม)
```

---

## ฟังก์ชันสำคัญ

### 1. Slug Utilities (`lib/slug-utils.ts`)

#### `createSlug(name: string): string`
สร้าง slug จากชื่อเว็บไซต์
- แปลงเป็นตัวพิมพ์เล็ก
- แปลงภาษาไทยเป็น Latin (transliteration)
- ลบอักขระพิเศษ
- แทนที่ช่องว่างด้วย dash

```typescript
createSlug("ครอบครัวสุขสันต์")  // → "khrobkhrua-sukhsan"
createSlug("My Gang 2024")       // → "my-gang-2024"
```

#### `isValidSlug(slug: string): boolean`
ตรวจสอบว่า slug ถูกต้องตามรูปแบบหรือไม่

#### `isReservedSlug(slug: string): boolean`
ตรวจสอบว่า slug เป็น reserved keyword หรือไม่ (เช่น `api`, `admin`, `dashboard`)

#### `generateUniqueSlug(baseSlug: string, existingSlugs: string[]): string`
สร้าง unique slug โดยเพิ่มตัวเลขท้าย

#### `validateSlug(slug: string, existingSlugs: string[]): object`
ตรวจสอบความถูกต้องครบถ้วน

---

### 2. Firebase Websites Management (`lib/firebase-websites.ts`)

#### `getAllSlugs(): Promise<string[]>`
ดึงรายการ slug ทั้งหมดที่มีอยู่

#### `isSlugTaken(slug: string): Promise<boolean>`
ตรวจสอบว่า slug ถูกใช้แล้วหรือยัง

#### `getWebsiteBySlug(slug: string): Promise<Website | null>`
ดึงข้อมูลเว็บไซต์จาก slug

#### `getWebsiteById(id: string): Promise<Website | null>`
ดึงข้อมูลเว็บไซต์จาก ID

#### `getUserWebsites(userId: string): Promise<Website[]>`
ดึงรายการเว็บไซต์ทั้งหมดของ user

#### `createWebsite(data): Promise<result>`
สร้างเว็บไซต์ใหม่ พร้อมสร้าง unique slug อัตโนมัติ

#### `updateWebsite(websiteId, data): Promise<result>`
อัพเดทข้อมูลเว็บไซต์

#### `deleteWebsite(websiteId): Promise<result>`
ลบเว็บไซต์

---

## การใช้งาน

### 1. สร้างเว็บไซต์ใหม่

เมื่อ user สร้างเว็บไซต์ที่ชื่อ **"ครอบครัวของฉัน"**:

1. ระบบจะสร้าง slug: `khrobkhrua-khong-chan`
2. ตรวจสอบว่า slug ซ้ำหรือไม่
3. ถ้าซ้ำ จะเพิ่มตัวเลข: `khrobkhrua-khong-chan-1`
4. บันทึกลง Firestore collection `websites`
5. Redirect ไป `https://vixahub.web.app/khrobkhrua-khong-chan/login`

### 2. เข้าถึงเว็บไซต์

URL Structure:
```
https://vixahub.web.app/[slug]/[page]
```

ตัวอย่าง:
```
https://vixahub.web.app/my-gang/login
https://vixahub.web.app/my-gang/dashboard
https://vixahub.web.app/my-gang/leave
https://vixahub.web.app/my-gang/delivery
```

### 3. จัดการเว็บไซต์

User สามารถ:
- ดูรายการเว็บไซต์ทั้งหมดใน `/user-dashboard/my-websites`
- คลิกเข้าเว็บไซต์ที่สร้าง
- ลบเว็บไซต์ได้

---

## Firebase Firestore Structure

### Collection: `websites`

```javascript
{
  id: "1234567890_abc123",
  slug: "my-gang",
  name: "My Gang",
  url: "https://vixahub.web.app/my-gang",
  plan: "GANG SYSTEM",
  status: "active",
  createdDate: "10 ต.ค. 2568",
  expiryDate: "10 พ.ย. 2568",
  visitors: 0,
  revenue: 0,
  thumbnail: "/ecommerce-store.png",
  description: "เหมาะสำหรับธุรกิจขนาดเล็กและทีมงาน",
  userId: "firebase_user_uid",
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Collection: `cloned_sites/{siteId}/*`

ข้อมูลของแต่ละเว็บไซต์ถูกเก็บแยกตาม `siteId` (ใช้ ID ไม่ใช่ slug)

---

## Firestore Security Rules

```javascript
match /websites/{websiteId} {
  // อนุญาตให้ทุกคนอ่านได้ (สำหรับหน้า login/register)
  allow read: if true;
  
  // อนุญาตให้ user ที่ล็อกอินสร้างเว็บไซต์ของตัวเอง
  allow create: if request.auth != null && 
                 request.resource.data.userId == request.auth.uid;
  
  // อนุญาตให้เจ้าของแก้ไข/ลบเว็บไซต์ของตัวเอง
  allow update, delete: if request.auth != null && 
                          resource.data.userId == request.auth.uid;
}
```

---

## สิ่งที่ต้องทำเพิ่มเติม

### ✅ สำเร็จแล้ว
1. ✅ สร้าง slug utilities
2. ✅ สร้าง Firebase websites management
3. ✅ แก้ไข create-website-page.tsx
4. ✅ สร้าง routing `app/[slug]/login`
5. ✅ สร้าง routing `app/[slug]/register`
6. ✅ สร้าง routing `app/[slug]/dashboard`
7. ✅ แก้ไข my-websites-page.tsx
8. ✅ อัพเดท Firestore rules

### 📝 ต้องทำเพิ่ม
1. ⚠️ แก้ไขหน้าอื่นๆ ใน `app/[slug]/` ให้ใช้ slug แทน id:
   - `leave/page.tsx`
   - `delivery/page.tsx`
   - `report/page.tsx`
   - `members/page.tsx`
   - `admin/page.tsx`
   - `fine-details/page.tsx`

2. ⚠️ Deploy Firestore Rules
   ```bash
   firebase deploy --only firestore:rules
   ```

3. ⚠️ ทดสอบระบบ:
   - สร้างเว็บไซต์ใหม่
   - ทดสอบ slug ภาษาไทย
   - ทดสอบ slug ซ้ำ
   - ทดสอบ login/register
   - ทดสอบ dashboard

---

## Template สำหรับแก้ไขหน้าอื่นๆ

สำหรับหน้าที่ยังใช้ `/preview/[id]/...` อยู่ ให้แก้ไขดังนี้:

### 1. เปลี่ยน params type
```typescript
// เดิม
const params = useParams<{ id: string }>()

// ใหม่
const params = useParams<{ slug: string }>()
```

### 2. เพิ่ม state สำหรับ siteId
```typescript
const [siteId, setSiteId] = useState<string>("")
const [siteName, setSiteName] = useState<string>("")
```

### 3. Load website จาก slug
```typescript
useEffect(() => {
  const loadSite = async () => {
    try {
      const website = await getWebsiteBySlug(params.slug)
      if (website) {
        setSiteId(website.id)
        setSiteName(website.name)
      } else {
        router.push("/")
      }
    } catch (error) {
      console.error("Error loading site:", error)
      router.push("/")
    }
  }
  loadSite()
}, [params.slug, router])
```

### 4. แทนที่ path ทั้งหมด
```typescript
// เดิม
/preview/${params.id}/...

// ใหม่
/${params.slug}/...
```

### 5. เพิ่ม import
```typescript
import { getWebsiteBySlug } from "@/lib/firebase-websites"
```

---

## ข้อดีของระบบใหม่

1. **URL ที่อ่านง่าย**: `vixahub.web.app/my-gang` แทน `vixahub.web.app/preview/1234567890`
2. **SEO ดีขึ้น**: URL มีความหมาย ไม่ใช่แค่ตัวเลข
3. **จดจำง่าย**: User สามารถจำ URL ได้ง่ายขึ้น
4. **Professional**: ดูเป็นมืออาชีพมากขึ้น
5. **Firebase Compatible**: ใช้งานกับ Firebase Hosting ได้โดยไม่ต้องใช้ subdomain

---

## ตัวอย่าง URL ที่สร้างจากชื่อภาษาไทย

| ชื่อเว็บไซต์ | Slug ที่สร้าง |
|-------------|---------------|
| ครอบครัวสุขสันต์ | `khrobkhrua-sukhsan` |
| แก๊งเพื่อนซี้ | `kaeng-phueuan-si` |
| บริษัท ABC | `borisat-abc` |
| My Gang 2024 | `my-gang-2024` |
| ทีมงาน-HR | `thimngaan-hr` |

---

## สรุป

ระบบ slug-based routing ช่วยให้:
- ✅ URL สะอาดและอ่านง่าย
- ✅ ใช้งานกับ Firebase Hosting ได้เลย
- ✅ ไม่ต้องตั้งค่า subdomain
- ✅ จัดการ SEO ได้ดีขึ้น
- ✅ ผู้ใช้จดจำ URL ได้ง่าย

**Firebase Hosting รองรับ dynamic routing แบบนี้เต็มรูปแบบ!** 🎉

