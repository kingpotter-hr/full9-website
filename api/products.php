<?php
// api/products.php - Products CRUD API
require_once 'config.php';
header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];
$db = getDB();

switch ($method) {
    case 'GET':
        // ดึงสินค้าทั้งหมด หรือ ดึงตาม ID
        if (isset($_GET['id'])) {
            $stmt = $db->prepare("SELECT * FROM products WHERE id = ?");
            $stmt->execute([$_GET['id']]);
            $product = $stmt->fetch();
            
            if ($product) {
                $product['features'] = json_decode($product['features'], true);
                echo json_encode($product);
            } else {
                http_response_code(404);
                echo json_encode(['error' => 'Product not found']);
            }
        } else {
            $category = $_GET['category'] ?? null;
            
            if ($category) {
                $stmt = $db->prepare("SELECT * FROM products WHERE category = ? ORDER BY created_at DESC");
                $stmt->execute([$category]);
            } else {
                $stmt = $db->query("SELECT * FROM products ORDER BY created_at DESC");
            }
            
            $products = $stmt->fetchAll();
            foreach ($products as &$product) {
                $product['features'] = json_decode($product['features'], true);
            }
            
            echo json_encode($products);
        }
        break;
        
    case 'POST':
        // สร้างสินค้าใหม่ (ต้อง Login)
        requireAuth();
        
        $data = json_decode(file_get_contents('php://input'), true);
        
        $stmt = $db->prepare("
            INSERT INTO products (name, category, icon, description, features, image_url)
            VALUES (?, ?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $data['name'],
            $data['category'],
            $data['icon'] ?? 'fas fa-box',
            $data['description'],
            json_encode($data['features'] ?? []),
            $data['image_url'] ?? null
        ]);
        
        $id = $db->lastInsertId();
        echo json_encode(['success' => true, 'id' => $id, 'message' => 'Product created']);
        break;
        
    case 'PUT':
        // แก้ไขสินค้า (ต้อง Login)
        requireAuth();
        
        $data = json_decode(file_get_contents('php://input'), true);
        $id = $_GET['id'] ?? null;
        
        if (!$id) {
            http_response_code(400);
            echo json_encode(['error' => 'Product ID required']);
            exit;
        }
        
        $stmt = $db->prepare("
            UPDATE products 
            SET name = ?, category = ?, icon = ?, description = ?, features = ?, image_url = ?
            WHERE id = ?
        ");
        
        $stmt->execute([
            $data['name'],
            $data['category'],
            $data['icon'],
            $data['description'],
            json_encode($data['features'] ?? []),
            $data['image_url'] ?? null,
            $id
        ]);
        
        echo json_encode(['success' => true, 'message' => 'Product updated']);
        break;
        
    case 'DELETE':
        // ลบสินค้า (ต้อง Login)
        requireAuth();
        
        $id = $_GET['id'] ?? null;
        
        if (!$id) {
            http_response_code(400);
            echo json_encode(['error' => 'Product ID required']);
            exit;
        }
        
        $stmt = $db->prepare("DELETE FROM products WHERE id = ?");
        $stmt->execute([$id]);
        
        echo json_encode(['success' => true, 'message' => 'Product deleted']);
        break;
}
?>