<?php
// api/debug.php - ตรวจสอบระบบ
require_once 'config.php';

echo "=== Debug Login System ===\n\n";

try {
    $db = getDB();
    echo "✅ Database connected\n\n";
    
    // ดึงข้อมูล admin
    $stmt = $db->query("SELECT * FROM admins WHERE email = 'admin@full9.co.th'");
    $admin = $stmt->fetch();
    
    if ($admin) {
        echo "✅ Found user: " . $admin['email'] . "\n";
        echo "Hash: " . substr($admin['password_hash'], 0, 20) . "...\n";
        echo "Hash length: " . strlen($admin['password_hash']) . "\n\n";
        
        // Test password verify
        $test_password = 'admin123';
        $verify_result = password_verify($test_password, $admin['password_hash']);
        
        echo "Testing password 'admin123':\n";
        echo "Result: " . ($verify_result ? "✅ MATCH" : "❌ NO MATCH") . "\n\n";
        
        // สร้าง hash ใหม่เผื่อ
        echo "New hash for 'admin123':\n";
        echo password_hash('admin123', PASSWORD_DEFAULT) . "\n";
        
    } else {
        echo "❌ User not found\n";
    }
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage();
}
?>
