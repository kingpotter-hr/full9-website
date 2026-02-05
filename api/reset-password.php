<?php
// api/reset-password.php - รีเซ็ตรหัสผ่านบน Hostinger
require_once 'config.php';

echo "=== Reset Password Tool ===\n\n";

try {
    $db = getDB();
    
    // สร้าง hash ใหม่บน Hostinger
    $new_password = 'admin123';
    $new_hash = password_hash($new_password, PASSWORD_DEFAULT);
    
    echo "New password: admin123\n";
    echo "New hash (generated on this server):\n";
    echo $new_hash . "\n\n";
    
    // อัปเดตในฐานข้อมูล
    $stmt = $db->prepare("UPDATE admins SET password_hash = ? WHERE email = 'admin@full9.co.th'");
    $stmt->execute([$new_hash]);
    
    if ($stmt->rowCount() > 0) {
        echo "✅ Password updated successfully!\n\n";
        
        // ตรวจสอบว่า update ถูกต้อง
        $stmt = $db->query("SELECT password_hash FROM admins WHERE email = 'admin@full9.co.th'");
        $row = $stmt->fetch();
        
        echo "Verifying new password:\n";
        $verify = password_verify('admin123', $row['password_hash']);
        echo "Result: " . ($verify ? "✅ MATCH!" : "❌ STILL NO MATCH") . "\n\n";
        
        if ($verify) {
            echo "🎉 SUCCESS! You can now login with:\n";
            echo "Email: admin@full9.co.th\n";
            echo "Password: admin123\n";
        }
    } else {
        echo "❌ No rows updated - user may not exist\n";
    }
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage();
}
?>
