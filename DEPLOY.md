# Full 9 Website - Deployment Guide

## วิธี Deploy บน Hostinger (ง่ายที่สุด)

### ขั้นตอนที่ 1: เตรียม Database บน Hostinger

1. เข้า Hostinger Control Panel (hPanel)
2. ไปที่ **Advanced** → **MySQL Databases**
3. สร้าง Database ใหม่:
   - Database name: `u880047496_full9_db` (หรือชื่อที่ต้องการ)
4. สร้าง User:
   - Username: `u880047496_full9_admin`
   - Password: ตั้งรหัสผ่านที่แข็งแรง
5. ให้สิทธิ์ user กับ database (All Privileges)

### ขั้นตอนที่ 2: Import Database

1. ใน hPanel ไปที่ **phpMyAdmin**
2. เลือก database ที่สร้างไว้
3. คลิก **Import** tab
4. เลือกไฟล์ `api/database.sql` แล้กกด **Go**
5. รอจนเสร็จ (จะมีตาราง: products, inquiries, users, site_settings)

### ขั้นตอนที่ 3: แก้ไข config

เปิดไฟล์ `api/config.php` แล้วแก้ตามที่ Hostinger ให้มา:

```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'u880047496_full9_db'); // ชื่อ database ที่สร้าง
define('DB_USER', 'u880047496_full9_admin'); // username ที่สร้าง
define('DB_PASS', 'YOUR_PASSWORD_HERE'); // password ที่ตั้งไว้
```

### ขั้นตอนที่ 4: Upload ไฟล์

#### วิธีที่ 1: File Manager (ง่ายสุด)

1. ใน hPanel ไปที่ **Files** → **File Manager**
2. เข้าไปที่โฟลเดอร์ `public_html` (หรือ `public_html/full9` ถ้าอยากใส่ subfolder)
3. คลิก **Upload** → เลือกไฟล์ทั้งหมดในโฟลเดอร์ `full9-website/`
4. รอ upload เสร็จ

#### วิธีที่ 2: FTP (เร็วกว่าถ้าไฟล์เยอะ)

ใช้ FileZilla หรือ FTP Client:
- Host: `ftp.full9.co.th` หรือ IP ที่ Hostinger ให้
- Username: ชื่อ user FTP
- Password: รหัสผ่าน FTP
- Port: 21

Upload ไฟล์ทั้งหมดไปที่ `public_html/`

### ขั้นตอนที่ 5: ตั้งค่า Admin

1. เปิด `https://www.full9.co.th/api/setup.php` ใน browser
2. ระบบจะสร้าง admin user อัตโนมัติ
3. Login ด้วย:
   - Username: `admin`
   - Password: `admin123`
4. **สำคัญ:** เปลี่ยน password ทันทีหลัง login!

### ขั้นตอนที่ 6: ตั้งค่า Domain

ถ้า domain ยังไม่ชี้มาที่ Hostinger:
1. ไปที่ Domain Registrar (ที่ซื้อ full9.co.th)
2. แก้ Nameservers เป็น:
   - `ns1.dns-parking.com`
   - `ns2.dns-parking.com`
3. รอ 5-30 นาทีให้ DNS propagate

### ขั้นตอนที่ 7: ตรวจสอบ

เปิดเว็บ `https://www.full9.co.th` ดูว่า:
- [ ] หน้าแรกแสดงข้อมูลจาก database
- [ ] สินค้าแสดงถูกต้อง
- [ ] สามารถส่งฟอร์มติดต่อได้
- [ ] Admin panel เข้าได้ (`/admin/`)

## แก้ปัญหาเบื้องต้น

### หน้าเว็บขาว (White Screen)
- ตรวจสอบ `api/config.php` ว่า connect database ได้ไหม
- ดู error log ใน File Manager → `error_logs/`

### Database Connection Failed
- ตรวจสอบชื่อ database, user, password ใน `api/config.php`
- ลอง test ด้วยไฟล์ `api/debug.php`

### 404 Not Found
- ตรวจสอบว่ามีไฟล์ `.htaccess` หรือไม่
- ใน hPanel → **Advanced** → **Configure PHP** → เปิดใช้งาน `.htaccess`

### ไม่สามารถส่งฟอร์มได้
- ตรวจสอบว่า API URL ถูกต้อง (`api/inquiries.php`)
- ดู Network tab ใน browser DevTools

## ไฟล์สำคัญที่ต้องมีบน Server

```
public_html/
├── .htaccess          ← สำคัญ! สำหรับ routing
├── index.php          ← หน้าแรก (ดึงข้อมูลจาก DB)
├── index.html         ← fallback (ถ้า PHP ไม่ทำงาน)
├── css/
│   └── style.css
├── js/
│   └── main.js
├── api/
│   ├── config.php     ← ต้องแก้ database config
│   ├── auth.php
│   ├── products.php
│   ├── inquiries.php
│   └── setup.php
└── admin/
    └── index.html
```

## ติดต่อ Support

หากมีปัญหา ตรวจสอบ:
1. Hostinger Knowledge Base: https://support.hostinger.com
2. ตรวจสอบ error log ใน File Manager
3. ลองรัน `api/debug.php` เพื่อเช็ค database connection
