<?php
// api/inquiries.php - Inquiries CRUD API
require_once 'config.php';
header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];
$db = getDB();

switch ($method) {
    case 'GET':
        // ดึงข้อความติดต่อทั้งหมด (ต้อง Login)
        requireAuth();
        
        $status = $_GET['status'] ?? null;
        $limit = $_GET['limit'] ?? 100;
        
        if ($status) {
            $stmt = $db->prepare("SELECT * FROM inquiries WHERE status = ? ORDER BY created_at DESC LIMIT ?");
            $stmt->execute([$status, $limit]);
        } else {
            $stmt = $db->prepare("SELECT * FROM inquiries ORDER BY created_at DESC LIMIT ?");
            $stmt->execute([$limit]);
        }
        
        $inquiries = $stmt->fetchAll();
        
        // นับจำนวน pending
        $countStmt = $db->query("SELECT COUNT(*) as count FROM inquiries WHERE status = 'pending'");
        $pendingCount = $countStmt->fetch()['count'];
        
        echo json_encode([
            'inquiries' => $inquiries,
            'pending_count' => $pendingCount
        ]);
        break;
        
    case 'POST':
        $data = json_decode(file_get_contents('php://input'), true);
        
        // ส่งข้อความติดต่อจากหน้าเว็บ (ไม่ต้อง Login)
        if ($_GET['action'] === 'submit') {
            $stmt = $db->prepare("
                INSERT INTO inquiries (name, email, phone, subject, message)
                VALUES (?, ?, ?, ?, ?)
            ");
            
            $stmt->execute([
                $data['name'],
                $data['email'],
                $data['phone'] ?? null,
                $data['subject'],
                $data['message']
            ]);
            
            echo json_encode(['success' => true, 'message' => 'Inquiry submitted']);
        }
        // อัปเดตสถานะ (ต้อง Login)
        elseif ($_GET['action'] === 'update-status') {
            requireAuth();
            
            $id = $data['id'];
            $status = $data['status'];
            $adminNotes = $data['admin_notes'] ?? null;
            
            $stmt = $db->prepare("
                UPDATE inquiries 
                SET status = ?, admin_notes = ?
                WHERE id = ?
            ");
            
            $stmt->execute([$status, $adminNotes, $id]);
            
            echo json_encode(['success' => true, 'message' => 'Status updated']);
        }
        break;
        
    case 'DELETE':
        // ลบข้อความ (ต้อง Login)
        requireAuth();
        
        $id = $_GET['id'] ?? null;
        
        if (!$id) {
            http_response_code(400);
            echo json_encode(['error' => 'Inquiry ID required']);
            exit;
        }
        
        $stmt = $db->prepare("DELETE FROM inquiries WHERE id = ?");
        $stmt->execute([$id]);
        
        echo json_encode(['success' => true, 'message' => 'Inquiry deleted']);
        break;
}
?>