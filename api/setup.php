
<?php
// api/setup.php - สร้างตารางและข้อมูลเริ่มต้น
require_once 'config.php';

try {
    $db = getDB();
    
    // สร้างตาราง admins
    $db->exec("
        CREATE TABLE IF NOT EXISTS admins (
            id INT AUTO_INCREMENT PRIMARY KEY,
            email VARCHAR(255) NOT NULL UNIQUE,
            password_hash VARCHAR(255) NOT NULL,
            name VARCHAR(100) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ");
    
    // สร้างตาราง products
    $db->exec("
        CREATE TABLE IF NOT EXISTS products (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            category ENUM('case', 'charger', 'accessories') NOT NULL,
            icon VARCHAR(100) DEFAULT 'fas fa-box',
            description TEXT NOT NULL,
            features JSON,
            image_url VARCHAR(500),
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ");
    
    // สร้างตาราง inquiries
    $db->exec("
        CREATE TABLE IF NOT EXISTS inquiries (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL,
            phone VARCHAR(50),
            subject VARCHAR(100) NOT NULL,
            message TEXT NOT NULL,
            status ENUM('pending', 'completed', 'cancelled') DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ");
    
    // สร้างตาราง site_settings
    $db->exec("
        CREATE TABLE IF NOT EXISTS site_settings (
            id INT AUTO_INCREMENT PRIMARY KEY,
            setting_key VARCHAR(100) NOT NULL UNIQUE,
            setting_value TEXT,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    ");
    
    // เพิ่ม admin user (password: admin123)
    $password_hash = password_hash('admin123', PASSWORD_DEFAULT);
    $stmt = $db->prepare("INSERT IGNORE INTO admins (email, password_hash, name) VALUES (?, ?, ?)");
    $stmt->execute(['admin@full9.co.th', $password_hash, 'Admin']);
    
    // เพิ่มสินค้าตัวอย่าง
    $products = [
        ['เคสโทรศัพท์มือถือ', 'case', 'fas fa-mobile-alt', 'ผลิตเคสหลากหลายรูปแบบ TPU, PC, Silicone, หนัง', '["รองรับทุกรุ่น", "พิมพ์ลายตามแบบ", "คุณภาพระดับพรีเมียม"]'],
        ['อุปกรณ์ชาร์จ', 'charger', 'fas fa-bolt', 'หัวชาร์จ, สายชาร์จ, Wireless Charger มาตรฐานสากล', '["Fast Charging", "รับรองมาตรฐาน", "ปลอดภัย 100%"]'],
        ['หูฟังและลำโพง', 'accessories', 'fas fa-headphones', 'หูฟัง Wired/Wireless, ลำโพง Bluetooth คุณภาพเสียงระดับ Hi-Fi', '["เสียงคมชัด", "ดีไซน์ทันสมัย", "แบตอึด"]'],
        ['Power Bank', 'charger', 'fas fa-battery-full', 'แบตเตอรี่สำรองหลากหลายความจุ ดีไซน์สวย น้ำหนักเบา', '["ความจุ 5000-30000 mAh", "Fast Charge", "รับประกัน 1 ปี"]']
    ];
    
    $stmt = $db->prepare("INSERT IGNORE INTO products (name, category, icon, description, features) VALUES (?, ?, ?, ?, ?)");
    foreach ($products as $p) {
        $stmt->execute($p);
    }
    
    echo "✅ Setup สำเร็จ!\n";
    echo "📧 Login: admin@full9.co.th\n";
    echo "🔑 Password: admin123\n";
    echo "\n⚠️ ควรลบไฟล์นี้หลังใช้งาน (setup.php)\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage();
}
?>
