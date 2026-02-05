<?php
// api/settings.php - Site Settings API
require_once 'config.php';
header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];
$db = getDB();

switch ($method) {
    case 'GET':
        // ดึงการตั้งค่าทั้งหมด
        $stmt = $db->query("SELECT setting_key, setting_value FROM site_settings");
        $settings = [];
        while ($row = $stmt->fetch()) {
            $settings[$row['setting_key']] = $row['setting_value'];
        }
        
        echo json_encode($settings);
        break;
        
    case 'POST':
    case 'PUT':
        // อัปเดตการตั้งค่า (ต้อง Login)
        requireAuth();
        
        $data = json_decode(file_get_contents('php://input'), true);
        
        foreach ($data as $key => $value) {
            $stmt = $db->prepare("
                INSERT INTO site_settings (setting_key, setting_value)
                VALUES (?, ?)
                ON DUPLICATE KEY UPDATE setting_value = ?
            ");
            $stmt->execute([$key, $value, $value]);
        }
        
        echo json_encode(['success' => true, 'message' => 'Settings updated']);
        break;
}
?>