-- Database Schema for Full 9 Website
-- รันคำสั่งนี้ใน phpMyAdmin ของ Hostinger

-- สร้าง Database (ถ้ายังไม่มี)
-- CREATE DATABASE IF NOT EXISTS full9_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE full9_db;

-- ตารางผู้ดูแลระบบ
CREATE TABLE IF NOT EXISTS admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ตารางสินค้า
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category ENUM('case', 'charger', 'accessories') NOT NULL,
    icon VARCHAR(100) DEFAULT 'fas fa-box',
    description TEXT NOT NULL,
    features JSON,
    image_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ตารางข้อความติดต่อ
CREATE TABLE IF NOT EXISTS inquiries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    subject VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    status ENUM('pending', 'completed', 'cancelled') DEFAULT 'pending',
    admin_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ตารางข้อมูลบริษัท (Content Management)
CREATE TABLE IF NOT EXISTS site_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert ข้อมูลเริ่มต้น
INSERT INTO admins (email, password_hash, name) VALUES 
('admin@full9.co.th', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin');
-- รหัสผ่าน default: admin123

-- Insert สินค้าตัวอย่าง
INSERT INTO products (name, category, icon, description, features) VALUES
('เคสโทรศัพท์มือถือ', 'case', 'fas fa-mobile-alt', 'ผลิตเคสหลากหลายรูปแบบ TPU, PC, Silicone, หนัง', '["รองรับทุกรุ่น", "พิมพ์ลายตามแบบ", "คุณภาพระดับพรีเมียม"]'),
('อุปกรณ์ชาร์จ', 'charger', 'fas fa-bolt', 'หัวชาร์จ, สายชาร์จ, Wireless Charger มาตรฐานสากล', '["Fast Charging", "รับรองมาตรฐาน", "ปลอดภัย 100%"]'),
('หูฟังและลำโพง', 'accessories', 'fas fa-headphones', 'หูฟัง Wired/Wireless, ลำโพง Bluetooth คุณภาพเสียงระดับ Hi-Fi', '["เสียงคมชัด", "ดีไซน์ทันสมัย", "แบตอึด"]'),
('Gadget และอุปกรณ์เสริม', 'accessories', 'fas fa-gamepad', 'Gaming accessories, Smart watch bands, Power bank และอื่นๆ', '["ฟังก์ชันครบ", "วัสดุดี", "ทนทาน"]'),
('เคสแท็บเล็ต', 'case', 'fas fa-tablet-alt', 'เคส iPad, Tablet หลายขนาด ทั้งแบบธรรมดาและ Smart Case', '["กันกระแทก", "ดีไซน์บาง", "ฟังก์ชัน Smart"]'),
('Power Bank', 'charger', 'fas fa-battery-full', 'แบตเตอรี่สำรองหลากหลายความจุ ดีไซน์สวย น้ำหนักเบา', '["ความจุ 5000-30000 mAh", "Fast Charge", "รับประกัน 1 ปี"]');

-- Insert Site Settings
INSERT INTO site_settings (setting_key, setting_value) VALUES
('company_name', 'FULL 9 COMPANY LIMITED'),
('company_name_th', 'บริษัท ฟูล 9 จำกัด'),
('company_description', 'ผู้เชี่ยวชาญด้านอุปกรณ์เสริมโทรศัพท์และ Gadget รับผลิตแบบ OEM คุณภาพสูง'),
('company_phone', '+66 XX XXX XXXX'),
('company_email', 'contact@full9.co.th'),
('company_address', 'กรุงเทพมหานคร, ประเทศไทย'),
('stat_years', '10'),
('stat_customers', '500'),
('stat_products', '1000');

-- Insert ข้อความติดต่อตัวอย่าง
INSERT INTO inquiries (name, email, phone, subject, message, status) VALUES
('คุณสมชาย ใจดี', 'somchai@example.com', '081-234-5678', 'oem', 'สนใจผลิตเคสโทรศัพท์แบบ OEM จำนวน 1000 ชิ้น ขอรายละเอียดและใบเสนอราคาด้วยครับ', 'pending'),
('บริษัท ไทยเทค จำกัด', 'info@thaitech.com', '02-123-4567', 'partnership', 'ต้องการเสนอตัวเป็นตัวแทนจำหน่ายสินค้าในภาคตะวันออก ขอเข้าพบเพื่อเจรจาธุรกิจครับ', 'pending'),
('คุณวิภา รุ่งเรือง', 'wipa@example.com', NULL, 'product', 'อยากทราบราคา Power Bank ความจุ 20000 mAh ค่ะ มีให้เลือกกี่สี', 'completed');