# Full 9 Company Website

เว็บไซต์บริษัท ฟูล 9 จำกัด - ผู้เชี่ยวชาญด้านอุปกรณ์เสริมโทรศัพท์และ Gadget

## 🌐 URL ที่ใช้งานได้

- เว็บไซต์หลัก: (URL จาก Hostinger)
- ระบบหลังบ้าน: `https://your-domain.com/admin/`

## 🎨 ระบบจัดการเนื้อหา (CMS)

เว็บไซต์นี้ใช้ **Decap CMS** (Git-based CMS) สำหรับจัดการเนื้อหา

### วิธีเข้าสู่ระบบหลังบ้าน

1. เข้าไปที่ `https://your-domain.com/admin/`
2. คลิก "Login with GitHub"
3. อนุมัติการเข้าถึง GitHub repository
4. เริ่มแก้ไขเนื้อหาได้เลย!

### ส่วนที่สามารถแก้ไขได้

| ส่วน | รายละเอียด |
|------|------------|
| **Hero** | ข้อความหน้าแรก, สถิติ, รูปพื้นหลัง |
| **About** | เกี่ยวกับเรา, จุดเด่นของบริษัท |
| **Products** | เพิ่ม/แก้ไข/ลบสินค้า |
| **Services** | บริการต่างๆ |
| **Contact** | ข้อมูลติดต่อ, โซเชียลมีเดีย |
| **Settings** | ชื่อเว็บ, สี, Logo, Favicon |

## 🚀 การ Deploy

### อัตโนมัติ (แนะนำ)

เมื่อ push ขึ้น GitHub `main` branch, Hostinger จะ deploy อัตโนมัติ:

```bash
git add .
git commit -m "อัพเดทเนื้อหา"
git push origin main
```

### แก้ไขผ่าน CMS

1. เข้า `/admin`
2. แก้ไขเนื้อหา
3. กด "Publish" 
4. ระบบจะ commit ขึ้น GitHub และ Hostinger จะ deploy อัตโนมัติ

## 📁 โครงสร้างไฟล์

```
full9-website/
├── index.html              # หน้าแรก
├── css/
│   └── style.css          # สไตล์
├── js/
│   └── main.js            # JavaScript
├── admin/                 # ระบบหลังบ้าน
│   ├── index.html
│   └── config.yml         # ตั้งค่า CMS
├── content/               # เนื้อหาที่ CMS จัดการ
│   ├── hero/
│   ├── about/
│   ├── products/
│   ├── services/
│   ├── contact/
│   └── settings/
└── images/                # รูปภาพ
    └── uploads/           # รูปที่อัพโหลดผ่าน CMS
```

## 📝 การตั้งค่า GitHub OAuth (สำหรับ CMS)

ถ้ายังไม่ได้ตั้งค่า:

1. ไปที่ https://github.com/settings/developers
2. สร้าง **OAuth App** ใหม่
3. Homepage URL: `https://your-domain.com`
4. Authorization callback URL: `https://your-domain.com/admin/`
5. ได้ Client ID มาใส่ใน `admin/config.yml`

## 🎨 การปรับแต่งสี

แก้ไขที่ `content/settings/site.md`:

```yaml
colors:
  primary: "#1B4D3E"    # เขียวเข้ม
  secondary: "#D4AF37"  # ทอง
  background: "#FFFFFF" # ขาว
  text: "#1A1A1A"       # ดำ
```

## 📞 ติดต่อ

- อีเมล: contact@full9.co.th
- โทร: +66 XX XXX XXXX

---

พัฒนาโดย Full 9 Company Limited
# full9-website
